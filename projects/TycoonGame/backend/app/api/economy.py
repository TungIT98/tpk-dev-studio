from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.core.database import get_db, get_db_sync
from app.models.models import (
    Player, PlayerGem, EconomyTransaction, GemTransaction,
    PriceHistory, IdempotencyRecord, AnomalyAlert, Item,
)
from app.schemas.schemas import (
    EconomyBalanceResponse,
    TradeExecuteRequest,
    TradeExecuteResponse,
    GemPurchaseRequest,
    GemConsumeRequest,
    GemTransactionResponse,
    PriceHistoryResponse,
    MarketStatsResponse,
    AnomalyAlertResponse,
)

router = APIRouter(prefix="/economy", tags=["economy"])


# ── Idempotency ─────────────────────────────────────────────────────────────────

def _check_idempotency(db: Session, key: str) -> Optional[dict]:
    record = db.get(IdempotencyRecord, key)
    if record and record.expires_at > datetime.now(timezone.utc):
        return record.result
    return None


def _store_idempotency(db: Session, key: str, user_id: str, action: str, result: dict, ttl_hours: int = 24):
    expires = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)
    record = IdempotencyRecord(
        idempotency_key=key,
        user_id=user_id,
        action=action,
        result=result,
        expires_at=expires,
    )
    db.merge(record)
    return record


# ── Anomaly Detection ─────────────────────────────────────────────────────────────

def _check_anomaly(db: Session, user_id: str, currency_delta: float, gem_delta: float) -> Optional[AnomalyAlert]:
    """Detect suspicious activity: rapid large changes, negative balances, etc."""
    # Check for rapid currency accumulation (velocity check)
    recent_window = datetime.now(timezone.utc) - timedelta(hours=1)
    recent_txs = db.execute(
        select(func.count(), func.sum(EconomyTransaction.amount))
        .select_from(EconomyTransaction)
        .where(
            EconomyTransaction.user_id == user_id,
            EconomyTransaction.created_at >= recent_window,
        )
    ).one()

    tx_count = recent_txs[0] or 0
    total_delta = recent_txs[1] or 0.0

    alert_type = None
    severity = "low"
    description = None

    if currency_delta > 1_000_000:  # suspicious large single trade
        alert_type = "inflation"
        severity = "high"
        description = f"Large currency trade: {currency_delta}"
    elif tx_count > 100:
        alert_type = "velocity"
        severity = "medium"
        description = f"High transaction velocity: {tx_count} txns in 1h"
    elif total_delta > 5_000_000:
        alert_type = "inflation"
        severity = "medium"
        description = f"Rapid accumulation: {total_delta} in 1h"

    if alert_type:
        alert = AnomalyAlert(
            user_id=user_id,
            alert_type=alert_type,
            severity=severity,
            description=description,
            anomaly_metadata={"currency_delta": currency_delta, "gem_delta": gem_delta, "tx_count": tx_count},
        )
        db.add(alert)
        return alert
    return None


# ── Balance ──────────────────────────────────────────────────────────────────────

