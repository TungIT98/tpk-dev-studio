"""
HTTP load test for Tycoon Game FastAPI endpoints.
Simple synchronous httpx-based load test.
"""
import random
import time
import statistics
import sys
import urllib.request
import urllib.error
import json
import concurrent.futures


BASE_URL = "http://127.0.0.1:8000"
RESULTS = {"endpoints": {}, "total_requests": 0, "total_errors": 0}


def random_user_id():
    return f"loadtest_user_{random.randint(1, 1000)}"


def do_get_player():
    url = f"{BASE_URL}/api/player/{random_user_id()}"
    return ("GET /api/player/[user_id]", url, None, {})


def do_get_leaderboard():
    limit = random.choice([10, 50, 100, 500])
    url = f"{BASE_URL}/api/leaderboard?limit={limit}"
    return ("GET /api/leaderboard", url, None, {})


def do_post_save():
    user_id = random_user_id()
    payload = json.dumps({
        "user_id": user_id,
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
    }).encode()
    url = f"{BASE_URL}/api/player/{user_id}/save"
    return ("POST /api/player/[user_id]/save", url, payload, {"Content-Type": "application/json"})


def do_post_rank():
    user_id = random_user_id()
    payload = json.dumps({"user_id": user_id, "total_earned": round(random.uniform(50000, 500000), 2)}).encode()
    url = f"{BASE_URL}/api/leaderboard/rank"
    return ("POST /api/leaderboard/rank", url, payload, {"Content-Type": "application/json"})


def do_offline():
    user_id = random_user_id()
    payload = json.dumps({"user_id": user_id, "last_save_time": 1700000000, "now": 1700000000 + random.randint(3600, 28800)}).encode()
    url = f"{BASE_URL}/api/player/{user_id}/offline"
    return ("POST /api/player/[user_id]/offline", url, payload, {"Content-Type": "application/json"})


TASKS = [
    (do_get_player, 5),
    (do_get_leaderboard, 3),
    (do_post_save, 2),
    (do_post_rank, 1),
    (do_offline, 1),
]
FLAT = [fn for fn, w in TASKS for _ in range(w)]


def make_request(method, url, payload=None, headers=None):
    headers = headers or {}
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, data=payload, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=10) as resp:
            latency = (time.perf_counter() - start) * 1000
            return latency, resp.status, ""
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return latency, 0, str(e)[:100]


def record(endpoint, latency, status, error):
    RESULTS["total_requests"] += 1
    if error or (status >= 400):
        RESULTS["total_errors"] += 1
    if endpoint not in RESULTS["endpoints"]:
        RESULTS["endpoints"][endpoint] = {"latencies": [], "errors": 0}
    RESULTS["endpoints"][endpoint]["latencies"].append(latency)
    if error:
        RESULTS["endpoints"][endpoint]["errors"] += 1


def worker():
    fn = random.choice(FLAT)
    ep, url, payload, headers = fn()
    latency, status, error = make_request("GET" if payload is None else "POST", url, payload, headers)
    record(ep, latency, status, error)


def run_test(num_requests=3000, workers=50):
    print(f"\n{'='*60}")
    print(f"HTTP Load Test: {num_requests} requests, {workers} workers")
    print(f"{'='*60}\n")

    # Health check
    try:
        with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=5) as r:
            print(f"  Server: {r.status} - {r.read().decode()}\n")
    except Exception as e:
        print(f"  ERROR: Cannot reach server: {e}")
        return

    start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        list(executor.map(lambda _: worker(), range(num_requests)))
    duration = time.perf_counter() - start

    print_summary(duration)


def print_summary(duration):
    print(f"\n{'='*60}")
    print(f"HTTP Load Test Results")
    print(f"{'='*60}")
    print(f"  Total requests : {RESULTS['total_requests']}")
    print(f"  Total errors   : {RESULTS['total_errors']}")
    print(f"  Error rate     : {RESULTS['total_errors'] / max(RESULTS['total_requests'], 1) * 100:.2f}%")
    print(f"  Duration       : {duration:.1f}s")
    print(f"  Throughput     : {RESULTS['total_requests'] / duration:.1f} req/sec")
    print()

    all_lat = []
    for ep, d in RESULTS["endpoints"].items():
        all_lat.extend(d["latencies"])

    if all_lat:
        sorted_lat = sorted(all_lat)
        n = len(sorted_lat)
        print(f"  Overall Latency (ms):")
        print(f"    p50 : {sorted_lat[int(n*0.50)]:.1f}")
        print(f"    p95 : {sorted_lat[int(n*0.95)]:.1f}")
        print(f"    p99 : {sorted_lat[int(n*0.99)]:.1f}")
        print(f"    max : {max(sorted_lat):.1f}")
        print()

    print(f"  Per-Endpoint Results:")
    print(f"  {'Endpoint':<45} {'Count':>6} {'Errors':>7} {'p50':>8} {'p95':>8} {'p99':>8}")
    print(f"  {'-'*45} {'-'*6} {'-'*7} {'-'*8} {'-'*8} {'-'*8}")

    for ep, d in sorted(RESULTS["endpoints"].items(), key=lambda x: -len(x[1]["latencies"])):
        lat = sorted(d["latencies"])
        n = len(lat)
        p50 = lat[int(n*0.50)] if n > 0 else 0
        p95 = lat[int(n*0.95)] if n > 0 else 0
        p99 = lat[int(n*0.99)] if n > 0 else 0
        print(f"  {ep:<45} {len(lat):>6} {d['errors']:>7} {p50:>8.1f} {p95:>8.1f} {p99:>8.1f}")

    if all_lat:
        lat_sorted = sorted(all_lat)
        n = len(lat_sorted)
        breaking = next((l for l in lat_sorted if l > 200), None)
        if breaking:
            count_over = sum(1 for l in lat_sorted if l > 200)
            pct = count_over / n * 100
            print(f"\n  ⚠ Breaking point: {pct:.1f}% of requests exceed 200ms at {max(all_lat):.0f}ms peak")
        else:
            print(f"\n  ✓ All requests under 200ms")

    print(f"{'='*60}\n")


num_req = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
workers = int(sys.argv[2]) if len(sys.argv) > 2 else 50
run_test(num_requests=num_req, workers=workers)
