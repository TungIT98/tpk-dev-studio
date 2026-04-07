--[[
	TycoonUI.lua
	Full game HUD per the architecture plan (TKPA-40).
	Features: Main HUD, Business Cards, Upgrade Panel, Stats Panel, Welcome Back Modal, Prestige Dialog.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

local TycoonClient = require(ReplicatedStorage.Modules.TycoonClient)
local BusinessConfig = require(ReplicatedStorage.Modules.BusinessConfig)
local UpgradeConfig = require(ReplicatedStorage.Modules.UpgradeConfig)
local PetCompanions = require(ReplicatedStorage.Modules.PetCompanions)

-- Theme
local THEME = {
	bg = Color3.fromRGB(15, 15, 25),
	panel = Color3.fromRGB(28, 28, 44),
	accent = Color3.fromRGB(255, 200, 0),
	accentDark = Color3.fromRGB(180, 140, 0),
	success = Color3.fromRGB(0, 210, 110),
	danger = Color3.fromRGB(220, 55, 55),
	text = Color3.fromRGB(255, 255, 255),
	textDim = Color3.fromRGB(160, 160, 190),
	border = Color3.fromRGB(55, 55, 85),
	prestige = Color3.fromRGB(200, 80, 255),
	trade = Color3.fromRGB(80, 180, 255),
}

local PlayerData = {
	money = 0,
	totalEarned = 0,
	totalEarnedEver = 0,
	businesses = {},
	upgrades = {},
	pets = {},
	prestigeLevel = 0,
	prestigePoints = 0,
}

local SelectedTab = "businesses"
local SelectedPetTab = "shop"  -- "shop" or "owned"

------------------------------------------------------------
-- GUI HELPERS
------------------------------------------------------------

local function Elem(parent, class, props)
	local obj = Instance.new(class)
	for k, v in pairs(props or {}) do
		if k ~= "Parent" then
			pcall(function() obj[k] = v end)
		end
	end
	obj.Parent = parent
	return obj
end

local function Corner(obj, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r or 8)
	c.Parent = obj
	return c
end

local function Stroke(obj, color, thick)
	local s = Instance.new("UIStroke")
	s.Color = color or THEME.border
	s.Thickness = thick or 1
	s.Parent = obj
	return s
end

local function FmtMoney(n)
	return TycoonClient.FormatMoney(n)
end

local function Pop(frame)
	local orig = frame.Size
	TweenService:Create(frame, TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
		Size = UDim2.new(orig.X.Scale * 1.12, orig.X.Offset, orig.Y.Scale * 1.12, orig.Y.Offset)
	}):Play()
	task.delay(0.12, function()
		TweenService:Create(frame, TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
			Size = orig
		}):Play()
	end)
end

------------------------------------------------------------
-- SCREEN GUI
------------------------------------------------------------

local ScreenGui = Elem(PlayerGui, "ScreenGui", {
	Name = "TycoonUI",
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	ResetOnSpawn = false,
})

------------------------------------------------------------
-- HEADER BAR
------------------------------------------------------------

local Header = Elem(ScreenGui, "Frame", {
	Name = "Header",
	Size = UDim2.new(1, 0, 0, 70),
	Position = UDim2.new(0, 0, 0, 0),
	BackgroundColor3 = THEME.panel,
	BorderSizePixel = 0,
})

Corner(Header, 0)

-- Trade button (left)
local TradeBtn = Elem(Header, "TextButton", {
	Name = "TradeBtn",
	Size = UDim2.new(0, 100, 0, 50),
	Position = UDim2.new(0, 10, 0.5, -25),
	BackgroundColor3 = THEME.trade,
	Text = "",
	AutoButtonColor = false,
})
Corner(TradeBtn, 8)
Stroke(TradeBtn, THEME.trade, 2)
Elem(TradeBtn, "TextLabel", {
	Size = UDim2.new(1, 0, 0.5, 0),
	Position = UDim2.new(0, 0, 0, 0),
	BackgroundTransparency = 1,
	Text = "Trade",
	TextColor3 = THEME.text,
	TextSize = 13,
	Font = Enum.Font.GothamBold,
}).TextYAlignment = Enum.TextYAlignment.Bottom
Elem(TradeBtn, "TextLabel", {
	Size = UDim2.new(1, 0, 0.5, 0),
	Position = UDim2.new(0, 0, 0.5, 0),
	BackgroundTransparency = 1,
	Text = "Players",
	TextColor3 = THEME.textDim,
	TextSize = 10,
	Font = Enum.Font.Gotham,
}).TextYAlignment = Enum.TextYAlignment.Top
TradeBtn.MouseButton1Click:Connect(function()
	if TycoonClient.OpenTradeUI then
		TycoonClient.OpenTradeUI()
	end
	TycoonClient.UI_PlaySound("click")
end)

-- Currency display (centered)
local CurrencyFrame = Elem(Header, "Frame", {
	Name = "CurrencyFrame",
	Size = UDim2.new(0, 260, 1, 0),
	Position = UDim2.new(0.5, -130, 0, 0),
	BackgroundTransparency = 1,
})

local MoneyText = Elem(CurrencyFrame, "TextLabel", {
	Name = "Money",
	Size = UDim2.new(1, 0, 0.65, 0),
	Position = UDim2.new(0, 0, 0, 4),
	BackgroundTransparency = 1,
	Text = "$0",
	TextColor3 = THEME.accent,
	TextSize = 32,
	Font = Enum.Font.GothamBold,
	TextScaled = false,
})

local IncomeRateText = Elem(CurrencyFrame, "TextLabel", {
	Name = "IncomeRate",
	Size = UDim2.new(1, 0, 0.35, 0),
	Position = UDim2.new(0, 0, 0.65, 0),
	BackgroundTransparency = 1,
	Text = "$0/sec",
	TextColor3 = THEME.success,
	TextSize = 13,
	Font = Enum.Font.Gotham,
})

