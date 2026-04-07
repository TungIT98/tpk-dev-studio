--[[
	UpgradeConfig.lua
	Defines upgrade tracks per the architecture plan (TKPA-40).
	Each business has 3 upgrade tracks: Speed, Value, Auto-Collect.
]]

local UpgradeConfig = {}

local UPGRADE_TYPES = {
	SPEED = "speed",
	VALUE = "value",
	AUTO_COLLECT = "auto_collect",
}

--[[
	Per-business upgrades (applied to each business tier)
	Speed: 10 levels, reduces tick interval by 10% per level
	Value: 10 levels, increases income by 25% per level
	Auto-Collect: 5 levels, auto-collects with increasing speed
	Cost formula (from plan): base_cost * 10 * 1.5^level
]]

local GLOBAL_UPGRADES = {
	{
		id = "global_manager",
		type = "manager",
		name = "Hire Manager",
		description = "Automatically buys the next affordable business",
		maxLevel = 1,
		baseCost = 50000,
		effectValue = 1,
	},
}

local BUSINESS_UPGRADES = {
	{
		id = "speed",
		type = UPGRADE_TYPES.SPEED,
		name = "Speed Boost",
		description = "Reduces tick interval by 10% per level",
		maxLevel = 10,
		baseCostMultiplier = 10,
		effectValue = 0.90, -- 10% faster per level
	},
	{
		id = "value",
		type = UPGRADE_TYPES.VALUE,
		name = "Value Increase",
		description = "Increases income by 25% per level",
		maxLevel = 10,
		baseCostMultiplier = 10,
		effectValue = 1.25, -- 25% more income per level
	},
	{
		id = "auto_collect",
		type = UPGRADE_TYPES.AUTO_COLLECT,
		name = "Auto-Collect",
		description = "Auto-collects income (5 speed tiers)",
		maxLevel = 5,
		baseCostMultiplier = 100,
		effectValue = 1,
	},
}

UpgradeConfig.UpgradeTypes = UPGRADE_TYPES
UpgradeConfig.GlobalUpgrades = GLOBAL_UPGRADES
UpgradeConfig.BusinessUpgrades = BUSINESS_UPGRADES

-- Build lookup
UpgradeConfig.UpgradeById = {}
for _, u in ipairs(BUSINESS_UPGRADES) do
	UpgradeConfig.UpgradeById[u.id] = u
end
for _, u in ipairs(GLOBAL_UPGRADES) do
	UpgradeConfig.UpgradeById[u.id] = u
end

--[[
	Upgrade cost formula (from plan):
	  cost = base_cost * 10 * 1.5^level
]]
function UpgradeConfig.GetUpgradeCost(upgradeId, businessId, currentLevel)
	local upgrade = UpgradeConfig.UpgradeById[upgradeId]
	if not upgrade then return math.huge end

	-- Base cost scales with the business tier
	local baseCost = upgrade.baseCostMultiplier or upgrade.baseCost or 100
	local business = nil
	if businessId then
		business = require(game.ReplicatedStorage.Modules.BusinessConfig).BusinessById[businessId]
	end
	local tierMultiplier = business and (business.tier * 0.5 + 0.5) or 1
	return math.floor(baseCost * tierMultiplier * (1.5 ^ currentLevel))
end

function UpgradeConfig.GetEffect(upgradeId, level)
	local upgrade = UpgradeConfig.UpgradeById[upgradeId]
	if not upgrade then return 0 end
	if upgrade.type == UPGRADE_TYPES.AUTO_COLLECT or upgrade.id == "global_manager" then
		return level >= 1
	end
	return upgrade.effectValue ^ level
end

return UpgradeConfig
