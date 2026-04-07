"""
Daily Engagement API: Login streaks, energy/stamina, daily missions,
push notification webhooks, and retention analytics.
"""
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func

from app.core.database import get_db, get_db_sync
from app.core.config import settings
from app.models.models import (
    LoginStreak, DailyMission, PlayerDailyMission, DailyReward,
    PlayerEnergy, Player, PushNotificationRecord,
    EconomyTransaction, GemTransaction, PlayerGem,
)
from app.schemas.schemas import (
    LoginStreakResponse,
    DailyMissionResponse,
    PlayerDailyMissionResponse,
    DailyRewardResponse,
    EnergyStatusResponse,
    EnergySpendRequest,
    EnergySpendResponse,
    RetentionStatsResponse,
)

router = APIRouter(prefix="/engagement", tags=["engagement"])


def _today_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ── Login Streaks ──────────────────────────────────────────────────────────────

@router.get("/streak/{user_id}", response_model=LoginStreakResponse)
def get_login_streak(user_id: str, db: Session = Depends(get_db_sync)):
    """Get a player's current login streak."""
    streak = db.get(LoginStreak, user_id)
    today = _today_utc()

    if not streak:
        return LoginStreakResponse(
            user_id=user_id,
            current_streak=0,
            longest_streak=0,
            last_login_date=None,
            streak_day_eligible=True,  # Can claim today's reward
        )

    streak_day_eligible = streak.last_login_date != today
    return LoginStreakResponse(
        user_id=user_id,
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_login_date=streak.last_login_date,
        streak_day_eligible=streak_day_eligible,
    )


@router.post("/streak/{user_id}/login", response_model=LoginStreakResponse)
def record_login(user_id: str, db: Session = Depends(get_db_sync)):
    """
    Record a daily login. Increments streak if consecutive, resets if missed.
    Returns the new streak and whether today's reward is claimable.
    """
    today = _today_utc()
    streak = db.get(LoginStreak, user_id)

    if not streak:
        streak = LoginStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_login_date=today,
            streak_started_at=datetime.now(timezone.utc),
        )
        db.add(streak)
    elif streak.last_login_date == today:
        # Already logged in today
        pass
    else:
        last_date = datetime.strptime(streak.last_login_date, "%Y-%m-%d").date()
        today_date = datetime.now(timezone.utc).date()
        diff = (today_date - last_date).days

        if diff == 1:
            # Consecutive day — increment
            streak.current_streak += 1
        elif diff > 1:
            # Missed a day — reset
            streak.current_streak = 1
            streak.streak_started_at = datetime.now(timezone.utc)

        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak

        streak.last_login_date = today

    db.commit()
    db.refresh(streak)

    return LoginStreakResponse(
        user_id=user_id,
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_login_date=streak.last_login_date,
        streak_day_eligible=True,
    )


@router.get("/streak/{user_id}/daily-reward", response_model=DailyRewardResponse)
def get_daily_reward(user_id: str, db: Session = Depends(get_db_sync)):
    """Get today's daily streak reward. Must have logged in today."""
    streak = db.get(LoginStreak, user_id)
    if not streak or streak.last_login_date != _today_utc():
        raise HTTPException(status_code=400, detail="Must log in today to claim daily reward")

    reward = db.execute(
        select(DailyReward)
        .where(DailyReward.streak_day == streak.current_streak, DailyReward.is_active == True)
    ).scalars().first()

    if not reward:
        # Use a default or find closest lower day
        reward = db.execute(
            select(DailyReward)
            .where(DailyReward.streak_day <= streak.current_streak, DailyReward.is_active == True)
            .order_by(DailyReward.streak_day.desc())
        ).scalars().first()

    if not reward:
        raise HTTPException(status_code=404, detail="No daily reward configured for this streak day")

    return DailyRewardResponse(
        streak_day=reward.streak_day,
        currency_reward=reward.currency_reward,
        gem_reward=reward.gem_reward,
    )


# ── Energy System ─────────────────────────────────────────────────────────────

def _calc_energy(db: Session, user_id: str) -> float:
    """Calculate current energy based on time elapsed since last_update."""
    energy_rec = db.get(PlayerEnergy, user_id)
    if not energy_rec:
        return 100.0

    elapsed = (datetime.now(timezone.utc) - energy_rec.last_update.replace(tzinfo=timezone.utc)).total_seconds()
    # regen_rate is energy per 5 minutes (300 seconds)
    regen_per_sec = energy_rec.regen_rate / 300.0
    regenerated = elapsed * regen_per_sec
    current = min(energy_rec.current_energy + regenerated, energy_rec.max_energy)
    return current


