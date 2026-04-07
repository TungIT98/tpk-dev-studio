--[[
	PetCompanions.lua
	Core pet companion system per the architecture plan (TKPA-86/88).
	Pet data structures, bonuses, and synergy calculations.

	Design (from plan):
	  - Pets provide passive income bonuses
	  - Synergy bonuses activate when multiple pets of compatible types are owned
	  - Pet rarities: Common, Rare, Epic, Legendary
	  - Pets can be leveled up using in-game currency
]]

local PetCompanions = {}

--[[
	Pet rarity tiers with cost/effect multipliers
]]
local RARITIES = {
	COMMON   = { id = "common",   name = "Common",   color = Color3.fromRGB(180, 180, 180), costMult = 1.0,   effectMult = 1.0,   maxLevel = 50  },
	RARE     = { id = "rare",     name = "Rare",     color = Color3.fromRGB(65,  185, 255), costMult = 10.0,  effectMult = 2.5,   maxLevel = 50  },
	EPIC     = { id = "epic",     name = "Epic",     color = Color3.fromRGB(200, 80,  255), costMult = 100.0, effectMult = 7.0,   maxLevel = 75  },
	LEGENDARY= { id = "legendary",name = "Legendary",color = Color3.fromRGB(255, 165, 0),  costMult = 1000.0,effectMult = 20.0,  maxLevel = 100 },
}

PetCompanions.Rarities = RARITIES

--[[
	Pet types (categories) that trigger synergy bonuses
	Groups pets by type; synergies activate when multiple pets in the same type are owned
]]
local PET_TYPES = {
	MONEY     = "money",      -- Income boost pets
	SPEED     = "speed",      -- Tick speed boost pets
	BUSINESS  = "business",   -- Business-specific boost pets
	LUCKY     = "lucky",      -- Chance-based bonus pets
	PRESTIGE  = "prestige",   -- Prestige point boost pets
}

PetCompanions.PetTypes = PET_TYPES

--[[
	Synergy definitions
	Activates when player owns N or more pets of a type
]]
local SYNERGIES = {
	{
		id = "money_mob",
		type = PET_TYPES.MONEY,
		name = "Money Mob",
		description = "Income bonus from multiple money pets",
		minCount = 3,
		bonusType = "income_mult",
		bonusValue = 0.10,   -- +10% income per synergy stack
		stackBonus = 0.05,   -- additional +5% per extra pet beyond minCount
		maxStacks = 10,
	},
	{
		id = "speed_demon",
		type = PET_TYPES.SPEED,
		name = "Speed Demon",
		description = "Tick speed boost from multiple speed pets",
		minCount = 3,
		bonusType = "speed_mult",
		bonusValue = 0.05,   -- +5% speed per synergy stack
		stackBonus = 0.02,
		maxStacks = 10,
	},
	{
		id = "business_baron",
		type = PET_TYPES.BUSINESS,
		name = "Business Baron",
		description = "Business income boost from business pets",
		minCount = 2,
		bonusType = "business_mult",
		bonusValue = 0.15,   -- +15% business income
		stackBonus = 0.05,
		maxStacks = 5,
	},
	{
		id = "lucky_charm",
		type = PET_TYPES.LUCKY,
		name = "Lucky Charm",
		description = "Chance bonus from luck pets",
		minCount = 2,
		bonusType = "luck_chance",
		bonusValue = 0.05,   -- 5% chance for bonus income
		stackBonus = 0.02,
		maxStacks = 5,
	},
	{
		id = "prestige_path",
		type = PET_TYPES.PRESTIGE,
		name = "Prestige Path",
		description = "Prestige point bonus from prestige pets",
		minCount = 2,
		bonusType = "prestige_mult",
		bonusValue = 0.10,   -- +10% prestige points
		stackBonus = 0.05,
		maxStacks = 5,
	},
}

PetCompanions.Synergies = SYNERGIES

