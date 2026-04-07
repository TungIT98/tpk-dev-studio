import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_

from app.core.database import get_db, get_db_sync
from app.core.redis import get_redis
from app.models.models import (
    Player, PlayerGem, PetInstance, PlayerItem, TradeOffer, TradeTransaction,
)
from app.schemas.schemas import (
    TradeCreateRequest,
    TradeOfferResponse,
    TradeTransactionResponse,
    TradeConfirmRequest,
    TradeCancelRequest,
    TradeListResponse,
    TradeOfferItemSpec,
)

router = APIRouter(prefix="/trades", tags=["trades"])

# ── Rate Limiting ────────────────────────────────────────────────────────────────

TRADE_OFFERS_MAX = 20  # max pending offers per player


async def _trade_rate_limit(redis, user_id: str) -> bool:
    """Return True if user is within rate limit. Raises HTTPException if over."""
    key = f"trades:offers:{user_id}"
    count = await redis.get(key)
    if count is not None and int(count) >= TRADE_OFFERS_MAX:
        raise HTTPException(
            status_code=429,
            detail=f"Too many pending trade offers. Max {TRADE_OFFERS_MAX}. Cancel or wait for some to expire.",
        )
    return True


async def _record_trade_offer(redis, user_id: str):
    key = f"trades:offers:{user_id}"
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    await redis.incr(key)
    await redis.expireat(key, int(midnight.timestamp()))


# ── Anti-Exploit Helpers ─────────────────────────────────────────────────────────

def _validate_pet_ownership(db: Session, user_id: str, pet_instance_ids: List[str]) -> None:
    """Raise HTTPException if any pet_instance_ids are not owned by user_id."""
    if not pet_instance_ids:
        return
    owned = db.execute(
        select(PetInstance.instance_id).where(
            PetInstance.user_id == user_id,
            PetInstance.instance_id.in_(pet_instance_ids),
            PetInstance.is_active == True,
        )
    ).scalars().all()
    owned_set = set(owned)
    for pid in pet_instance_ids:
        if pid not in owned_set:
            raise HTTPException(status_code=403, detail=f"Pet instance '{pid}' is not owned by this player or is inactive.")


def _validate_item_ownership(db: Session, user_id: str, item_ids: List[str]) -> None:
    """Raise HTTPException if any item_ids are not owned by user_id."""
    if not item_ids:
        return
    owned = db.execute(
        select(PlayerItem.instance_id).where(
            PlayerItem.user_id == user_id,
            PlayerItem.instance_id.in_(item_ids),
            PlayerItem.is_active == True,
        )
    ).scalars().all()
    owned_set = set(owned)
    for iid in item_ids:
        if iid not in owned_set:
            raise HTTPException(status_code=403, detail=f"Item '{iid}' is not owned by this player or is inactive.")


def _validate_player_exists(db: Session, user_id: str) -> Player:
    player = db.execute(select(Player).where(Player.user_id == user_id)).scalars().first()
    if not player:
        raise HTTPException(status_code=404, detail=f"Player '{user_id}' not found.")
    return player


def _check_player_balance(db: Session, user_id: str, required_currency: float) -> None:
    """Raise HTTPException if player does not have enough currency in escrow."""
    if required_currency <= 0:
        return
    player = db.execute(select(Player.total_currency).where(Player.user_id == user_id)).scalars().first()
    if player is None or float(player) < required_currency:
        raise HTTPException(status_code=403, detail=f"Insufficient currency balance for trade. Required: {required_currency}.")


# ── Transfer Helpers ─────────────────────────────────────────────────────────────

def _transfer_pets(db: Session, from_user: str, to_user: str, pet_instance_ids: List[str]) -> dict:
    """Transfer pet instances from one player to another. Returns list of transferred IDs."""
    if not pet_instance_ids:
        return {}
    transferred = db.execute(
        select(PetInstance).where(
            PetInstance.user_id == from_user,
            PetInstance.instance_id.in_(pet_instance_ids),
            PetInstance.is_active == True,
        )
    ).scalars().all()
    transferred_ids = []
    for pet in transferred:
        pet.user_id = to_user
        transferred_ids.append(pet.instance_id)
    db.flush()
    return {"pet_instance_ids": transferred_ids}


def _transfer_items(db: Session, from_user: str, to_user: str, item_ids: List[str]) -> dict:
    """Transfer item instances from one player to another. Returns list of transferred IDs."""
    if not item_ids:
        return {}
    transferred = db.execute(
        select(PlayerItem).where(
            PlayerItem.user_id == from_user,
            PlayerItem.instance_id.in_(item_ids),
            PlayerItem.is_active == True,
        )
    ).scalars().all()
    transferred_ids = []
    for item in transferred:
        item.user_id = to_user
        transferred_ids.append(item.instance_id)
    db.flush()
    return {"item_ids": transferred_ids}


