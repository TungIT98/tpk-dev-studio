from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from app.core.database import get_db, get_db_sync
from app.models.models import (
    Collection, PlayerCollectionProgress,
    Achievement, PlayerAchievement,
    Player, PlayerGem, EconomyTransaction, GemTransaction,
)
from app.schemas.schemas import (
    CollectionResponse,
    PlayerCollectionProgressResponse,
    CollectionItemCollectRequest,
    CollectionProgressUpdateRequest,
    AchievementResponse,
    PlayerAchievementResponse,
    AchievementProgressUpdateRequest,
    AchievementClaimResponse,
)

router = APIRouter(tags=["collections"])


# ── Collections ──────────────────────────────────────────────────────────────────

@router.get("/collections", response_model=List[CollectionResponse])
def list_collections(theme: Optional[str] = Query(None), db: Session = Depends(get_db_sync)):
    """List all active collection albums, optionally filtered by theme."""
    query = select(Collection).where(Collection.is_active == True)
    if theme:
        query = query.where(Collection.theme == theme)
    result = db.execute(query.order_by(Collection.name))
    return result.scalars().all()


@router.get("/collections/{collection_id}", response_model=CollectionResponse)
def get_collection(collection_id: str, db: Session = Depends(get_db_sync)):
    """Get a specific collection album."""
    col = db.execute(
        select(Collection).where(
            Collection.collection_id == collection_id,
            Collection.is_active == True,
        )
    ).scalars().first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    return col


@router.get("/collections/{collection_id}/progress", response_model=PlayerCollectionProgressResponse)
def get_collection_progress(collection_id: str, user_id: str = Query(...), db: Session = Depends(get_db_sync)):
    """Get a player's progress in a specific collection."""
    col = db.execute(select(Collection).where(Collection.collection_id == collection_id)).scalars().first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")

    progress = db.execute(
        select(PlayerCollectionProgress).where(
            PlayerCollectionProgress.user_id == user_id,
            PlayerCollectionProgress.collection_id == collection_id,
        )
    ).scalars().first()

    if not progress:
        return PlayerCollectionProgressResponse(
            user_id=user_id,
            collection_id=collection_id,
            collected_item_ids=[],
            progress_percent=0.0,
            claimed_milestones=[],
            completed=False,
            total_reward_claimed=0.0,
        )
    return progress


@router.post("/collections/{collection_id}/collect", response_model=PlayerCollectionProgressResponse)
def collect_item(
    collection_id: str,
    req: CollectionItemCollectRequest,
    db: Session = Depends(get_db_sync),
):
    """Record that a player collected an item for a collection. Auto-calculates milestones."""
    col = db.execute(select(Collection).where(Collection.collection_id == collection_id)).scalars().first()
    if not col or not col.is_active:
        raise HTTPException(status_code=404, detail="Collection not found")

    if req.item_id not in col.required_item_ids:
        raise HTTPException(status_code=400, detail="Item not part of this collection")

    progress = db.execute(
        select(PlayerCollectionProgress).where(
            PlayerCollectionProgress.user_id == req.user_id,
            PlayerCollectionProgress.collection_id == collection_id,
        )
    ).scalars().first()

    if not progress:
        progress = PlayerCollectionProgress(
            user_id=req.user_id,
            collection_id=collection_id,
            collected_item_ids=[],
            progress_percent=0.0,
            claimed_milestones=[],
            completed=False,
            total_reward_claimed=0.0,
        )
        db.add(progress)
        db.flush()

    # Already collected
    if req.item_id in progress.collected_item_ids:
        return progress

    # Add item
    progress.collected_item_ids = list(progress.collected_item_ids) + [req.item_id]
    progress.progress_percent = min(100.0, len(progress.collected_item_ids) / col.total_items * 100)

    # Check milestones (25, 50, 75, 100)
    milestone_rewards: dict = col.milestone_rewards or {}
    completion_reward: dict = col.completion_reward or {}

    claimed = list(progress.claimed_milestones)
    total_reward = progress.total_reward_claimed

    for milestone in [25, 50, 75]:
        if int(progress.progress_percent) >= milestone and milestone not in claimed:
            if str(milestone) in milestone_rewards:
                reward = milestone_rewards[str(milestone)]
                total_reward += reward.get("currency", 0.0) + reward.get("gems", 0.0)
                claimed.append(milestone)

    # Completion reward
    if progress.progress_percent >= 100.0 and not progress.completed:
        progress.completed = True
        total_reward += completion_reward.get("currency", 0.0) + completion_reward.get("gems", 0.0)

    progress.claimed_milestones = claimed
    progress.total_reward_claimed = total_reward
    db.commit()
    db.refresh(progress)
    return progress


@router.post("/collections/{collection_id}/progress", response_model=PlayerCollectionProgressResponse)
def sync_collection_progress(
    collection_id: str,
    req: CollectionProgressUpdateRequest,
    db: Session = Depends(get_db_sync),
):
    """Bulk-update collection progress (called when player re-syncs from game)."""
    col = db.execute(select(Collection).where(Collection.collection_id == collection_id)).scalars().first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")

    progress = db.execute(
        select(PlayerCollectionProgress).where(
            PlayerCollectionProgress.user_id == req.user_id,
            PlayerCollectionProgress.collection_id == collection_id,
        )
    ).scalars().first()

    # Validate all item_ids are in the collection
    invalid = [i for i in req.collected_item_ids if i not in col.required_item_ids]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid item_ids: {invalid}")

    if not progress:
        progress = PlayerCollectionProgress(
            user_id=req.user_id,
            collection_id=collection_id,
            collected_item_ids=req.collected_item_ids,
            progress_percent=min(100.0, len(req.collected_item_ids) / col.total_items * 100),
            claimed_milestones=[],
            completed=len(req.collected_item_ids) >= col.total_items,
            total_reward_claimed=0.0,
        )
        db.add(progress)
    else:
        progress.collected_item_ids = req.collected_item_ids
        progress.progress_percent = min(100.0, len(req.collected_item_ids) / col.total_items * 100)
        if progress.progress_percent >= 100.0 and not progress.completed:
            progress.completed = True

    db.commit()
    db.refresh(progress)
    return progress