@router.get("/player/{user_id}", response_model=EconomyBalanceResponse)
def get_player_balance(user_id: str, db: Session = Depends(get_db_sync)):
    """Get a player's currency and gem balances."""
    player = db.get(Player, user_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    gem_record = db.get(PlayerGem, user_id)
    gem_balance = gem_record.gem_balance if gem_record else 0.0
    total_purchased = gem_record.total_purchased if gem_record else 0.0
    total_consumed = gem_record.total_consumed if gem_record else 0.0

    return EconomyBalanceResponse(
        user_id=user_id,
        currency_balance=player.total_currency,
        gem_balance=gem_balance,
        total_purchased_gems=total_purchased,
        total_consumed_gems=total_consumed,
    )


# ── Trade Execution ───────────────────────────────────────────────────────────────

@router.post("/trade-execute", response_model=TradeExecuteResponse)
def execute_trade(req: TradeExecuteRequest, db: Session = Depends(get_db_sync)):
    """
    Atomically execute a currency/gem transfer between two players.
    Idempotency key prevents double-spend on retry.
    """
    # Check idempotency first
    cached = _check_idempotency(db, req.idempotency_key)
    if cached:
        return TradeExecuteResponse(**cached)

    # Validate: can't trade to yourself
    if req.from_user_id == req.to_user_id:
        raise HTTPException(status_code=400, detail="Cannot trade with yourself")

    # Validate amounts
    if req.currency_amount < 0 and req.gem_amount < 0:
        raise HTTPException(status_code=400, detail="Amounts must be non-negative")
    if req.currency_amount == 0 and req.gem_amount == 0:
        raise HTTPException(status_code=400, detail="At least one amount must be positive")

    # Fetch players
    from_player = db.get(Player, req.from_user_id)
    to_player = db.get(Player, req.to_user_id)
    if not from_player or not to_player:
        raise HTTPException(status_code=404, detail="One or both players not found")

    from_gems = db.get(PlayerGem, req.from_user_id)

    # Validate balances
    if req.currency_amount > 0 and from_player.total_currency < req.currency_amount:
        raise HTTPException(status_code=400, detail=f"Insufficient currency. Have {from_player.total_currency}, need {req.currency_amount}")

    if req.gem_amount > 0 and (not from_gems or from_gems.gem_balance < req.gem_amount):
        raise HTTPException(status_code=400, detail=f"Insufficient gems. Have {from_gems.gem_balance if from_gems else 0}, need {req.gem_amount}")

    # Anomaly detection
    _check_anomaly(db, req.from_user_id, -req.currency_amount, -req.gem_amount)
    _check_anomaly(db, req.to_user_id, req.currency_amount, req.gem_amount)

    # Execute atomic transfer
    from_player.total_currency -= req.currency_amount
    to_player.total_currency += req.currency_amount

    tx_ids = []

    # Currency transaction
    currency_tx = EconomyTransaction(
        user_id=req.from_user_id,
        transaction_type="trade_sent",
        amount=-req.currency_amount,
        balance_after=from_player.total_currency,
        description=f"Trade to {req.to_user_id}" + (f" (item: {req.item_id})" if req.item_id else ""),
    )
    db.add(currency_tx)
    db.flush()
    tx_ids.append(f"cur_tx_{currency_tx.id}")

    currency_rx = EconomyTransaction(
        user_id=req.to_user_id,
        transaction_type="trade_received",
        amount=req.currency_amount,
        balance_after=to_player.total_currency,
        description=f"Trade from {req.from_user_id}" + (f" (item: {req.item_id})" if req.item_id else ""),
    )
    db.add(currency_rx)
    db.flush()
    tx_ids.append(f"cur_tx_{currency_rx.id}")

    # Gem transfer
    gem_from_new = from_gems.gem_balance if from_gems else 0.0
    gem_to_new = 0.0

    if req.gem_amount > 0:
        from_gems.gem_balance -= req.gem_amount
        gem_from_new = from_gems.gem_balance

        to_gems = db.get(PlayerGem, req.to_user_id)
        if not to_gems:
            to_gems = PlayerGem(user_id=req.to_user_id, gem_balance=0.0)
            db.add(to_gems)
            db.flush()

        to_gems.gem_balance += req.gem_amount
        gem_to_new = to_gems.gem_balance

        gem_tx = GemTransaction(
            user_id=req.from_user_id,
            transaction_type="trade_sent",
            amount=-req.gem_amount,
            balance_after=gem_from_new,
            description=f"Gem trade to {req.to_user_id}",
            idempotency_key=req.idempotency_key,
        )
        db.add(gem_tx)
        db.flush()
        tx_ids.append(f"gem_tx_{gem_tx.id}")

        gem_rx = GemTransaction(
            user_id=req.to_user_id,
            transaction_type="trade_received",
            amount=req.gem_amount,
            balance_after=gem_to_new,
            description=f"Gem trade from {req.from_user_id}",
        )
        db.add(gem_rx)
        db.flush()
        tx_ids.append(f"gem_tx_{gem_rx.id}")

    db.commit()

    result = {
        "success": True,
        "idempotency_key": req.idempotency_key,
        "from_new_balance": from_player.total_currency,
        "to_new_balance": to_player.total_currency,
        "gem_from_new": gem_from_new,
        "gem_to_new": gem_to_new,
        "transaction_ids": tx_ids,
    }
    _store_idempotency(db, req.idempotency_key, req.from_user_id, "trade_execute", result)
    db.commit()

    return TradeExecuteResponse(**result)


# ── Gem Purchase (IAP Mock) ───────────────────────────────────────────────────────

@router.post("/gems/purchase", response_model=GemTransactionResponse)
def purchase_gems(req: GemPurchaseRequest, db: Session = Depends(get_db_sync)):
    """Mock IAP gem purchase. Idempotent via idempotency_key."""
    cached = _check_idempotency(db, req.idempotency_key)
    if cached:
        return GemTransactionResponse(**cached)

    gem_record = db.get(PlayerGem, req.user_id)
    if not gem_record:
        gem_record = PlayerGem(user_id=req.user_id, gem_balance=0.0)
        db.add(gem_record)
        db.flush()

    gem_record.gem_balance += req.gem_amount
    gem_record.total_purchased += req.gem_amount

    tx = GemTransaction(
        user_id=req.user_id,
        transaction_type="purchase",
        amount=req.gem_amount,
        balance_after=gem_record.gem_balance,
        description=f"Gem purchase: {req.gem_amount} gems for {req.price_paid}",
        source=req.source,
        idempotency_key=req.idempotency_key,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    result = tx.__dict__.copy()
    result.pop("_sa_instance_state", None)
    # Convert datetime objects to ISO strings for JSON serialization
    for k, v in list(result.items()):
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()
    _store_idempotency(db, req.idempotency_key, req.user_id, "gem_purchase", result)
    db.commit()
    return tx


@router.post("/gems/consume", response_model=GemTransactionResponse)
def consume_gems(req: GemConsumeRequest, db: Session = Depends(get_db_sync)):
    """Spend gems (buy item, entry fee, etc.). Idempotent."""
    cached = _check_idempotency(db, req.idempotency_key)
    if cached:
        return GemTransactionResponse(**cached)

    gem_record = db.get(PlayerGem, req.user_id)
    if not gem_record or gem_record.gem_balance < req.gem_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient gems. Have {gem_record.gem_balance if gem_record else 0}, need {req.gem_amount}"
        )

    gem_record.gem_balance -= req.gem_amount
    gem_record.total_consumed += req.gem_amount

    tx = GemTransaction(
        user_id=req.user_id,
        transaction_type="consume",
        amount=-req.gem_amount,
        balance_after=gem_record.gem_balance,
        description=req.description or f"Consumed {req.gem_amount} gems",
        idempotency_key=req.idempotency_key,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    result = tx.__dict__.copy()
    result.pop("_sa_instance_state", None)
    for k, v in list(result.items()):
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()
    _store_idempotency(db, req.idempotency_key, req.user_id, "gem_consume", result)
    db.commit()
    return tx


# ── Price History ────────────────────────────────────────────────────────────────

@router.get("/price-history/{item_id}", response_model=PriceHistoryResponse)
def get_price_history(
    item_id: str,
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db_sync),
):
    """Get historical price data for an item over N days (rolling window)."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = db.execute(
        select(PriceHistory)
        .where(
            PriceHistory.item_id == item_id,
            PriceHistory.recorded_at >= since,
        )
        .order_by(PriceHistory.recorded_at.desc())
    ).scalars().all()

    return PriceHistoryResponse(
        item_id=item_id,
        prices=[{"price": r.price, "recorded_at": r.recorded_at.isoformat()} for r in rows],
    )


@router.post("/price-history/{item_id}/record")
def record_price(item_id: str, price: float, db: Session = Depends(get_db_sync)):
    """Record a price data point (called by game server or admin)."""
    record = PriceHistory(item_id=item_id, price=price)
    db.add(record)
    db.commit()
    return {"item_id": item_id, "price": price, "recorded": True}


# ── Market Stats ─────────────────────────────────────────────────────────────────

@router.get("/market-stats", response_model=MarketStatsResponse)
def get_market_stats(db: Session = Depends(get_db_sync)):
    """Aggregate economy health metrics."""
    cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)

    total_currency = db.execute(
        select(func.sum(Player.total_currency))
    ).scalar() or 0.0

    total_gems = db.execute(
        select(func.sum(PlayerGem.gem_balance))
    ).scalar() or 0.0

    active_traders = db.execute(
        select(func.count(func.distinct(EconomyTransaction.user_id)))
        .where(EconomyTransaction.created_at >= cutoff_24h)
    ).scalar() or 0

    avg_volume = db.execute(
        select(func.avg(EconomyTransaction.amount))
        .where(
            EconomyTransaction.created_at >= cutoff_24h,
            EconomyTransaction.transaction_type.in_(["trade_sent", "trade_received"]),
        )
    ).scalar() or 0.0

    active_alerts = db.execute(
        select(func.count())
        .where(AnomalyAlert.resolved_at.is_(None))
    ).scalar() or 0

    return MarketStatsResponse(
        total_currency_in_circulation=total_currency,
        total_gems_in_circulation=total_gems,
        active_traders_24h=active_traders,
        avg_trade_volume_24h=float(avg_volume),
        active_anomaly_alerts=active_alerts,
    )


# ── Anomaly Alerts ──────────────────────────────────────────────────────────────

@router.get("/anomalies", response_model=List[AnomalyAlertResponse])
def list_anomalies(
    severity: Optional[str] = Query(None),
    unresolved_only: bool = Query(True),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db_sync),
):
    """List economy anomaly alerts."""
    query = select(AnomalyAlert).order_by(AnomalyAlert.created_at.desc())
    if severity:
        query = query.where(AnomalyAlert.severity == severity)
    if unresolved_only:
        query = query.where(AnomalyAlert.resolved_at.is_(None))
    result = db.execute(query.limit(limit))
    return result.scalars().all()


@router.post("/anomalies/{alert_id}/resolve")
def resolve_anomaly(alert_id: int, db: Session = Depends(get_db_sync)):
    """Mark an anomaly alert as resolved."""
    alert = db.get(AnomalyAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"resolved": True, "alert_id": alert_id}