@router.get("/energy/{user_id}", response_model=EnergyStatusResponse)
def get_energy(user_id: str, db: Session = Depends(get_db_sync)):
    """Get current energy (regenerated since last check) and metadata."""
    energy_rec = db.get(PlayerEnergy, user_id)
    current = _calc_energy(db, user_id)
    max_e = energy_rec.max_energy if energy_rec else 100.0
    regen = energy_rec.regen_rate if energy_rec else 1.0

    return EnergyStatusResponse(
        user_id=user_id,
        current_energy=current,
        max_energy=max_e,
        regen_rate=regen,
        energy_percent=current / max_e * 100,
    )


@router.post("/energy/{user_id}/spend", response_model=EnergySpendResponse)
def spend_energy(user_id: str, req: EnergySpendRequest, db: Session = Depends(get_db_sync)):
    """Spend energy for an action. Returns new balance."""
    energy_rec = db.get(PlayerEnergy, user_id)
    current = _calc_energy(db, user_id)

    if current < req.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough energy. Have {current:.1f}, need {req.amount:.1f}"
        )

    if not energy_rec:
        energy_rec = PlayerEnergy(
            user_id=user_id,
            current_energy=current - req.amount,
            max_energy=100.0,
            regen_rate=1.0,
            last_update=datetime.now(timezone.utc),
        )
        db.add(energy_rec)
    else:
        energy_rec.current_energy = current - req.amount
        energy_rec.last_update = datetime.now(timezone.utc)

    db.commit()

    new_energy = energy_rec.current_energy
    return EnergySpendResponse(
        user_id=user_id,
        energy_spent=req.amount,
        new_energy=new_energy,
        energy_full=new_energy >= energy_rec.max_energy,
    )


# ── Daily Missions ─────────────────────────────────────────────────────────────

@router.get("/missions/today", response_model=List[PlayerDailyMissionResponse])
def get_today_missions(user_id: str = Query(...), db: Session = Depends(get_db_sync)):
    """Get today's daily missions with player progress."""
    today = _today_utc()
    rows = db.execute(
        select(PlayerDailyMission)
        .options(joinedload(PlayerDailyMission.mission))
        .where(
            PlayerDailyMission.user_id == user_id,
            PlayerDailyMission.date_assigned == today,
        )
        .order_by(PlayerDailyMission.mission_id)
    ).scalars().unique().all()

    # If no missions assigned for today, assign from config
    if not rows:
        missions = db.execute(
            select(DailyMission).where(DailyMission.is_active == True)
        ).scalars().all()
        for m in missions:
            pm = PlayerDailyMission(
                user_id=user_id,
                mission_id=m.mission_id,
                progress=0.0,
                completed=False,
                claimed=False,
                date_assigned=today,
            )
            db.add(pm)
        db.commit()
        rows = db.execute(
            select(PlayerDailyMission)
            .options(joinedload(PlayerDailyMission.mission))
            .where(
                PlayerDailyMission.user_id == user_id,
                PlayerDailyMission.date_assigned == today,
            )
        ).scalars().unique().all()

    result = []
    for row in rows:
        m = row.mission if hasattr(row, 'mission') else db.get(DailyMission, row.mission_id)
        result.append(PlayerDailyMissionResponse(
            user_id=user_id,
            mission_id=row.mission_id,
            mission=DailyMissionResponse.model_validate(m) if m else None,
            progress=row.progress,
            completed=row.completed,
            claimed=row.claimed,
            date_assigned=row.date_assigned,
        ))
    return result


@router.post("/missions/{mission_id}/progress")
def update_mission_progress(
    mission_id: str,
    user_id: str = Query(...),
    delta: float = Query(1.0),
    db: Session = Depends(get_db_sync),
):
    """Increment mission progress (called from game events)."""
    mission = db.get(DailyMission, mission_id)
    if not mission or not mission.is_active:
        raise HTTPException(status_code=404, detail="Mission not found")

    today = _today_utc()
    pm = db.execute(
        select(PlayerDailyMission).where(
            PlayerDailyMission.user_id == user_id,
            PlayerDailyMission.mission_id == mission_id,
            PlayerDailyMission.date_assigned == today,
        )
    ).scalars().first()

    if not pm:
        pm = PlayerDailyMission(
            user_id=user_id,
            mission_id=mission_id,
            progress=0.0,
            completed=False,
            claimed=False,
            date_assigned=today,
        )
        db.add(pm)
        db.flush()

    pm.progress = min(pm.progress + delta, mission.target_value)
    if pm.progress >= mission.target_value:
        pm.completed = True

    db.commit()
    return {"mission_id": mission_id, "progress": pm.progress, "target": mission.target_value, "completed": pm.completed}


