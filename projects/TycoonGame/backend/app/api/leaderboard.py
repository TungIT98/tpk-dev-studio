from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import get_current_user_optional
from app.models.models import Player, LeaderboardEntry
from app.schemas.schemas import LeaderboardRankRequest, LeaderboardResponse, LeaderboardEntryResponse

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(default=100, le=1000),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    _=Depends(get_current_user_optional),
):
    # Try cache first
    cache_key = f"leaderboard:top:{limit}"
    if redis:
        import json
        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            return LeaderboardResponse(entries=data["entries"], total=data["total"])

    # Get top players by total_earned_ever
    result = await db.execute(
        select(Player)
        .order_by(desc(Player.total_earned_ever))
        .limit(limit)
    )
    players = result.scalars().all()

    # Get total player count
    count_result = await db.execute(select(func.count(Player.user_id)))
    total = count_result.scalar() or 0

    entries = [
        LeaderboardEntryResponse(
            rank=idx + 1,
            user_id=p.user_id,
            username=p.username,
            total_earned=p.total_earned_ever,
            submitted_at=p.updated_at or datetime.utcnow(),
        )
        for idx, p in enumerate(players)
    ]

    response = LeaderboardResponse(entries=entries, total=total)

    # Cache for 1 minute
    if redis:
        import json
        await redis.setex(cache_key, 60, json.dumps({
            "entries": [e.model_dump(mode="json") for e in entries],
            "total": total,
        }))

    return response


@router.post("/rank", status_code=200)
async def submit_score(
    payload: LeaderboardRankRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    _=Depends(get_current_user_optional),
):
    """
    Submit or update a player's leaderboard entry.
    """
    result = await db.execute(select(LeaderboardEntry).where(LeaderboardEntry.user_id == str(payload.user_id)))
    entry = result.scalar_one_or_none()

    if entry:
        entry.total_earned = payload.total_earned
        entry.submitted_at = datetime.utcnow()
    else:
        entry = LeaderboardEntry(
            user_id=str(payload.user_id),
            total_earned=payload.total_earned,
        )
        db.add(entry)

    await db.commit()

    # Invalidate cache
    if redis:
        keys = []
        async for key in redis.scan_iter("leaderboard:top:*"):
            keys.append(key)
        if keys:
            await redis.delete(*keys)

    return {"success": True, "user_id": payload.user_id, "total_earned": payload.total_earned}
