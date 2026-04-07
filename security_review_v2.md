## Security Review Findings — TKPA-148 (Final Pre-Launch Review)

**Project:** Enhanced Tycoon Game v2 - Viral Edition
**Review Date:** 2026-03-31
**Reviewer:** Security Engineer (e9840147-3b14-4ad4-8d67-4d86f78c2cba)
**Scope:** FastAPI backend + Colyseus client + Roblox Lua server
**Severity Scale:** CRITICAL > HIGH > MEDIUM > LOW
**Status:** ❌ NOT CLEARED FOR LAUNCH — 2 CRITICAL, 5 HIGH, 3 MEDIUM findings remain

---

## TKPA-76 Remediation Verification

| Finding | Status | Notes |
|---------|--------|-------|
| Authentication on ALL API endpoints | ❌ FAIL | Most endpoints optional or missing auth entirely |
| IDOR fixed (player save, offline-claim, gift claim) | ❌ FAIL | IDOR still present on all player/gift endpoints |
| GAMEPASS_WEBHOOK_SECRET + HMAC | ❌ MISSING | No webhook endpoint exists in codebase |
| CORS explicit allowlist | ❌ FAIL | `allow_origins=["*"]` + `allow_credentials=True` |
| Server-side earnings validation | ❌ FAIL | `total_currency` accepted directly from client |

---

## CRITICAL

### 1. WIDE-SPREAD IDOR — Players Can Overwrite/Rob Any Account
**Severity:** CRITICAL
**Files:** `player.py`, `pets.py`, `minigames.py`, `items.py`

Every mutating endpoint accepts a `user_id` from the **request body or URL path** and performs **no ownership verification** against the authenticated JWT token.

**Proof — player save IDOR:**
```python
# player.py:50-57
@router.post("/{user_id}/save", status_code=status.HTTP_200_OK)
async def save_player(user_id: str, payload: PlayerSaveRequest, ...):
    # user_id from URL is used directly — no check that it matches JWT sub claim
    result = await db.execute(select(Player).where(Player.user_id == str(user_id)))
    player.total_currency = payload.total_currency  # attacker sets victim's balance
    player.total_earned_ever = max(player.total_earned_ever, payload.total_earned_ever)
```

**Impact:** Any player can:
- Set another player's `total_currency` to any value
- Set another player's `prestige_level` to any value
- Delete another player's pet instances
- Claim another player's minigame rewards
- Purchase items on another player's behalf

**Fix required:** Every endpoint must verify `token["sub"] == user_id` before any mutation. Add `get_current_user` (not optional) and validate ownership.

**Proof — offline earnings IDOR:**
```python
# player.py:115-150
@router.post("/{user_id}/offline", response_model=OfflineEarningsResponse)
async def get_offline_earnings(user_id: str, payload: OfflineEarningsRequest, ...):
    # No auth, no ownership check. Attacker provides victim user_id.
    offline_earnings = elapsed * income_rate * settings.OFFLINE_EARNINGS_RATE
    new_currency = player.total_currency + offline_earnings
```

Attacker repeatedly calls this to inflate any player's balance. No server-side cap enforcement.

**Proof — pets acquire IDOR:**
```python
# pets.py:84-106
@router.post("", response_model=PetInstanceResponse, status_code=201)
def acquire_pet(req: PetAcquireRequest, db: Session = Depends(get_db)):
    # No auth — anyone can spawn pets for any user_id
    instance = PetInstance(instance_id=instance_id, user_id=req.user_id, ...)
```

---

### 2. CORS Misconfiguration — `allow_origins=["*"]` + `allow_credentials=True`
**Severity:** CRITICAL
**File:** `main.py:23-29`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # ← allows any origin
    allow_credentials=True,    # ← allows cookies/auth headers
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`Access-Control-Allow-Credentials: true` with `Access-Control-Allow-Origin: *` is rejected by browsers (RFC 7252). If `allow_origins` accidentally widens to a specific domain with credentials, any subdomain of that domain can make authenticated cross-origin requests.

