from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.redis import init_redis, close_redis
from app.api import player, leaderboard, auth, items, pets, minigames, economy, collections, gifts, events, engagement, auction, trades


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title="Tycoon Game Economy API",
    description="FastAPI economy server for the Enhanced Tycoon Game v2",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(player.router)
app.include_router(leaderboard.router)
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(pets.router)
app.include_router(minigames.router)
app.include_router(economy.router)
app.include_router(collections.router)
app.include_router(gifts.router)
app.include_router(events.router)
app.include_router(engagement.router)
app.include_router(auction.router)
app.include_router(trades.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
