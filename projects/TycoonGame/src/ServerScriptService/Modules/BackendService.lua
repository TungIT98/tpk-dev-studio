--[[
	BackendService.lua
	HTTP integration with FastAPI backend per the architecture plan (TKPA-40).
	Gracefully falls back to local DataStore if backend is unavailable.
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local BackendService = {}

-- Backend base URL (configured via environment or game settings)
-- In production this would come from a GameSetting or Environment variable
local BASE_URL = "http://localhost:8000"
local API_TIMEOUT = 10 -- seconds

--[[
	Make a GET request to the backend
	Returns: { success: bool, data: any, error: string }
]]
function BackendService.Get(endpoint)
	local url = BASE_URL .. endpoint
	local success, response = pcall(function()
		local request = HttpService:GetAsync(url, false, nil, API_TIMEOUT)
		return request
	end)

	if not success then
		return { success = false, data = nil, error = tostring(response) }
	end

	local decodeSuccess, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)

	if not decodeSuccess then
		return { success = false, data = nil, error = "JSON decode failed" }
	end

	return { success = true, data = data, error = nil }
end

--[[
	Make a POST request to the backend
	Returns: { success: bool, data: any, error: string }
]]
function BackendService.Post(endpoint, body)
	local url = BASE_URL .. endpoint
	local jsonBody = HttpService:JSONEncode(body)
	local headers = { ["Content-Type"] = "application/json" }

	local success, response = pcall(function()
		return HttpService:PostAsync(url, jsonBody, Enum.HttpContentType.ApplicationJson, false, headers, API_TIMEOUT)
	end)

	if not success then
		return { success = false, data = nil, error = tostring(response) }
	end

	local decodeSuccess, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)

	-- Some POST endpoints return empty body
	if not decodeSuccess then
		return { success = true, data = nil, error = nil }
	end

	return { success = true, data = data, error = nil }
end

--[[
	Load player data from the backend
	GET /api/player/{user_id}
]]
function BackendService.LoadPlayerData(userId)
	local result = BackendService.Get("/api/player/" .. tostring(userId))
	if not result.success then
		warn("[BackendService] LoadPlayerData failed:", result.error)
		return nil
	end
	return result.data
end

--[[
	Save player data to the backend
	POST /api/player/{user_id}/save
	Payload: full player data snapshot
]]
function BackendService.SavePlayerData(userId, playerData)
	local payload = {
		user_id = tostring(userId),
		username = Players:GetNameFromUserIdAsync(userId),
		total_currency = playerData.Money or 0,
		total_earned = playerData.TotalEarned or 0,
		total_earned_ever = playerData.TotalEarnedEver or 0,
		prestige_level = playerData.PrestigeLevel or 0,
		prestige_points = playerData.PrestigePoints or 0,
		businesses = playerData.Businesses or {},
		upgrades = playerData.Upgrades or {},
		save_version = "1.0",
		saved_at = os.time(),
	}

	local result = BackendService.Post("/api/player/" .. tostring(userId) .. "/save", payload)
	if not result.success then
		warn("[BackendService] SavePlayerData failed:", result.error)
		return false
	end
	return true
end

--[[
	Calculate offline earnings from the backend
	POST /api/player/{user_id}/offline
	Returns: { offline_earnings: number }
]]
function BackendService.GetOfflineEarnings(userId, lastSaveTime)
	local payload = {
		user_id = tostring(userId),
		last_save_time = lastSaveTime or os.time(),
		now = os.time(),
	}

	local result = BackendService.Post("/api/player/" .. tostring(userId) .. "/offline", payload)
	if not result.success then
		warn("[BackendService] GetOfflineEarnings failed:", result.error)
		return { success = false, data = nil, error = result.error }
	end

	local earnings = result.data and result.data.offline_earnings or 0
	return { success = true, data = { offline_earnings = earnings }, error = nil }
end

--[[
	Submit score to leaderboard
	POST /api/leaderboard/rank
]]
function BackendService.SubmitScore(userId, totalEarned)
	local payload = {
		user_id = tostring(userId),
		total_earned = totalEarned or 0,
	}

	local result = BackendService.Post("/api/leaderboard/rank", payload)
	if not result.success then
		return false
	end
	return true
end

--[[
	Get global leaderboard
	GET /api/leaderboard
]]
function BackendService.GetLeaderboard(limit)
	limit = limit or 100
	local result = BackendService.Get("/api/leaderboard?limit=" .. tostring(limit))
	if not result.success then
		return nil
	end
	return result.data
end

return BackendService
