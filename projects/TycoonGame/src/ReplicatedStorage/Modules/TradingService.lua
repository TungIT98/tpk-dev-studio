--[[
	TradingService.lua
	HTTP client for the trades backend API (TKPA-5510).
	Wraps all trade lifecycle calls: create, accept, decline, cancel, history.
	All validation is server-side — anti-exploit handled by the backend.
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local TradingService = {}

-- Backend base URL (configured via environment / game settings)
local BASE_URL = "http://localhost:8000"
local API_TIMEOUT = 10 -- seconds

-- ── HTTP Helpers ───────────────────────────────────────────────────────────────

local function Get(endpoint)
	local url = BASE_URL .. endpoint
	local ok, response = pcall(function()
		return HttpService:GetAsync(url, false, nil, API_TIMEOUT)
	end)
	if not ok then
		return { success = false, data = nil, error = tostring(response) }
	end
	local decodeOk, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)
	if not decodeOk then
		return { success = false, data = nil, error = "JSON decode failed" }
	end
	return { success = true, data = data, error = nil }
end

local function Post(endpoint, body)
	local url = BASE_URL .. endpoint
	local jsonBody = HttpService:JSONEncode(body)
	local headers = { ["Content-Type"] = "application/json" }
	local ok, response = pcall(function()
		return HttpService:PostAsync(url, jsonBody, Enum.HttpContentType.ApplicationJson, false, headers, API_TIMEOUT)
	end)
	if not ok then
		return { success = false, data = nil, error = tostring(response) }
	end
	local decodeOk, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)
	if not decodeOk then
		-- Some POST endpoints return empty body
		return { success = true, data = nil, error = nil }
	end
	return { success = true, data = data, error = nil }
end

local function Put(endpoint, body)
	-- Reuse Post but for PUT semantics — FastAPI accepts JSON body on PUT too
	local url = BASE_URL .. endpoint
	local jsonBody = body and HttpService:JSONEncode(body) or ""
	local headers = { ["Content-Type"] = "application/json" }
	local ok, response = pcall(function()
		return HttpService:PostAsync(url, jsonBody, Enum.HttpContentType.ApplicationJson, false, headers, API_TIMEOUT)
	end)
	if not ok then
		return { success = false, data = nil, error = tostring(response) }
	end
	local decodeOk, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)
	if not decodeOk then
		return { success = true, data = nil, error = nil }
	end
	return { success = true, data = data, error = nil }
end

local function DeletePut(endpoint, body)
	-- DELETE with body — use PostAsync with HTTP method override via headers
	local url = BASE_URL .. endpoint
	local jsonBody = body and HttpService:JSONEncode(body) or ""
	local headers = {
		["Content-Type"] = "application/json",
		["X-HTTP-Method-Override"] = "DELETE",
	}
	local ok, response = pcall(function()
		return HttpService:PostAsync(url, jsonBody, Enum.HttpContentType.ApplicationJson, false, headers, API_TIMEOUT)
	end)
	if not ok then
		return { success = false, data = nil, error = tostring(response) }
	end
	local decodeOk, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)
	if not decodeOk then
		return { success = true, data = nil, error = nil }
	end
	return { success = true, data = data, error = nil }
end

-- ── Trade API Calls ────────────────────────────────────────────────────────────

--[[
	Create a new trade offer.
	@param initiatorId  string  - user_id of the player creating the offer
	@param receiverId   string  - user_id of the player being offered the trade
	@param initOffer    table   - { pet_instance_ids = {}, item_ids = {}, currency = 0 }
	@param recvOffer    table   - { pet_instance_ids = {}, item_ids = {}, currency = 0 }
	@param expiresInHours int   - hours until the offer expires (default 24)
	@return TradeOfferResponse or nil
]]
function TradingService.CreateTradeOffer(initiatorId, receiverId, initOffer, recvOffer, expiresInHours)
	expiresInHours = expiresInHours or 24
	local body = {
		initiator_id = tostring(initiatorId),
		receiver_id = tostring(receiverId),
		initiator_offer = {
			pet_instance_ids = initOffer.pet_instance_ids or {},
			item_ids = initOffer.item_ids or {},
			currency = initOffer.currency or 0,
		},
		receiver_offer = {
			pet_instance_ids = recvOffer.pet_instance_ids or {},
			item_ids = recvOffer.item_ids or {},
			currency = recvOffer.currency or 0,
		},
		expires_in_hours = expiresInHours,
	}
	local result = Post("/api/trades", body)
	if not result.success then
		warn("[TradingService] CreateTradeOffer failed:", result.error)
		return nil, result.error
	end
	return result.data
end