-- Prestige badge (right)
local PrestigeBtn = Elem(Header, "TextButton", {
	Name = "PrestigeBtn",
	Size = UDim2.new(0, 175, 0, 50),
	Position = UDim2.new(1, -185, 0.5, -25),
	BackgroundColor3 = THEME.prestige,
	Text = "",
})
Corner(PrestigeBtn, 8)
Stroke(PrestigeBtn, THEME.prestige, 2)

Elem(PrestigeBtn, "TextLabel", {
	Size = UDim2.new(1, 0, 0.5, 0),
	Position = UDim2.new(0, 0, 0, 0),
	BackgroundTransparency = 1,
	Text = "0 Star Tycoon",
	TextColor3 = THEME.text,
	TextSize = 12,
	Font = Enum.Font.GothamBold,
}).TextYAlignment = Enum.TextYAlignment.Bottom

Elem(PrestigeBtn, "TextLabel", {
	Name = "PP",
	Size = UDim2.new(1, 0, 0.5, 0),
	Position = UDim2.new(0, 0, 0.5, 0),
	BackgroundTransparency = 1,
	Text = "0 PP",
	TextColor3 = THEME.text,
	TextSize = 11,
	Font = Enum.Font.Gotham,
}).TextYAlignment = Enum.TextYAlignment.Top

------------------------------------------------------------
-- TAB NAVIGATION
------------------------------------------------------------

local TabFrame = Elem(ScreenGui, "Frame", {
	Name = "Tabs",
	Size = UDim2.new(0, 400, 0, 44),
	Position = UDim2.new(0.5, -200, 0, 74),
	BackgroundTransparency = 1,
})

local TAB_KEYS = { "businesses", "upgrades", "pets", "stats" }
local TabBtns = {}

