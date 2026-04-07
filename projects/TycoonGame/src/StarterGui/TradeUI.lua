--[[
	TradeUI.lua
	Player-to-player trading screen for Tycoon Game v2 (TKPA-5510).

	Features:
	- Trade screen: select player, build offer, send trade request
	- Offer builder: currency slider, pet selection, item selection
	- Pending trades panel: accept, decline, cancel
	- Trade history: completed trades list
	- Toast notifications for incoming offers

	Integration:
	- Opens via "Trade" button in TycoonUI header
	- Uses TradingService for HTTP API calls
	- Uses TycoonRemotes for server → client push events
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

local TradingService = require(ReplicatedStorage.Modules.TradingService)
local TycoonClient = require(ReplicatedStorage.Modules.TycoonClient)

-- ── Theme (matches TycoonUI) ────────────────────────────────────────────────────

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
	trade = Color3.fromRGB(80, 180, 255),
}

-- ── Remote References ──────────────────────────────────────────────────────────

local R = {
	CreateTrade        = ReplicatedStorage:WaitForChild("CreateTrade"),
	AcceptTrade        = ReplicatedStorage:WaitForChild("AcceptTrade"),
	DeclineTrade       = ReplicatedStorage:WaitForChild("DeclineTrade"),
	CancelTrade        = ReplicatedStorage:WaitForChild("CancelTrade"),
	FetchTrades        = ReplicatedStorage:WaitForChild("FetchTrades"),
	FetchTradeHistory  = ReplicatedStorage:WaitForChild("FetchTradeHistory"),
	TradeOfferReceived = ReplicatedStorage:WaitForChild("TradeOfferReceived"),
	TradeUpdated       = ReplicatedStorage:WaitForChild("TradeUpdated"),
	TradeError         = ReplicatedStorage:WaitForChild("TradeError"),
	TradesFetched      = ReplicatedStorage:WaitForChild("TradesFetched"),
	TradeHistoryFetched= ReplicatedStorage:WaitForChild("TradeHistoryFetched"),
}

-- ── GUI Helpers ───────────────────────────────────────────────────────────────

local function Elem(parent, class, props)
	local obj = Instance.new(class)
	for k, v in pairs(props or {}) do
		if k ~= "Parent" then pcall(function() obj[k] = v end) end
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
		Size = UDim2.new(orig.X.Scale * 1.1, orig.X.Offset, orig.Y.Scale * 1.1, orig.Y.Offset)
	}):Play()
	task.delay(0.12, function()
		TweenService:Create(frame, TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Size = orig }):Play()
	end)
end

local function SlideIn(frame, fromRight)
	local targetPos = frame.Position
	local startPos = UDim2.new(fromRight and 1 + 0.02 or -0.02, 0, targetPos.Y.Scale, targetPos.Y.Offset)
	frame.Position = startPos
	frame.BackgroundTransparency = 1
	local tween = TweenService:Create(frame, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
		Position = targetPos,
		BackgroundTransparency = 0,
	})
	tween:Play()
	return tween
end

local function SlideOut(frame, fromRight)
	local targetPos = UDim2.new(fromRight and 1 + 0.02 or -0.02, 0, frame.Position.Y.Scale, frame.Position.Y.Offset)
	local tween = TweenService:Create(frame, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		Position = targetPos,
		BackgroundTransparency = 1,
	})
	tween:Play()
	tween.Completed:Connect(function() frame:Destroy() end)
end

-- ── State ─────────────────────────────────────────────────────────────────────

local myUserId = tostring(Player.UserId)
local myPlayerName = Player.Name

local SelectedTradePartner = nil  -- { userId, name }
local MyOffer = { currency = 0, pet_instance_ids = {}, item_ids = {} }
local TheirOffer = { currency = 0, pet_instance_ids = {}, item_ids = {} }

local PendingTrades = {}      -- list of TradeOfferResponse
local TradeHistoryList = {}   -- list of TradeTransactionResponse
local IncomingToasts = {}     -- toast queue

local SelectedSubTab = "trades"  -- "trades" | "history"
local IsCreatingTrade = false   -- whether create-trade panel is open

-- ── Main ScreenGui ────────────────────────────────────────────────────────────

local ScreenGui = Elem(PlayerGui, "ScreenGui", {
	Name = "TradeUI",
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	ResetOnSpawn = false,
	Enabled = false,
})
ScreenGui.Enabled = false

-- Overlay backdrop
local Backdrop = Elem(ScreenGui, "Frame", {
	Name = "Backdrop",
	Size = UDim2.new(1, 0, 1, 0),
	BackgroundColor3 = Color3.fromRGB(0, 0, 0),
	BackgroundTransparency = 0.5,
	BorderSizePixel = 0,
})

-- ── Main Panel ────────────────────────────────────────────────────────────────

local MainPanel = Elem(ScreenGui, "Frame", {
	Name = "MainPanel",
	Size = UDim2.new(0, 480, 0, 620),
	Position = UDim2.new(0.5, -240, 0.5, -310),
	BackgroundColor3 = THEME.panel,
	BorderSizePixel = 0,
})
Corner(MainPanel, 14)
Stroke(MainPanel, THEME.border, 1)
SlideIn(MainPanel, true)

-- Header
local Header = Elem(MainPanel, "Frame", {
	Name = "Header",
	Size = UDim2.new(1, 0, 0, 54),
	BackgroundColor3 = THEME.bg,
	BorderSizePixel = 0,
})
Corner(Header, 14)
-- Cover bottom corners
local headerCover = Elem(Header, "Frame", {
	Size = UDim2.new(1, 0, 0, 14),
	Position = UDim2.new(0, 0, 1, -14),
	BackgroundColor3 = THEME.bg,
	BorderSizePixel = 0,
	ZIndex = 0,
})
headerCover.Parent = Header

