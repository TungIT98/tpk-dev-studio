"""
Locust load test for Tycoon Game FastAPI endpoints.
Run with:
  locust -f tests/locustfile.py --host=http://127.0.0.1:8000 --users=1000 --spawn-rate=100 --run-time=60s --headless
"""
import random
from locust import HttpUser, task, between, events

# ── Helpers ──────────────────────────────────────────────────────────────────

def random_user_id() -> str:
    return f"loadtest_user_{random.randint(1, 1000)}"

# ── HTTP Load Tests ──────────────────────────────────────────────────────────

class TycoonAPIUser(HttpUser):
    """
    Simulates concurrent players hitting the FastAPI economy endpoints.
    """
    wait_time = between(0.05, 0.3)
    host = "http://127.0.0.1:8000"

    @task(5)
    def get_player(self):
        """Most frequent: read player data (cache-friendly)."""
        self.client.get(
            f"/api/player/{random_user_id()}",
            name="/api/player/[user_id]"
        )

    @task(3)
    def get_leaderboard(self):
        """Read leaderboard (cached 1 min by Redis)."""
        limit = random.choice([10, 50, 100, 500])
        self.client.get(
            f"/api/leaderboard?limit={limit}",
            name="/api/leaderboard"
        )

    @task(2)
    def post_player_save(self):
        """Player save — writes to DB + invalidates cache."""
        user_id = random_user_id()
        payload = {
            "username": f"Player_{random.randint(1, 9999)}",
            "total_currency": round(random.uniform(100, 100000), 2),
            "total_earned": round(random.uniform(50, 50000), 2),
            "total_earned_ever": round(random.uniform(500, 500000), 2),
            "prestige_level": random.randint(0, 9),
            "prestige_points": round(random.uniform(0, 500), 2),
            "businesses": {"baker": {"level": random.randint(1, 50), "count": random.randint(1, 20)}},
            "upgrades": {"speed": True, "multiplier": round(random.uniform(1.0, 5.0), 2)},
            "pets": {},
            "saved_at": 1700000000 + random.randint(0, 86400),
            "save_version": "1.0",
        }
        self.client.post(
            f"/api/player/{user_id}/save",
            json=payload,
            name="/api/player/[user_id]/save"
        )

    @task(1)
    def post_leaderboard_rank(self):
        """Submit score — writes to DB + invalidates Redis cache."""
        user_id = random_user_id()
        self.client.post(
            "/api/leaderboard/rank",
            json={
                "user_id": user_id,
                "total_earned": round(random.uniform(50000, 500000), 2),
            },
            name="/api/leaderboard/rank"
        )

    @task(1)
    def get_offline_earnings(self):
        """Calculate offline earnings."""
        user_id = random_user_id()
        self.client.post(
            f"/api/player/{user_id}/offline",
            json={
                "last_save_time": 1700000000,
                "now": 1700000000 + random.randint(3600, 28800),
            },
            name="/api/player/[user_id]/offline"
        )


# ── Metrics Collection ─────────────────────────────────────────────────────────

results = {"total": 0, "errors": 0, "latencies": []}

@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, **kwargs):
    results["total"] += 1
    results["latencies"].append(response_time)
    if exception:
        results["errors"] += 1

@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    latencies = sorted(results["latencies"])
    n = len(latencies)
    if n == 0:
        return
    p50 = latencies[int(n * 0.50)]
    p95 = latencies[int(n * 0.95)]
    p99 = latencies[int(n * 0.99)]
    print(f"\n=== Load Test Summary ===")
    print(f"Total requests : {results['total']}")
    print(f"Errors         : {results['errors']}")
    print(f"p50 latency    : {p50:.1f} ms")
    print(f"p95 latency    : {p95:.1f} ms")
    print(f"p99 latency    : {p99:.1f} ms")
    print(f"Max latency    : {max(latencies):.1f} ms")