def _transfer_currency(db: Session, from_user: str, to_user: str, amount: float) -> dict:
    """Transfer currency between players. Returns transfer record."""
    if amount <= 0:
        return {}
    from_player = db.execute(select(Player).where(Player.user_id == from_user)).scalars().first()
    to_player = db.execute(select(Player).where(Player.user_id == to_user)).scalars().first()
    if not from_player or not to_player:
        return {}
    if from_player.total_currency < amount:
        raise HTTPException(status_code=403, detail="Insufficient funds for currency transfer.")
    from_player.total_currency -= amount
    to_player.total_currency += amount
    return {"currency": amount, "from": from_user, "to": to_user}


# ── Trade Expiration ─────────────────────────────────────────────────────────────

async def _expire_stale_trades(db: Session, redis) -> int:
    """Mark pending offers past their expiry as cancelled. Returns count expired."""
    now = datetime.now(timezone.utc)
    stale = db.execute(
        select(TradeOffer).where(
            TradeOffer.status == "pending",
            TradeOffer.expires_at < now,
        )
    ).scalars().all()
    for offer in stale:
        offer.status = "expired"
    db.commit()
    return len(stale)


# ── Endpoints ────────────────────────────────────────────────────────────────────

@router.post("", response_model=TradeOfferResponse)
async def create_trade_offer(
    req: TradeCreateRequest,
    db: Session = Depends(get_db_sync),
):
    """Create a new two-party trade offer."""
    redis = await get_redis()
    await _trade_rate_limit(redis, req.initiator_id)
    await _trade_rate_limit(redis, req.receiver_id)

    # Self-trade check
    if req.initiator_id == req.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot trade with yourself.")

    # Validate both players exist
    _validate_player_exists(db, req.initiator_id)
    _validate_player_exists(db, req.receiver_id)

    # Anti-exploit: validate pet ownership
    _validate_pet_ownership(db, req.initiator_id, req.initiator_offer.pet_instance_ids)
    _validate_pet_ownership(db, req.receiver_id, req.receiver_offer.pet_instance_ids)

    # Anti-exploit: validate item ownership
    _validate_item_ownership(db, req.initiator_id, req.initiator_offer.item_ids)
    _validate_item_ownership(db, req.receiver_id, req.receiver_offer.item_ids)

    # Anti-exploit: validate currency balance
    _check_player_balance(db, req.initiator_id, req.initiator_offer.currency)
    _check_player_balance(db, req.receiver_id, req.receiver_offer.currency)

    expires_at = datetime.now(timezone.utc) + timedelta(hours=req.expires_in_hours)
    trade_id = f"trade_{uuid.uuid4().hex[:16]}"

    offer = TradeOffer(
        trade_id=trade_id,
        initiator_id=req.initiator_id,
        receiver_id=req.receiver_id,
        status="pending",
        initiator_offer=req.initiator_offer.model_dump(),
        receiver_offer=req.receiver_offer.model_dump(),
        expires_at=expires_at,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    await _record_trade_offer(redis, req.initiator_id)

    return offer


@router.get("/{player_id}", response_model=TradeListResponse)
def get_player_trades(
    player_id: str,
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, declined, cancelled, expired"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_sync),
):
    """Get all trade offers involving a player (as initiator or receiver)."""
    conditions = or_(
        TradeOffer.initiator_id == player_id,
        TradeOffer.receiver_id == player_id,
    )
    if status:
        conditions = and_(conditions, TradeOffer.status == status)

    total = db.execute(
        select(func.count()).select_from(TradeOffer).where(conditions)
    ).scalar() or 0

    offset = (page - 1) * limit
    trades = db.execute(
        select(TradeOffer)
        .where(conditions)
        .order_by(desc(TradeOffer.created_at))
        .offset(offset)
        .limit(limit)
    ).scalars().all()

    return TradeListResponse(
        trades=[TradeOfferResponse.model_validate(t) for t in trades],
        total=total,
        page=page,
    )


@router.get("/single/{trade_id}", response_model=TradeOfferResponse)
def get_trade(
    trade_id: str,
    db: Session = Depends(get_db_sync),
):
    """Get a single trade offer by ID."""
    offer = db.execute(
        select(TradeOffer).where(TradeOffer.trade_id == trade_id)
    ).scalars().first()
    if not offer:
        raise HTTPException(status_code=404, detail="Trade offer not found.")
    return offer


@router.put("/{trade_id}/accept", response_model=TradeOfferResponse)
async def accept_trade(
    trade_id: str,
    req: TradeConfirmRequest,
    db: Session = Depends(get_db_sync),
):
    """Accept a pending trade offer. Both parties must confirm (initiator auto-confirms on create)."""
    offer = db.execute(
        select(TradeOffer).where(TradeOffer.trade_id == trade_id)
    ).scalars().first()
    if not offer:
        raise HTTPException(status_code=404, detail="Trade offer not found.")

    if offer.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot accept a trade that is '{offer.status}'.")
    if offer.receiver_id != req.user_id:
        raise HTTPException(status_code=403, detail="Only the receiver can accept this trade.")
    if datetime.now(timezone.utc) > offer.expires_at:
        offer.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Trade offer has expired.")

    # Execute the transfer: initiator -> receiver for initiator's offer
    init_offer = TradeOfferItemSpec(**offer.initiator_offer)
    recv_offer = TradeOfferItemSpec(**offer.receiver_offer)

    try:
        _transfer_pets(db, offer.initiator_id, offer.receiver_id, init_offer.pet_instance_ids)
        _transfer_pets(db, offer.receiver_id, offer.initiator_id, recv_offer.pet_instance_ids)
        _transfer_items(db, offer.initiator_id, offer.receiver_id, init_offer.item_ids)
        _transfer_items(db, offer.receiver_id, offer.initiator_id, recv_offer.item_ids)
        _transfer_currency(db, offer.initiator_id, offer.receiver_id, init_offer.currency)
        _transfer_currency(db, offer.receiver_id, offer.initiator_id, recv_offer.currency)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Trade execution failed: {str(e)}")

    # Record completed trade
    tx_record = TradeTransaction(
        trade_id=offer.trade_id,
        initiator_id=offer.initiator_id,
        receiver_id=offer.receiver_id,
        initiator_pet_ids={"pet_instance_ids": init_offer.pet_instance_ids},
        receiver_pet_ids={"pet_instance_ids": recv_offer.pet_instance_ids},
        initiator_item_ids={"item_ids": init_offer.item_ids},
        receiver_item_ids={"item_ids": recv_offer.item_ids},
        status="completed",
    )
    db.add(tx_record)

    offer.status = "accepted"
    offer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(offer)
    return offer


@router.put("/{trade_id}/decline", response_model=TradeOfferResponse)
def decline_trade(
    trade_id: str,
    req: TradeCancelRequest,
    db: Session = Depends(get_db_sync),
):
    """Decline a pending trade offer. Can be done by either party."""
    offer = db.execute(
        select(TradeOffer).where(TradeOffer.trade_id == trade_id)
    ).scalars().first()
    if not offer:
        raise HTTPException(status_code=404, detail="Trade offer not found.")

    if offer.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot decline a trade that is '{offer.status}'.")
    if req.user_id not in (offer.initiator_id, offer.receiver_id):
        raise HTTPException(status_code=403, detail="Only participants can decline this trade.")

    offer.status = "declined"
    offer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/{trade_id}", response_model=TradeOfferResponse)
def cancel_trade(
    trade_id: str,
    req: TradeCancelRequest,
    db: Session = Depends(get_db_sync),
):
    """Cancel a pending trade offer. Only the initiator can cancel."""
    offer = db.execute(
        select(TradeOffer).where(TradeOffer.trade_id == trade_id)
    ).scalars().first()
    if not offer:
        raise HTTPException(status_code=404, detail="Trade offer not found.")

    if offer.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot cancel a trade that is '{offer.status}'.")
    if req.user_id != offer.initiator_id:
        raise HTTPException(status_code=403, detail="Only the initiator can cancel this trade.")

    offer.status = "cancelled"
    offer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(offer)
    return offer


@router.get("/history/{player_id}", response_model=List[TradeTransactionResponse])
def trade_history(
    player_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_sync),
):
    """Get completed trade transaction history for a player."""
    conditions = or_(
        TradeTransaction.initiator_id == player_id,
        TradeTransaction.receiver_id == player_id,
    )
    offset = (page - 1) * limit
    txs = db.execute(
        select(TradeTransaction)
        .where(conditions)
        .order_by(desc(TradeTransaction.completed_at))
        .offset(offset)
        .limit(limit)
    ).scalars().all()
    return [TradeTransactionResponse.model_validate(tx) for tx in txs]