--[[
	All available pets
	Each pet: id, name, type, rarity, baseEffect, baseCost, icon
]]
PetCompanions.Pets = {
	-- Common pets
	{ id = "penny_pig",       name = "Penny Pig",        type = PET_TYPES.MONEY,     rarity = RARITIES.COMMON,    baseEffect = 0.01,  baseCost = 500,     icon = "rbxassetid://6031071053" },
	{ id = "swift_rabbit",     name = "Swift Rabbit",      type = PET_TYPES.SPEED,     rarity = RARITIES.COMMON,    baseEffect = 0.02,  baseCost = 750,     icon = "rbxassetid://6031068097" },
	{ id = "biz_beaver",       name = "Biz Beaver",        type = PET_TYPES.BUSINESS,  rarity = RARITIES.COMMON,    baseEffect = 0.01,  baseCost = 600,     icon = "rbxassetid://6031068429" },
	{ id = "lucky_cat",        name = "Lucky Cat",         type = PET_TYPES.LUCKY,     rarity = RARITIES.COMMON,    baseEffect = 0.02,  baseCost = 800,     icon = "rbxassetid://6031072893" },
	{ id = "star_cub",         name = "Star Cub",          type = PET_TYPES.PRESTIGE, rarity = RARITIES.COMMON,    baseEffect = 0.01,  baseCost = 1000,    icon = "rbxassetid://6031068861" },

	-- Rare pets
	{ id = "gold_gopher",      name = "Gold Gopher",       type = PET_TYPES.MONEY,     rarity = RARITIES.RARE,     baseEffect = 0.05,  baseCost = 5000,    icon = "rbxassetid://6031071053" },
	{ id = "wind_wolf",        name = "Wind Wolf",         type = PET_TYPES.SPEED,     rarity = RARITIES.RARE,     baseEffect = 0.06,  baseCost = 7500,    icon = "rbxassetid://6031068097" },
	{ id = "tycoon_tortoise",   name = "Tycoon Tortoise",   type = PET_TYPES.BUSINESS,  rarity = RARITIES.RARE,     baseEffect = 0.04,  baseCost = 6000,    icon = "rbxassetid://6031068429" },
	{ id = "clover_cobra",     name = "Clover Cobra",      type = PET_TYPES.LUCKY,     rarity = RARITIES.RARE,     baseEffect = 0.06,  baseCost = 8000,    icon = "rbxassetid://6031072893" },
	{ id = "royal_raccoon",    name = "Royal Raccoon",     type = PET_TYPES.PRESTIGE, rarity = RARITIES.RARE,     baseEffect = 0.05,  baseCost = 10000,   icon = "rbxassetid://6031068861" },

	-- Epic pets
	{ id = "vault_dragon",     name = "Vault Dragon",      type = PET_TYPES.MONEY,     rarity = RARITIES.EPIC,     baseEffect = 0.10,  baseCost = 50000,   icon = "rbxassetid://6031071053" },
	{ id = "turbo_tiger",      name = "Turbo Tiger",       type = PET_TYPES.SPEED,     rarity = RARITIES.EPIC,     baseEffect = 0.12,  baseCost = 75000,   icon = "rbxassetid://6031068097" },
	{ id = "empire_eagle",     name = "Empire Eagle",      type = PET_TYPES.BUSINESS,  rarity = RARITIES.EPIC,     baseEffect = 0.10,  baseCost = 60000,   icon = "rbxassetid://6031068429" },
	{ id = "fortune_fox",      name = "Fortune Fox",       type = PET_TYPES.LUCKY,     rarity = RARITIES.EPIC,     baseEffect = 0.12,  baseCost = 80000,   icon = "rbxassetid://6031072893" },
	{ id = "cosmic_crane",     name = "Cosmic Crane",      type = PET_TYPES.PRESTIGE, rarity = RARITIES.EPIC,     baseEffect = 0.10,  baseCost = 100000,  icon = "rbxassetid://6031068861" },

	-- Legendary pets
	{ id = "diamond_whale",    name = "Diamond Whale",     type = PET_TYPES.MONEY,     rarity = RARITIES.LEGENDARY, baseEffect = 0.25, baseCost = 500000,  icon = "rbxassetid://6031071053" },
	{ id = "lightning_lynx",    name = "Lightning Lynx",   type = PET_TYPES.SPEED,     rarity = RARITIES.LEGENDARY, baseEffect = 0.30, baseCost = 750000,  icon = "rbxassetid://6031068097" },
	{ id = "monopoly_moose",   name = "Monopoly Moose",   type = PET_TYPES.BUSINESS,  rarity = RARITIES.LEGENDARY, baseEffect = 0.25, baseCost = 600000,  icon = "rbxassetid://6031068429" },
	{ id = "jackpot_jaguar",    name = "Jackpot Jaguar",   type = PET_TYPES.LUCKY,     rarity = RARITIES.LEGENDARY, baseEffect = 0.30, baseCost = 800000,  icon = "rbxassetid://6031072893" },
	{ id = "ascended_alpaca",   name = "Ascended Alpaca",  type = PET_TYPES.PRESTIGE, rarity = RARITIES.LEGENDARY, baseEffect = 0.25, baseCost = 1000000, icon = "rbxassetid://6031068861" },
}

-- Build lookup
PetCompanions.PetById = {}
for _, pet in ipairs(PetCompanions.Pets) do
	PetCompanions.PetById[pet.id] = pet
end