Elem(Header, "TextLabel", {
	Size = UDim2.new(1, -160, 1, 0),
	Position = UDim2.new(0, 16, 0, 0),
	BackgroundTransparency = 1,
	Text = "Trade",
	TextColor3 = THEME.trade,
	TextSize = 22,
	Font = Enum.Font.GothamBold,
	TextXAlignment = Enum.TextXAlignment.Left,
})

local NewTradeBtn = Elem(Header, "TextButton", {
	Size = UDim2.new(0, 90, 0, 30),
	Position = UDim2.new(1, -200, 0.5, -15),
	BackgroundColor3 = THEME.trade,
	Text = "+ New Trade",
	TextColor3 = THEME.text,
	TextSize = 12,
	Font = Enum.Font.GothamBold,
	AutoButtonColor = false,
})
Corner(NewTradeBtn, 6)

local CloseBtn = Elem(Header, "TextButton", {
	Size = UDim2.new(0, 36, 0, 36),
	Position = UDim2.new(1, -46, 0.5, -18),
	BackgroundColor3 = THEME.danger,
	Text = "X",
	TextColor3 = THEME.text,
	TextSize = 16,
	Font = Enum.Font.GothamBold,
	AutoButtonColor = false,
})
Corner(CloseBtn, 8)

-- Sub-tabs
local SubTabFrame = Elem(MainPanel, "Frame", {
	Name = "SubTabs",
	Size = UDim2.new(1, -32, 0, 38),
	Position = UDim2.new(0, 16, 0, 60),
	BackgroundTransparency = 1,
})

local SUB_TABS = { "trades", "history" }
local SubTabBtns = {}
for i, key in ipairs(SUB_TABS) do
	local btn = Elem(SubTabFrame, "TextButton", {
		Name = "Tab_" .. key,
		Size = UDim2.new(0.5, -4, 1, 0),
		Position = UDim2.new((i-1) * 0.5, (i-1) * 4, 0, 0),
		BackgroundColor3 = THEME.bg,
		AutoButtonColor = false,
		Text = key:sub(1,1):upper()..key:sub(2),
		TextColor3 = THEME.textDim,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
	})
	Corner(btn, 8)
	SubTabBtns[key] = btn
end

-- Content area
local ContentFrame = Elem(MainPanel, "Frame", {
	Name = "Content",
	Size = UDim2.new(1, -32, 1, -110),
	Position = UDim2.new(0, 16, 0, 104),
	BackgroundTransparency = 1,
})

-- ── Create Trade Panel ─────────────────────────────────────────────────────────

local CreateScrollFrame = Elem(ContentFrame, "ScrollingFrame", {
	Name = "CreateScroll",
	Size = UDim2.new(1, 0, 1, 0),
	BackgroundTransparency = 1,
	ScrollBarThickness = 5,
	CanvasSize = UDim2.new(0, 0, 0, 0),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ZIndex = 5,
})
CreateScrollFrame.Visible = false
Elem(CreateScrollFrame, "UIListLayout", {
	SortOrder = Enum.SortOrder.LayoutOrder,
	Padding = UDim.new(0, 8),
})

local function ShowCreateTradePanel()
	IsCreatingTrade = true
	CreateScrollFrame.Visible = true
	ScrollFrame.Visible = false
	-- Refresh player list
	BuildPlayerSelector()
end

local function HideCreateTradePanel()
	IsCreatingTrade = false
	CreateScrollFrame.Visible = false
	ScrollFrame.Visible = true
	SelectedTradePartner = nil
	MyOffer = { currency = 0, pet_instance_ids = {}, item_ids = {} }
end

-- Player selector state
local SelectedPlayerBtn = nil

