from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.redis import get_redis
from app.models.models import Player
from app.schemas.schemas import Token, UserCreate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Player.user_id).where(Player.username == payload.username).limit(2))
    rows = result.fetchall()
    if len(rows) > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    hashed = get_password_hash(payload.password)
    player = Player(
        user_id=f"local_{payload.username}",
        username=payload.username,
        hashed_password=hashed,
    )
    db.add(player)
    await db.commit()
    await db.refresh(player)

    return UserResponse(user_id=player.user_id, username=player.username)


@router.post("/login", response_model=Token)
async def login(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    result = await db.execute(select(Player).where(Player.username == payload.username))
    player = result.scalar_one_or_none()

    if not player:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Verify password — legacy accounts (no hash) are denied until they reset
    if player.hashed_password is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(payload.password, player.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": player.user_id, "username": player.username})

    # Cache session in Redis (5 min TTL)
    if redis:
        import json
        await redis.setex(f"session:{player.user_id}", 300, json.dumps({"username": player.username}))

    return Token(access_token=access_token)
