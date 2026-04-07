from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.core.database import get_db, get_db_sync
from app.models.models import (
    GiftConfig, GiftTransaction,
    Player, PlayerGem, EconomyTransaction, GemTransaction,
)
from app.schemas.schemas import (
    GiftConfigResponse,
    GiftSendRequest,
    GiftSendResponse,
    GiftClaimRequest,
    GiftTransactionResponse,
    GiftCooldownResponse,
)

router = APIRouter(prefix="/gifts", tags=["gifts"])

# ── Config ──────────────────────────────────────────────────────────────────────

@router.get("/config", response_model=List[GiftConfigResponse])
def list_gift_configs(vip_only: bool = Query(False), db: Session = Depends(get_db_sync)):
    """List all active gift configurations."""
    query = select(GiftConfig).where(GiftConfig.is_active == True)
    if vip_only:
        query = query.where(GiftConfig.is_vip_only == True)
    result = db.execute(query.order_by(GiftConfig.gem_cost, GiftConfig.currency_cost))
    return result.scalars().all()


# ── Send Gift ────────────────────────────────────────────────────────────────────

def _is_same_day(dt1: datetime, dt2: datetime) -> bool:
    return dt1.year == dt2.year and dt1.month == dt2.month and dt1.day == dt2.day


def _get_daily_gift_count(db: Session, sender_id: str, gift_type: str) -> int:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = db.execute(
        select(func.count())
        .select_from(GiftTransaction)
        .where(
            GiftTransaction.sender_id == sender_id,
            GiftTransaction.gift_type == gift_type,
            GiftTransaction.sent_at >= today,
        )
    ).scalar() or 0
    return count


def _get_receiver_cooldown(db: Session, sender_id: str, receiver_id: str) -> float:
    """Return seconds remaining on cooldown for sender→receiver gift, 0 if none."""
    last_gift = db.execute(
        select(GiftTransaction)
        .where(
            GiftTransaction.sender_id == sender_id,
            GiftTransaction.receiver_id == receiver_id,
            GiftTransaction.status == "sent",
        )
        .order_by(GiftTransaction.sent_at.desc())
    ).scalars().first()

    if not last_gift:
        return 0.0

    cooldown_seconds = 86400  # 24h
    elapsed = (datetime.now(timezone.utc) - last_gift.sent_at.replace(tzinfo=timezone.utc)).total_seconds()
    return max(0.0, cooldown_seconds - elapsed)


@router.post("/send", response_model=GiftSendResponse)
def send_gift(req: GiftSendRequest, db: Session = Depends(get_db_sync)):
    """Send a gift to a friend. Enforces sender limit (5/day) and receiver cooldown (24h)."""
    # Can't gift yourself
    if req.sender_id == req.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send gift to yourself")

    # Load gift config
    gift_config = db.execute(
        select(GiftConfig).where(
            GiftConfig.gift_type == req.gift_type,
            GiftConfig.is_active == True,
        )
    ).scalars().first()
    if not gift_config:
        raise HTTPException(status_code=404, detail="Gift type not found")

    # Check VIP-only
    if gift_config.is_vip_only:
        # TODO: check sender vipLevel when Player model is extended
        pass

    # Check receiver cooldown
    cooldown = _get_receiver_cooldown(db, req.sender_id, req.receiver_id)
    if cooldown > 0:
        raise HTTPException(status_code=429, detail=f"Receiver cooldown active. Try again in {int(cooldown)} seconds.")

    # Check sender daily limit
    daily_count = _get_daily_gift_count(db, req.sender_id, req.gift_type)
    sender_daily_limit = 5  # could be increased for VIP players
    if daily_count >= sender_daily_limit:
        raise HTTPException(status_code=429, detail=f"Daily limit reached ({sender_daily_limit} gifts/day of {req.gift_type})")

    # Validate sender has enough currency/gems to pay for gift
    sender = db.get(Player, req.sender_id)
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")

    if gift_config.currency_cost > 0 and sender.total_currency < gift_config.currency_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient currency for gift. Need {gift_config.currency_cost}")

    sender_gems = db.get(PlayerGem, req.sender_id)
    sender_gem_balance = sender_gems.gem_balance if sender_gems else 0.0
    if gift_config.gem_cost > 0 and sender_gem_balance < gift_config.gem_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient gems for gift. Need {gift_config.gem_cost}")

    # Deduct gift cost from sender
    if gift_config.currency_cost > 0:
        sender.total_currency -= gift_config.currency_cost
        tx = EconomyTransaction(
            user_id=req.sender_id,
            transaction_type="gift_sent_cost",
            amount=-gift_config.currency_cost,
            balance_after=sender.total_currency,
            description=f"Gift cost: {gift_config.name} to {req.receiver_id}",
        )
        db.add(tx)

    if gift_config.gem_cost > 0 and sender_gems:
        sender_gems.gem_balance -= gift_config.gem_cost
        gem_tx = GemTransaction(
            user_id=req.sender_id,
            transaction_type="gift_sent_cost",
            amount=-gift_config.gem_cost,
            balance_after=sender_gems.gem_balance,
            description=f"Gift cost: {gift_config.name} to {req.receiver_id}",
        )
        db.add(gem_tx)

    # Create gift transaction (status: sent)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    gift_tx = GiftTransaction(
        gift_type=req.gift_type,
        sender_id=req.sender_id,
        receiver_id=req.receiver_id,
        currency_amount=gift_config.currency_value,
        gem_amount=gift_config.gem_value,
        item_id=gift_config.item_id,
        was_free=gift_config.currency_cost == 0 and gift_config.gem_cost == 0,
        status="sent",
        expires_at=expires_at,
    )
    db.add(gift_tx)
    db.commit()
    db.refresh(gift_tx)

    return GiftSendResponse(
        success=True,
        gift_transaction_id=gift_tx.id,
        status="sent",
        cooldown_remaining=0.0,
    )