local function BuildPlayerSelector()
	for _, child in ipairs(CreateScrollFrame:GetChildren()) do
		if child:IsA("Frame") then child:Destroy() end
	end

	-- Header
	local hdr = Elem(CreateScrollFrame, "Frame", {
		Name = "CreateHdr",
		Size = UDim2.new(1, 0, 0, 32),
		BackgroundColor3 = THEME.trade:Lerp(THEME.bg, 0.3),
		LayoutOrder = 0,
	})
	Corner(hdr, 6)
	Elem(hdr, "TextLabel", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 1,
		Text = "Select Trade Partner",
		TextColor3 = THEME.trade,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
	})

	-- List of other players in game
	local otherPlayers = {}
	for _, p in ipairs(Players:GetPlayers()) do
		if tostring(p.UserId) ~= myUserId then
			table.insert(otherPlayers, p)
		end
	end

	if #otherPlayers == 0 then
		local empty = Elem(CreateScrollFrame, "Frame", {
			Name = "NoPlayers",
			Size = UDim2.new(1, 0, 0, 60),
			BackgroundColor3 = THEME.bg,
			LayoutOrder = 1,
		})
		Corner(empty, 8)
		Elem(empty, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 20),
			Position = UDim2.new(0, 0, 0, 12),
			BackgroundTransparency = 1,
			Text = "No other players in game",
			TextColor3 = THEME.textDim,
			TextSize = 12,
			Font = Enum.Font.Gotham,
		})
		Elem(empty, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 14),
			Position = UDim2.new(0, 0, 0, 34),
			BackgroundTransparency = 1,
			Text = "Invite a friend to trade!",
			TextColor3 = THEME.textDim,
			TextSize = 10,
			Font = Enum.Font.Gotham,
		})
	else
		for i, p in ipairs(otherPlayers) do
			local btn = Elem(CreateScrollFrame, "TextButton", {
				Name = "Player_" .. p.UserId,
				Size = UDim2.new(1, 0, 0, 44),
				BackgroundColor3 = THEME.bg,
				AutoButtonColor = false,
				LayoutOrder = 1 + i,
			})
			Corner(btn, 8)
			Stroke(btn, THEME.border, 1)

			local iconBlock = Elem(btn, "Frame", {
				Size = UDim2.new(0, 36, 0, 36),
				Position = UDim2.new(0, 6, 0.5, -18),
				BackgroundColor3 = THEME.panel,
			})
			Corner(iconBlock, 6)
			Elem(iconBlock, "TextLabel", {
				Size = UDim2.new(1, 0, 1, 0),
				BackgroundTransparency = 1,
				Text = p.Name:sub(1, 2):upper(),
				TextColor3 = THEME.trade,
				TextSize = 13,
				Font = Enum.Font.GothamBold,
			})

			Elem(btn, "TextLabel", {
				Size = UDim2.new(1, -56, 0, 20),
				Position = UDim2.new(0, 50, 0, 6),
				BackgroundTransparency = 1,
				Text = p.Name,
				TextColor3 = THEME.text,
				TextSize = 13,
				Font = Enum.Font.GothamBold,
				TextXAlignment = Enum.TextXAlignment.Left,
				TextTruncate = Enum.TextTruncate.AtEnd,
			})
			Elem(btn, "TextLabel", {
				Size = UDim2.new(1, -56, 0, 14),
				Position = UDim2.new(0, 50, 0, 26),
				BackgroundTransparency = 1,
				Text = "Tap to select",
				TextColor3 = THEME.textDim,
				TextSize = 10,
				Font = Enum.Font.Gotham,
				TextXAlignment = Enum.TextXAlignment.Left,
			})

			btn.MouseButton1Click:Connect(function()
				-- Deselect previous
				if SelectedPlayerBtn then
					SelectedPlayerBtn.BackgroundColor3 = THEME.bg
					SelectedPlayerBtn:FindFirstChildOfClass("UIStroke").Color = THEME.border
				end
				SelectedPlayerBtn = btn
				SelectedPlayerBtn.BackgroundColor3 = THEME.trade:Lerp(THEME.bg, 0.7)
				btn:FindFirstChildOfClass("UIStroke").Color = THEME.trade
				SelectedTradePartner = { userId = tostring(p.UserId), name = p.Name }
				Pop(btn)
				TycoonClient.UI_PlaySound("click")
				-- Move to offer builder
				task.delay(0.15, BuildOfferBuilder)
			end)
		end
	end
end

-- ── Offer Builder ──────────────────────────────────────────────────────────────

local MAX_CURRENCY_DISPLAY = 1e15

local function CurrencyInputRow(currency, onChange)
	local row = Elem(CreateScrollFrame, "Frame", {
		Name = "CurrencyRow",
		Size = UDim2.new(1, 0, 0, 60),
		BackgroundColor3 = THEME.bg,
		LayoutOrder = 100,
	})
	Corner(row, 8)
	Stroke(row, THEME.border, 1)

	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 80, 0, 16),
		Position = UDim2.new(0, 12, 0, 8),
		BackgroundTransparency = 1,
		Text = "Cash Offered",
		TextColor3 = THEME.text,
		TextSize = 12,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
	})

	-- Currency amount display
	local amountLabel = Elem(row, "TextLabel", {
		Size = UDim2.new(0, 140, 0, 22),
		Position = UDim2.new(0, 12, 0, 28),
		BackgroundTransparency = 1,
		Text = "$" .. FmtMoney(currency),
		TextColor3 = THEME.accent,
		TextSize = 16,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
	})

	-- Slider
	local sliderBg = Elem(row, "Frame", {
		Size = UDim2.new(1, -170, 0, 8),
		Position = UDim2.new(0, 160, 0.5, -4),
		BackgroundColor3 = THEME.panel,
	})
	Corner(sliderBg, 4)

	local fill = Elem(sliderBg, "Frame", {
		Size = UDim2.new(0.5, 0, 1, 0),
		BackgroundColor3 = THEME.accent,
	})
	Corner(fill, 4)

	-- Slider buttons: -$1K, -$10K, +$1K, +$10K
	local function AddSliderBtn(parent, offsetX, label, delta)
		local btn = Elem(parent, "TextButton", {
			Size = UDim2.new(0, 34, 0, 28),
			Position = UDim2.new(1, offsetX, 0.5, -14),
			BackgroundColor3 = THEME.panel,
			Text = label,
			TextColor3 = THEME.text,
			TextSize = 9,
			Font = Enum.Font.GothamBold,
			AutoButtonColor = false,
			ZIndex = 6,
		})
		Corner(btn, 4)
		Stroke(btn, THEME.border, 1)
		btn.MouseButton1Click:Connect(function()
			local newVal = math.max(0, math.min(MAX_CURRENCY_DISPLAY, currency + delta))
			if newVal ~= currency then
				currency = newVal
				amountLabel.Text = "$" .. FmtMoney(currency)
				fill.Size = UDim2.new(currency > 0 and math.min(1, currency / MAX_CURRENCY_DISPLAY) or 0, 0, 1, 0)
				if onChange then onChange(currency) end
				Pop(btn)
			end
		end)
	end

	AddSliderBtn(row, -148, "-10K", -10000)
	AddSliderBtn(row, -110, "-1K", -1000)
	AddSliderBtn(row, 6, "+1K", 1000)
	AddSliderBtn(row, 44, "+10K", 10000)

	return row, function(newCurrency)
		currency = newCurrency
		amountLabel.Text = "$" .. FmtMoney(currency)
		fill.Size = UDim2.new(currency > 0 and math.min(1, currency / MAX_CURRENCY_DISPLAY) or 0, 0, 1, 0)
	end
end

local SelectedPetsForTrade = {}  -- set of pet instance ids

