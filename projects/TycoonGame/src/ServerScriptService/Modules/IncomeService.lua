--[[
	IncomeService.lua
	Income calculations per the architecture plan (TKPA-40).

	Income formula:
	  income = base_income * quantity * (1 + 0.25 * level) * prestigeMultiplier * speedMultiplier * valueMultiplier
]]

local BusinessConfig = require(game.ReplicatedStorage.Modules.BusinessConfig)
local UpgradeConfig = require(game.ReplicatedStorage.Modules.UpgradeConfig)
local PrestigeService = require(script.Parent.Modules.PrestigeService)

local IncomeService = {}

--[[
	Calculate income for a single business in one tick
	Returns: income amount
]]
function IncomeService.CalcBusinessTickIncome(businessId, owned, level, prestigeLevel, upgrades)
	if owned <= 0 then return 0 end

	local business = BusinessConfig.BusinessById[businessId]
	if not business then return 0 end

	local prestigeMultiplier = PrestigeService.GetPrestigeMultiplier(prestigeLevel or 0)
	local speedMultiplier = IncomeService.GetSpeedMultiplier(upgrades or {})
	local valueMultiplier = IncomeService.GetValueMultiplier(upgrades or {})

	-- Formula from plan: base_income * quantity * (1 + 0.25 * level)
	local baseIncome = business.baseIncome * owned
	local levelBonus = 1 + (0.25 * ((level or 1) - 1))
	local totalMultiplier = prestigeMultiplier * speedMultiplier * valueMultiplier

	return baseIncome * levelBonus * totalMultiplier
end

--[[
	Calculate total income per second across all businesses
]]
function IncomeService.CalcIncomePerSecond(playerData)
	local businesses = playerData.Businesses or {}
	local upgrades = playerData.Upgrades or {}
	local prestigeLevel = playerData.PrestigeLevel or 0

	local totalPerSecond = 0

	for businessId, bizData in pairs(businesses) do
		local owned = bizData.owned or 0
		local level = bizData.level or 1

		if owned > 0 then
			local tickIncome = IncomeService.CalcBusinessTickIncome(
				businessId, owned, level, prestigeLevel, upgrades
			)
			local business = BusinessConfig.BusinessById[businessId]
			if business then
				-- Tick rate from plan is 1 second per tick
				local ticksPerSecond = 1 / (business.tickRate)
				totalPerSecond = totalPerSecond + (tickIncome * ticksPerSecond)
			end
		end
	end

	return totalPerSecond
end

-- Speed multiplier from speed upgrade: 0.90^level = 10% faster per level
function IncomeService.GetSpeedMultiplier(upgrades)
	local speedLevel = upgrades["speed"] or 0
	local speedUpgrade = UpgradeConfig.UpgradeById["speed"]
	if speedUpgrade then
		return speedUpgrade.effectValue ^ speedLevel
	end
	return 1
end

-- Value multiplier from value upgrade: 1.25^level = 25% more per level
function IncomeService.GetValueMultiplier(upgrades)
	local valueLevel = upgrades["value"] or 0
	local valueUpgrade = UpgradeConfig.UpgradeById["value"]
	if valueUpgrade then
		return valueUpgrade.effectValue ^ valueLevel
	end
	return 1
end

-- Calculate offline earnings locally (fallback when backend unavailable)
-- Uses same formula as online but at 50% efficiency, capped at 8 hours
function IncomeService.CalcOfflineEarnings(playerData, lastSaveTime)
	local now = os.time()
	local elapsed = math.max(0, now - (lastSaveTime or now))
	local cappedSeconds = math.min(elapsed, 8 * 60 * 60) -- 8 hours max

	if cappedSeconds <= 0 then return 0 end

	local incomePerSecond = IncomeService.CalcIncomePerSecond(playerData)
	-- Offline earnings at 50% efficiency
	return math.floor(incomePerSecond * cappedSeconds * 0.5)
end

return IncomeService
