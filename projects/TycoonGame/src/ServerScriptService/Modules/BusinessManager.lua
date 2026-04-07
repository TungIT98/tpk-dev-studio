--[[
	BusinessManager.lua
	Business purchase and sale logic per the architecture plan (TKPA-40).
	Cost formula: base_cost * 1.15^quantity
	Income formula: base_income * quantity * (1 + 0.25 * level)
]]

local BusinessConfig = require(game.ReplicatedStorage.Modules.BusinessConfig)

local BusinessManager = {}

--[[
	Purchase another unit of a business
	playerData: player data table
	businessId: string
	Returns: { success, message, cost }
]]
function BusinessManager.PurchaseBusiness(playerData, businessId)
	local business = BusinessConfig.BusinessById[businessId]
	if not business then
		return { success = false, message = "Unknown business", cost = 0 }
	end

	local businesses = playerData.Businesses or {}
	local bizData = businesses[businessId]
	local ownedCount = bizData and bizData.owned or 0

	local cost = BusinessConfig.GetPurchaseCost(businessId, ownedCount)

	if (playerData.Money or 0) < cost then
		return { success = false, message = "Not enough money", cost = cost }
	end

	playerData.Money = playerData.Money - cost

	if not bizData then
		bizData = { owned = 0, level = 1 }
		businesses[businessId] = bizData
	end

	bizData.owned = (bizData.owned or 0) + 1
	if not bizData.level then bizData.level = 1 end
	playerData.Businesses = businesses

	return { success = true, message = "Purchased " .. business.name, cost = cost }
end

--[[
	Upgrade a business level (increases income)
	Cost formula from plan: base_cost * 10 * 1.5^level
]]
function BusinessManager.UpgradeBusiness(playerData, businessId)
	local business = BusinessConfig.BusinessById[businessId]
	if not business then
		return { success = false, message = "Unknown business", cost = 0 }
	end

	local bizData = (playerData.Businesses or {})[businessId]
	if not bizData or bizData.owned == 0 then
		return { success = false, message = "Business not owned", cost = 0 }
	end

	local level = bizData.level or 1
	local cost = math.floor(business.baseCost * 10 * (1.5 ^ level))

	if (playerData.Money or 0) < cost then
		return { success = false, message = "Not enough money", cost = cost }
	end

	playerData.Money = playerData.Money - cost
	bizData.level = level + 1

	return { success = true, message = "Upgraded " .. business.name .. " to Lv." .. bizData.level, cost = cost }
end

--[[
	Sell one unit of a business (refund 70%)
]]
function BusinessManager.SellBusiness(playerData, businessId)
	local business = BusinessConfig.BusinessById[businessId]
	if not business then
		return { success = false, message = "Unknown business", refund = 0 }
	end

	local bizData = (playerData.Businesses or {})[businessId]
	if not bizData or bizData.owned == 0 then
		return { success = false, message = "Nothing to sell", refund = 0 }
	end

	local owned = bizData.owned
	-- Refund 70% of total invested
	local totalInvested = 0
	for i = 0, owned - 1 do
		totalInvested = totalInvested + math.floor(business.baseCost * (1.15 ^ i))
	end
	local refund = math.floor(totalInvested * 0.70)

	playerData.Money = (playerData.Money or 0) + refund
	bizData.owned = bizData.owned - 1

	return { success = true, message = "Sold " .. business.name, refund = refund }
end

function BusinessManager.IsBusinessUnlocked(playerData, businessId)
	local business = BusinessConfig.BusinessById[businessId]
	if not business then return false end
	return BusinessConfig.IsUnlocked(business, playerData.TotalEarnedEver or 0)
end

return BusinessManager