# ── Claim Gift ───────────────────────────────────────────────────────────────────

@router.post("/{gift_id}/claim", response_model=GiftTransactionResponse)
def claim_gift(gift_id: int, req: GiftClaimRequest, db: Session = Depends(get_db_sync)):
    """Claim a received gift. Credits currency/gems to receiver."""
    gift = db.get(GiftTransaction, gift_id)
    if not gift:
        raise HTTPException(status_code=404, detail="Gift not found")

    if gift.receiver_id != req.receiver_id:
        raise HTTPException(status_code=403, detail="Gift not addressed to you")

    if gift.status != "sent":
        raise HTTPException(status_code=400, detail=f"Gift already {gift.status}")

    if gift.expires_at < datetime.now(timezone.utc):
        gift.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="Gift has expired")

    # Credit receiver
    receiver = db.get(Player, req.receiver_id)
    if gift.currency_amount > 0 and receiver:
        receiver.total_currency += gift.currency_amount
        tx = EconomyTransaction(
            user_id=req.receiver_id,
            transaction_type="gift_received",
            amount=gift.currency_amount,
            balance_after=receiver.total_currency,
            description=f"Gift received: {gift.gift_type} from {gift.sender_id}",
        )
        db.add(tx)

    if gift.gem_amount > 0:
        receiver_gems = db.get(PlayerGem, req.receiver_id)
        if not receiver_gems:
            receiver_gems = PlayerGem(user_id=req.receiver_id, gem_balance=0.0)
            db.add(receiver_gems)
            db.flush()
        receiver_gems.gem_balance += gift.gem_amount
        gem_tx = GemTransaction(
            user_id=req.receiver_id,
            transaction_type="gift_received",
            amount=gift.gem_amount,
            balance_after=receiver_gems.gem_balance,
            description=f"Gift received: {gift.gift_type} from {gift.sender_id}",
        )
        db.add(gem_tx)

    gift.status = "claimed"
    gift.claimed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(gift)
    return gift


# ── Gift History ─────────────────────────────────────────────────────────────────

@router.get("/sent", response_model=List[GiftTransactionResponse])
def get_sent_gifts(
    sender_id: str = Query(...),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db_sync),
):
    """Get a player's sent gift history."""
    gifts = db.execute(
        select(GiftTransaction)
        .where(GiftTransaction.sender_id == sender_id)
        .order_by(GiftTransaction.sent_at.desc())
        .limit(limit)
    ).scalars().all()
    return gifts


@router.get("/received", response_model=List[GiftTransactionResponse])
def get_received_gifts(
    receiver_id: str = Query(...),
    unclaimed_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db_sync),
):
    """Get a player's received gift history."""
    query = select(GiftTransaction).where(GiftTransaction.receiver_id == receiver_id)
    if unclaimed_only:
        query = query.where(GiftTransaction.status == "sent")
    gifts = db.execute(
        query.order_by(GiftTransaction.sent_at.desc())
        .limit(limit)
    ).scalars().all()
    return gifts


@router.get("/cooldown", response_model=GiftCooldownResponse)
def check_cooldown(
    sender_id: str = Query(...),
    receiver_id: str = Query(...),
    gift_type: str = Query(...),
    db: Session = Depends(get_db_sync),
):
    """Check if sender can send a gift to a specific receiver."""
    cooldown = _get_receiver_cooldown(db, sender_id, receiver_id)
    daily_count = _get_daily_gift_count(db, sender_id, gift_type)
    can_send = cooldown == 0 and daily_count < 5
    return GiftCooldownResponse(
        receiver_id=receiver_id,
        gift_type=gift_type,
        can_send=can_send,
        cooldown_remaining=cooldown,
    )
