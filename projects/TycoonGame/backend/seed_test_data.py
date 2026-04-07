"""Seed test data for load testing."""
import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://paperclip:paperclip@localhost:54329/tycoon_game"

async def seed():
    engine = create_async_engine(DB_URL, pool_size=20, max_overflow=10)

    async with AsyncSession(engine) as session:
        # Insert 1000 test players (batch)
        print("Inserting players...")
        await session.execute(
            text("""
                INSERT INTO players (user_id, username, total_currency, total_earned,
                    total_earned_ever, prestige_level, prestige_points, last_save_time,
                    save_version, businesses, upgrades, pets, achievements, created_at, updated_at)
                SELECT
                    'loadtest_user_' || gs.i,
                    'LoadTestPlayer' || gs.i,
                    10000.0 + gs.i * 10,
                    5000.0 + gs.i * 5,
                    50000.0 + gs.i * 100,
                    gs.i % 10,
                    (gs.i % 10) * 5.0,
                    1700000000 + gs.i,
                    '1.0',
                    '{"baker": {"level": 1, "count": 5}, "car": {"level": 2, "count": 3}}',
                    '{"speed": true, "multiplier": 1.5}',
                    '{}',
                    '{"first_login": true}',
                    NOW(), NOW()
                FROM generate_series(1, 1000) AS gs(i)
                ON CONFLICT (user_id) DO NOTHING
            """)
        )
        await session.commit()
        print("Players inserted")

        # Insert 50 items
        print("Inserting items...")
        for i in range(1, 51):
            item_type = ["pet", "cosmetic", "boost"][i % 3]
            rarity = ["common", "rare", "epic", "legendary"][i % 4]
            is_unique = i % 10 == 0
            metadata = {"unique": is_unique, "bonus": 1.2}
            await session.execute(
                text("""
                    INSERT INTO items (item_id, name, item_type, rarity, base_cost, item_metadata, is_active, created_at)
                    VALUES (:item_id, :name, :item_type, :rarity, :base_cost, :metadata, true, NOW())
                    ON CONFLICT (item_id) DO NOTHING
                """),
                {"item_id": f"item_{i}", "name": f"Item {i}", "item_type": item_type,
                 "rarity": rarity, "base_cost": float(100 + i * 10), "metadata": json.dumps(metadata)}
            )
        await session.commit()
        print("Items inserted")

        # Insert economy transactions (bulk cross join)
        print("Inserting economy transactions...")
        await session.execute(
            text("""
                INSERT INTO economy_transactions (user_id, transaction_type, amount, balance_after, description, created_at)
                SELECT
                    'loadtest_user_' || u.i,
                    CASE (t.i % 3) WHEN 0 THEN 'income' WHEN 1 THEN 'purchase' ELSE 'prestige' END,
                    100.0 + t.i * 10,
                    10000.0 + u.i * 10 + t.i * 10,
                    'Load test transaction ' || t.i,
                    NOW()
                FROM generate_series(1, 100) AS u(i), generate_series(0, 9) AS t(i)
            """)
        )
        await session.commit()
        print("Economy transactions inserted")

        # Insert leaderboard entries (bulk)
        print("Inserting leaderboard entries...")
        await session.execute(
            text("""
                INSERT INTO leaderboard_entries (user_id, total_earned, submitted_at)
                SELECT
                    'loadtest_user_' || gs.i,
                    50000.0 + gs.i * 100,
                    NOW()
                FROM generate_series(1, 1000) AS gs(i)
                ON CONFLICT (user_id) DO UPDATE SET total_earned = EXCLUDED.total_earned, submitted_at = NOW()
            """)
        )
        await session.commit()
        print("Leaderboard entries inserted")

    await engine.dispose()
    print("Test data seeding complete!")

asyncio.run(seed())
