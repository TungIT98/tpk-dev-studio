from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, update, func

from app.core.database import get_db, get_db_sync
from app.models.models import (
    SeasonalEvent, EventQuest, PlayerEventProgress,
    PlayerEventCurrency, EventLeaderboard,
    Player, PlayerGem, EconomyTransaction, GemTransaction,
)
from app.schemas.schemas import (
    SeasonalEventResponse,
    EventQuestResponse,
    PlayerEventProgressResponse,
    EventLeaderboardEntry,
    EventLeaderboardResponse,
    EventClaimRequest,
    EventClaimResponse,
    EventJoinRequest,
    EventPointsEarnRequest,
)

router = APIRouter(prefix="/events", tags=["events"])


def _update_event_statuses(db: Session) -> None:
    """Mark events as active/ended based on current date. Call on each request."""
    now = datetime.now(timezone.utc)
    db.execute(
        update(SeasonalEvent)
        .where(SeasonalEvent.is_active == True)
        .where(SeasonalEvent.end_date < now)
        .values(status="ended")
    )
    db.execute(
        update(SeasonalEvent)
        .where(SeasonalEvent.is_active == True)
        .where(SeasonalEvent.start_date <= now, SeasonalEvent.end_date >= now)
        .where(SeasonalEvent.status == "upcoming")
        .values(status="active")
    )
    db.commit()


# ── Event Calendar ──────────────────────────────────────────────────────────────

@router.get("", response_model=List[SeasonalEventResponse])
def list_events(
    status: Optional[str] = Query(None),  # upcoming, active, ended
    db: Session = Depends(get_db_sync),
):
    """List all events, optionally filtered by status. Auto-updates statuses."""
    _update_event_statuses(db)
    query = select(SeasonalEvent).where(SeasonalEvent.is_active == True)
    if status:
        query = query.where(SeasonalEvent.status == status)
    result = db.execute(query.order_by(SeasonalEvent.start_date.desc()))
    return result.scalars().all()


@router.get("/active", response_model=List[SeasonalEventResponse])
def list_active_events(db: Session = Depends(get_db_sync)):
    """List all currently active events."""
    _update_event_statuses(db)
    result = db.execute(
        select(SeasonalEvent)
        .where(SeasonalEvent.status == "active")
        .order_by(SeasonalEvent.start_date)
    )
    return result.scalars().all()


@router.get("/{event_id}", response_model=SeasonalEventResponse)
def get_event(event_id: str, db: Session = Depends(get_db_sync)):
    """Get a specific event."""
    _update_event_statuses(db)
    event = db.execute(
        select(SeasonalEvent).where(SeasonalEvent.event_id == event_id)
    ).scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/{event_id}/quests", response_model=List[EventQuestResponse])
def get_event_quests(event_id: str, db: Session = Depends(get_db_sync)):
    """Get all quests for an event."""
    event = db.execute(
        select(SeasonalEvent).where(SeasonalEvent.event_id == event_id)
    ).scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    quests = db.execute(
        select(EventQuest)
        .where(EventQuest.event_id == event_id, EventQuest.is_active == True)
        .order_by(EventQuest.target_value)
    ).scalars().all()
    return quests


# ── Event Join / Points ──────────────────────────────────────────────────────────

@router.post("/{event_id}/join")
def join_event(event_id: str, req: EventJoinRequest, db: Session = Depends(get_db_sync)):
    """Join an event. Creates player entry in leaderboard with 0 score."""
    _update_event_statuses(db)
    event = db.execute(
        select(SeasonalEvent).where(
            SeasonalEvent.event_id == event_id,
            SeasonalEvent.status == "active",
        )
    ).scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Active event not found")

    # Check if already joined
    existing = db.execute(
        select(EventLeaderboard).where(
            EventLeaderboard.event_id == event_id,
            EventLeaderboard.user_id == req.user_id,
        )
    ).scalars().first()
    if existing:
        return {"joined": True, "already_joined": True}

    lb = EventLeaderboard(
        event_id=event_id,
        user_id=req.user_id,
        username=req.username,
        score=0.0,
        rank=0,
    )
    db.add(lb)

    # Initialize event currency
    if event.reward_currency_name:
        currency = PlayerEventCurrency(
            user_id=req.user_id,
            event_id=event_id,
            currency_name=event.reward_currency_name,
            balance=0.0,
            total_earned=0.0,
        )
        db.add(currency)

    db.commit()
    return {"joined": True, "already_joined": False}