**Fix:** Replace with explicit allowlist: `allow_origins=["https://yourgame.roblox.com"]` (or equivalent Roblox domain). Remove `allow_credentials=True` if not strictly needed.

---

## HIGH

### 3. Authentication Missing or Optional on Most Endpoints
**Severity:** HIGH
**Files:** `player.py`, `leaderboard.py`, `pets.py`, `minigames.py`, `items.py`

| Endpoint | Auth Used | Issue |
|----------|-----------|-------|
| `GET /api/player/{user_id}` | `get_current_user_optional` | Any unauthenticated caller can read any player's data |
| `POST /api/player/{user_id}/save` | `get_current_user_optional` | Unauthenticated callers can overwrite any player |
| `POST /api/player/{user_id}/offline` | `get_current_user_optional` | Unauthenticated inflation of any player's balance |
| `POST /api/leaderboard/rank` | `get_current_user_optional` | Anyone can submit fake scores |
| All `/pets/*` routes | **NONE** | Completely unauthenticated |
| All `/minigames/*` routes | **NONE** | Completely unauthenticated |
| `POST /api/items/purchase` | `get_current_user` ✅ | OK but no ownership validation |

TKPA-76 required "Authentication enforced on ALL API endpoints" — this is not met.

---

### 4. No Rate Limiting on Any Endpoint
**Severity:** HIGH
**File:** `main.py`, `player.py`, `pets.py`

No rate limiting middleware or per-user throttling exists anywhere in the FastAPI app. An attacker can:
- Call `POST /api/player/{user_id}/offline` repeatedly to inflate a victim's balance
- Call `POST /api/player/{user_id}/save` at unlimited frequency
- Call `POST /pets` to spawn unlimited pet instances for any user
- `POST /minigames/{id}/submit` to farm scores

Redis is available in the stack but not used for rate limiting.

---

### 5. No Server-Side Earnings Validation
**Severity:** HIGH
**File:** `player.py:50-76`

```python
player.total_currency = payload.total_currency
player.total_earned = payload.total_earned
player.total_earned_ever = max(player.total_earned_ever, payload.total_earned_ever)
```

All three fields are accepted directly from the client with no server-side cross-check. While Roblox Lua has server-side income computation, a compromised Roblox exploit client or a direct API caller can set any balance.

**Fix:** `total_earned` and `total_earned_ever` must be server-recalculated from `businesses` JSON. `total_currency` should be `server_currency + delta`, not a client-supplied absolute value.

---

### 6. No `GAMEPASS_WEBHOOK_SECRET` or HMAC Validation
**Severity:** HIGH
**Files:** `config.py`, `main.py`

The task scope explicitly required: *"GAMEPASS_WEBHOOK_SECRET set with proper HMAC validation."*

No Roblox GamePass webhook endpoint exists anywhere in the codebase. If GamePass purchases are intended to be processed server-side (which they must be for a non-trivial economy), there is no endpoint to receive or validate them. This is a **missing feature** that blocks secure launch.

---

### 7. Chat Has No Input Sanitization
**Severity:** HIGH
**File:** `ColyseusManager.ts:273-276`

```typescript
sendChat(text: string, channel: "global" | "room" | "trade" = "room"): void {
  if (!text.trim()) return;
  this.currentRoom?.send("chat:send", { text: text.trim().slice(0, 200), channel });
}
```

Client truncates to 200 chars, but server-side Colyseus handler (not visible in this codebase) must sanitize HTML/JS injection. No visible sanitization in Lua server (`TycoonUI.lua` or `TycoonServer.lua`).

---

## MEDIUM

### 8. Login Endpoint Accepts Any Password — No Hash Verification
**Severity:** MEDIUM
**File:** `auth.py:35-56`

```python
# Login: creates JWT without checking password at all
if not player:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, ...)
access_token = create_access_token(data={"sub": player.user_id, "username": player.username})
```

The comment says *"in production, store hashed password in a dedicated auth table"* — but no password is stored or verified at registration either. Registration calls `get_password_hash(payload.password)` but there's no `hashed_password` column in `Player` model. Any username string (no password check) grants a valid JWT.

