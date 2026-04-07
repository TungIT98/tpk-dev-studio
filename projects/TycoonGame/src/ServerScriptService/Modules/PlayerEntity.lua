--[[
	PlayerEntity.lua
	Entity wrapper for player data per the architecture plan.
	Encapsulates a player object + their cached game data.
	Provides convenience methods for querying/updating the entity.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local BusinessConfig = require(ReplicatedStorage.Modules.BusinessConfig)

local PlayerEntity = {}
PlayerEntity.__index = PlayerEntity

--[[
	Create a new PlayerEntity wrapper around a player + their data
	player: Player instance
	data: player data table from PlayerDataCache
]]
function PlayerEntity.New(player, data)
	local self = setmetatable({}, PlayerEntity)
	self.Player = player
	self.Data = data
	self.UserId = player.UserId
	self.DisplayName = player.DisplayName
	self.Name = player.Name
	return self
end

--[[
	Re-wrap after data cache updates (data pointer may change)
]]
function PlayerEntity:Refresh(data)
	self.Data = data or self.Data
end

--[[
	Money accessors
]]
function PlayerEntity:GetMoney()
	return self.Data.Money or 0
end

function PlayerEntity:SetMoney(amount)
	self.Data.Money = math.max(0, amount)
end

function PlayerEntity:AddMoney(amount)
	self.Data.Money = (self.Data.Money or 0) + amount
end

function PlayerEntity:SpendMoney(amount)
	local current = self:GetMoney()
	if current < amount then return false end
	self.Data.Money = current - amount
	return true
end

--[[
	Earnings tracking
]]
function PlayerEntity:AddEarnings(amount)
	self.Data.Money = (self.Data.Money or 0) + amount
	self.Data.TotalEarned = (self.Data.TotalEarned or 0) + amount
	self.Data.TotalEarnedEver = (self.Data.TotalEarnedEver or 0) + amount
end

function PlayerEntity:GetTotalEarned()
	return self.Data.TotalEarned or 0
end

function PlayerEntity:GetTotalEarnedEver()
	return self.Data.TotalEarnedEver or 0
end

--[[
	Business helpers
]]
function PlayerEntity:GetBusinessCount(businessId)
	local biz = (self.Data.Businesses or {})[businessId]
	return biz and biz.owned or 0
end

function PlayerEntity:CountTotalBusinesses()
	local count = 0
	for _, biz in pairs(self.Data.Businesses or {}) do
		count = count + (biz.owned or 0)
	end
	return count
end

function PlayerEntity:CountUnlockedBusinesses()
	local count = 0
	local totalEarned = self:GetTotalEarnedEver()
	for _, bizDef in ipairs(BusinessConfig.Businesses) do
		if BusinessConfig.IsUnlocked(bizDef, totalEarned) then
			local owned = self:GetBusinessCount(bizDef.id)
			if owned > 0 then count = count + 1 end
		end
	end
	return count
end

function PlayerEntity:CountUnlockedBusinessTypes()
	-- Count business *types* (not quantity) that are unlocked
	local totalEarned = self:GetTotalEarnedEver()
	local count = 0
	for _, bizDef in ipairs(BusinessConfig.Businesses) do
		if BusinessConfig.IsUnlocked(bizDef, totalEarned) then
			count = count + 1
		end
	end
	return count
end

function PlayerEntity:HasAnyBusinesses()
	return self:CountTotalBusinesses() > 0
end

--[[
	Upgrade helpers
]]
function PlayerEntity:HasUpgrade(upgradeId, businessId)
	local upgrades = self.Data.Upgrades or {}
	if businessId then
		local bizUpgrades = upgrades[businessId]
		return bizUpgrades and (bizUpgrades[upgradeId] or 0) > 0
	else
		return (upgrades[upgradeId] or 0) > 0
	end
end

function PlayerEntity:GetUpgradeLevel(upgradeId, businessId)
	local upgrades = self.Data.Upgrades or {}
	if businessId then
		local bizUpgrades = upgrades[businessId]
		return bizUpgrades and bizUpgrades[upgradeId] or 0
	else
		return upgrades[upgradeId] or 0
	end
end

--[[
	Prestige helpers
]]
function PlayerEntity:GetPrestigeLevel()
	return self.Data.PrestigeLevel or 0
end

function PlayerEntity:GetPrestigePoints()
	return self.Data.PrestigePoints or 0
end

function PlayerEntity:CanPrestige(threshold)
	local threshold = threshold or 1e12
	return self:GetTotalEarned() >= threshold
end

--[[
	Net worth calculation (sum of all assets)
	Used for leaderboard / display
]]
function PlayerEntity:GetNetWorth()
	local money = self:GetMoney()
	local totalInvested = 0

	for businessId, bizData in pairs(self.Data.Businesses or {}) do
		local owned = bizData.owned or 0
		local business = BusinessConfig.BusinessById[businessId]
		if business and owned > 0 then
			-- Sum of cost for all owned businesses
			for i = 0, owned - 1 do
				totalInvested = totalInvested + BusinessConfig.GetPurchaseCost(businessId, i)
			end
		end
	end

	return money + totalInvested
end

--[[
	Serialize entity data for client sync
	Omits internal fields (_bizTickAccum, etc.)
]]
function PlayerEntity:Serialize()
	return {
		playerId = self.UserId,
		displayName = self.DisplayName,
		money = self.Data.Money or 0,
		totalEarned = self.Data.TotalEarned or 0,
		totalEarnedEver = self.Data.TotalEarnedEver or 0,
		businesses = self.Data.Businesses or {},
		upgrades = self.Data.Upgrades or {},
		prestigeLevel = self.Data.PrestigeLevel or 0,
		prestigePoints = self.Data.PrestigePoints or 0,
		netWorth = self:GetNetWorth(),
	}
end

return PlayerEntity
