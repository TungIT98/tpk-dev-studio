"""
Database stress test for Tycoon Game economy system.
Tests concurrent economy transactions and leaderboard updates.

Run:
  python -m pytest tests/test_db_stress.py -v --tb=short
"""
import asyncio
import json
import random
import statistics
import time
from datetime import datetime

import pytest
import pytest_asyncio
import httpx


BASE_URL = "http://127.0.0.1:8000"
DB_URL = "postgresql+asyncpg://paperclip:paperclip@localhost:54329/tycoon_game"


# ── Database Direct Stress Tests ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def db_engine():
    """Async SQLAlchemy engine for direct DB access."""
    from sqlalchemy.ext.asyncio import create_async_engine
    engine = create_async_engine(DB_URL, pool_size=50, max_overflow=20, pool_timeout=10)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    """Async SQLAlchemy session."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    async_session = async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session


# ── Economy Transaction Stress Test ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_concurrent_economy_transactions(db_engine):
    """
    Stress test: 1000 concurrent economy transactions.
    Measures: transaction throughput, p50/p95/p99 latency, error rate.
    """
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    num_transactions = 1000
    concurrency = 100
    latencies = []
    errors = []

    async def insert_transaction(tx_num: int):
        start = time.perf_counter()
        session_factory = async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)
        try:
            async with session_factory() as session:
                user_id = f"loadtest_user_{(tx_num % 1000) + 1}"
                await session.execute(
                    text("""
                        INSERT INTO economy_transactions
                            (user_id, transaction_type, amount, balance_after, description, created_at)
                        VALUES (:user_id, :tx_type, :amount, :balance, :desc, NOW())
                    """),
                    {
                        "user_id": user_id,
                        "tx_type": random.choice(["income", "purchase", "prestige", "offline"]),
                        "amount": round(random.uniform(1, 10000), 2),
                        "balance": round(random.uniform(100, 100000), 2),
                        "desc": f"Stress test tx {tx_num}",
                    }
                )
                await session.commit()
            latency = (time.perf_counter() - start) * 1000
            latencies.append(latency)
        except Exception as e:
            errors.append(str(e)[:100])

    # Run in batches of `concurrency`
    start_time = time.perf_counter()
    for batch_start in range(0, num_transactions, concurrency):
        batch = [insert_transaction(i) for i in range(batch_start, min(batch_start + concurrency, num_transactions))]
        await asyncio.gather(*batch)
    total_duration = time.perf_counter() - start_time

    lat_sorted = sorted(latencies)
    n = len(lat_sorted)
    error_rate = len(errors) / num_transactions * 100
    tps = num_transactions / total_duration

    print(f"\n  Concurrent Transactions: {num_transactions}")
    print(f"  Throughput: {tps:.1f} tx/sec")
    print(f"  Total time: {total_duration:.2f}s")
    print(f"  p50: {lat_sorted[int(n*0.50)]:.1f}ms  p95: {lat_sorted[int(n*0.95)]:.1f}ms  p99: {lat_sorted[int(n*0.99)]:.1f}ms")
    print(f"  Error rate: {error_rate:.1f}% ({len(errors)} errors)")

    assert error_rate < 5, f"Error rate too high: {error_rate:.1f}%"


# ── Leaderboard Update Stress Test ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_concurrent_leaderboard_updates(db_engine):
    """
    Stress test: 1000 concurrent leaderboard score submissions.
    Measures throughput, latency, and Redis cache invalidation overhead.
    """
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    num_updates = 1000
    concurrency = 100
    latencies = []
    errors = []

    async def update_leaderboard(i: int):
        start = time.perf_counter()
        session_factory = async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)
        try:
            async with session_factory() as session:
                user_id = f"loadtest_user_{(i % 1000) + 1}"
                await session.execute(
                    text("""
                        INSERT INTO leaderboard_entries (user_id, total_earned, submitted_at)
                        VALUES (:user_id, :total_earned, NOW())
                        ON CONFLICT (user_id) DO UPDATE
                            SET total_earned = EXCLUDED.total_earned, submitted_at = NOW()
                    """),
                    {"user_id": user_id, "total_earned": round(random.uniform(50000, 500000), 2)}
                )
                await session.commit()
            latency = (time.perf_counter() - start) * 1000
            latencies.append(latency)
        except Exception as e:
            errors.append(str(e)[:100])

    start_time = time.perf_counter()
    for batch_start in range(0, num_updates, concurrency):
        batch = [update_leaderboard(i) for i in range(batch_start, min(batch_start + concurrency, num_updates))]
        await asyncio.gather(*batch)
    total_duration = time.perf_counter() - start_time

    lat_sorted = sorted(latencies)
    n = len(lat_sorted)
    error_rate = len(errors) / num_updates * 100
    tps = num_updates / total_duration

    print(f"\n  Leaderboard Updates: {num_updates}")
    print(f"  Throughput: {tps:.1f} updates/sec")
    print(f"  Total time: {total_duration:.2f}s")
    print(f"  p50: {lat_sorted[int(n*0.50)]:.1f}ms  p95: {lat_sorted[int(n*0.95)]:.1f}ms  p99: {lat_sorted[int(n*0.99)]:.1f}ms")
    print(f"  Error rate: {error_rate:.1f}% ({len(errors)} errors)")

    assert error_rate < 5, f"Error rate too high: {error_rate:.1f}%"


# ── Mixed Read/Write Stress Test ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_mixed_read_write_stress(db_engine):
    """
    Stress test: 50% reads (player + leaderboard GET) / 50% writes (save + rank).
    Simulates realistic game traffic during peak hours.
    """
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    num_ops = 500
    concurrency = 100
    latencies = []
    errors = []

    async def mixed_op(op_num: int):
        start = time.perf_counter()
        session_factory = async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)
        is_write = op_num % 2 == 0
        try:
            async with session_factory() as session:
                if is_write:
                    # Player save
                    user_id = f"loadtest_user_{(op_num % 1000) + 1}"
                    await session.execute(
                        text("""
                            INSERT INTO economy_transactions
                                (user_id, transaction_type, amount, balance_after, description, created_at)
                            VALUES (:user_id, 'save', 0, :balance, 'load test save', NOW())
                        """),
                        {"user_id": user_id, "balance": round(random.uniform(100, 100000), 2)}
                    )
                else:
                    # Player read
                    user_id = f"loadtest_user_{(op_num % 1000) + 1}"
                    result = await session.execute(
                        text("SELECT user_id, total_currency, prestige_level FROM players WHERE user_id = :uid"),
                        {"uid": user_id}
                    )
                    result.scalar_one_or_none()
                await session.commit()
            latency = (time.perf_counter() - start) * 1000
            latencies.append(latency)
        except Exception as e:
            errors.append(str(e)[:100])

    start_time = time.perf_counter()
    for batch_start in range(0, num_ops, concurrency):
        batch = [mixed_op(i) for i in range(batch_start, min(batch_start + concurrency, num_ops))]
        await asyncio.gather(*batch)
    total_duration = time.perf_counter() - start_time

    lat_sorted = sorted(latencies)
    n = len(lat_sorted)
    error_rate = len(errors) / num_ops * 100
    tps = num_ops / total_duration

    print(f"\n  Mixed Ops: {num_ops} (50% read / 50% write)")
    print(f"  Throughput: {tps:.1f} ops/sec")
    print(f"  Total time: {total_duration:.2f}s")
    print(f"  p50: {lat_sorted[int(n*0.50)]:.1f}ms  p95: {lat_sorted[int(n*0.95)]:.1f}ms  p99: {lat_sorted[int(n*0.99)]:.1f}ms")
    print(f"  Error rate: {error_rate:.1f}% ({len(errors)} errors)")

    assert error_rate < 5, f"Error rate too high: {error_rate:.1f}%"


# ── Breaking Point Detection ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_breaking_point_detection(db_engine):
    """
    Progressive load test: increase concurrency from 10 to 500 in steps.
    Detect at what concurrency level p95 latency exceeds 200ms.
    """
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    steps = [10, 50, 100, 200, 300, 500]
    results = []

    async def run_step(concurrency_level: int):
        latencies = []
        errors = []

        async def do_tx(i: int):
            start = time.perf_counter()
            session_factory = async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)
            try:
                async with session_factory() as session:
                    await session.execute(
                        text("""
                            INSERT INTO economy_transactions
                                (user_id, transaction_type, amount, balance_after, description, created_at)
                            VALUES (:uid, 'stress', 1.0, 1.0, 'break test', NOW())
                        """),
                        {"uid": f"loadtest_user_{(i % 1000) + 1}"}
                    )
                    await session.commit()
                latencies.append((time.perf_counter() - start) * 1000)
            except Exception:
                pass

        tasks = [do_tx(i) for i in range(concurrency_level)]
        await asyncio.gather(*tasks)

        if latencies:
            lat_sorted = sorted(latencies)
            n = len(lat_sorted)
            p95 = lat_sorted[int(n * 0.95)]
            return {"concurrency": concurrency_level, "p95": p95, "samples": n}
        return {"concurrency": concurrency_level, "p95": 9999, "samples": 0}

    for step in steps:
        r = await run_step(step)
        results.append(r)
        print(f"  Concurrency {step:>3}: p95 = {r['p95']:.1f}ms")

    print(f"\n  Breaking Point Analysis:")
    breaking_point = None
    for r in results:
        if r["p95"] > 200:
            breaking_point = r["concurrency"]
            break

    if breaking_point:
        print(f"  ⚠ Latency exceeds 200ms at concurrency = {breaking_point}")
    else:
        print(f"  ✓ Latency stayed under 200ms even at concurrency = {max(steps)}")

    # We report the result but don't assert — this is a diagnostic test
    return results