--[[
	Get all trades involving a player (as initiator or receiver).
	@param playerId  string
	@param status    string?  - filter: "pending", "accepted", "declined", "cancelled", "expired"
	@param page      int?     - page number (default 1)
	@param limit     int?     - items per page (default 20, max 100)
	@return { trades = {}, total, page } or nil
]]
function TradingService.GetPlayerTrades(playerId, status, page, limit)
	page = page or 1
	limit = limit or 20
	local endpoint = "/api/trades/" .. tostring(playerId)
	local queryParts = {}
	if status then table.insert(queryParts, "status=" .. status) end
	table.insert(queryParts, "page=" .. tostring(page))
	table.insert(queryParts, "limit=" .. tostring(limit))
	if #queryParts > 0 then
		endpoint = endpoint .. "?" .. table.concat(queryParts, "&")
	end
	local result = Get(endpoint)
	if not result.success then
		warn("[TradingService] GetPlayerTrades failed:", result.error)
		return nil
	end
	return result.data
end

--[[
	Get a single trade offer by ID.
	@param tradeId  string
	@return TradeOfferResponse or nil
]]
function TradingService.GetTradeOffer(tradeId)
	local result = Get("/api/trades/single/" .. tostring(tradeId))
	if not result.success then
		warn("[TradingService] GetTradeOffer failed:", result.error)
		return nil
	end
	return result.data
end

--[[
	Accept a pending trade offer.
	@param tradeId  string
	@param userId   string  - the receiver accepting the trade
	@return TradeOfferResponse or nil
]]
function TradingService.AcceptTrade(tradeId, userId)
	local body = { user_id = tostring(userId) }
	local result = Put("/api/trades/" .. tostring(tradeId) .. "/accept", body)
	if not result.success then
		warn("[TradingService] AcceptTrade failed:", result.error)
		return nil, result.error
	end
	return result.data
end

--[[
	Decline a pending trade offer.
	@param tradeId  string
	@param userId   string  - either party can decline
	@return TradeOfferResponse or nil
]]
function TradingService.DeclineTrade(tradeId, userId)
	local body = { user_id = tostring(userId) }
	local result = Put("/api/trades/" .. tostring(tradeId) .. "/decline", body)
	if not result.success then
		warn("[TradingService] DeclineTrade failed:", result.error)
		return nil, result.error
	end
	return result.data
end

--[[
	Cancel (delete) a pending trade offer.
	@param tradeId  string
	@param userId   string  - only the initiator can cancel
	@return TradeOfferResponse or nil
]]
function TradingService.CancelTrade(tradeId, userId)
	local body = { user_id = tostring(userId) }
	local result = DeletePut("/api/trades/" .. tostring(tradeId), body)
	if not result.success then
		warn("[TradingService] CancelTrade failed:", result.error)
		return nil, result.error
	end
	return result.data
end

--[[
	Get completed trade transaction history for a player.
	@param playerId  string
	@param page      int?
	@param limit     int?
	@return list of TradeTransactionResponse
]]
function TradingService.GetTradeHistory(playerId, page, limit)
	page = page or 1
	limit = limit or 20
	local endpoint = "/api/trades/history/" .. tostring(playerId)
		.. "?page=" .. tostring(page) .. "&limit=" .. tostring(limit)
	local result = Get(endpoint)
	if not result.success then
		warn("[TradingService] GetTradeHistory failed:", result.error)
		return nil
	end
	return result.data
end

-- ── Utility ───────────────────────────────────────────────────────────────────

--[[
	Format a TradeOfferItemSpec for UI display.
	Returns a human-readable summary string.
]]
function TradingService.FormatOfferSpec(offerSpec)
	local parts = {}
	if offerSpec.currency and offerSpec.currency > 0 then
		table.insert(parts, "$" .. TycoonClient.FormatMoney(offerSpec.currency))
	end
	local petCount = #(offerSpec.pet_instance_ids or {})
	if petCount > 0 then
		table.insert(parts, petCount .. " pet" .. (petCount > 1 and "s" or ""))
	end
	local itemCount = #(offerSpec.item_ids or {})
	if itemCount > 0 then
		table.insert(parts, itemCount .. " item" .. (itemCount > 1 and "s" or ""))
	end
	return #parts > 0 and table.concat(parts, ", ") or "Nothing"
end

--[[
	Return human-readable time remaining until expiration.
	@param expiresAt  string  - ISO datetime
	@return string like "23h 45m" or "Expired"
]]
function TradingService.FormatExpiresAt(expiresAt)
	if not expiresAt then return "Unknown" end
	-- Try to parse ISO datetime
	local year, month, day, hour, min, sec = expiresAt:match("(%d+)-(%d+)-(%d+)T(%d+):(%d+):(%d+)")
	if not year then return expiresAt end
	local expireTime = os.time({ year = year, month = month, day = day, hour = hour, min = min, sec = sec })
	local now = os.time()
	local diff = expireTime - now
	if diff <= 0 then return "Expired" end
	local hours = math.floor(diff / 3600)
	local mins = math.floor((diff % 3600) / 60)
	if hours > 0 then
		return tostring(hours) .. "h " .. tostring(mins) .. "m"
	else
		return tostring(mins) .. "m"
	end
end

-- Load TycoonClient at module scope for FormatMoney (circular-safe)
local TycoonClient = require(script.Parent.TycoonClient)

return TradingService
