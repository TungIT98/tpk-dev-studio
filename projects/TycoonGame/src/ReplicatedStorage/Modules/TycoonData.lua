--[[
	TycoonData.lua
	Shared module for player data structure and utility functions.
]]

local TycoonData = {}

TycoonData.Fields = {
	Money = "money",
	TotalEarned = "totalEarned",
	TotalEarnedEver = "totalEarnedEver",
	Businesses = "businesses",      -- { [businessId] = { owned = count, level = level } }
	Upgrades = "upgrades",          -- { [upgradeId] = level }
	PrestigeLevel = "prestigeLevel",
	PrestigePoints = "prestigePoints",
	LastSaveTime = "lastSaveTime",
}

-- Create a fresh player data table
function TycoonData.NewPlayerData()
	return {
		[TycoonData.Fields.Money] = 0,
		[TycoonData.Fields.TotalEarned] = 0,
		[TycoonData.Fields.TotalEarnedEver] = 0,
		[TycoonData.Fields.Businesses] = {},
		[TycoonData.Fields.Upgrades] = {},
		[TycoonData.Fields.PrestigeLevel] = 0,
		[TycoonData.Fields.PrestigePoints] = 0,
		[TycoonData.Fields.LastSaveTime] = os.time(),
	}
end

-- Calculate offline earnings when player returns
function TycoonData.CalcOfflineEarnings(data, lastSaveTime)
	local now = os.time()
	local elapsedSeconds = math.max(0, now - (lastSaveTime or now))
	local maxOfflineSeconds = 8 * 60 * 60 -- 8 hours max offline earnings
	local cappedSeconds = math.min(elapsedSeconds, maxOfflineSeconds)

	-- Base: sum all business incomes
	local incomePerSecond = 0
	for businessId, bizData in pairs(data[TycoonData.Fields.Businesses]) do
		if bizData.owned > 0 and bizData.level > 0 then
			-- This is a simplified rate; actual tick calculation done in IncomeService
			-- For offline: use estimated average income rate
			local level = bizData.level
			incomePerSecond = incomePerSecond + (bizData.owned * level * 1) -- base estimate
		end
	end

	local offlineEarnings = math.floor(incomePerSecond * cappedSeconds * 0.5) -- 50% efficiency offline
	return offlineEarnings
end

-- Serialize for network transfer
function TycoonData.Serialize(data)
	return {
		money = data[TycoonData.Fields.Money] or 0,
		totalEarned = data[TycoonData.Fields.TotalEarned] or 0,
		totalEarnedEver = data[TycoonData.Fields.TotalEarnedEver] or 0,
		businesses = data[TycoonData.Fields.Businesses] or {},
		upgrades = data[TycoonData.Fields.Upgrades] or {},
		prestigeLevel = data[TycoonData.Fields.PrestigeLevel] or 0,
		prestigePoints = data[TycoonData.Fields.PrestigePoints] or 0,
	}
end

return TycoonData