local function BuildOfferBuilder()
	if not SelectedTradePartner then return end

	for _, child in ipairs(CreateScrollFrame:GetChildren()) do
		if child:IsA("Frame") then child:Destroy() end
	end

	-- Partner header
	local partnerHdr = Elem(CreateScrollFrame, "Frame", {
		Name = "PartnerHdr",
		Size = UDim2.new(1, 0, 0, 44),
		BackgroundColor3 = THEME.trade:Lerp(THEME.bg, 0.3),
		LayoutOrder = 0,
	})
	Corner(partnerHdr, 8)
	Stroke(partnerHdr, THEME.trade, 1)
	Elem(partnerHdr, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 18),
		Position = UDim2.new(0, 12, 0, 6),
		BackgroundTransparency = 1,
		Text = "Trading with:",
		TextColor3 = THEME.textDim,
		TextSize = 10,
		Font = Enum.Font.Gotham,
		TextXAlignment = Enum.TextXAlignment.Left,
	})
	Elem(partnerHdr, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 18),
		Position = UDim2.new(0, 12, 0, 22),
		BackgroundTransparency = 1,
		Text = SelectedTradePartner.name,
		TextColor3 = THEME.trade,
		TextSize = 14,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
	})

	-- Your offer label
	Elem(CreateScrollFrame, "TextLabel", {
		Name = "YourOfferLabel",
		Size = UDim2.new(1, 0, 0, 22),
		BackgroundTransparency = 1,
		Text = "Your Offer",
		TextColor3 = THEME.accent,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
		LayoutOrder = 10,
	})

	-- Currency slider
	local _, setCurrency = CurrencyInputRow(MyOffer.currency, function(newVal)
		MyOffer.currency = newVal
	end)
	setCurrency(MyOffer.currency)

	-- Pets section
	local petsHdr = Elem(CreateScrollFrame, "Frame", {
		Name = "PetsHdr",
		Size = UDim2.new(1, 0, 0, 26),
		BackgroundColor3 = THEME.bg,
		LayoutOrder = 102,
	})
	Corner(petsHdr, 6)
	Elem(petsHdr, "TextLabel", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 1,
		Text = "Select Pets to Trade",
		TextColor3 = THEME.text,
		TextSize = 12,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	-- Pet list placeholder (fetched from TycoonData)
	local TycoonData = nil
	pcall(function() TycoonData = require(ReplicatedStorage.Modules.TycoonData) end)
	local playerPets = {}
	if TycoonData and TycoonData.GetPlayerPets then
		playerPets = TycoonData.GetPlayerPets(Player) or {}
	end

	local petLayoutOrder = 103
	local function RefreshPetList()
		for _, child in ipairs(CreateScrollFrame:GetChildren()) do
			if child.Name == "PetTradeRow" then child:Destroy() end
		end
		local idx = 103
		for petId, petInfo in pairs(playerPets) do
			if petInfo.owned then
				local isSelected = SelectedPetsForTrade[petId] == true
				local petCard = Elem(CreateScrollFrame, "Frame", {
					Name = "PetTradeRow",
					Size = UDim2.new(1, 0, 0, 50),
					BackgroundColor3 = isSelected and THEME.accent:Lerp(THEME.bg, 0.6) or THEME.bg,
					LayoutOrder = idx,
				})
				Corner(petCard, 8)
				Stroke(petCard, isSelected and THEME.accent or THEME.border, isSelected and 2 or 1)

				local petDef = nil
				pcall(function()
					local PetCompanions = require(ReplicatedStorage.Modules.PetCompanions)
					petDef = PetCompanions.PetById[petId]
				end)
				local petName = petDef and petDef.name or petId
				local rarityColor = THEME.textDim
				if petDef and petDef.rarity then
					local rarityId = petDef.rarity.id
					rarityColor = rarityId == "legendary" and Color3.fromRGB(255,165,0)
						or rarityId == "epic" and Color3.fromRGB(200,80,255)
						or rarityId == "rare" and Color3.fromRGB(65,185,255)
						or Color3.fromRGB(180,180,180)
				end

				Elem(petCard, "TextLabel", {
					Size = UDim2.new(0, 120, 0, 18),
					Position = UDim2.new(0, 10, 0, 8),
					BackgroundTransparency = 1,
					Text = petName,
					TextColor3 = rarityColor,
					TextSize = 12,
					Font = Enum.Font.GothamBold,
					TextXAlignment = Enum.TextXAlignment.Left,
					TextTruncate = Enum.TextTruncate.AtEnd,
				})

				local lvlText = "Lv." .. (petInfo.level or 1)
				Elem(petCard, "TextLabel", {
					Size = UDim2.new(0, 60, 0, 14),
					Position = UDim2.new(0, 10, 0, 28),
					BackgroundTransparency = 1,
					Text = lvlText,
					TextColor3 = THEME.textDim,
					TextSize = 10,
					Font = Enum.Font.Gotham,
					TextXAlignment = Enum.TextXAlignment.Left,
				})

				-- Select/deselect button
				local toggleBtn = Elem(petCard, "TextButton", {
					Size = UDim2.new(0, 80, 0, 30),
					Position = UDim2.new(1, -90, 0.5, -15),
					BackgroundColor3 = isSelected and THEME.danger or THEME.success,
					Text = isSelected and "Remove" or "Add",
					TextColor3 = THEME.text,
					TextSize = 11,
					Font = Enum.Font.GothamBold,
					AutoButtonColor = false,
					LayoutOrder = 1,
				})
				Corner(toggleBtn, 6)

				toggleBtn.MouseButton1Click:Connect(function()
					if SelectedPetsForTrade[petId] then
						SelectedPetsForTrade[petId] = nil
						MyOffer.pet_instance_ids = {}
						for k in pairs(SelectedPetsForTrade) do
							table.insert(MyOffer.pet_instance_ids, k)
						end
					else
						SelectedPetsForTrade[petId] = true
						MyOffer.pet_instance_ids = {}
						for k in pairs(SelectedPetsForTrade) do
							table.insert(MyOffer.pet_instance_ids, k)
						end
					end
					RefreshPetList()
					Pop(toggleBtn)
					TycoonClient.UI_PlaySound("click")
				end)

				idx = idx + 1
			end
		end
		if idx == 103 then
			local noPets = Elem(CreateScrollFrame, "Frame", {
				Name = "PetTradeRow",
				Size = UDim2.new(1, 0, 0, 44),
				BackgroundColor3 = THEME.bg,
				LayoutOrder = 103,
			})
			Corner(noPets, 8)
			Elem(noPets, "TextLabel", {
				Size = UDim2.new(1, 0, 1, 0),
				BackgroundTransparency = 1,
				Text = "No pets available to trade",
				TextColor3 = THEME.textDim,
				TextSize = 11,
				Font = Enum.Font.Gotham,
			})
		end
	end

	RefreshPetList()

	-- Summary and send button
	local summaryHdr = Elem(CreateScrollFrame, "Frame", {
		Name = "SummaryHdr",
		Size = UDim2.new(1, 0, 0, 70),
		BackgroundColor3 = THEME.bg,
		LayoutOrder = 500,
	})
	Corner(summaryHdr, 8)
	Stroke(summaryHdr, THEME.border, 1)

	local summaryText = Elem(summaryHdr, "TextLabel", {
		Size = UDim2.new(1, -20, 0, 28),
		Position = UDim2.new(0, 10, 0, 6),
		BackgroundTransparency = 1,
		Text = "Offer: " .. TradingService.FormatOfferSpec(MyOffer),
		TextColor3 = THEME.accent,
		TextSize = 12,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	local sendBtn = Elem(summaryHdr, "TextButton", {
		Size = UDim2.new(1, -20, 0, 30),
		Position = UDim2.new(0, 10, 0, 36),
		BackgroundColor3 = THEME.trade,
		Text = "Send Trade Offer",
		TextColor3 = THEME.text,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
		AutoButtonColor = false,
	})
	Corner(sendBtn, 6)

	sendBtn.MouseButton1Click:Connect(function()
		Pop(sendBtn)
		-- Send trade via RemoteEvent
		R.CreateTrade:FireServer(
			SelectedTradePartner.userId,
			MyOffer,
			{ currency = 0, pet_instance_ids = {}, item_ids = {} }  -- recvOffer (empty for now)
		)
		TycoonClient.UI_PlaySound("purchase")
		HideCreateTradePanel()
	end)

	-- Back button
	local backBtn = Elem(CreateScrollFrame, "TextButton", {
		Name = "BackBtn",
		Size = UDim2.new(1, 0, 0, 34),
		BackgroundColor3 = THEME.panel,
		Text = "< Back to Player Selection",
		TextColor3 = THEME.textDim,
		TextSize = 12,
		Font = Enum.Font.GothamBold,
		AutoButtonColor = false,
		LayoutOrder = 600,
	})
	Corner(backBtn, 6)
	Stroke(backBtn, THEME.border, 1)
	backBtn.MouseButton1Click:Connect(function()
		SelectedTradePartner = nil
		BuildPlayerSelector()
		TycoonClient.UI_PlaySound("click")
	end)
end

-- New Trade button handler
NewTradeBtn.MouseButton1Click:Connect(function()
	Pop(NewTradeBtn)
	ShowCreateTradePanel()
	TycoonClient.UI_PlaySound("click")
end)

local ScrollFrame = Elem(ContentFrame, "ScrollingFrame", {
	Size = UDim2.new(1, 0, 1, 0),
	BackgroundTransparency = 1,
	ScrollBarThickness = 5,
	CanvasSize = UDim2.new(0, 0, 0, 0),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
})
Elem(ScrollFrame, "UIListLayout", {
	SortOrder = Enum.SortOrder.LayoutOrder,
	Padding = UDim.new(0, 8),
})

-- ── Trade Sub-Tab ─────────────────────────────────────────────────────────────

local TRADE_TAB_H = 50

-- Incoming / Outgoing section headers
local function SectionHeader(name, yOffset)
	local hdr = Elem(ScrollFrame, "Frame", {
		Name = "Hdr_" .. name,
		Size = UDim2.new(1, 0, 0, 28),
		BackgroundColor3 = THEME.trade:Lerp(THEME.bg, 0.4),
		LayoutOrder = yOffset,
	})
	Corner(hdr, 5)
	Elem(hdr, "TextLabel", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 1,
		Text = name,
		TextColor3 = THEME.trade,
		TextSize = 12,
		Font = Enum.Font.GothamBold,
	})
	return hdr
end

local function TradeRow(trade, isIncoming, layoutOrder)
	local isPending = trade.status == "pending"
	local otherId = isIncoming and trade.initiator_id or trade.receiver_id
	local otherName = "Player"  -- name resolved client-side via Players service
	local otherPlayer = Players:GetPlayerByUserId(tonumber(otherId))
	if otherPlayer then otherName = otherPlayer.Name end

	local row = Elem(ScrollFrame, "Frame", {
		Name = "Trade_" .. trade.trade_id,
		Size = UDim2.new(1, 0, 0, TRADE_TAB_H),
		BackgroundColor3 = THEME.bg,
		LayoutOrder = layoutOrder,
	})
	Corner(row, 8)
	Stroke(row, isPending and THEME.accent or THEME.border, isPending and 2 or 1)

	-- Left: status indicator
	local statusColor = trade.status == "pending" and THEME.accent
		or trade.status == "accepted" and THEME.success
		or THEME.danger
	local statusDot = Elem(row, "Frame", {
		Size = UDim2.new(0, 10, 0, 10),
		Position = UDim2.new(0, 10, 0.5, -5),
		BackgroundColor3 = statusColor,
	})
	Corner(statusDot, 5)

	-- Player name
	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 120, 0, 20),
		Position = UDim2.new(0, 28, 0, 8),
		BackgroundTransparency = 1,
		Text = otherName,
		TextColor3 = THEME.text,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
		TextTruncate = Enum.TextTruncate.AtEnd,
		TextXAlignment = Enum.TextXAlignment.Left,
	})

	-- Status + time
	local statusText = trade.status:sub(1,1):upper()..trade.status:sub(2)
	local expiresText = ""
	if isPending then
		expiresText = " · " .. TradingService.FormatExpiresAt(trade.expires_at)
	end
	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 120, 0, 14),
		Position = UDim2.new(0, 28, 0, 28),
		BackgroundTransparency = 1,
		Text = statusText .. expiresText,
		TextColor3 = statusColor,
		TextSize = 11,
		Font = Enum.Font.Gotham,
		TextXAlignment = Enum.TextXAlignment.Left,
	})

	-- Offer summary (right side)
	local offerSummary = isIncoming
		and TradingService.FormatOfferSpec(trade.initiator_offer or {})
		or TradingService.FormatOfferSpec(trade.receiver_offer or {})
	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 140, 0, 16),
		Position = UDim2.new(1, -230, 0, 8),
		BackgroundTransparency = 1,
		Text = isIncoming and "They offer:" or "You offered:",
		TextColor3 = THEME.textDim,
		TextSize = 10,
		Font = Enum.Font.Gotham,
		TextXAlignment = Enum.TextXAlignment.Left,
	})
	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 140, 0, 14),
		Position = UDim2.new(1, -230, 0, 24),
		BackgroundTransparency = 1,
		Text = offerSummary,
		TextColor3 = THEME.accent,
		TextSize = 11,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	-- Action buttons (only for pending incoming trades)
	if isPending and isIncoming then
		local acceptBtn = Elem(row, "TextButton", {
			Size = UDim2.new(0, 70, 0, 32),
			Position = UDim2.new(1, -80, 0.5, -16),
			BackgroundColor3 = THEME.success,
			Text = "Accept",
			TextColor3 = THEME.text,
			TextSize = 11,
			Font = Enum.Font.GothamBold,
			AutoButtonColor = false,
			LayoutOrder = 1,
		})
		Corner(acceptBtn, 6)
		acceptBtn.MouseButton1Click:Connect(function()
			Pop(acceptBtn)
			R.AcceptTrade:FireServer(trade.trade_id)
		end)

		local declineBtn = Elem(row, "TextButton", {
			Size = UDim2.new(0, 70, 0, 32),
			Position = UDim2.new(1, -155, 0.5, -16),
			BackgroundColor3 = THEME.panel,
			Text = "Decline",
			TextColor3 = THEME.danger,
			TextSize = 11,
			Font = Enum.Font.GothamBold,
			AutoButtonColor = false,
			LayoutOrder = 0,
		})
		Corner(declineBtn, 6)
		Stroke(declineBtn, THEME.danger, 1)
		declineBtn.MouseButton1Click:Connect(function()
			R.DeclineTrade:FireServer(trade.trade_id)
		end)
	elseif isPending and not isIncoming then
		-- Outgoing pending: cancel button
		local cancelBtn = Elem(row, "TextButton", {
			Size = UDim2.new(0, 70, 0, 32),
			Position = UDim2.new(1, -80, 0.5, -16),
			BackgroundColor3 = THEME.panel,
			Text = "Cancel",
			TextColor3 = THEME.danger,
			TextSize = 11,
			Font = Enum.Font.GothamBold,
			AutoButtonColor = false,
			LayoutOrder = 1,
		})
		Corner(cancelBtn, 6)
		Stroke(cancelBtn, THEME.danger, 1)
		cancelBtn.MouseButton1Click:Connect(function()
			R.CancelTrade:FireServer(trade.trade_id)
		end)
	end

	return row