@router.post("/{event_id}/earn")
def earn_points(event_id: str, req: EventPointsEarnRequest, db: Session = Depends(get_db_sync)):
    """Award event points for completing a quest. Called from game events."""
    _update_event_statuses(db)

    quest = db.execute(
        select(EventQuest).where(
            EventQuest.event_id == event_id,
            EventQuest.quest_id == req.quest_id,
            EventQuest.is_active == True,
        )
    ).scalars().first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Update quest progress
    progress = db.execute(
        select(PlayerEventProgress).where(
            PlayerEventProgress.user_id == req.user_id,
            PlayerEventProgress.event_id == event_id,
            PlayerEventProgress.quest_id == req.quest_id,
        )
    ).scalars().first()

    if not progress:
        progress = PlayerEventProgress(
            user_id=req.user_id,
            event_id=event_id,
            quest_id=req.quest_id,
            progress=0.0,
            completed=False,
            reward_claimed=False,
        )
        db.add(progress)
        db.flush()

    progress.progress = min(progress.progress + req.delta, quest.target_value)
    if progress.progress >= quest.target_value and not progress.completed:
        progress.completed = True

    db.commit()

    # Update leaderboard score: sum points from completed quests
    completed_progress = db.execute(
        select(PlayerEventProgress)
        .where(
            PlayerEventProgress.user_id == req.user_id,
            PlayerEventProgress.event_id == event_id,
            PlayerEventProgress.completed == True,
        )
    ).scalars().all()

    total_points = sum(
        (
            db.execute(select(EventQuest.points_reward).where(EventQuest.quest_id == p.quest_id)).scalar() or 0.0
        )
        for p in completed_progress
    )

    lb = db.execute(
        select(EventLeaderboard).where(
            EventLeaderboard.event_id == event_id,
            EventLeaderboard.user_id == req.user_id,
        )
    ).scalars().first()
    if lb:
        lb.score = total_points
        db.commit()

    return {
        "quest_id": req.quest_id,
        "new_progress": progress.progress,
        "target": quest.target_value,
        "completed": progress.completed,
        "total_points": total_points,
    }


# ── Event Leaderboard ────────────────────────────────────────────────────────────

@router.get("/{event_id}/leaderboard", response_model=EventLeaderboardResponse)
def get_event_leaderboard(
    event_id: str,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_sync),
):
    """Get the event leaderboard, sorted by score."""
    entries = db.execute(
        select(EventLeaderboard)
        .where(EventLeaderboard.event_id == event_id)
        .order_by(EventLeaderboard.score.desc())
        .limit(limit)
    ).scalars().all()

    ranked = [
        EventLeaderboardEntry(
            rank=i + 1,
            user_id=e.user_id,
            username=e.username,
            score=e.score,
            rewards_distributed=e.rewards_distributed,
        )
        for i, e in enumerate(entries)
    ]
    return EventLeaderboardResponse(event_id=event_id, entries=ranked, total=len(ranked))


# ── Claim Rewards ────────────────────────────────────────────────────────────────