--[[
	Calculate pet level-up cost
	Cost formula: baseCost * rarity.costMult * 1.5^level
]]
function PetCompanions.GetLevelUpCost(petId, currentLevel)
	local pet = PetCompanions.PetById[petId]
	if not pet then return math.huge end
	local rarity = pet.rarity
	return math.floor(pet.baseCost * rarity.costMult * (1.5 ^ currentLevel))
end

--[[
	Calculate pet income bonus at a given level
	Bonus = pet.baseEffect * rarity.effectMult * (1 + 0.1 * level)
]]
function PetCompanions.GetPetBonus(petId, level)
	local pet = PetCompanions.PetById[petId]
	if not pet then return 0 end
	level = level or 1
	return pet.baseEffect * pet.rarity.effectMult * (1 + 0.1 * (level - 1))
end

--[[
	Calculate all active synergy bonuses from a player's pet collection
	playerPets: { [petId] = { owned = bool, level = number } }
	Returns: { [bonusType] = multiplierValue }
]]
function PetCompanions.CalcSynergyBonuses(playerPets)
	local bonuses = {
		income_mult = 1.0,
		speed_mult = 1.0,
		business_mult = 1.0,
		luck_chance = 0.0,
		prestige_mult = 1.0,
	}

	-- Count pets per type
	local typeCounts = {}
	for petId, petInfo in pairs(playerPets or {}) do
		local petDef = PetCompanions.PetById[petId]
		if petDef and (petInfo.owned or petInfo.level > 0) then
			typeCounts[petDef.type] = (typeCounts[petDef.type] or 0) + 1
		end
	end

	-- Apply synergies
	for _, synergy in ipairs(SYNERGIES) do
		local count = typeCounts[synergy.type] or 0
		if count >= synergy.minCount then
			local stacks = math.min(count - synergy.minCount + 1, synergy.maxStacks)
			local bonus = synergy.bonusValue + (stacks - 1) * synergy.stackBonus
			if synergy.bonusType == "luck_chance" then
				bonuses.luck_chance = bonuses.luck_chance + bonus
			else
				bonuses[synergy.bonusType] = bonuses[synergy.bonusType] + bonus
			end
		end
	end

	return bonuses
end

--[[
	Calculate total pet income multiplier for a player
]]
function PetCompanions.CalcPetIncomeMultiplier(playerPets)
	local bonuses = PetCompanions.CalcSynergyBonuses(playerPets)
	local total = 1.0

	-- Sum pet base bonuses
	for petId, petInfo in pairs(playerPets or {}) do
		if petInfo.owned or petInfo.level > 0 then
			local petBonus = PetCompanions.GetPetBonus(petId, petInfo.level or 1)
			total = total + petBonus
		end
	end

	-- Apply synergy multiplier
	total = total * bonuses.income_mult

	return total
end

--[[
	Apply pet bonuses to a base income value
]]
function PetCompanions.ApplyBonusesToIncome(baseIncome, playerPets, prestigeLevel)
	local petMultiplier = PetCompanions.CalcPetIncomeMultiplier(playerPets)
	local synergyBonuses = PetCompanions.CalcSynergyBonuses(playerPets)
	local prestigeMultiplier = 1 + ((prestigeLevel or 0) * 0.10)

	-- Lucky bonus: chance roll for bonus income
	local luckChance = synergyBonuses.luck_chance
	local luckyBonus = 0
	if luckChance > 0 and math.random() < luckChance then
		luckyBonus = baseIncome * 0.5  -- Lucky hit = 50% bonus income
	end

	return baseIncome * petMultiplier * prestigeMultiplier + luckyBonus
end

--[[
	Apply pet bonuses to prestige points
]]
function PetCompanions.ApplyBonusesToPrestige(basePoints, playerPets)
	local synergyBonuses = PetCompanions.CalcSynergyBonuses(playerPets)
	return basePoints * synergyBonuses.prestige_mult
end

--[[
	Validate pet purchase for a player
	playerPets: { [petId] = { owned = bool, level = number } }
]]
function PetCompanions.CanPurchasePet(petId, playerPets, money)
	playerPets = playerPets or {}
	local pet = PetCompanions.PetById[petId]
	if not pet then
		return { success = false, message = "Unknown pet", cost = 0 }
	end

	if playerPets[petId] and playerPets[petId].owned then
		return { success = false, message = "You already own this pet", cost = 0 }
	end

	local cost = pet.baseCost * pet.rarity.costMult
	if (money or 0) < cost then
		return { success = false, message = "Not enough money for " .. pet.name, cost = cost }
	end

	return { success = true, message = "Ready to buy " .. pet.name, cost = cost }
end

return PetCompanions