for i, key in ipairs(TAB_KEYS) do
	local btn = Elem(TabFrame, "TextButton", {
		Name = "Tab_" .. key,
		Size = UDim2.new(1/#TAB_KEYS, -4, 1, 0),
		Position = UDim2.new((i-1)/#TAB_KEYS, 0, 0, 0),
		BackgroundColor3 = THEME.panel,
		AutoButtonColor = false,
		Text = key:sub(1,1):upper()..key:sub(2),
		TextColor3 = THEME.textDim,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
	})
	Corner(btn, 7)
	Stroke(btn, THEME.border, 1)
	TabBtns[key] = btn
end

------------------------------------------------------------
-- MAIN CONTENT AREA
------------------------------------------------------------

local ContentFrame = Elem(ScreenGui, "Frame", {
	Name = "Content",
	Size = UDim2.new(0, 420, 1, -140),
	Position = UDim2.new(0.5, -210, 0, 130),
	BackgroundColor3 = THEME.panel,
	BorderSizePixel = 0,
})
Corner(ContentFrame, 12)
Stroke(ContentFrame, THEME.border, 1)

local ScrollFrame = Elem(ContentFrame, "ScrollingFrame", {
	Size = UDim2.new(1, 0, 1, 0),
	BackgroundTransparency = 1,
	ScrollBarThickness = 5,
	CanvasSize = UDim2.new(0, 0, 0, 0),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
})
Elem(ScrollFrame, "UIListLayout", {
	SortOrder = Enum.SortOrder.LayoutOrder,
	Padding = UDim.new(0, 6),
})
Elem(ScrollFrame, "UIPadding", {
	PaddingTop = UDim.new(0, 8),
	PaddingBottom = UDim.new(0, 8),
	PaddingLeft = UDim.new(0, 8),
	PaddingRight = UDim.new(0, 8),
})

------------------------------------------------------------
-- BUSINESS CARD
------------------------------------------------------------

local CARD_H = 110

local function BusinessCard(business, index)
	local bizData = PlayerData.businesses[business.id] or { owned = 0, level = 1 }
	local owned = bizData.owned or 0
	local level = bizData.level or 1
	local isUnlocked = BusinessConfig.IsUnlocked(business, PlayerData.totalEarnedEver or 0)
	local cost = BusinessConfig.GetPurchaseCost(business.id, owned)
	local prestigeMult = 1 + (PlayerData.prestigeLevel or 0) * 0.10
	local income = BusinessConfig.GetIncome(business.id, level, owned, PlayerData.prestigeLevel or 0)

	local card = Elem(ScrollFrame, "Frame", {
		Name = "Biz_" .. business.id,
		Size = UDim2.new(1, 0, 0, CARD_H),
		BackgroundColor3 = THEME.bg,
		LayoutOrder = business.tier * 1000 + index,
	})
	Corner(card, 9)
	Stroke(card, isUnlocked and business.color or THEME.border, owned > 0 and 2 or 1)

	-- Left: Icon block
	local iconBlock = Elem(card, "Frame", {
		Size = UDim2.new(0, 64, 0, 64),
		Position = UDim2.new(0, 10, 0.5, -32),
		BackgroundColor3 = business.color:Lerp(THEME.bg, 0.4),
	})
	Corner(iconBlock, 8)
	Elem(iconBlock, "TextLabel", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 1,
		Text = owned > 0 and tostring(owned) or "🔒",
		TextColor3 = THEME.text,
		TextSize = owned > 0 and 26 or 22,
		Font = Enum.Font.GothamBold,
	})

	-- Name
	Elem(card, "TextLabel", {
		Size = UDim2.new(0, 190, 0, 20),
		Position = UDim2.new(0, 84, 0, 12),
		BackgroundTransparency = 1,
		Text = business.name,
		TextColor3 = THEME.text,
		TextSize = 14,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	-- Level badge
	if owned > 0 then
		local lvlBadge = Elem(card, "TextLabel", {
			Size = UDim2.new(0, 80, 0, 18),
			Position = UDim2.new(0, 84, 0, 34),
			BackgroundColor3 = THEME.success,
			BackgroundTransparency = 0.8,
			Text = "Lv." .. level,
			TextColor3 = THEME.text,
			TextSize = 11,
			Font = Enum.Font.GothamBold,
		})
		Corner(lvlBadge, 4)
	end

	-- Income
	Elem(card, "TextLabel", {
		Size = UDim2.new(0, 190, 0, 16),
		Position = UDim2.new(0, 84, 0, owned > 0 and 56 or 34),
		BackgroundTransparency = 1,
		Text = owned > 0 and "$" .. FmtMoney(income) .. "/tick" or "$" .. FmtMoney(business.baseIncome) .. "/tick",
		TextColor3 = owned > 0 and THEME.success or THEME.textDim,
		TextSize = 12,
		Font = Enum.Font.Gotham,
		TextXAlignment = Enum.TextXAlignment.Left,
	})

	-- Prestige multiplier badge
	if PlayerData.prestigeLevel > 0 then
		local pBadge = Elem(card, "TextLabel", {
			Size = UDim2.new(0, 90, 0, 16),
			Position = UDim2.new(0, 84, 0, owned > 0 and 74 or 52),
			BackgroundTransparency = 0.7,
			BackgroundColor3 = THEME.prestige,
			Text = "x" .. string.format("%.1f", prestigeMult) .. " prestige",
			TextColor3 = THEME.text,
			TextSize = 10,
			Font = Enum.Font.GothamBold,
		})
		Corner(pBadge, 4)
	end

	-- Buy button (right side)
	local buyBtn = Elem(card, "TextButton", {
		Size = UDim2.new(0, 100, 0, 44),
		Position = UDim2.new(1, -110, 0.5, -22),
		BackgroundColor3 = owned > 0 and THEME.accentDark or THEME.accent,
		Text = owned > 0 and "Buy" or "Buy",
		AutoButtonColor = false,
	})
	Corner(buyBtn, 7)

	local priceLabel = Elem(buyBtn, "TextLabel", {
		Size = UDim2.new(1, 0, 0.5, 0),
		Position = UDim2.new(0, 0, 0, owned > 0 and 10 or 0),
		BackgroundTransparency = 1,
		Text = "$" .. FmtMoney(cost),
		TextColor3 = THEME.text,
		TextSize = owned > 0 and 10 or 13,
		Font = Enum.Font.GothamBold,
	})

	-- Upgrade level button (if owned)
	if owned > 0 then
		local upgradeCost = math.floor(business.baseCost * 10 * (1.5 ^ level))
		local upgradeBtn = Elem(card, "TextButton", {
			Size = UDim2.new(0, 100, 0, 28),
			Position = UDim2.new(1, -110, 0.5, 18),
			BackgroundColor3 = THEME.panel,
			Text = "Level Up",
			AutoButtonColor = false,
		})
		Corner(upgradeBtn, 5)
		Stroke(upgradeBtn, THEME.border, 1)
		Elem(upgradeBtn, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 10),
			Position = UDim2.new(0, 0, 0, 0),
			BackgroundTransparency = 1,
			Text = "$" .. FmtMoney(upgradeCost),
			TextColor3 = THEME.textDim,
			TextSize = 9,
			Font = Enum.Font.Gotham,
		})

		upgradeBtn.MouseButton1Click:Connect(function()
			if PlayerData.money >= upgradeCost then
				TycoonClient.Events.PurchaseBusiness:FireServer(business.id)
				Pop(upgradeBtn)
				TycoonClient.UI_PlaySound("upgrade")
			end
		end)
	end

	buyBtn.MouseButton1Click:Connect(function()
		if PlayerData.money >= cost then
			TycoonClient.Events.PurchaseBusiness:FireServer(business.id)
			Pop(buyBtn)
			TycoonClient.UI_PlaySound("purchase")
		end
	end)

	-- Lock overlay
	if not isUnlocked then
		local lock = Elem(card, "Frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = THEME.bg,
			BackgroundTransparency = 0.4,
		})
		Corner(lock, 9)
		Elem(lock, "TextLabel", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundTransparency = 1,
			Text = "🔒 Earn $" .. FmtMoney(business.unlockRequirement) .. " to unlock",
			TextColor3 = THEME.textDim,
			TextSize = 12,
			Font = Enum.Font.Gotham,
		})
	end

	return card
end

------------------------------------------------------------
-- UPGRADE CARD
------------------------------------------------------------

local UPGRADE_CARD_H = 80