end

local function EmptyState(message, layoutOrder)
	local empty = Elem(ScrollFrame, "Frame", {
		Name = "EmptyState",
		Size = UDim2.new(1, 0, 0, 70),
		BackgroundColor3 = THEME.bg,
		LayoutOrder = layoutOrder,
	})
	Corner(empty, 8)
	Elem(empty, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 24),
		Position = UDim2.new(0, 0, 0, 16),
		BackgroundTransparency = 1,
		Text = message,
		TextColor3 = THEME.textDim,
		TextSize = 13,
		Font = Enum.Font.Gotham,
	})
	return empty
end

local function RefreshTradesTab()
	for _, child in ipairs(ScrollFrame:GetChildren()) do
		if child:IsA("Frame") then child:Destroy() end
	end

	local incoming = {}
	local outgoing = {}
	for _, trade in ipairs(PendingTrades) do
		if trade.receiver_id == myUserId then
			table.insert(incoming, trade)
		elseif trade.initiator_id == myUserId then
			table.insert(outgoing, trade)
		end
	end

	-- Incoming pending
	SectionHeader("Incoming Offers", 0)
	if #incoming == 0 then
		EmptyState("No incoming trade offers", 1)
	else
		for i, trade in ipairs(incoming) do
			TradeRow(trade, true, 1 + i)
		end
	end

	-- Outgoing pending
	SectionHeader("Outgoing Offers", 100)
	if #outgoing == 0 then
		EmptyState("No outgoing trade offers", 101)
	else
		for i, trade in ipairs(outgoing) do
			TradeRow(trade, false, 101 + i)
		end
	end
