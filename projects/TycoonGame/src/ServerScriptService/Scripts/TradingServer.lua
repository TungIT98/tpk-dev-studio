--[[
	TradingServer.lua
	Server-side trade lifecycle handler (TKPA-5510).

	Handles:
	- Setup of trade RemoteEvents/RemoteFunctions in ReplicatedStorage
	- Server-side trade initiation, accept, decline, cancel
	- Pushes incoming trade offers to clients via RemoteEvent
	- All anti-exploit validation is done by the FastAPI backend.

	Note: This script calls the FastAPI backend via HTTP (same as other services).
	The backend is the authoritative source for trade state.
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local BASE_URL = "http://localhost:8000"
local API_TIMEOUT = 10

-- ── Remote Setup ───────────────────────────────────────────────────────────────

local TRADE_EVENTS = {
	-- Client → Server
	"CreateTrade",      -- FireServer(receiverId, initOffer, recvOffer)
	"AcceptTrade",      -- FireServer(tradeId)
	"DeclineTrade",    -- FireServer(tradeId)
	"CancelTrade",     -- FireServer(tradeId)
	"FetchTrades",     -- FireServer(status, page)
	"FetchTradeHistory", -- FireServer(page)

	-- Server → Client
	"TradeOfferReceived",    -- FireClient(receiver, tradeData)
	"TradeUpdated",          -- FireClient(player, tradeData)  (accept/decline/cancel)
	"TradeError",            -- FireClient(player, errorMessage)
	"TradesFetched",         -- FireClient(player, tradesData)
	"TradeHistoryFetched",    -- FireClient(player, historyData)
}

-- RemoteFunctions for synchronous requests
local TRADE_FUNCTIONS = {
	"GetTradeOffer",    -- InvokeServer(tradeId) → tradeData
	"GetMyTrades",      -- InvokeServer(status, page) → tradesData
}

local function SetupTradeRemotes()
	for _, name in ipairs(TRADE_EVENTS) do
		if not ReplicatedStorage:FindFirstChild(name) then
			Instance.new("RemoteEvent", ReplicatedStorage).Name = name
		end
	end
	for _, name in ipairs(TRADE_FUNCTIONS) do
		if not ReplicatedStorage:FindFirstChild(name) then
			Instance.new("RemoteFunction", ReplicatedStorage).Name = name
		end
	end
end

-- ── HTTP Helpers ───────────────────────────────────────────────────────────────

local function Get(endpoint)
	local url = BASE_URL .. endpoint
	local ok, resp = pcall(function()
		return HttpService:GetAsync(url, false, nil, API_TIMEOUT)
	end)
	if not ok then return nil end
	local decodeOk, data = pcall(function() return HttpService:JSONDecode(resp) end)
	return decodeOk and data or nil
end

local function Post(endpoint, body)
	local url = BASE_URL .. endpoint
	local json = HttpService:JSONEncode(body)
	local headers = { ["Content-Type"] = "application/json" }
	local ok, resp = pcall(function()
		return HttpService:PostAsync(url, json, Enum.HttpContentType.ApplicationJson, false, headers, API_TIMEOUT)
	end)
	if not ok then return nil end
	local decodeOk, data = pcall(function() return HttpService:JSONDecode(resp) end)
	return (decodeOk and data) or nil
end

local function Put(endpoint, body)
	local url = BASE_URL .. endpoint
	local json = body and HttpService:JSONEncode(body) or ""
	local headers = { ["Content-Type"] = "application/json" }
	local ok, resp = pcall(function()
		return HttpService:PostAsync(url, json, Enum.HttpContentType.ApplicationJson, false, headers, API_TIMEOUT)
	end)
	if not ok then return nil end
	local decodeOk, data = pcall(function() return HttpService:JSONDecode(resp) end)
	return (decodeOk and data) or nil
end

local function DeletePut(endpoint, body)
	local url = BASE_URL .. endpoint
	local json = body and HttpService:JSONEncode(body) or ""
	local headers = {
		["Content-Type"] = "application/json",
		["X-HTTP-Method-Override"] = "DELETE",
	}
	local ok, resp = pcall(function()
		return HttpService:PostAsync(url, json, Enum.HttpContentType.ApplicationJson, false, headers, API_TIMEOUT)
	end)
	if not ok then return nil end
	local decodeOk, data = pcall(function() return HttpService:JSONDecode(resp) end)
	return (decodeOk and data) or nil
end

-- ── Player tracking ────────────────────────────────────────────────────────────

local PLAYER_ID_CACHE = {} -- [player] = userId string

local function GetPlayerId(player)
	if PLAYER_ID_CACHE[player] then
		return PLAYER_ID_CACHE[player]
	end
	-- Use the user_id from backend via Players service
	-- For Roblox, we use the player's UserId as string
	local userId = tostring(player.UserId)
	PLAYER_ID_CACHE[player] = userId
	return userId
end

-- ── RemoteEvent Handlers ───────────────────────────────────────────────────────

local function SetupEventHandlers()
	-- CreateTrade: receiverId, initOffer, recvOffer
	ReplicatedStorage.CreateTrade.OnServerEvent:Connect(function(player, receiverId, initOffer, recvOffer)
		local userId = GetPlayerId(player)
		local result = Post("/api/trades", {
			initiator_id = userId,
			receiver_id = tostring(receiverId),
			initiator_offer = initOffer or {},
			receiver_offer = recvOffer or {},
			expires_in_hours = 24,
		})
		if result then
			-- Notify the receiver if they're online
			local receiverPlayer = Players:GetPlayerByUserId(tonumber(receiverId))
			if receiverPlayer then
				ReplicatedStorage.TradeOfferReceived:FireClient(receiverPlayer, result)
			end
			-- Also confirm to the initiator
			ReplicatedStorage.TradeUpdated:FireClient(player, result)
		else
			ReplicatedStorage.TradeError:FireClient(player, "Failed to create trade offer.")
		end
	end)

	-- AcceptTrade: tradeId
	ReplicatedStorage.AcceptTrade.OnServerEvent:Connect(function(player, tradeId)
		local userId = GetPlayerId(player)
		local result = Put("/api/trades/" .. tostring(tradeId) .. "/accept", { user_id = userId })
		if result then
			-- Notify both parties
			local initiator = Players:GetPlayerByUserId(tonumber(result.initiator_id))
			local receiver = Players:GetPlayerByUserId(tonumber(result.receiver_id))
			if initiator then ReplicatedStorage.TradeUpdated:FireClient(initiator, result) end
			if receiver then ReplicatedStorage.TradeUpdated:FireClient(receiver, result) end
		else
			ReplicatedStorage.TradeError:FireClient(player, "Failed to accept trade.")
		end
	end)

	-- DeclineTrade: tradeId
	ReplicatedStorage.DeclineTrade.OnServerEvent:Connect(function(player, tradeId)
		local userId = GetPlayerId(player)
		local result = Put("/api/trades/" .. tostring(tradeId) .. "/decline", { user_id = userId })
		if result then
			local initiator = Players:GetPlayerByUserId(tonumber(result.initiator_id))
			local receiver = Players:GetPlayerByUserId(tonumber(result.receiver_id))
			if initiator then ReplicatedStorage.TradeUpdated:FireClient(initiator, result) end
			if receiver then ReplicatedStorage.TradeUpdated:FireClient(receiver, result) end
		else
			ReplicatedStorage.TradeError:FireClient(player, "Failed to decline trade.")
		end
	end)

	-- CancelTrade: tradeId
	ReplicatedStorage.CancelTrade.OnServerEvent:Connect(function(player, tradeId)
		local userId = GetPlayerId(player)
		local result = DeletePut("/api/trades/" .. tostring(tradeId), { user_id = userId })
		if result then
			local initiator = Players:GetPlayerByUserId(tonumber(result.initiator_id))
			local receiver = Players:GetPlayerByUserId(tonumber(result.receiver_id))
			if initiator then ReplicatedStorage.TradeUpdated:FireClient(initiator, result) end
			if receiver then ReplicatedStorage.TradeUpdated:FireClient(receiver, result) end
		else
			ReplicatedStorage.TradeError:FireClient(player, "Failed to cancel trade.")
		end
	end)

	-- FetchTrades: status, page
	ReplicatedStorage.FetchTrades.OnServerEvent:Connect(function(player, status, page)
		local userId = GetPlayerId(player)
		local endpoint = "/api/trades/" .. userId
		local query = {}
		if status then table.insert(query, "status=" .. status) end
		table.insert(query, "page=" .. tostring(page or 1))
		table.insert(query, "limit=20")
		if #query > 0 then endpoint = endpoint .. "?" .. table.concat(query, "&") end
		local result = Get(endpoint)
		if result then
			ReplicatedStorage.TradesFetched:FireClient(player, result)
		else
			ReplicatedStorage.TradeError:FireClient(player, "Failed to fetch trades.")
		end
	end)

	-- FetchTradeHistory: page
	ReplicatedStorage.FetchTradeHistory.OnServerEvent:Connect(function(player, page)
		local userId = GetPlayerId(player)
		local endpoint = "/api/trades/history/" .. userId .. "?page=" .. tostring(page or 1) .. "&limit=20"
		local result = Get(endpoint)
		if result then
			ReplicatedStorage.TradeHistoryFetched:FireClient(player, result)
		else
			ReplicatedStorage.TradeError:FireClient(player, "Failed to fetch trade history.")
		end
	end)
end

-- ── RemoteFunction Handlers ────────────────────────────────────────────────────

local function SetupFunctionHandlers()
	-- GetTradeOffer: tradeId → tradeData
	ReplicatedStorage.GetTradeOffer.OnServerInvoke = function(player, tradeId)
		return Get("/api/trades/single/" .. tostring(tradeId))
	end

	-- GetMyTrades: status, page → tradesData
	ReplicatedStorage.GetMyTrades.OnServerInvoke = function(player, status, page)
		local userId = GetPlayerId(player)
		local endpoint = "/api/trades/" .. userId
		local query = {}
		if status then table.insert(query, "status=" .. status) end
		table.insert(query, "page=" .. tostring(page or 1))
		table.insert(query, "limit=20")
		if #query > 0 then endpoint = endpoint .. "?" .. table.concat(query, "&") end
		return Get(endpoint)
	end
end

-- ── Periodic: poll for pending offers and push to clients ──────────────────────

-- Poll every 10 seconds for pending trades for each online player
local function StartTradePolling()
	local RunService = game:GetService("RunService")
	local period = 10

	local nextPoll = 0
	RunService.Heartbeat:Connect(function()
		local now = tick()
		if now < nextPoll then return end
		nextPoll = now + period

		for _, player in ipairs(Players:GetPlayers()) do
			local userId = GetPlayerId(player)
			local data = Get("/api/trades/" .. userId .. "?status=pending&limit=20&page=1")
			if data and data.trades and #data.trades > 0 then
				-- Push each pending offer as a notification
				for _, trade in ipairs(data.trades) do
					-- Only fire if the player is the receiver (they need to act)
					if trade.receiver_id == userId then
						ReplicatedStorage.TradeOfferReceived:FireClient(player, trade)
					end
				end
			end
		end
	end)
end

-- ── Init ───────────────────────────────────────────────────────────────────────

local function Init()
	SetupTradeRemotes()
	SetupEventHandlers()
	SetupFunctionHandlers()
	StartTradePolling()
	print("[TradingServer] Initialized")
end

Init()

return {}
