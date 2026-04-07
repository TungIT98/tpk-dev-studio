from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Item, PlayerItem
from app.schemas.schemas import UserResponse

router = APIRouter(prefix="/api/items", tags=["items"])


class ItemResponse:
    pass


@router.get("", response_model=List[dict])
async def list_items(
    item_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = select(Item).where(Item.is_active == True)
    if item_type:
        query = query.where(Item.item_type == item_type)
    result = await db.execute(query.order_by(Item.rarity, Item.name))
    items = result.scalars().all()
    return [
        {
            "item_id": i.item_id,
            "name": i.name,
            "item_type": i.item_type,
            "rarity": i.rarity,
            "base_cost": i.base_cost,
            "metadata": i.item_metadata,
        }
        for i in items
    ]


@router.post("/purchase", status_code=200)
async def purchase_item(
    item_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.item_id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Check if already owned (for unique items)
    if item.item_metadata.get("unique"):
        existing = await db.execute(
            select(PlayerItem).where(
                and_(PlayerItem.user_id == user_id, PlayerItem.item_id == item_id)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already owned")

    player_item = PlayerItem(
        user_id=user_id,
        item_id=item_id,
        quantity=1,
    )
    db.add(player_item)
    await db.commit()
    return {"success": True, "item_id": item_id, "user_id": user_id}


@router.get("/inventory", response_model=List[dict])
async def get_inventory(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(PlayerItem, Item)
        .join(Item, PlayerItem.item_id == Item.item_id)
        .where(PlayerItem.user_id == user_id)
    )
    rows = result.all()
    return [
        {
            "item_id": pi.item_id,
            "name": item.name,
            "rarity": item.rarity,
            "quantity": pi.quantity,
            "acquired_at": pi.acquired_at.isoformat() if pi.acquired_at else None,
            "expires_at": pi.expires_at.isoformat() if pi.expires_at else None,
        }
        for pi, item in rows
    ]
