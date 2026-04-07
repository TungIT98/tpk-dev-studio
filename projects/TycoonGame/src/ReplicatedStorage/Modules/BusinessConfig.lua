--[[
	BusinessConfig.lua
	Defines all 10 business tiers per the architecture plan (TKPA-40).
	Business tiers: Lemonade Stand → Moon Base
]]

local BusinessConfig = {}

-- Cost scaling: cost = base_cost * 1.15^quantity
local COST_MULTIPLIER = 1.15

-- Prestige multiplier per prestige level: 1 + (prestigeLevel * 0.1)
local PRESTIGE_MULTIPLIER_PER_LEVEL = 0.10

--[[
	10 Business tiers per architecture plan
	Income formula (from plan):
	  income = base_income * quantity * (1 + 0.25 * level)
	Cost formula (from plan):
	  cost = base_cost * 1.15^quantity
]]
BusinessConfig.Businesses = {
	{
		id = "lemonade_stand",
		name = "Lemonade Stand",
		icon = "rbxassetid://6031071053",
		baseIncome = 1,
		baseCost = 10,
		tickRate = 1,
		tier = 1,
		color = Color3.fromRGB(255, 215, 0),
		description = "A humble lemonade stand. Simple but effective.",
		unlockRequirement = 0,
	},
	{
		id = "newspaper_route",
		name = "Newspaper Route",
		icon = "rbxassetid://6031068861",
		baseIncome = 8,
		baseCost = 100,
		tickRate = 1,
		tier = 1,
		color = Color3.fromRGB(200, 200, 200),
		description = "Deliver papers across the neighborhood.",
		unlockRequirement = 0,
	},
	{
		id = "car_wash",
		name = "Car Wash",
		icon = "rbxassetid://6031068097",
		baseIncome = 47,
		baseCost = 1100,
		tickRate = 1,
		tier = 2,
		color = Color3.fromRGB(0, 191, 255),
		description = "Sparkling clean cars bring sparkling clean cash.",
		unlockRequirement = 500,
	},
	{
		id = "donut_shop",
		name = "Donut Shop",
		icon = "rbxassetid://6031068429",
		baseIncome = 260,
		baseCost = 12000,
		tickRate = 1,
		tier = 2,
		color = Color3.fromRGB(255, 160, 90),
		description = "Who can resist a fresh donut? Not your wallet.",
		unlockRequirement = 8000,
	},
	{
		id = "pizza_shop",
		name = "Pizza Shop",
		icon = "rbxassetid://6031072893",
		baseIncome = 1400,
		baseCost = 130000,
		tickRate = 1,
		tier = 3,
		color = Color3.fromRGB(255, 100, 0),
		description = "Hot pizza, happy customers, heavy profits.",
		unlockRequirement = 50000,
	},
	{
		id = "burger_joint",
		name = "Burger Joint",
		icon = "rbxassetid://6031072893",
		baseIncome = 7800,
		baseCost = 1400000,
		tickRate = 1,
		tier = 3,
		color = Color3.fromRGB(139, 90, 43),
		description = "Flipping burgers and flipping profits.",
		unlockRequirement = 200000,
	},
	{
		id = "taco_truck",
		name = "Taco Truck",
		icon = "rbxassetid://6031068097",
		baseIncome = 43000,
		baseCost = 20000000,
		tickRate = 1,
		tier = 4,
		color = Color3.fromRGB(255, 180, 0),
		description = "Taco Tuesday every day of the week.",
		unlockRequirement = 1000000,
	},
	{
		id = "sushi_bar",
		name = "Sushi Bar",
		icon = "rbxassetid://6031068861",
		baseIncome = 230000,
		baseCost = 330000000,
		tickRate = 1,
		tier = 4,
		color = Color3.fromRGB(255, 80, 80),
		description = "Exquisite dining, exquisite profits.",
		unlockRequirement = 15000000,
	},
	{
		id = "tech_startup",
		name = "Tech Startup",
		icon = "rbxassetid://6031072893",
		baseIncome = 1300000,
		baseCost = 5100000000,
		tickRate = 1,
		tier = 5,
		color = Color3.fromRGB(80, 200, 120),
		description = "Disrupting industries and printing money.",
		unlockRequirement = 200000000,
	},
	{
		id = "moon_base",
		name = "Moon Base",
		icon = "rbxassetid://6031068097",
		baseIncome = 8000000,
		baseCost = 75000000000,
		tickRate = 1,
		tier = 5,
		color = Color3.fromRGB(0, 100, 255),
		description = "To the moon! And beyond.",
		unlockRequirement = 5000000000,
	},
}

-- Build lookup table
BusinessConfig.BusinessById = {}
for _, business in ipairs(BusinessConfig.Businesses) do
	BusinessConfig.BusinessById[business.id] = business
end

--[[
	Cost formula (from architecture plan):
	  cost = base_cost * 1.15^quantity
]]
function BusinessConfig.GetPurchaseCost(businessId, ownedCount)
	local business = BusinessConfig.BusinessById[businessId]
	if not business then return math.huge end
	return math.floor(business.baseCost * (COST_MULTIPLIER ^ ownedCount))
end

--[[
	Income formula (from architecture plan):
	  income = base_income * quantity * (1 + 0.25 * level) * prestige_multiplier
]]
function BusinessConfig.GetIncome(businessId, level, quantity, prestigeLevel)
	local business = BusinessConfig.BusinessById[businessId]
	if not business then return 0 end
	level = level or 1
	quantity = quantity or 1
	prestigeLevel = prestigeLevel or 0
	local levelBonus = 1 + (0.25 * (level - 1))
	local prestigeMultiplier = 1 + (prestigeLevel * PRESTIGE_MULTIPLIER_PER_LEVEL)
	return business.baseIncome * quantity * levelBonus * prestigeMultiplier
end

function BusinessConfig.IsUnlocked(business, totalEarnedEver)
	local requirement = business.unlockRequirement or 0
	return totalEarnedEver >= requirement
end

return BusinessConfig