@router.post("/missions/{mission_id}/claim")
def claim_mission_reward(
    mission_id: str,
    user_id: str = Query(...),
    db: Session = Depends(get_db_sync),
):
    """Claim a completed mission's reward."""
    mission = db.get(DailyMission, mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    today = _today_utc()
    pm = db.execute(
        select(PlayerDailyMission).where(
            PlayerDailyMission.user_id == user_id,
            PlayerDailyMission.mission_id == mission_id,
            PlayerDailyMission.date_assigned == today,
        )
    ).scalars().first()

    if not pm or not pm.completed:
        raise HTTPException(status_code=400, detail="Mission not completed")

    if pm.claimed:
        return {"claimed": True, "currency": 0.0, "gems": 0.0}

    pm.claimed = True

    if mission.reward_currency > 0:
        player = db.get(Player, user_id)
        if player:
            player.total_currency += mission.reward_currency
            db.add(EconomyTransaction(
                user_id=user_id,
                transaction_type="mission_reward",
                amount=mission.reward_currency,
                balance_after=player.total_currency,
                description=f"Daily mission reward: {mission.name}",
            ))

    if mission.reward_gems > 0:
        gem_rec = db.get(PlayerGem, user_id)
        if not gem_rec:
            gem_rec = PlayerGem(user_id=user_id, gem_balance=0.0)
            db.add(gem_rec)
            db.flush()
        gem_rec.gem_balance += mission.reward_gems
        db.add(GemTransaction(
            user_id=user_id,
            transaction_type="mission_reward",
            amount=mission.reward_gems,
            balance_after=gem_rec.gem_balance,
            description=f"Daily mission reward: {mission.name}",
        ))

    db.commit()
    return {"claimed": True, "currency": mission.reward_currency, "gems": mission.reward_gems}


# ── Push Notifications ─────────────────────────────────────────────────────────

async def _send_push(user_id: str, notification_type: str, payload: dict, db: Session) -> str:
    """Send a push notification via Braze or OneSignal. Returns status."""
    provider = payload.pop("_provider", "braze")  # braze or onesignal

    record = PushNotificationRecord(
        user_id=user_id,
        provider=provider,
        notification_type=notification_type,
        payload=payload,
        status="sent",
    )
    db.add(record)
    db.commit()

    # Mock: in production, call Braze/OneSignal API
    try:
        if provider == "braze":
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.braze_api_url}/messages/send",
                    headers={"Authorization": f"Bearer {settings.braze_api_key}"},
                    json={"external_user_ids": [user_id], "messages": {"push": {"alert": payload.get("message", "")}}},
                    timeout=5.0,
                )
        elif provider == "onesignal":
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.onesignal_api_url}/notifications",
                    headers={"Authorization": f"Basic {settings.onesignal_api_key}"},
                    json={"include_external_user_ids": [user_id], "contents": {"en": payload.get("message", "")}},
                    timeout=5.0,
                )
    except Exception:
        record.status = "failed"
        db.commit()

    return record.status


@router.post("/notifications/energy-full")
async def notify_energy_full(
    user_id: str,
    db: Session = Depends(get_db_sync),
):
    """Webhook: notify player their energy is full."""
    energy = _calc_energy(db, user_id)
    status = await _send_push(
        user_id=user_id,
        notification_type="energy_full",
        payload={"message": "Your energy is fully restored!", "current_energy": energy},
        db=db,
    )
    return {"user_id": user_id, "notification_type": "energy_full", "status": status}


@router.post("/notifications/streak-risk")
async def notify_streak_risk(user_id: str, db: Session = Depends(get_db_sync)):
    """Webhook: notify player their streak is at risk of breaking."""
    streak = db.get(LoginStreak, user_id)
    message = f"Play today to keep your {streak.current_streak}-day streak alive!"
    status = await _send_push(
        user_id=user_id,
        notification_type="streak_risk",
        payload={"message": message, "current_streak": streak.current_streak if streak else 0},
        db=db,
    )
    return {"user_id": user_id, "notification_type": "streak_risk", "status": status}


# ── Retention Analytics ─────────────────────────────────────────────────────────

@router.get("/analytics/retention", response_model=RetentionStatsResponse)
def get_retention_stats(db: Session = Depends(get_db_sync)):
    """Get DAU and retention metrics for today."""
    today = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)

    dau = db.execute(
        select(func.count(func.distinct(Player.user_id)))
        .where(Player.updated_at >= today_start)
    ).scalar() or 0

    # 1-day retention: users who logged in today AND yesterday
    yesterday = today - timedelta(days=1)
    yesterday_start = datetime.combine(yesterday, datetime.min.time()).replace(tzinfo=timezone.utc)

    retained_1d = db.execute(
        select(func.count(func.distinct(Player.user_id)))
        .where(Player.updated_at >= today_start)
    ).scalar() or 0

    return RetentionStatsResponse(
        dau=dau,
        dau_1d_ago=retained_1d,
        retention_1d=0.0,  # Would require cohort tracking from login_streaks table
        retention_7d=0.0,
        retention_30d=0.0,
        total_players=db.execute(select(func.count(Player.user_id))).scalar() or 0,
    )