end

-- ── History Sub-Tab ───────────────────────────────────────────────────────────

local function HistoryRow(tx, index, layoutOrder)
	local isInitiator = tx.initiator_id == myUserId
	local otherId = isInitiator and tx.receiver_id or tx.initiator_id
	local otherName = "Player"
	local otherPlayer = Players:GetPlayerByUserId(tonumber(otherId))
	if otherPlayer then otherName = otherPlayer.Name end

	local myOffer = isInitiator and tx.initiator_pet_ids or tx.receiver_pet_ids
	local theirOffer = isInitiator and tx.receiver_pet_ids or tx.initiator_pet_ids

	local row = Elem(ScrollFrame, "Frame", {
		Name = "Hist_" .. tx.trade_id,
		Size = UDim2.new(1, 0, 0, TRADE_TAB_H),
		BackgroundColor3 = THEME.bg,
		LayoutOrder = layoutOrder,
	})
	Corner(row, 8)
	Stroke(row, THEME.success, 1)

	-- "Completed" badge
	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 80, 0, 18),
		Position = UDim2.new(0, 10, 0.5, -9),
		BackgroundColor3 = THEME.success,
		BackgroundTransparency = 0.3,
		Text = "Completed",
		TextColor3 = THEME.text,
		TextSize = 10,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
	})

	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 100, 0, 16),
		Position = UDim2.new(0, 96, 0, 8),
		BackgroundTransparency = 1,
		Text = isInitiator and ("Gave to " .. otherName) or ("Got from " .. otherName),
		TextColor3 = THEME.text,
		TextSize = 12,
		Font = Enum.Font.GothamBold,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	local petIds = myOffer and myOffer.pet_instance_ids or {}
	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 120, 0, 14),
		Position = UDim2.new(0, 96, 0, 26),
		BackgroundTransparency = 1,
		Text = #petIds .. " pet(s)",
		TextColor3 = THEME.textDim,
		TextSize = 11,
		Font = Enum.Font.Gotham,
		TextXAlignment = Enum.TextXAlignment.Left,
	})

	-- Date
	local dateStr = "—"
	if tx.completed_at then
		local year, month, day = tx.completed_at:match("(%d+)-(%d+)-(%d+)")
		if year then dateStr = month.."/"..day end
	end
	Elem(row, "TextLabel", {
		Size = UDim2.new(0, 80, 0, 14),
		Position = UDim2.new(1, -90, 0, 8),
		BackgroundTransparency = 1,
		Text = dateStr,
		TextColor3 = THEME.textDim,
		TextSize = 11,
		Font = Enum.Font.Gotham,
		TextXAlignment = Enum.TextXAlignment.Right,
	})

	return row
