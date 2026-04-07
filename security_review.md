## Security Review Findings — TKPA-81

**Project:** Enhanced Tycoon Game v2 - Viral Edition (Roblox/Lua)
**Scope:** Full Lua codebase — server scripts, modules, client UI, backend HTTP client
**Severity Scale:** CRITICAL > HIGH > MEDIUM > LOW

---

### CRITICAL

**1. No Player Identity Validation on RemoteEvent Handlers**
- File: `TycoonServer.lua:239–289`
- All `OnServerEvent` handlers (`PurchaseBusiness`, `SellBusiness`, `BuyUpgrade`, `Prestige`) receive `(player, ...)` but never assert `player` is non-nil or validate it further.
- A compromised Roblox client or modified packet could call these with a spoofed `player` reference in multi-player contexts. While Roblox abstracts player identity at the socket layer, the Lua event handlers themselves should be hardened.
- Fix: Add explicit `assert(player and player:IsA("Player"))` guard at the top of every handler.

**2. Arbitrary String Business ID / Upgrade ID Accepted from Client**
- Files: `BusinessManager.lua:19`, `UpgradeService.lua:23`
- `businessId` and `upgradeId` arrive from `OnServerEvent` and are passed directly to lookup tables. A malicious client could inject arbitrary strings.
- Current defense: `BusinessConfig.BusinessById[businessId]` returns `nil` for unknown IDs, causing silent failure. This is a weak but functional defense.
- Risk: If `BusinessById` ever auto-creates entries (future-proofing), injection becomes exploitable.
- Fix: Add an explicit allowlist set of valid IDs rather than relying on nil-guard.

**3. Server Trust of In-Memory Cache (Design Risk)**
- File: `TycoonServer.lua:239–289`
- All purchase/prestige handlers read `PlayerDataCache[player].Money` as authoritative. In Roblox, the server-side `PlayerDataCache` is fully server-authoritative — no exploit can directly modify server memory.
- Design is correct. No exploit can directly write to server memory. Mark OK contingent on ongoing diligence.
- Fix: Ensure `SyncDataToClient` never has a paired reverse-sync (client to server money setter). Currently unidirectional — correct.

---

### HIGH

**4. Offline Earnings Backend Response Not Re-Validated**
- File: `TycoonServer.lua:117–126`
- `offlineResult.data.offline_earnings` is accepted directly from the FastAPI backend without server-side re-calculation validation.
- If the FastAPI backend is compromised or returns an inflated value, the player receives free money.
- Fix: After receiving backend offline earnings, run `IncomeService.CalcOfflineEarnings` on the server and cap the accepted value to `min(reported, serverCalculated * 1.5)`.

**5. No Rate Limiting on Any RemoteEvent**
- File: `TycoonServer.lua:237–295`
- No debounce, cooldown, or rate-limit per player on purchase/upgrade/prestige events. An automated exploit script could fire `PurchaseBusiness` thousands of times per second.
- Fix: Implement a per-player cooldown dictionary keyed by event name. On handler entry, check `if os.time() < (cooldowns[player][eventName] or 0) then return end`.

**6. Hardcoded Backend URL — No HTTPS Enforcement**
- File: `BackendService.lua:14`
- `BASE_URL = "http://localhost:8000"` — hardcoded HTTP (not HTTPS). In production, this leaks player data (money, username, play session) in plaintext.
- Fix: Move to a GameSetting/Environment variable. Enforce `https://` in production via a config flag.

---

### MEDIUM

**7. Backend API Endpoints Have No Authentication Token**
- File: `BackendService.lua:21–70`
- All HTTP calls to `/api/player/`, `/api/leaderboard/` carry no `Authorization` header or signed request token. Any external actor who can reach the backend IP can read/write player data.
- The architecture plan mentions JWT auth but no JWT is implemented in the Lua client.
- Fix: Add a shared-secret header: `X-Game-Token: <server-api-key>`. Validate on every FastAPI endpoint. Use HTTPS to protect the token in transit.