# ── Achievements ─────────────────────────────────────────────────────────────────

@router.get("/achievements", response_model=List[AchievementResponse])
def list_achievements(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db_sync),
):
    """List all active achievements."""
    query = select(Achievement).where(Achievement.is_active == True)
    if category:
        query = query.where(Achievement.category == category)
    result = db.execute(query.order_by(Achievement.target_value))
    return result.scalars().all()


@router.get("/player/{user_id}/achievements", response_model=List[PlayerAchievementResponse])
def get_player_achievements(user_id: str, db: Session = Depends(get_db_sync)):
    """Get all achievements with player progress."""
    rows = db.execute(
        select(PlayerAchievement)
        .options(joinedload(PlayerAchievement.achievement))
        .where(PlayerAchievement.user_id == user_id)
        .order_by(PlayerAchievement.achievement_id)
    ).scalars().unique().all()

    # Merge with all known achievements to show unstarted ones
    all_achievements = db.execute(
        select(Achievement).where(Achievement.is_active == True)
    ).scalars().all()

    achievement_ids = {row.achievement_id for row in rows}
    result = []
    for ach in all_achievements:
        player_ach = next((r for r in rows if r.achievement_id == ach.achievement_id), None)
        if player_ach:
            result.append(PlayerAchievementResponse(
                user_id=user_id,
                achievement_id=ach.achievement_id,
                achievement=AchievementResponse.model_validate(ach),
                progress=player_ach.progress,
                completed=player_ach.completed,
                reward_claimed=player_ach.reward_claimed,
                completed_at=player_ach.completed_at,
            ))
        else:
            result.append(PlayerAchievementResponse(
                user_id=user_id,
                achievement_id=ach.achievement_id,
                achievement=AchievementResponse.model_validate(ach),
                progress=0.0,
                completed=False,
                reward_claimed=False,
                completed_at=None,
            ))
    return result


@router.post("/achievements/{achievement_id}/progress", response_model=PlayerAchievementResponse)
def update_achievement_progress(
    achievement_id: str,
    req: AchievementProgressUpdateRequest,
    db: Session = Depends(get_db_sync),
):
    """Increment a player's achievement progress (called from game events)."""
    ach = db.execute(select(Achievement).where(Achievement.achievement_id == achievement_id)).scalars().first()
    if not ach or not ach.is_active:
        raise HTTPException(status_code=404, detail="Achievement not found")

    player_ach = db.execute(
        select(PlayerAchievement).where(
            PlayerAchievement.user_id == req.user_id,
            PlayerAchievement.achievement_id == achievement_id,
        )
    ).scalars().first()

    if not player_ach:
        player_ach = PlayerAchievement(
            user_id=req.user_id,
            achievement_id=achievement_id,
            progress=0.0,
            completed=False,
            reward_claimed=False,
        )
        db.add(player_ach)
        db.flush()

    if player_ach.completed:
        return player_ach

    player_ach.progress = min(player_ach.progress + req.delta, ach.target_value)
    if player_ach.progress >= ach.target_value:
        player_ach.completed = True
        player_ach.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(player_ach)
    return player_ach


@router.post("/achievements/{achievement_id}/claim", response_model=AchievementClaimResponse)
def claim_achievement_reward(
    achievement_id: str,
    user_id: str = Query(...),
    db: Session = Depends(get_db_sync),
):
    """Claim a completed achievement's reward. Called once per achievement."""
    ach = db.execute(select(Achievement).where(Achievement.achievement_id == achievement_id)).scalars().first()
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")

    player_ach = db.execute(
        select(PlayerAchievement).where(
            PlayerAchievement.user_id == user_id,
            PlayerAchievement.achievement_id == achievement_id,
        )
    ).scalars().first()

    if not player_ach or not player_ach.completed:
        raise HTTPException(status_code=400, detail="Achievement not yet completed")

    if player_ach.reward_claimed:
        return AchievementClaimResponse(
            achievement_id=achievement_id,
            user_id=user_id,
            reward_currency=0.0,
            reward_gems=0.0,
            already_claimed=True,
        )

    # Grant rewards
    if ach.reward_currency > 0:
        player = db.get(Player, user_id)
        if player:
            player.total_currency += ach.reward_currency
            tx = EconomyTransaction(
                user_id=user_id,
                transaction_type="achievement_reward",
                amount=ach.reward_currency,
                balance_after=player.total_currency,
                description=f"Achievement reward: {ach.name}",
            )
            db.add(tx)

    if ach.reward_gems > 0:
        gem_record = db.get(PlayerGem, user_id)
        if not gem_record:
            gem_record = PlayerGem(user_id=user_id, gem_balance=0.0)
            db.add(gem_record)
            db.flush()
        gem_record.gem_balance += ach.reward_gems
        gem_tx = GemTransaction(
            user_id=user_id,
            transaction_type="reward",
            amount=ach.reward_gems,
            balance_after=gem_record.gem_balance,
            description=f"Achievement reward: {ach.name}",
        )
        db.add(gem_tx)

    player_ach.reward_claimed = True
    db.commit()

    return AchievementClaimResponse(
        achievement_id=achievement_id,
        user_id=user_id,
        reward_currency=ach.reward_currency,
        reward_gems=ach.reward_gems,
        already_claimed=False,
    )
