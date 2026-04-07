import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func

from app.core.database import get_db, get_db_sync
from app.models.models import MiniGameConfig, MiniGameSession, MiniGameLeaderboard
from app.schemas.schemas import (
    MiniGameConfigResponse,
    MiniGameStartRequest,
    MiniGameStartResponse,
    MiniGameScoreSubmitRequest,
    MiniGameScoreResponse,
    MiniGameLeaderboardEntry,
    MiniGameLeaderboardResponse,
    MiniGameCooldownResponse,
)

router = APIRouter(prefix="/minigames", tags=["minigames"])


# ── Config ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[MiniGameConfigResponse])
def list_games(game_type: Optional[str] = Query(None), db: Session = Depends(get_db_sync)):
    """List all active mini-games, optionally filtered by type."""
    query = select(MiniGameConfig).where(MiniGameConfig.is_active == True)
    if game_type:
        query = query.where(MiniGameConfig.game_type == game_type)
    result = db.execute(query.order_by(MiniGameConfig.name))
    return result.scalars().all()


@router.get("/{game_id}", response_model=MiniGameConfigResponse)
def get_game(game_id: str, db: Session = Depends(get_db_sync)):
    """Get a specific mini-game configuration."""
    game = db.execute(
        select(MiniGameConfig).where(
            MiniGameConfig.game_id == game_id,
            MiniGameConfig.is_active == True,
        )
    ).scalars().first()
    if not game:
        raise HTTPException(status_code=404, detail="Mini-game not found")
    return game


# ── Session Lifecycle ───────────────────────────────────────────────────────────

def _get_cooldown_remaining(db: Session, user_id: str, game_id: str) -> float:
    """Return seconds remaining in cooldown, or 0.0 if not in cooldown."""
    last = db.execute(
        select(MiniGameSession)
        .where(
            MiniGameSession.user_id == user_id,
            MiniGameSession.game_id == game_id,
            MiniGameSession.status == "active",
        )
        .order_by(MiniGameSession.started_at.desc())
    ).scalars().first()

    if not last:
        return 0.0

    config = db.execute(
        select(MiniGameConfig).where(MiniGameConfig.game_id == game_id)
    ).scalars().first()
    if not config:
        return 0.0

    elapsed = (datetime.now(timezone.utc) - last.started_at.replace(tzinfo=timezone.utc)).total_seconds()
    remaining = config.cooldown_seconds - elapsed
    return max(0.0, remaining)


@router.get("/{game_id}/cooldown", response_model=MiniGameCooldownResponse)
def get_cooldown(game_id: str, user_id: str = Query(...), db: Session = Depends(get_db_sync)):
    """Check if a player is in cooldown for a specific game."""
    game = db.execute(
        select(MiniGameConfig).where(MiniGameConfig.game_id == game_id)
    ).scalars().first()
    if not game:
        raise HTTPException(status_code=404, detail="Mini-game not found")

    remaining = _get_cooldown_remaining(db, user_id, game_id)
    return MiniGameCooldownResponse(game_id=game_id, cooldown_remaining=remaining)


@router.post("/{game_id}/start", response_model=MiniGameStartResponse)
def start_game(game_id: str, req: MiniGameStartRequest, db: Session = Depends(get_db_sync)):
    """Start a new mini-game session after validating cooldown."""
    config = db.execute(
        select(MiniGameConfig).where(
            MiniGameConfig.game_id == game_id,
            MiniGameConfig.is_active == True,
        )
    ).scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Mini-game not found")

    # Check cooldown
    remaining = _get_cooldown_remaining(db, req.user_id, game_id)
    if remaining > 0:
        raise HTTPException(
            status_code=429,
            detail=f"Cooldown active. Try again in {int(remaining)} seconds."
        )

    # Abort any stale "active" sessions for this user/game
    stale = db.execute(
        select(MiniGameSession).where(
            MiniGameSession.user_id == req.user_id,
            MiniGameSession.game_id == game_id,
            MiniGameSession.status == "active",
        )
    ).scalars().all()
    for s in stale:
        s.status = "abandoned"
        s.ended_at = datetime.now(timezone.utc)

    session_id = str(uuid.uuid4())
    session = MiniGameSession(
        session_id=session_id,
        game_id=game_id,
        user_id=req.user_id,
        status="active",
        score=0.0,
    )
    db.add(session)
    db.commit()
    return MiniGameStartResponse(
        session_id=session_id,
        game_id=game_id,
        status="active",
        cooldown_remaining=0.0,
    )


# ── Score Submission ─────────────────────────────────────────────────────────────

def _calculate_reward(config: MiniGameConfig, score: float, rank: int) -> float:
    """Calculate reward based on reward_table config."""
    table: dict = config.reward_table or {}
    # reward by rank: "1" → flat reward, "top10" → % of base, "participation" → flat
    reward = 0.0
    # Check exact rank reward
    rank_key = str(rank)
    if rank_key in table:
        reward = float(table[rank_key])
    # Check percentile-based reward
    if rank == 1 and "first_place" in table:
        reward = float(table["first_place"])
    elif rank <= 3 and "top3" in table:
        reward = float(table["top3"])
    elif rank <= 10 and "top10" in table:
        reward = float(table["top10"])
    elif "participation" in table:
        reward = float(table["participation"])
    return reward


