from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.core.redis import get_redis
from app.core.security import get_current_user_optional
from app.models.models import Player, EconomyTransaction
from app.schemas.schemas import (
    PlayerSaveRequest,
    PlayerResponse,
    OfflineEarningsRequest,
    OfflineEarningsResponse,
)

router = APIRouter(prefix="/api/player", tags=["player"])


@router.get("/{user_id}", response_model=PlayerResponse)
async def get_player(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    _=Depends(get_current_user_optional),
):
    # Try cache first
    if redis:
        cached = await redis.get(f"player:{user_id}")
        if cached:
            import json
            return PlayerResponse(**json.loads(cached))

    result = await db.execute(select(Player).where(Player.user_id == str(user_id)))
    player = result.scalar_one_or_none()

    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    response = PlayerResponse.model_validate(player)

    # Cache for 5 minutes
    if redis:
        import json
        await redis.setex(f"player:{user_id}", 300, json.dumps(response.model_dump(mode="json")))

    return response


@router.post("/{user_id}/save", status_code=status.HTTP_200_OK)
async def save_player(
    user_id: str,
    payload: PlayerSaveRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    _=Depends(get_current_user_optional),
):
    result = await db.execute(select(Player).where(Player.user_id == str(user_id)))
    player = result.scalar_one_or_none()

    now = datetime.utcnow()
    now_ts = int(datetime.utcnow().timestamp())

    if player:
        player.username = payload.username
        player.total_currency = payload.total_currency
        player.total_earned = payload.total_earned
        player.total_earned_ever = max(player.total_earned_ever, payload.total_earned_ever)
        player.prestige_level = payload.prestige_level
        player.prestige_points = payload.prestige_points
        player.businesses = payload.businesses
        player.upgrades = payload.upgrades
        player.pets = payload.pets
        player.last_save_time = payload.saved_at or now_ts
        player.save_version = payload.save_version
        player.updated_at = now
    else:
        player = Player(
            user_id=str(user_id),
            username=payload.username,
            total_currency=payload.total_currency,
            total_earned=payload.total_earned,
            total_earned_ever=payload.total_earned_ever,
            prestige_level=payload.prestige_level,
            prestige_points=payload.prestige_points,
            businesses=payload.businesses,
            upgrades=payload.upgrades,
            pets=payload.pets,
            last_save_time=payload.saved_at or now_ts,
            save_version=payload.save_version,
        )
        db.add(player)

    await db.commit()
    await db.refresh(player)

    # Invalidate cache
    if redis:
        await redis.delete(f"player:{user_id}")

    # Record transaction
    tx = EconomyTransaction(
        user_id=str(user_id),
        transaction_type="save",
        amount=0,
        balance_after=payload.total_currency,
        description=f"Player save snapshot v{payload.save_version}",
    )
    db.add(tx)
    await db.commit()

    return {"success": True, "saved_at": now_ts}


@router.post("/{user_id}/offline", response_model=OfflineEarningsResponse)
async def get_offline_earnings(
    user_id: str,
    payload: OfflineEarningsRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user_optional),
):
    """
    Calculate offline earnings based on time elapsed since last save.
    Offline rate = 50% of normal income per second.
    Max offline time = 8 hours (28800 seconds).
    """
    result = await db.execute(select(Player).where(Player.user_id == str(user_id)))
    player = result.scalar_one_or_none()

    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    # Cap at 8 hours
    elapsed = min(payload.now - payload.last_save_time, 28800)
    if elapsed <= 0:
        return OfflineEarningsResponse(offline_earnings=0, new_currency=player.total_currency)

    # Use current income rate from player's saved state
    # We'll approximate income as total_earned / time_played
    income_rate = player.total_earned / max(player.total_earned_ever / 100, 1) * 10
    income_rate = min(income_rate, player.total_earned * 0.001) if player.total_earned > 0 else 0

    offline_earnings = elapsed * income_rate * settings.OFFLINE_EARNINGS_RATE
    new_currency = player.total_currency + offline_earnings

    return OfflineEarningsResponse(
        offline_earnings=round(offline_earnings, 2),
        new_currency=round(new_currency, 2),
        earnings_rate=settings.OFFLINE_EARNINGS_RATE,
    )
