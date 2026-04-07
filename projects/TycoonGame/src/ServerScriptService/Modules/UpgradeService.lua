--[[
	UpgradeService.lua
	Handles upgrade purchases per the architecture plan (TKPA-40).
	- Speed: 10 levels, 10% faster per level
	- Value: 10 levels, 25% more income per level
	- Auto-Collect: 5 levels
	- Manager: global, auto-buys when affordable
	Cost formula: base_cost * 10 * 1.5^level
]]

local UpgradeConfig = require(game.ReplicatedStorage.Modules.UpgradeConfig)

local UpgradeService = {}

--[[
	Purchase a per-business upgrade
	playerData: player data table
	upgradeId: speed | value | auto_collect
	businessId: the business this upgrade applies to
	Returns: { success, message, cost }
]]
function UpgradeService.PurchaseUpgrade(playerData, upgradeId, businessId)
	local upgrade = UpgradeConfig.UpgradeById[upgradeId]
	if not upgrade then
		return { success = false, message = "Unknown upgrade: " .. tostring(upgradeId), cost = 0 }
	end

	local upgrades = playerData.Upgrades or {}
	local currentLevel = 0

	-- Per-business upgrades stored as businessId:level
	if businessId then
		local bizUpgrades = upgrades[businessId] or {}
		currentLevel = bizUpgrades[upgradeId] or 0
	else
		-- Global upgrades
		currentLevel = upgrades[upgradeId] or 0
	end

	if currentLevel >= upgrade.maxLevel then
		return { success = false, message = upgrade.name .. " is max level (" .. upgrade.maxLevel .. ")", cost = 0 }
	end

	local cost = UpgradeConfig.GetUpgradeCost(upgradeId, businessId, currentLevel)

	if (playerData.Money or 0) < cost then
		return { success = false, message = "Not enough money", cost = cost }
	end

	playerData.Money = playerData.Money - cost

	if businessId then
		-- Per-business upgrade
		if not upgrades[businessId] then upgrades[businessId] = {} end
		upgrades[businessId][upgradeId] = currentLevel + 1
	else
		-- Global upgrade
		upgrades[upgradeId] = currentLevel + 1
	end

	playerData.Upgrades = upgrades

	return {
		success = true,
		message = upgrade.name .. " Lv." .. (currentLevel + 1),
		cost = cost
	}
end

function UpgradeService.HasAutoCollect(playerData)
	-- Global auto-collect (stored under businessId or global)
	for businessId, bizUpgrades in pairs(playerData.Upgrades or {}) do
		if bizUpgrades.auto_collect and bizUpgrades.auto_collect >= 1 then
			return true
		end
	end
	return false
end

function UpgradeService.HasManager(playerData)
	return (playerData.Upgrades or {})["global_manager"] and (playerData.Upgrades["global_manager"] or 0) >= 1
end

return UpgradeService