local function UpgradeCard(upgrade, index, isGlobal)
	local currentLevel = 0
	if isGlobal then
		currentLevel = (PlayerData.upgrades or {})[upgrade.id] or 0
	else
		-- Per-business upgrades are stored per business — show total levels owned
		for _, bizUpgrades in pairs(PlayerData.upgrades or {}) do
			if type(bizUpgrades) == "table" and bizUpgrades[upgrade.id] then
				currentLevel = currentLevel + bizUpgrades[upgrade.id]
			end
		end
	end

	local isMaxed = currentLevel >= upgrade.maxLevel
	local cost = UpgradeConfig.GetUpgradeCost(upgrade.id, nil, currentLevel)

	local card = Elem(ScrollFrame, "Frame", {
		Name = "Upg_" .. upgrade.id,
		Size = UDim2.new(1, 0, 0, UPGRADE_CARD_H),
		LayoutOrder = index + 100,
		BackgroundColor3 = THEME.bg,
	})
	Corner(card, 8)
	Stroke(card, isMaxed and THEME.success or THEME.border, 1)

	local typeColor = upgrade.type == "speed" and Color3.fromRGB(80, 200, 255)
		or upgrade.type == "value" and Color3.fromRGB(255, 200, 0)
		or THEME.accent

	-- Icon
	local icon = Elem(card, "Frame", {
		Size = UDim2.new(0, 56, 0, 56),
		Position = UDim2.new(0, 10, 0.5, -28),
		BackgroundColor3 = typeColor:Lerp(THEME.bg, 0.3),
	})
	Corner(icon, 7)
	Elem(icon, "TextLabel", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 1,
		Text = upgrade.name:sub(1, 3):upper(),
		TextColor3 = typeColor,
		TextSize = 14,
		Font = Enum.Font.GothamBold,
	})

	-- Name and level
	Elem(card, "TextLabel", {
		Size = UDim2.new(0, 200, 0, 18),
		Position = UDim2.new(0, 76, 0, 10),
		BackgroundTransparency = 1,
		Text = upgrade.name .. " (" .. currentLevel .. "/" .. upgrade.maxLevel .. ")",
		TextColor3 = THEME.text,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	-- Description
	Elem(card, "TextLabel", {
		Size = UDim2.new(0, 200, 0, 28),
		Position = UDim2.new(0, 76, 0, 30),
		BackgroundTransparency = 1,
		Text = upgrade.description,
		TextColor3 = THEME.textDim,
		TextSize = 11,
		Font = Enum.Font.Gotham,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextWrapped = true,
	})

	-- Buy button
	local buyBtn = Elem(card, "TextButton", {
		Size = UDim2.new(0, 85, 0, 40),
		Position = UDim2.new(1, -95, 0.5, -20),
		BackgroundColor3 = isMaxed and THEME.success or THEME.accent,
		Text = isMaxed and "MAX" or "$" .. FmtMoney(cost),
		AutoButtonColor = false,
	})
	Corner(buyBtn, 6)

	if not isMaxed then
		buyBtn.MouseButton1Click:Connect(function()
			if PlayerData.money >= cost then
				TycoonClient.Events.BuyUpgrade:FireServer(upgrade.id, nil)
				Pop(buyBtn)
				TycoonClient.UI_PlaySound("upgrade")
			end
		end)
	end

	return card
end

------------------------------------------------------------
-- STATS PANEL
------------------------------------------------------------

local STAT_ROW_H = 36

local function StatsPanel()
	local prestigeCheck = {
		canPrestige = (PlayerData.totalEarned or 0) >= 1e12,
		threshold = 1e12,
	}

	local function AddRow(name, value, y, color)
		local row = Elem(ScrollFrame, "Frame", {
			Size = UDim2.new(1, 0, 0, STAT_ROW_H),
			BackgroundColor3 = THEME.bg,
			LayoutOrder = 1000 + y,
		})
		Corner(row, 6)
		Stroke(row, THEME.border, 1)
		Elem(row, "TextLabel", {
			Size = UDim2.new(0.5, -8, 1, 0),
			Position = UDim2.new(0, 12, 0, 0),
			BackgroundTransparency = 1,
			Text = name,
			TextColor3 = THEME.textDim,
			TextSize = 13,
			Font = Enum.Font.Gotham,
			TextXAlignment = Enum.TextXAlignment.Left,
		})
		Elem(row, "TextLabel", {
			Size = Udim2.new(0.5, -12, 1, 0),
			Position = UDim2.new(0.5, 0, 0, 0),
			BackgroundTransparency = 1,
			Text = value,
			TextColor3 = color or THEME.text,
			TextSize = 14,
			Font = Enum.Font.GothamBold,
			TextXAlignment = Enum.TextXAlignment.Right,
		})
		return row
	end

	local y = 0
	AddRow("Money", "$" .. FmtMoney(PlayerData.money), y, THEME.accent); y = y + STAT_ROW_H + 2
	AddRow("Session Earned", "$" .. FmtMoney(PlayerData.totalEarned), y, THEME.success); y = y + STAT_ROW_H + 2
	AddRow("Lifetime Earned", "$" .. FmtMoney(PlayerData.totalEarnedEver), y); y = y + STAT_ROW_H + 2
	AddRow("Prestige Level", tostring(PlayerData.prestigeLevel) .. " Star Tycoon", y, THEME.prestige); y = y + STAT_ROW_H + 2
	AddRow("Prestige Points", tostring(PlayerData.prestigePoints), y, THEME.prestige); y = y + STAT_ROW_H + 2
	AddRow("Income Mult.", "x" .. string.format("%.2f", 1 + (PlayerData.prestigeLevel or 0) * 0.1), y, THEME.prestige); y = y + STAT_ROW_H + 2
	AddRow("Manager", "No", y); y = y + STAT_ROW_H + 2

	-- Prestige requirement progress
	local progressToPrestige = math.min(1, (PlayerData.totalEarned or 0) / 1e12)
	AddRow("→ Prestige ($1T)", string.format("%.2f%%", progressToPrestige * 100), y, progressToPrestige >= 1 and THEME.prestige or THEME.textDim); y = y + STAT_ROW_H + 2

	-- Prestige button
	local pBtn = Elem(ScrollFrame, "TextButton", {
		Size = UDim2.new(1, -16, 0, 54),
		Position = UDim2.new(0, 8, 0, y + 8),
		BackgroundColor3 = progressToPrestige >= 1 and THEME.prestige or THEME.panel,
		Text = progressToPrestige >= 1 and "✨ PRESTIGE NOW ✨" or ("Earn $1T to prestige (" .. string.format("%.1f%%", progressToPrestige * 100) .. ")"),
		TextColor3 = THEME.text,
		TextSize = 15,
		Font = Enum.Font.GothamBold,
		AutoButtonColor = false,
		LayoutOrder = 9999,
	})
	Corner(pBtn, 10)
	Stroke(pBtn, progressToPrestige >= 1 and THEME.prestige or THEME.border, 2)

	pBtn.MouseButton1Click:Connect(function()
		TycoonClient.Events.Prestige:FireServer()
		TycoonClient.UI_PlaySound("prestige")
	end)

	return pBtn
end

------------------------------------------------------------
-- CONTENT REFRESH
------------------------------------------------------------

------------------------------------------------------------
-- PET SHOP / OWNED PANEL
------------------------------------------------------------

-- Pet rarity badge colors
local RARITY_COLOR = {
	common   = Color3.fromRGB(180, 180, 180),
	rare     = Color3.fromRGB(65,  185, 255),
	epic     = Color3.fromRGB(200, 80,  255),
	legendary= Color3.fromRGB(255, 165, 0),
}

-- Pet type labels
local PET_TYPE_LABEL = {
	money    = "Income",
	speed    = "Speed",
	business = "Business",
	lucky    = "Luck",
	prestige = "Prestige",
}

local PET_CARD_H = 88

local function PetCard(pet, isOwned, level, index, layoutOrder)
	local playerPets = PlayerData.pets or {}
	local petInfo = playerPets[pet.id] or {}
	local owned = petInfo.owned or false
	local lvl = petInfo.level or 1
	local cost = PetCompanions.GetLevelUpCost(pet.id, lvl)
	local bonus = PetCompanions.GetPetBonus(pet.id, lvl)
	local canAfford = (PlayerData.money or 0) >= cost
	local maxLevel = pet.rarity.maxLevel
	local isMaxed = lvl >= maxLevel

	local rarityColor = RARITY_COLOR[pet.rarity.id] or THEME.border

	local card = Elem(ScrollFrame, "Frame", {
		Name = "Pet_" .. pet.id,
		Size = UDim2.new(1, 0, 0, PET_CARD_H),
		BackgroundColor3 = THEME.bg,
		LayoutOrder = layoutOrder,
	})
	Corner(card, 8)
	Stroke(card, owned and rarityColor or THEME.border, owned and 2 or 1)

	-- Pet icon (left)
	local iconBlock = Elem(card, "Frame", {
		Size = UDim2.new(0, 56, 0, 56),
		Position = UDim2.new(0, 10, 0.5, -28),
		BackgroundColor3 = rarityColor:Lerp(THEME.bg, 0.4),
	})
	Corner(iconBlock, 7)
	Elem(iconBlock, "ImageLabel", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 1,
		Image = pet.icon,
		ImageColor3 = THEME.text,
		ZIndex = 2,
	})
	-- Rarity shimmer overlay
	Elem(iconBlock, "TextLabel", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 0.7,
		BackgroundColor3 = rarityColor,
		Text = "",
	})

	-- Pet name
	Elem(card, "TextLabel", {
		Size = UDim2.new(0, 180, 0, 18),
		Position = UDim2.new(0, 76, 0, 10),
		BackgroundTransparency = 1,
		Text = pet.name,
		TextColor3 = rarityColor,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	-- Rarity badge
	local rarityBadge = Elem(card, "TextLabel", {
		Size = UDim2.new(0, 70, 0, 16),
		Position = UDim2.new(0, 76, 0, 30),
		BackgroundTransparency = 0.5,
		BackgroundColor3 = rarityColor,
		Text = pet.rarity.name,
		TextColor3 = THEME.text,
		TextSize = 10,
		Font = Enum.Font.GothamBold,
	})
	Corner(rarityBadge, 4)

	-- Type badge
	local typeColor = PetCompanions.PetTypes[pet.type] == PetCompanions.PetTypes.MONEY and THEME.accent
		or PetCompanions.PetTypes[pet.type] == PetCompanions.PetTypes.SPEED and Color3.fromRGB(80, 200, 255)
		or PetCompanions.PetTypes[pet.type] == PetCompanions.PetTypes.PRESTIGE and THEME.prestige
		or THEME.success

	local typeBadge = Elem(card, "TextLabel", {
		Size = UDim2.new(0, 72, 0, 16),
		Position = UDim2.new(0, 150, 0, 30),
		BackgroundTransparency = 0.6,
		BackgroundColor3 = typeColor,
		Text = PET_TYPE_LABEL[pet.type] or pet.type,
		TextColor3 = THEME.text,
		TextSize = 10,
		Font = Enum.Font.GothamBold,
	})
	Corner(typeBadge, 4)

	-- Level and bonus
	if owned then
		local lvlText = "Lv." .. lvl .. "/" .. maxLevel
		local bonusText = "+" .. string.format("%.1f%%", bonus * 100) .. " bonus"
		Elem(card, "TextLabel", {
			Size = UDim2.new(0, 120, 0, 14),
			Position = UDim2.new(0, 76, 0, 50),
			BackgroundTransparency = 1,
			Text = lvlText,
			TextColor3 = THEME.textDim,
			TextSize = 11,
			Font = Enum.Font.Gotham,
			TextXAlignment = Enum.TextXAlignment.Left,
		})
		Elem(card, "TextLabel", {
			Size = UDim2.new(0, 140, 0, 14),
			Position = UDim2.new(0, 76, 0, 64),
			BackgroundTransparency = 1,
			Text = bonusText,
			TextColor3 = THEME.success,
			TextSize = 11,
			Font = Enum.Font.GothamBold,
			TextXAlignment = Enum.TextXAlignment.Left,
		})
	else
		Elem(card, "TextLabel", {
			Size = UDim2.new(0, 120, 0, 14),
			Position = UDim2.new(0, 76, 0, 50),
			BackgroundTransparency = 1,
			Text = "Base: +" .. string.format("%.1f%%", pet.baseEffect * 100) .. " bonus",
			TextColor3 = THEME.textDim,
			TextSize = 11,
			Font = Enum.Font.Gotham,
			TextXAlignment = Enum.TextXAlignment.Left,
		})
	end

	-- Right side action
	if owned then
		-- Level-up button
		local levelUpBtn = Elem(card, "TextButton", {
			Size = UDim2.new(0, 95, 0, 40),
			Position = UDim2.new(1, -105, 0.5, -20),
			BackgroundColor3 = isMaxed and THEME.success or (canAfford and THEME.accent or THEME.panel),
			Text = isMaxed and "MAX" or "$" .. FmtMoney(cost),
			AutoButtonColor = false,
		})
		Corner(levelUpBtn, 6)
		if not isMaxed then
			Stroke(levelUpBtn, canAfford and THEME.accent or THEME.border, 1)
		end

		if not isMaxed then
			levelUpBtn.MouseButton1Click:Connect(function()
				if (PlayerData.money or 0) >= cost then
					TycoonClient.Events.LevelUpPet:FireServer(pet.id)
					Pop(levelUpBtn)
					TycoonClient.UI_PlaySound("upgrade")
				end
			end)
		end
	else
		-- Purchase button
		local purchaseCost = pet.baseCost * pet.rarity.costMult
		local canAffordBuy = (PlayerData.money or 0) >= purchaseCost
		local buyBtn = Elem(card, "TextButton", {
			Size = UDim2.new(0, 95, 0, 40),
			Position = UDim2.new(1, -105, 0.5, -20),
			BackgroundColor3 = canAffordBuy and THEME.accent or THEME.panel,
			Text = "$" .. FmtMoney(purchaseCost),
			AutoButtonColor = false,
		})
		Corner(buyBtn, 6)
		Stroke(buyBtn, canAffordBuy and THEME.accent or THEME.border, 1)

		buyBtn.MouseButton1Click:Connect(function()
			if (PlayerData.money or 0) >= purchaseCost then
				TycoonClient.Events.PurchasePet:FireServer(pet.id)
				Pop(buyBtn)
				TycoonClient.UI_PlaySound("purchase")
			end
		end)
	end

	return card
end

local function SynergySection()
	local SYNERGY_HEADER_H = 30
	local SYNERGY_ROW_H = 38
	local playerPets = PlayerData.pets or {}
	local bonuses = PetCompanions.CalcSynergyBonuses(playerPets)
	local hasAny = false

	-- Count how many synergies are active
	local activeCount = 0
	local activeSynergies = {}
	for _, syn in ipairs(PetCompanions.Synergies) do
		local typeCount = 0
		for petId, info in pairs(playerPets) do
			local def = PetCompanions.PetById[petId]
			if def and (info.owned or info.level > 0) and def.type == syn.type then
				typeCount = typeCount + 1
			end
		end
		if typeCount >= syn.minCount then
			activeCount = activeCount + 1
			activeSynergies[#activeSynergies + 1] = { syn = syn, count = typeCount }
			hasAny = true
		end
	end

	if not hasAny then return 0 end

	-- Section header
	local header = Elem(ScrollFrame, "Frame", {
		Name = "SynergyHeader",
		Size = UDim2.new(1, 0, 0, SYNERGY_HEADER_H),
		BackgroundColor3 = THEME.prestige:Lerp(THEME.bg, 0.3),
		LayoutOrder = 9000,
	})
	Corner(header, 6)
	Elem(header, "TextLabel", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 1,
		Text = "⭐ Synergy Bonuses",
		TextColor3 = THEME.prestige,
		TextSize = 12,
		Font = Enum.Font.GothamBold,
	})

	local yOff = SYNERGY_HEADER_H + 4

	for i, entry in ipairs(activeSynergies) do
		local syn = entry.syn
		local stacks = math.min(entry.count - syn.minCount + 1, syn.maxStacks)
		local totalBonus = syn.bonusValue + (stacks - 1) * syn.stackBonus
		local bonusDisplay = syn.bonusType == "luck_chance"
			and (string.format("%.0f%% chance", totalBonus * 100) .. " bonus income")
			or ("+" .. string.format("%.0f%%", totalBonus * 100) .. " " .. syn.bonusType:gsub("_", " "))

		local row = Elem(ScrollFrame, "Frame", {
			Name = "Syn_" .. syn.id,
			Size = UDim2.new(1, 0, 0, SYNERGY_ROW_H - 2),
			BackgroundColor3 = THEME.bg,
			LayoutOrder = 9000 + i,
		})
		Corner(row, 6)
		Stroke(row, THEME.prestige, 1)

		Elem(row, "TextLabel", {
			Size = UDim2.new(0, 160, 0, 16),
			Position = UDim2.new(0, 12, 0, 5),
			BackgroundTransparency = 1,
			Text = syn.name,
			TextColor3 = THEME.prestige,
			TextSize = 12,
			Font = Enum.Font.GothamBold,
			TextXAlignment = Enum.TextXAlignment.Left,
		})
		Elem(row, "TextLabel", {
			Size = UDim2.new(0, 140, 0, 14),
			Position = UDim2.new(0, 12, 0, 21),
			BackgroundTransparency = 1,
			Text = bonusDisplay,
			TextColor3 = THEME.success,
			TextSize = 11,
			Font = Enum.Font.GothamBold,
			TextXAlignment = Enum.TextXAlignment.Left,
		})
		Elem(row, "TextLabel", {
			Size = UDim2.new(0, 80, 0, 14),
			Position = UDim2.new(1, -92, 0, 12),
			BackgroundTransparency = 1,
			Text = "x" .. stacks .. " stacks",
			TextColor3 = THEME.textDim,
			TextSize = 11,
			Font = Enum.Font.Gotham,
			TextXAlignment = Enum.TextXAlignment.Right,
		})
	end

	return yOff + (#activeSynergies * (SYNERGY_ROW_H - 2)) + 6
end

local function OwnedPetsPanel()
	local playerPets = PlayerData.pets or {}
	local ownedPets = {}
	for petId, info in pairs(playerPets) do
		if info.owned or info.level > 0 then
			ownedPets[#ownedPets + 1] = { petId = petId, info = info }
		end
	end

	if #ownedPets == 0 then
		local empty = Elem(ScrollFrame, "Frame", {
			Name = "NoPets",
			Size = UDim2.new(1, 0, 0, 80),
			BackgroundColor3 = THEME.bg,
			LayoutOrder = 8000,
		})
		Corner(empty, 8)
		Elem(empty, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 26),
			Position = UDim2.new(0, 0, 0, 14),
			BackgroundTransparency = 1,
			Text = "No pets yet!",
			TextColor3 = THEME.textDim,
			TextSize = 15,
			Font = Enum.Font.GothamBold,
		})
		Elem(empty, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 18),
			Position = UDim2.new(0, 0, 0, 42),
			BackgroundTransparency = 1,
			Text = "Visit the Pet Shop to buy your first companion.",
			TextColor3 = THEME.textDim,
			TextSize = 11,
			Font = Enum.Font.Gotham,
		})
		return
	end

	-- Total pet bonus header
	local totalMult = PetCompanions.CalcPetIncomeMultiplier(playerPets)
	local bonusHeader = Elem(ScrollFrame, "Frame", {
		Name = "BonusHeader",
		Size = UDim2.new(1, 0, 0, 52),
		BackgroundColor3 = THEME.accent:Lerp(THEME.bg, 0.3),
		LayoutOrder = 7000,
	})
	Corner(bonusHeader, 8)
	Stroke(bonusHeader, THEME.accent, 1)
	Elem(bonusHeader, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 20),
		Position = UDim2.new(0, 0, 0, 6),
		BackgroundTransparency = 1,
		Text = "Total Pet Bonus",
		TextColor3 = THEME.textDim,
		TextSize = 11,
		Font = Enum.Font.Gotham,
	})
	Elem(bonusHeader, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 22),
		Position = UDim2.new(0, 0, 0, 24),
		BackgroundTransparency = 1,
		Text = "x" .. string.format("%.3f", totalMult) .. " income multiplier",
		TextColor3 = THEME.accent,
		TextSize = 16,
		Font = Enum.Font.GothamBold,
	})

	for i, entry in ipairs(ownedPets) do
		local petDef = PetCompanions.PetById[entry.petId]
		if petDef then
			PetCard(petDef, entry.info.owned, entry.info.level or 1, i, 7000 + i)
		end
	end

	SynergySection()
