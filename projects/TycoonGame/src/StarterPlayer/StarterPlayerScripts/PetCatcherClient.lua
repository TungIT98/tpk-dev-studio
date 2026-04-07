--[[
	PetCatcherClient.lua
	Client-side module for wild pet catching mini-game UI.
	Handles spawn notifications, catch attempts, and catch result feedback.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

local TycoonClient = require(ReplicatedStorage.Modules.TycoonClient)
local PetCompanions = require(ReplicatedStorage.Modules.PetCompanions)

-- Wild pet tracking
local WildPets = {} -- { [wildPetId] = { petId, petName, rarity, position } }
local ActiveCatchUI = nil
local CurrentCatchState = nil

-- Theme
local THEME = {
	bg = Color3.fromRGB(15, 15, 25),
	panel = Color3.fromRGB(28, 28, 44),
	accent = Color3.fromRGB(255, 200, 0),
	success = Color3.fromRGB(0, 210, 110),
	danger = Color3.fromRGB(220, 55, 55),
	text = Color3.fromRGB(255, 255, 255),
	textDim = Color3.fromRGB(160, 160, 190),
}

-- Rarity colors
local RARITY_COLOR = {
	common   = Color3.fromRGB(180, 180, 180),
	rare     = Color3.fromRGB(65,  185, 255),
	epic     = Color3.fromRGB(200, 80,  255),
	legendary= Color3.fromRGB(255, 165, 0),
}

-- UI Helper
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

-- Show catch attempt UI
local function ShowCatchUI(wildPetId, petName, rarity, catchWindow)
	-- Remove existing UI if any
	if ActiveCatchUI then
		ActiveCatchUI:Destroy()
	end

	CurrentCatchState = {
		wildPetId = wildPetId,
		catchStartTime = tick(),
		clickCount = 0,
		catchWindow = catchWindow,
	}

	-- Create catch UI overlay
	ActiveCatchUI = Elem(PlayerGui, "ScreenGui", {
		Name = "PetCatchUI",
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		IgnoreGuiInset = true,
	})

	-- Background
	local bg = Elem(ActiveCatchUI, "Frame", {
		Size = UDim2.new(0, 300, 0, 180),
		Position = UDim2.new(0.5, -150, 0.7, -90),
		BackgroundColor3 = THEME.panel,
	})
	Corner(bg, 16)
	Stroke(bg, RARITY_COLOR[rarity] or THEME.accent, 3)

	-- Title
	Elem(bg, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 40),
		Position = UDim2.new(0, 0, 0, 10),
		BackgroundTransparency = 1,
		Text = "Catch " .. petName .. "!",
		TextColor3 = RARITY_COLOR[rarity] or THEME.accent,
		TextSize = 22,
		Font = Enum.Font.GothamBold,
	})

	-- Instructions
	Elem(bg, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 24),
		Position = UDim.new(0, 0, 0, 50),
		BackgroundTransparency = 1,
		Text = "Click rapidly to catch!",
		TextColor3 = THEME.textDim,
		TextSize = 14,
		Font = Enum.Font.Gotham,
	})

	-- Progress bar background
	local barBg = Elem(bg, "Frame", {
		Size = UDim2.new(0.8, 0, 0, 20),
		Position = UDim2.new(0.1, 0, 0, 80),
		BackgroundColor3 = THEME.bg,
	})
	Corner(barBg, 10)

	-- Progress bar fill
	local barFill = Elem(barBg, "Frame", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = RARITY_COLOR[rarity] or THEME.accent,
		Name = "BarFill",
	})
	Corner(barFill, 10)

	-- Click counter
	local clickText = Elem(bg, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 30),
		Position = UDim2.new(0, 0, 0, 105),
		BackgroundTransparency = 1,
		Text = "Clicks: 0",
		TextColor3 = THEME.text,
		TextSize = 16,
		Font = Enum.Font.GothamBold,
	})

	-- Hint
	Elem(bg, "TextLabel", {
		Size = UDim2.new(1, 0, 0, 20),
		Position = UDim2.new(0, 0, 0, 140),
		BackgroundTransparency = 1,
		Text = "Closer = Better chance!",
		TextColor3 = THEME.textDim,
		TextSize = 12,
		Font = Enum.Font.Gotham,
	})

	-- Click handler
	local clickConnection
	clickConnection = UserInputService.InputBegan:Connect(function(input, gameProcessed)
		if gameProcessed then return end
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			CurrentCatchState.clickCount = CurrentCatchState.clickCount + 1
			clickText.Text = "Clicks: " .. CurrentCatchState.clickCount

			-- Send click to server
			ReplicatedStorage.StartCatchAttempt:FireServer(wildPetId)

			-- Visual feedback - pulse the bar
			TweenService:Create(barFill, TweenInfo.new(0.1), {
				Size = UDim2.new(0.3, 0, 1.2, 0)
			}):Play()
		end
	end)

	-- Timeout to close UI
	task.delay(catchWindow + 0.5, function()
		if ActiveCatchUI then
			ActiveCatchUI:Destroy()
			ActiveCatchUI = nil
		end
		clickConnection:Disconnect()
		CurrentCatchState = nil
	end)
