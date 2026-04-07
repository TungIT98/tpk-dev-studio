--[[
	DataStoreService.lua
	Handles player data persistence using ProfileService or manual DataStore.
]]

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")

local DataStore = DataStoreService:GetDataStore("TycoonPlayerData_v1")

local DataStoreService = {}

local PROFILE_TEMPLATE = {
	Money = 0,
	TotalEarned = 0,
	TotalEarnedEver = 0,
	Businesses = {},
	Upgrades = {},
	PrestigeLevel = 0,
	PrestigePoints = 0,
	LastSaveTime = os.time(),
}

-- Load player data
function DataStoreService.LoadPlayerData(player)
	local userId = player.UserId
	local success, data = pcall(function()
		return DataStore:GetAsync("Player_" .. userId)
	end)

	if success then
		if data then
			-- Merge with template to handle new fields
			local merged = {}
			for k, v in pairs(PROFILE_TEMPLATE) do
				merged[k] = data[k] or v
			end
			-- Ensure sub-tables exist
			if type(merged.Businesses) ~= "table" then merged.Businesses = {} end
			if type(merged.Upgrades) ~= "table" then merged.Upgrades = {} end
			return merged
		else
			return table.clone(PROFILE_TEMPLATE)
		end
	else
		warn("[DataStoreService] Failed to load data for", player.Name, ":", data)
		return table.clone(PROFILE_TEMPLATE)
	end
end

-- Save player data
function DataStoreService.SavePlayerData(player, data)
	local userId = player.UserId
	local saveData = {
		Money = data.Money or 0,
		TotalEarned = data.TotalEarned or 0,
		TotalEarnedEver = data.TotalEarnedEver or 0,
		Businesses = data.Businesses or {},
		Upgrades = data.Upgrades or {},
		PrestigeLevel = data.PrestigeLevel or 0,
		PrestigePoints = data.PrestigePoints or 0,
		LastSaveTime = os.time(),
	}

	local success, err = pcall(function()
		DataStore:SetAsync("Player_" .. userId, saveData)
	end)

	if not success then
		warn("[DataStoreService] Failed to save data for", player.Name, ":", err)
	end

	return success
end

return DataStoreService