end

local PET_SUB_TABS = { "shop", "owned" }
local PetSubTabBtns = {}

local function BuildPetsSubToggle()
	-- Small toggle inside the scroll area
	local container = Elem(ScrollFrame, "Frame", {
		Name = "PetSubToggle",
		Size = UDim2.new(1, -16, 0, 38),
		BackgroundTransparency = 1,
		LayoutOrder = 0,
	})

	local pillBg = Elem(container, "Frame", {
		Name = "PillBg",
		Size = UDim2.new(0, 240, 0, 30),
		Position = UDim2.new(0.5, -120, 0.5, -15),
		BackgroundColor3 = THEME.bg,
	})
	Corner(pillBg, 15)
	Stroke(pillBg, THEME.border, 1)

	for i, key in ipairs(PET_SUB_TABS) do
		local btn = Elem(pillBg, "TextButton", {
			Name = "SubTab_" .. key,
			Size = UDim2.new(0.5, 0, 1, 0),
			Position = UDim2.new((i-1) * 0.5, 0, 0, 0),
			BackgroundTransparency = key == SelectedPetTab and 0 or 1,
			BackgroundColor3 = key == SelectedPetTab and THEME.accent or Color3.fromRGB(0,0,0),
			Text = key:sub(1,1):upper()..key:sub(2),
			TextColor3 = THEME.text,
			TextSize = 12,
			Font = Enum.Font.GothamBold,
			AutoButtonColor = false,
		})
		Corner(btn, 14)

		btn.MouseButton1Click:Connect(function()
			SelectedPetTab = key
			RefreshContent()
			TycoonClient.UI_PlaySound("click")
		end)
		PetSubTabBtns[key] = btn
	end