end

-- Show catch result
local function ShowCatchResult(success, chance, petName)
	if ActiveCatchUI then
		ActiveCatchUI:Destroy()
		ActiveCatchUI = nil
	end

	local resultUI = Elem(PlayerGui, "ScreenGui", {
		Name = "CatchResult",
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	})

	local resultBg = Elem(resultUI, "Frame", {
		Size = UDim2.new(0, 280, 0, 140),
		Position = UDim2.new(0.5, -140, 0.5, -70),
		BackgroundColor3 = THEME.panel,
	})
	Corner(resultBg, 16)
	Stroke(resultBg, success and THEME.success or THEME.danger, 3)

	if success then
		Elem(resultBg, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 50),
			Position = UDim2.new(0, 0, 0, 10),
			BackgroundTransparency = 1,
			Text = "🎉 Caught " .. petName .. "!",
			TextColor3 = THEME.success,
			TextSize = 20,
			Font = Enum.Font.GothamBold,
		})

		Elem(resultBg, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 24),
			Position = UDim2.new(0, 0, 0, 60),
			BackgroundTransparency = 1,
			Text = "Added to your pet collection!",
			TextColor3 = THEME.text,
			TextSize = 14,
			Font = Enum.Font.Gotham,
		})
	else
		Elem(resultBg, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 50),
			Position = UDim2.new(0, 0, 0, 10),
			BackgroundTransparency = 1,
			Text = "😢 It escaped!",
			TextColor3 = THEME.danger,
			TextSize = 20,
			Font = Enum.Font.GothamBold,
		})

		Elem(resultBg, "TextLabel", {
			Size = UDim2.new(1, 0, 0, 24),
			Position = UDim2.new(0, 0, 0, 60),
			BackgroundTransparency = 1,
			Text = string.format("Catch chance: %.0f%%", chance * 100),
			TextColor3 = THEME.textDim,
			TextSize = 14,
			Font = Enum.Font.Gotham,
		})
	end

	local okBtn = Elem(resultBg, "TextButton", {
		Size = UDim2.new(0.5, -20, 0, 36),
		Position = UDim2.new(0.25, 10, 1, -46),
		BackgroundColor3 = success and THEME.success or THEME.panel,
		Text = "OK",
		TextColor3 = THEME.text,
		TextSize = 14,
		Font = Enum.Font.GothamBold,
		AutoButtonColor = false,
	})
	Corner(okBtn, 8)

	okBtn.MouseButton1Click:Connect(function()
		resultUI:Destroy()
	end)

	task.delay(5, function()
		if resultUI.Parent then
			resultUI:Destroy()
		end
	end)
end

-- Setup event handlers
local function SetupEventHandlers()
	-- Wild pet spawned notification
	ReplicatedStorage.SpawnWildPet.OnClientEvent:Connect(function(wildPetId, petId, petName, rarity, position)
		WildPets[wildPetId] = {
			petId = petId,
			petName = petName,
			rarity = rarity,
			position = position,
		}

		-- Show notification
		if PlayerGui:FindFirstChild("TycoonUI") then
			local tycoonUI = PlayerGui.TycoonUI
			-- Could add a toast notification here
			print("[PetCatcher] Wild pet spawned: " .. petName)
		end
	end)

	-- Wild pet removed
	ReplicatedStorage.RemoveWildPet.OnClientEvent:Connect(function(wildPetId)
		WildPets[wildPetId] = nil
	end)

	-- Catch attempt started
	ReplicatedStorage.StartCatchAttempt.OnClientEvent:Connect(function(wildPetId, catchWindow)
		local wildPet = WildPets[wildPetId]
		if wildPet then
			ShowCatchUI(wildPetId, wildPet.petName, wildPet.rarity, catchWindow)
		end
	end)

	-- Catch attempt click feedback
	ReplicatedStorage.CatchAttemptClick.OnClientEvent:Connect(function(clickCount)
		-- Already handled in ShowCatchUI
	end)

	-- Catch result
	ReplicatedStorage.CatchResult.OnClientEvent:Connect(function(wildPetId, success, chance)
		local wildPet = WildPets[wildPetId]
		local petName = wildPet and wildPet.petName or "Pet"
		ShowCatchResult(success, chance, petName)

		if success then
			WildPets[wildPetId] = nil
		end
	end)

	-- Request wild pet list on load
	ReplicatedStorage:WaitForChild("WildPetList")
	ReplicatedStorage.WildPetList.OnClientEvent:Connect(function(petList)
		WildPets = {}
		for _, wildPet in ipairs(petList) do
			WildPets[wildPet.wildPetId] = {
				petId = wildPet.petId,
				petName = wildPet.petName,
				rarity = wildPet.rarity,
				position = wildPet.position,
			}
		end
	end)

	-- Request list after load
	task.wait(1)
	ReplicatedStorage.WildPetList:FireServer()
end

-- Initialize
SetupEventHandlers()
print("[PetCatcherClient] Initialized")