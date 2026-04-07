"""Quick diagnostic test for POST endpoints."""
import urllib.request
import json

base = "http://127.0.0.1:8000"

# Test save endpoint
payload = json.dumps({
    "username": "test", "total_currency": 1000, "total_earned": 500,
    "total_earned_ever": 5000, "prestige_level": 0, "prestige_points": 0,
    "businesses": {}, "upgrades": {}, "pets": {}, "saved_at": 1700000000, "save_version": "1.0"
}).encode()

req = urllib.request.Request(
    f"{base}/api/player/loadtest_user_1/save",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print(f"Save: {r.status} - {r.read().decode()[:100]}")
except urllib.request.HTTPError as e:
    print(f"Save: {e.code} - {e.read().decode()[:200]}")
except Exception as e:
    print(f"Save: ERROR - {e}")

# Test leaderboard rank endpoint
req2 = urllib.request.Request(
    f"{base}/api/leaderboard/rank",
    data=json.dumps({"user_id": "loadtest_user_1", "total_earned": 50000}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(req2, timeout=10) as r:
        print(f"Rank: {r.status} - {r.read().decode()[:100]}")
except urllib.request.HTTPError as e:
    print(f"Rank: {e.code} - {e.read().decode()[:200]}")
except Exception as e:
    print(f"Rank: ERROR - {e}")