end

local function RefreshHistoryTab()
	for _, child in ipairs(ScrollFrame:GetChildren()) do
		if child:IsA("Frame") do child:Destroy() end
	end

	if #TradeHistoryList == 0 then
		EmptyState("No completed trades yet", 0)
	else
		for i, tx in ipairs(TradeHistoryList) do
			HistoryRow(tx, i, i)
		end
	end
end

-- ── Sub-Tab Navigation ────────────────────────────────────────────────────────

local function UpdateSubTabs()
	for key, btn in pairs(SubTabBtns) do
		btn.BackgroundColor3 = key == SelectedSubTab and THEME.trade or THEME.bg
		btn.TextColor3 = key == SelectedSubTab and THEME.text or THEME.textDim
	end
	if IsCreatingTrade then return end  -- Don't switch tabs while creating
	if SelectedSubTab == "trades" then
		RefreshTradesTab()
	else
		RefreshHistoryTab()
	end
end

for key, btn in pairs(SubTabBtns) do
	btn.MouseButton1Click:Connect(function()
		SelectedSubTab = key
		UpdateSubTabs()
		TycoonClient.UI_PlaySound("click")
	end)
end

-- ── Close ─────────────────────────────────────────────────────────────────────

local function CloseTradeUI()
	ScreenGui.Enabled = false
	-- Reset create trade state
	if IsCreatingTrade then
		HideCreateTradePanel()
	end
end

CloseBtn.MouseButton1Click:Connect(function()
	CloseTradeUI()
end)

Backdrop.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
		CloseTradeUI()
	end
end)

-- ── Toast Notification System ────────────────────────────────────────────────

local ToastContainer = Elem(ScreenGui, "Frame", {
	Name = "ToastContainer",
	Size = UDim2.new(0, 300, 1, 0),
	Position = UDim2.new(1, -310, 0, 70),
	BackgroundTransparency = 1,
	ZIndex = 20,
})
Elem(ToastContainer, "UIListLayout", {
	SortOrder = Enum.SortOrder.LayoutOrder,
	VerticalAlignment = Enum.VerticalAlignment.Top,
	Padding = UDim.new(0, 8),
})

local TOAST_LIFETIME = 8 -- seconds