**8. Data Merge on Backend Load Accepts Arbitrary Table Structure**
- File: `TycoonServer.lua:96–105`
- When loading from the backend, response fields are accepted without type validation. A malicious backend response could inject deeply nested or malformed tables.
- Fix: Add explicit field validation: `data.total_currency = tonumber(data.total_currency) or 0`, `data.businesses = type(data.businesses) == "table" and data.businesses or {}`.

**9. Prestige Operation Not Idempotent — Double Prestige Risk**
- File: `PrestigeService.lua:72–105`
- If a player fires `Prestige` and the network times out, the client may retry. The server does not track whether prestige was already applied.
- Fix: Add a `prestigePending` flag per player in `PlayerDataCache`. Set to `true` before calling `DoPrestige`, clear after save completes. Reject attempts while flag is set.

**10. DataStore Failures Silently Ignored**
- File: `DataStoreService.lua:45–48, 65–71`
- On DataStore load failure, a blank template is returned — player loses progress silently. On save failure, only a `warn()` is issued — data loss is silent.
- Fix: Log a metric/event on failure. Consider exponential retry for saves rather than a single `pcall`.

---

### LOW

**11. Sound Event Accepts Arbitrary String**
- File: `TycoonClient.lua:86`
- `FireServer(soundType)` is echoed back via `FireClient`. Low risk (audio only) but could probe event routing.
- Fix: Allowlist sound types: `local VALID_SOUNDS = { purchase = true, upgrade = true, error = true, ... }`.

**12. TycoonUI References ServerScriptService Directly from Client**
- File: `TycoonUI.lua:659`
- `require(game.ServerScriptService.Modules.IncomeService)` — this violates Roblox sandboxing. In a properly configured game, client scripts cannot require server-only modules. This line will throw a runtime error in a locked-down environment.
- Fix: Remove this require; move income calculation to a ReplicatedStorage module or compute client-side from synced data.

**13. Leaderboard Limit Not Bounded**
- File: `BackendService.lua:158`
- `limit` is not bounded before URL interpolation. Large or non-numeric input could cause backend issues.
- Fix: Cap limit: `limit = math.min(math.max(tonumber(limit) or 100, 1), 500)`.

---

### Architecture-Level Notes

- **Server-authoritative design is correct.** Money is computed server-side via Heartbeat loop and cached in `PlayerDataCache`. Client cannot directly write money — this is the right approach.
- **No trade/gift endpoints exist yet** — the architecture plan references these but they are not implemented. Ensure when added they include rate limiting and server-side validation.
- **No anti-cheat/speed-hack detection** present. For a Tycoon game (passive income), this is low priority. Consider adding periodic server-side sanity checks (e.g., if `TotalEarned` jumps by >10x expected rate, flag for review).
- **GDPR/privacy:** Player usernames are sent to the backend (`Players:GetNameFromUserIdAsync`). Ensure backend has a data retention/deletion policy before production.

---

### Summary Table

| # | Severity | Issue | File(s) |
|---|----------|-------|---------|
| 1 | CRITICAL | No player identity guard on event handlers | TycoonServer.lua |
| 2 | CRITICAL | Arbitrary business/upgrade ID accepted from client | BusinessManager.lua, UpgradeService.lua |
| 3 | CRITICAL | Server trust of in-memory cache (OK if design holds) | TycoonServer.lua |
| 4 | HIGH | Offline earnings from backend not re-validated | TycoonServer.lua |
| 5 | HIGH | No rate limiting on remote events | TycoonServer.lua |
| 6 | HIGH | Hardcoded HTTP backend URL | BackendService.lua |
| 7 | MEDIUM | Backend API has no auth token | BackendService.lua |
| 8 | MEDIUM | Backend data load lacks type validation | TycoonServer.lua |
| 9 | MEDIUM | Prestige not idempotent — double prestige risk | PrestigeService.lua |
| 10 | MEDIUM | DataStore failures silently ignored | DataStoreService.lua |
| 11 | LOW | Sound event accepts arbitrary string | TycoonClient.lua |
| 12 | LOW | TycoonUI requires ServerScriptService from client | TycoonUI.lua |
| 13 | LOW | Leaderboard limit not bounded | BackendService.lua |

**Recommended Priority:** Fix #6, #7 (HTTPS + auth token on FastAPI backend) before any production deployment. Then address #1, #2, #4, #5 as a batch.