@router.post("/{game_id}/submit", response_model=MiniGameScoreResponse)
def submit_score(
    game_id: str,
    req: MiniGameScoreSubmitRequest,
    db: Session = Depends(get_db_sync),
):
    """Submit a score for an active mini-game session. Validates score plausibility."""
    config = db.execute(
        select(MiniGameConfig).where(
            MiniGameConfig.game_id == game_id,
            MiniGameConfig.is_active == True,
        )
    ).scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Mini-game not found")

    # Find active session
    session = db.execute(
        select(MiniGameSession).where(
            MiniGameSession.user_id == req.user_id,
            MiniGameSession.game_id == game_id,
            MiniGameSession.status == "active",
        )
    ).scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="No active session found. Start a game first.")

    # Validate score plausibility: score can't exceed max_duration * reasonable_score_rate
    max_plausible = config.duration_seconds * 1000  # e.g. 60s * 1000 pts/s
    if req.score < 0 or req.score > max_plausible * 10:
        raise HTTPException(status_code=400, detail="Score out of plausible range.")

    # Compute rank among all sessions for this game today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    rank_subq = (
        select(
            MiniGameSession.score,
            func.rank().over(
                order_by=func.max(MiniGameSession.score).desc(),
                partition_by=MiniGameSession.game_id,
            ).label("rank")
        )
        .where(
            MiniGameSession.game_id == game_id,
            MiniGameSession.status == "completed",
            MiniGameSession.ended_at >= today_start,
        )
        .group_by(MiniGameSession.game_id, MiniGameSession.user_id, MiniGameSession.score)
        .subquery()
    )
    # For simplicity, rank based on current score vs. today's leaderboard entries
    better_count = db.execute(
        select(func.count())
        .select_from(MiniGameLeaderboard)
        .where(
            MiniGameLeaderboard.game_id == game_id,
            MiniGameLeaderboard.high_score > req.score,
        )
    ).scalar() or 0

    rank = int(better_count) + 1

    # Calculate and grant reward
    reward = _calculate_reward(config, req.score, rank)

    # Update session
    session.score = req.score
    session.status = "completed"
    session.rank = rank
    session.reward_granted = reward
    session.ended_at = datetime.now(timezone.utc)

    # Update leaderboard
    lb_entry = db.execute(
        select(MiniGameLeaderboard).where(
            MiniGameLeaderboard.game_id == game_id,
            MiniGameLeaderboard.user_id == req.user_id,
        )
    ).scalars().first()

    if lb_entry:
        lb_entry.games_played += 1
        if req.score > lb_entry.high_score:
            lb_entry.high_score = req.score
        if rank < lb_entry.best_rank or lb_entry.best_rank == 0:
            lb_entry.best_rank = rank
    else:
        lb_entry = MiniGameLeaderboard(
            game_id=game_id,
            user_id=req.user_id,
            username=req.game_data.get("username") if req.game_data else None,
            high_score=req.score,
            best_rank=rank,
            games_played=1,
        )
        db.add(lb_entry)

    db.commit()
    db.refresh(session)
    return MiniGameScoreResponse(
        session_id=session.session_id,
        game_id=game_id,
        score=req.score,
        rank=rank,
        reward_granted=reward,
        status="completed",
    )


# ── Leaderboard ─────────────────────────────────────────────────────────────────

@router.get("/{game_id}/leaderboard", response_model=MiniGameLeaderboardResponse)
def get_leaderboard(
    game_id: str,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_sync),
):
    """Get the top scores for a mini-game."""
    game = db.execute(
        select(MiniGameConfig).where(MiniGameConfig.game_id == game_id)
    ).scalars().first()
    if not game:
        raise HTTPException(status_code=404, detail="Mini-game not found")

    entries = db.execute(
        select(MiniGameLeaderboard)
        .where(MiniGameLeaderboard.game_id == game_id)
        .order_by(MiniGameLeaderboard.high_score.desc())
        .limit(limit)
    ).scalars().all()

    ranked = [
        MiniGameLeaderboardEntry(
            rank=i + 1,
            user_id=e.user_id,
            username=e.username,
            high_score=e.high_score,
            best_rank=e.best_rank,
            games_played=e.games_played,
        )
        for i, e in enumerate(entries)
    ]
    return MiniGameLeaderboardResponse(game_id=game_id, entries=ranked, total=len(ranked))


# ── Player History ──────────────────────────────────────────────────────────────

@router.get("/{game_id}/history", response_model=List[MiniGameScoreResponse])
def get_player_history(
    game_id: str,
    user_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_sync),
):
    """Get a player's session history for a specific mini-game."""
    sessions = db.execute(
        select(MiniGameSession)
        .where(
            MiniGameSession.game_id == game_id,
            MiniGameSession.user_id == user_id,
        )
        .order_by(MiniGameSession.started_at.desc())
        .limit(limit)
    ).scalars().all()

    return [
        MiniGameScoreResponse(
            session_id=s.session_id,
            game_id=s.game_id,
            score=s.score,
            rank=s.rank or 0,
            reward_granted=s.reward_granted,
            status=s.status,
        )
        for s in sessions
    ]