end

local function RefreshPetsSubToggle()
	for _, key in ipairs(PET_SUB_TABS) do
		local btn = PetSubTabBtns[key]
		if btn then
			btn.BackgroundTransparency = key == SelectedPetTab and 0 or 1
		end
	end
end

local function PetShopPanel()
	-- Rarity group order
	local rarityOrder = { "common", "rare", "epic", "legendary" }
	local layoutOrder = 1000

	for _, rarityId in ipairs(rarityOrder) do
		local petsInRarity = {}
		for _, pet in ipairs(PetCompanions.Pets) do
			if pet.rarity.id == rarityId then
				petsInRarity[#petsInRarity + 1] = pet
			end
		end

		if #petsInRarity > 0 then
			local rarityColor = RARITY_COLOR[rarityId]
			local rarityDef = PetCompanions.Rarities[rarityId:upper()]

			-- Rarity section header
			local hdr = Elem(ScrollFrame, "Frame", {
				Name = "Header_" .. rarityId,
				Size = UDim2.new(1, 0, 0, 28),
				BackgroundColor3 = rarityColor:Lerp(THEME.bg, 0.3),
				LayoutOrder = layoutOrder; layoutOrder = layoutOrder + 1,
			})
			Corner(hdr, 5)
			Elem(hdr, "TextLabel", {
				Size = UDim2.new(1, 0, 1, 0),
				BackgroundTransparency = 1,
				Text = rarityDef.name .. " Pets",
				TextColor3 = rarityColor,
				TextSize = 12,
				Font = Enum.Font.GothamBold,
			})

			for j, pet in ipairs(petsInRarity) do
				local playerPets = PlayerData.pets or {}
				local info = playerPets[pet.id] or {}
				local owned = info.owned or false
				PetCard(pet, owned, info.level or 1, j, layoutOrder)
				layoutOrder = layoutOrder + 1
			end
		end
	end
end

------------------------------------------------------------
-- CONTENT REFRESH
------------------------------------------------------------

local function ClearContent()
	for _, child in ipairs(ScrollFrame:GetChildren()) do
		if child:IsA("Frame") then child:Destroy() end
	end
end

local function RefreshContent()
	ClearContent()

	if SelectedTab == "businesses" then
		for i, biz in ipairs(BusinessConfig.Businesses) do
			BusinessCard(biz, i)
		end

	elseif SelectedTab == "upgrades" then
		-- Business upgrades
		local i = 1
		for _, upgrade in ipairs(UpgradeConfig.BusinessUpgrades) do
			UpgradeCard(upgrade, i, false)
			i = i + 1
		end
		-- Global upgrades
		for _, upgrade in ipairs(UpgradeConfig.GlobalUpgrades) do
			UpgradeCard(upgrade, i, true)
			i = i + 1
		end

	elseif SelectedTab == "stats" then
		StatsPanel()
	elseif SelectedTab == "pets" then
		BuildPetsSubToggle()
		if SelectedPetTab == "shop" then
			PetShopPanel()
		else
			OwnedPetsPanel()
		end
	end
end

------------------------------------------------------------
-- UI UPDATE
------------------------------------------------------------

local function UpdateUI()
	MoneyText.Text = "$" .. FmtMoney(PlayerData.money)

	-- Compute income/sec client-side (IncomeService is server-only)
	local baseIncomePerSec = 0
	local petMult = PetCompanions.CalcPetIncomeMultiplier(PlayerData.pets or {})
	local prestigeMult = 1 + ((PlayerData.prestigeLevel or 0) * 0.10)
	for bizId, bizData in pairs(PlayerData.businesses or {}) do
		local biz = BusinessConfig.BusinessById[bizId]
		if biz and (bizData.owned or 0) > 0 then
			local lvl = bizData.level or 1
			local owned = bizData.owned or 0
			local tickIncome = biz.baseIncome * owned * (1 + 0.25 * (lvl - 1))
			local ticksPerSec = 1 / (biz.tickRate or 1)
			baseIncomePerSec = baseIncomePerSec + tickIncome * ticksPerSec
		end
	end
	local totalPerSec = baseIncomePerSec * petMult * prestigeMult
	IncomeRateText.Text = "$" .. FmtMoney(totalPerSec) .. "/sec"

	local tierName = "New Tycoon"
	if PlayerData.prestigeLevel >= 5 then tierName = "Diamond Tycoon"
	elseif PlayerData.prestigeLevel >= 4 then tierName = "Platinum Tycoon"
	elseif PlayerData.prestigeLevel >= 3 then tierName = "Gold Tycoon"
	elseif PlayerData.prestigeLevel >= 2 then tierName = "Silver Tycoon"
	elseif PlayerData.prestigeLevel >= 1 then tierName = "Bronze Tycoon"
	end

	PrestigeBtn:FindFirstChild("TextLabel").Text = tierName
	PrestigeBtn:FindFirstChild("PP").Text = FmtMoney(PlayerData.prestigePoints) .. " PP"

	for key, btn in pairs(TabBtns) do
		btn.BackgroundColor3 = key == SelectedTab and THEME.accentDark or THEME.panel
		btn.TextColor3 = key == SelectedTab and THEME.text or THEME.textDim
	end

	RefreshContent()
end

-- IncomeService is server-only; income/sec is calculated client-side in UpdateUI()

------------------------------------------------------------
-- EVENT BINDINGS
------------------------------------------------------------

for key, btn in pairs(TabBtns) do
	btn.MouseButton1Click:Connect(function()
		SelectedTab = key
		UpdateUI()
		TycoonClient.UI_PlaySound("click")
	end)
end

PrestigeBtn.MouseButton1Click:Connect(function()
	SelectedTab = "stats"
	UpdateUI()
end)

TycoonClient.ListenForDataUpdates(function(data)
	local old = PlayerData.money or 0
	PlayerData = data
	if data.money > old then
		TycoonClient.UI_MoneyFlash(MoneyText, old, data.money)
	end
	UpdateUI()
end)

TycoonClient.ListenForOfflineEarnings(function(amount)
	local modal = Elem(ScreenGui, "Frame", {
		Size = UDim2.new(0, 380, 0, 150),
		Position = UDim2.new(0.5, -190, 0.5, -75),
		BackgroundColor3 = THEME.panel,
		ZIndex = 10,
	})
	Corner(modal, 14)
	Stroke(modal, THEME.success, 2)

	Elem(modal, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 36),
		Position = UDim2.new(0, 0, 0, 14),
		BackgroundTransparency = 1,
		Text = "Welcome Back!",
		TextColor3 = THEME.success,
		TextSize = 24,
		Font = Enum.Font.GothamBold,
	})
	Elem(modal, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 22),
		Position = UDim2.new(0, 0, 0, 52),
		BackgroundTransparency = 1,
		Text = "You earned while away:",
		TextColor3 = THEME.textDim,
		TextSize = 13,
		Font = Enum.Font.Gotham,
	})
	Elem(modal, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 40),
		Position = UDim2.new(0, 0, 0, 76),
		BackgroundTransparency = 1,
		Text = "$" .. FmtMoney(amount),
		TextColor3 = THEME.accent,
		TextSize = 30,
		Font = Enum.Font.GothamBold,
	})

	local ok = Elem(modal, "TextButton", {
		Size = UDim2.new(0.5, -16, 0, 36),
		Position = UDim2.new(0.25, 8, 1, -46),
		BackgroundColor3 = THEME.accent,
		Text = "Collect",
		TextColor3 = THEME.text,
		TextSize = 14,
		Font = Enum.Font.GothamBold,
		AutoButtonColor = false,
		ZIndex = 11,
	})
	Corner(ok, 8)
	ok.MouseButton1Click:Connect(function() modal:Destroy() end)
	task.delay(10, function() if modal.Parent then modal:Destroy() end end)
end)

UpdateUI()
print("[TycoonUI] Initialized")
