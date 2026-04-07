import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DB_PORT = "54329"

async def test():
    engine = create_async_engine(f'postgresql+asyncpg://paperclip:paperclip@localhost:{DB_PORT}/postgres')
    async with engine.connect() as conn:
        # List databases
        result = await conn.execute(text("SELECT datname FROM pg_database WHERE datistemplate = false"))
        dbs = result.fetchall()
        print("Databases:", [r[0] for r in dbs])

        # Create tycoon_game if not exists
        await conn.execute(text("COMMIT"))
        await conn.execute(text("CREATE DATABASE tycoon_game"))
        print("Created tycoon_game database")
    await engine.dispose()

asyncio.run(test())