@router.post("/{event_id}/claim", response_model=EventClaimResponse)
def claim_quest_reward(event_id: str, req: EventClaimRequest, db: Session = Depends(get_db_sync)):
    """Claim reward for completing an event quest."""
    _update_event_statuses(db)

    quest = db.execute(select(EventQuest).where(EventQuest.quest_id == req.quest_id)).scalars().first()
    if not quest or quest.event_id != event_id:
        raise HTTPException(status_code=404, detail="Quest not found")

    progress = db.execute(
        select(PlayerEventProgress).where(
            PlayerEventProgress.user_id == req.user_id,
            PlayerEventProgress.event_id == event_id,
            PlayerEventProgress.quest_id == req.quest_id,
        )
    ).scalars().first()

    if not progress or not progress.completed:
        raise HTTPException(status_code=400, detail="Quest not yet completed")

    if progress.reward_claimed:
        return EventClaimResponse(
            event_id=event_id,
            quest_id=req.quest_id,
            user_id=req.user_id,
            points_earned=0.0,
            currency_reward=0.0,
            gem_reward=0.0,
            already_claimed=True,
        )

    progress.reward_claimed = True
    points = quest.points_reward
    currency = quest.currency_reward
    gems = quest.gem_reward

    # Grant currency
    if currency > 0:
        player = db.get(Player, req.user_id)
        if player:
            player.total_currency += currency
            tx = EconomyTransaction(
                user_id=req.user_id,
                transaction_type="event_reward",
                amount=currency,
                balance_after=player.total_currency,
                description=f"Event reward: {quest.name} ({event_id})",
            )
            db.add(tx)

    # Grant gems
    if gems > 0:
        gem_record = db.get(PlayerGem, req.user_id)
        if not gem_record:
            gem_record = PlayerGem(user_id=req.user_id, gem_balance=0.0)
            db.add(gem_record)
            db.flush()
        gem_record.gem_balance += gems
        gem_tx = GemTransaction(
            user_id=req.user_id,
            transaction_type="event_reward",
            amount=gems,
            balance_after=gem_record.gem_balance,
            description=f"Event reward: {quest.name} ({event_id})",
        )
        db.add(gem_tx)

    db.commit()
    return EventClaimResponse(
        event_id=event_id,
        quest_id=req.quest_id,
        user_id=req.user_id,
        points_earned=points,
        currency_reward=currency,
        gem_reward=gems,
        already_claimed=False,
    )


# ── Player Event Status ──────────────────────────────────────────────────────────

@router.get("/{event_id}/player/{user_id}")
def get_player_event_status(event_id: str, user_id: str, db: Session = Depends(get_db_sync)):
    """Get a player's status in an event: quests, progress, currency balance."""
    _update_event_statuses(db)
    event = db.execute(select(SeasonalEvent).where(SeasonalEvent.event_id == event_id)).scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # All quests
    quests = db.execute(
        select(EventQuest).where(EventQuest.event_id == event_id)
    ).scalars().all()

    quest_ids = [q.quest_id for q in quests]
    progresses = db.execute(
        select(PlayerEventProgress)
        .where(
            PlayerEventProgress.user_id == user_id,
            PlayerEventProgress.event_id == event_id,
        )
    ).scalars().all()
    progress_map = {p.quest_id: p for p in progresses}

    total_points = sum(
        p.progress for p in progresses if p.completed
    )

    # Event currency
    event_currency = None
    if event.reward_currency_name:
        ec = db.execute(
            select(PlayerEventCurrency).where(
                PlayerEventCurrency.user_id == user_id,
                PlayerEventCurrency.event_id == event_id,
            )
        ).scalars().first()
        if ec:
            event_currency = {"name": ec.currency_name, "balance": ec.balance}

    return {
        "event_id": event_id,
        "user_id": user_id,
        "event_status": event.status,
        "total_points": total_points,
        "event_currency": event_currency,
        "quests": [
            {
                "quest_id": q.quest_id,
                "name": q.name,
                "completed": progress_map.get(q.quest_id, None) is not None and progress_map[q.quest_id].completed,
                "reward_claimed": progress_map.get(q.quest_id, None) is not None and progress_map[q.quest_id].reward_claimed,
                "progress": progress_map.get(q.quest_id, None).progress if progress_map.get(q.quest_id) else 0.0,
                "target": q.target_value,
            }
            for q in quests
        ],
    }