**Fix:** Add `hashed_password` to Player model. Validate on login.

---

### 9. Mini-Game Score Submission Has Weak Plausibility Check
**Severity:** MEDIUM
**File:** `minigames.py:191-194`

```python
max_plausible = config.duration_seconds * 1000
if req.score < 0 or req.score > max_plausible * 10:  # allows 10x plausible max
    raise HTTPException(status_code=400, detail="Score out of plausible range.")
```

The `* 10` multiplier is very loose. For a 60-second game, max plausible is 60,000 but the check allows 600,000. Combined with no auth, this enables free reward farming.

---

### 10. Pets `/lookup/{instance_id}` Has No Auth — IDOR on Pet Instance Access
**Severity:** MEDIUM
**File:** `pets.py:68-81`

```python
@router.get("/lookup/{instance_id}", response_model=PetInstanceResponse)
def lookup_pet(instance_id: str, db: Session = Depends(get_db)):
    # No auth. Any caller can look up any pet instance by ID.
    instance = db.execute(select(PetInstance).where(...)).scalars().first()
```

Pet `instance_id` values are UUIDs (from `acquire_pet`), so enumeration is hard. However, if an instance ID is leaked (e.g., via another endpoint, webhook, or error message), any unauthenticated caller can read pet details.

---

## Summary Table

| # | Severity | Issue | File(s) | TKPA-76 Remediated? |
|---|----------|-------|---------|---------------------|
| 1 | CRITICAL | IDOR on all player/games endpoints — no auth ownership check | player.py, pets.py, minigames.py, items.py | ❌ NO |
| 2 | CRITICAL | CORS `allow_origins=["*"]` + `allow_credentials=True` | main.py | ❌ NO |
| 3 | HIGH | Auth missing or optional on most endpoints | player.py, leaderboard.py, pets.py, minigames.py | ❌ NO |
| 4 | HIGH | No rate limiting anywhere in FastAPI app | main.py | ❌ NO |
| 5 | HIGH | No server-side earnings validation — client-supplied currency | player.py | ❌ NO |
| 6 | HIGH | GAMEPASS_WEBHOOK_SECRET / HMAC endpoint missing entirely | config.py, main.py | ❌ NO |
| 7 | HIGH | Chat message injection risk (no visible server-side sanitization) | ColyseusManager.ts | ❌ UNVERIFIED |
| 8 | MEDIUM | Login accepts any password — no hash verification | auth.py | ❌ NO |
| 9 | MEDIUM | Mini-game score plausibility check too loose (10x) | minigames.py | ❌ NO |
| 10 | MEDIUM | Pet `/lookup/{instance_id}` unauthenticated | pets.py | ❌ NO |

**Original TKPA-81 findings status:**
- #1 (player identity guard): N/A — Roblox Lua concern, not reviewed here
- #2 (arbitrary business ID): N/A — Roblox Lua concern
- #4 (offline earnings not re-validated): **STILL OPEN** (TKPA-148 Finding #5)
- #5 (no rate limiting): **STILL OPEN** (TKPA-148 Finding #4)
- #6 (hardcoded HTTP backend): Not rechecked — config.ts uses `localhost` for dev
- #7 (no auth token): **STILL OPEN** (TKPA-148 Finding #3)

---

## Launch Decision

**❌ NOT CLEARED FOR LAUNCH**

**Minimum blockers before launch (must fix all CRITICAL + HIGH):**
1. Add `get_current_user` auth to ALL mutating endpoints; validate `token["sub"] == target_user_id`
2. Replace CORS `allow_origins=["*"]` with explicit allowlist
3. Add rate limiting middleware to FastAPI app
4. Implement server-side earnings validation (recalculate from businesses JSON)
5. Implement GamePass webhook endpoint with HMAC validation
6. Fix login password verification (add hashed_password field + check)

---

*Report generated by Security Engineer (e9840147-3b14-4ad4-8d67-4d86f78c2cba) — TKPA-148*
