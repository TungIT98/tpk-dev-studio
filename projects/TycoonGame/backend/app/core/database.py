from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings

# Async engine (for FastAPI async endpoints)
engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_size=20, max_overflow=10)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Sync engine (for FastAPI sync endpoints using Session)
_sync_db_url = settings.DATABASE_URL.replace("+asyncpg", "").replace("postgresql+asyncpg://", "postgresql://")
_sync_db_url = _sync_db_url.replace("postgres:postgres@localhost:5432", "paperclip:paperclip@localhost:54329")
_sync_engine = create_engine(_sync_db_url, echo=False, pool_size=20, max_overflow=10)
SyncSession = sessionmaker(_sync_engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


def get_db_sync():
    """Synchronous database session for endpoints that use Session (sync) pattern."""
    session = SyncSession()
    try:
        yield session
    finally:
        session.close()
