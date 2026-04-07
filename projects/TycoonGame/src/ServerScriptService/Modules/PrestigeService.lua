--[[
	PrestigeService.lua
	Prestige/rebirth system per the architecture plan (TKPA-40).
	- Unlocks at $1 Trillion lifetime earnings
	- Resets: businesses, upgrades, currency
	- Keeps: prestige level (permanent multiplier: 1 + prestigeLevel * 0.1)
	- Prestige level is never reset
]]

local PrestigeService = {}

-- Prestige unlock threshold (from architecture plan)
local PRESTIGE_THRESHOLD = 1e12 -- $1 Trillion

--[[
	Prestige tiers with names
]]
local PRESTIGE_TIERS = {
	{ threshold = 0,   tier = 0, name = "New Tycoon" },
	{ threshold = 1,   tier = 1, name = "Bronze Tycoon" },
	{ threshold = 2,   tier = 2, name = "Silver Tycoon" },
	{ threshold = 3,   tier = 3, name = "Gold Tycoon" },
	{ threshold = 5,   tier = 4, name = "Platinum Tycoon" },
	{ threshold = 10,  tier = 5, name = "Diamond Tycoon" },
}

--[[
	Points formula (from plan): prestige resets give points based on lifetime earnings
	Higher lifetime earnings = more prestige points
]]
function PrestigeService.CalcPrestigePoints(totalEarnedEver, currentPrestigeLevel)
	if totalEarnedEver < PRESTIGE_THRESHOLD then return 0 end

	-- Points scale logarithmically with total earned
	-- More times you prestige, the more points you get per prestige
	local basePoints = math.floor(math.log(totalEarnedEver / 1e12) * 10)
	local multiplier = currentPrestigeLevel + 1
	return math.max(1, basePoints * multiplier)
end

--[[
	Check if player is eligible to prestige
	Returns: { canPrestige, pointsToEarn, message }
]]
function PrestigeService.CheckPrestige(playerData)
	local totalEarned = playerData.TotalEarned or 0

	if totalEarned < PRESTIGE_THRESHOLD then
		return {
			canPrestige = false,
			pointsToEarn = 0,
			message = "Earn $" .. string.format("%.2fT", PRESTIGE_THRESHOLD / 1e12) .. " lifetime to prestige"
		}
	end

	local points = PrestigeService.CalcPrestigePoints(totalEarned, playerData.PrestigeLevel or 0)
	local nextTierName = PrestigeService.GetTierName(playerData.PrestigeLevel + 1)

	return {
		canPrestige = true,
		pointsToEarn = points,
		message = "Prestige for " .. points .. " Prestige Points (" .. nextTierName .. ")"
	}
end

--[[
	Execute prestige reset
	Resets: businesses, currency, upgrades, totalEarned
	Keeps: prestigeLevel (cumulative), prestigePoints, autoCollect/manager upgrades
	Multiplier formula: 1 + (prestigeLevel * 0.1)
]]
function PrestigeService.DoPrestige(playerData)
	local check = PrestigeService.CheckPrestige(playerData)
	if not check.canPrestige then
		return { success = false, message = check.message, pointsEarned = 0 }
	end

	local newPrestigeLevel = (playerData.PrestigeLevel or 0) + 1
	local pointsEarned = check.pointsToEarn

	-- Reset progress
	local oldPrestigePoints = playerData.PrestigePoints or 0
	playerData.PrestigeLevel = newPrestigeLevel
	playerData.PrestigePoints = oldPrestigePoints + pointsEarned
	playerData.Money = 0
	playerData.TotalEarned = 0
	playerData.Businesses = {}

	-- Reset business-level upgrades but keep global upgrades (manager)
	local keptUpgrades = {}
	if playerData.Upgrades["global_manager"] then
		keptUpgrades["global_manager"] = playerData.Upgrades["global_manager"]
	end
	playerData.Upgrades = keptUpgrades

	local tierName = PrestigeService.GetTierName(newPrestigeLevel)

	return {
		success = true,
		message = "PRESTIGED! You are now " .. tierName .. "! +" .. pointsEarned .. " Prestige Points",
		pointsEarned = pointsEarned,
		newPrestigeLevel = newPrestigeLevel,
		tierName = tierName,
	}
end

--[[
	Prestige income multiplier
	Formula from plan: 1 + (prestigeLevel * 0.1)
]]
function PrestigeService.GetPrestigeMultiplier(prestigeLevel)
	return 1 + ((prestigeLevel or 0) * 0.10)
end

function PrestigeService.GetTierName(tierLevel)
	for i = #PRESTIGE_TIERS, 1, -1 do
		if tierLevel >= PRESTIGE_TIERS[i].tier then
			return PRESTIGE_TIERS[i].name
		end
	end
	return "New Tycoon"
end

return PrestigeService