local function ShowToast(trade)
	local senderId = trade.initiator_id
	local senderName = "Someone"
	local sender = Players:GetPlayerByUserId(tonumber(senderId))
	if sender then senderName = sender.Name end

	local offerSummary = TradingService.FormatOfferSpec(trade.initiator_offer or {})

	local toast = Elem(ToastContainer, "Frame", {
		Name = "Toast_" .. trade.trade_id,
		Size = UDim2.new(1, 0, 0, 80),
		BackgroundColor3 = THEME.panel,
		LayoutOrder = 0,
		ZIndex = 20,
	})
	Corner(toast, 10)
	Stroke(toast, THEME.accent, 2)

	-- Accent bar on left
	Elem(toast, "Frame", {
		Size = UDim2.new(0, 4, 1, -16),
		Position = UDim2.new(0, 6, 0, 8),
		BackgroundColor3 = THEME.accent,
		BackgroundTransparency = 0.3,
		ZIndex = 21,
	})
	Corner(toast, 10)

	Elem(toast, "TextLabel", {
		Size = UDim2.new(1, -30, 0, 20),
		Position = UDim2.new(0, 20, 0, 10),
		BackgroundTransparency = 1,
		Text = "Trade Offer from " .. senderName,
		TextColor3 = THEME.accent,
		TextSize = 13,
		Font = Enum.Font.GothamBold,
		ZIndex = 21,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	Elem(toast, "TextLabel", {
		Size = UDim2.new(1, -30, 0, 16),
		Position = UDim2.new(0, 20, 0, 32),
		BackgroundTransparency = 1,
		Text = "Offering: " .. offerSummary,
		TextColor3 = THEME.text,
		TextSize = 12,
		Font = Enum.Font.Gotham,
		ZIndex = 21,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
	})

	-- Time remaining
	local expiresText = TradingService.FormatExpiresAt(trade.expires_at)
	Elem(toast, "TextLabel", {
		Size = UDim2.new(0, 80, 0, 14),
		Position = UDim2.new(0, 20, 0, 52),
		BackgroundTransparency = 1,
		Text = "Expires: " .. expiresText,
		TextColor3 = THEME.textDim,
		TextSize = 10,
		Font = Enum.Font.Gotham,
		ZIndex = 21,
	})

	-- Accept / Decline buttons
	local acceptBtn = Elem(toast, "TextButton", {
		Size = UDim2.new(0, 70, 0, 28),
		Position = UDim2.new(1, -162, 0, 48),
		BackgroundColor3 = THEME.success,
		Text = "Accept",
		TextColor3 = THEME.text,
		TextSize = 11,
		Font = Enum.Font.GothamBold,
		AutoButtonColor = false,
		ZIndex = 21,
	})
	Corner(acceptBtn, 6)

	local declineBtn = Elem(toast, "TextButton", {
		Size = UDim2.new(0, 70, 0, 28),
		Position = UDim2.new(1, -82, 0, 48),
		BackgroundColor3 = THEME.panel,
		Text = "Decline",
		TextColor3 = THEME.danger,
		TextSize = 11,
		Font = Enum.Font.GothamBold,
		AutoButtonColor = false,
		ZIndex = 21,
	})
	Corner(declineBtn, 6)
	Stroke(declineBtn, THEME.danger, 1)

	acceptBtn.MouseButton1Click:Connect(function()
		Pop(acceptBtn)
		R.AcceptTrade:FireServer(trade.trade_id)
		task.delay(0.3, function() if toast.Parent then toast:Destroy() end end)
	end)

	declineBtn.MouseButton1Click:Connect(function()
		R.DeclineTrade:FireServer(trade.trade_id)
		task.delay(0.1, function() if toast.Parent then toast:Destroy() end end)
	end)

	-- Auto-dismiss
	task.delay(TOAST_LIFETIME, function()
		if toast.Parent then
			SlideOut(toast, true)
		end
	end)

	-- Slide in from right
	local origPos = toast.Position
	toast.Position = UDim2.new(1.05, 0, 0, 0)
	toast.BackgroundTransparency = 1
	TweenService:Create(toast, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
		Position = origPos,
		BackgroundTransparency = 0,
	}):Play()
end

-- ── Server Event Bindings ──────────────────────────────────────────────────────

R.TradeOfferReceived.OnClientEvent:Connect(function(trade)
	-- Add to pending trades
	table.insert(PendingTrades, 1, trade)
	ShowToast(trade)
	if SelectedSubTab == "trades" then
		RefreshTradesTab()
	end
end)

R.TradeUpdated.OnClientEvent:Connect(function(trade)
	-- Update or remove from pending trades
	local updated = false
	for i, t in ipairs(PendingTrades) do
		if t.trade_id == trade.trade_id then
			if trade.status == "pending" then
				PendingTrades[i] = trade
				updated = true
			else
				table.remove(PendingTrades, i)
				-- Move to history if accepted
				if trade.status == "accepted" then
					table.insert(TradeHistoryList, 1, {
						trade_id = trade.trade_id,
						initiator_id = trade.initiator_id,
						receiver_id = trade.receiver_id,
						initiator_pet_ids = trade.initiator_offer,
						receiver_pet_ids = trade.receiver_offer,
						status = "completed",
						completed_at = trade.updated_at,
					})
				end
			end
			break
		end
	end
	if not updated then
		table.insert(PendingTrades, 1, trade)
	end
	if SelectedSubTab == "trades" then
		RefreshTradesTab()
	elseif SelectedSubTab == "history" then
		RefreshHistoryTab()
	end
end)

R.TradeError.OnClientEvent:Connect(function(errorMsg)
	warn("[TradeUI] Trade error:", errorMsg)
	-- Could show an error toast here
end)

R.TradesFetched.OnClientEvent:Connect(function(data)
	PendingTrades = data and data.trades or {}
	if SelectedSubTab == "trades" then
		RefreshTradesTab()
	end
end)

R.TradeHistoryFetched.OnClientEvent:Connect(function(data)
	TradeHistoryList = data or {}
	if SelectedSubTab == "history" then
		RefreshHistoryTab()
	end
end)

-- ── Public: Open / Close ──────────────────────────────────────────────────────

local function OpenTradeUI()
	-- Reset create-trade state before opening
	if IsCreatingTrade then
		HideCreateTradePanel()
	end
	ScreenGui.Enabled = true
	-- Fetch fresh data
	R.FetchTrades:FireServer("pending", 1)
	R.FetchTradeHistory:FireServer(1)
end

-- Expose globally so TycoonUI can call it
TycoonClient.OpenTradeUI = OpenTradeUI

-- ── Init ─────────────────────────────────────────────────────────────────────

UpdateSubTabs()
print("[TradeUI] Initialized")
return {}
