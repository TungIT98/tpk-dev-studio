--[[
	UIInputHandler.lua
	Client-side input handling for the tycoon game UI.
	Per the architecture plan: handles mouse/touch input for UI interactions.
]]

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local UI_INPUT_MODES = {
	FREE = "free",       -- Normal gameplay, can interact with world
	UI_ONLY = "ui_only", -- UI overlay open, world interaction blocked
	DISABLED = "disabled",-- All input disabled (cutscenes, loading)
}

local UIInputHandler = {
	Mode = UI_INPUT_MODES.FREE,
	InputModes = UI_INPUT_MODES,

	-- Callbacks for input events
	OnShopToggle = nil,
	OnPetPanelToggle = nil,
	OnPauseToggle = nil,
	OnPrestigeOpen = nil,
	OnInventoryOpen = nil,
	OnLeaderboardOpen = nil,
	OnSettingsOpen = nil,

	-- Currently open UI panel
	ActivePanel = nil,  -- "shop" | "pets" | "prestige" | "inventory" | "leaderboard" | "settings" | nil

	-- Mobile detection
	IsMobile = nil,
}

--[[
	Initialize the input handler
	Call this once from the client game scene
]]
function UIInputHandler.Init()
	UIInputHandler.IsMobile = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled

	-- Keyboard shortcuts
	UserInputService.InputBegan:Connect(function(input, gameProcessed)
		if gameProcessed then return end
		UIInputHandler:OnInputBegan(input)
	end)

	-- Global GUI click/touch handler
	UserInputService.InputBegan:Connect(function(input, gameProcessed)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or
		   input.UserInputType == Enum.UserInputType.Touch then
			UIInputHandler:OnPointerInput(input)
		end
	end)

	-- Escape key / pause
	UserInputService.InputBegan:Connect(function(input, gameProcessed)
		if input.KeyCode == Enum.KeyCode.Escape then
			UIInputHandler:TogglePause()
		end
	end)

	print("[UIInputHandler] Initialized, mobile:", UIInputHandler.IsMobile)
end

--[[
	Handle keyboard input
]]
function UIInputHandler:OnInputBegan(input)
	if self.Mode == UI_INPUT_MODES.DISABLED then return end

	-- Keyboard shortcuts (when no UI panel is open)
	if self.ActivePanel == nil then
		if input.KeyCode == Enum.KeyCode.B or input.KeyCode == Enum.KeyCode.One then
			self:ToggleShop()
		elseif input.KeyCode == Enum.KeyCode.P or input.KeyCode == Enum.KeyCode.Two then
			self:TogglePetPanel()
		elseif input.KeyCode == Enum.KeyCode.I then
			self:ToggleInventory()
		elseif input.KeyCode == Enum.KeyCode.L then
			self:ToggleLeaderboard()
		elseif input.KeyCode == Enum.KeyCode.Comma then
			self:OpenPrestige()
		end
	else
		-- Close current panel on these keys when a panel is open
		if input.KeyCode == Enum.KeyCode.Escape or input.KeyCode == Enum.KeyCode.B or
		   input.KeyCode == Enum.KeyCode.P then
			self:CloseActivePanel()
		end
	end
end

--[[
	Handle pointer (mouse/touch) input on GUI elements
	Uses button IDs for routing
]]
function UIInputHandler:OnPointerInput(input)
	if self.Mode == UI_INPUT_MODES.DISABLED then return end

	-- Detect which UI element was interacted with
	-- This is called after the click; actual button routing done via Button1Click callbacks
end

--[[
	Route a UI button click by its name/id
	Called from Button1Click on UI elements
]]
function UIInputHandler:RouteButtonClick(buttonId)
	if self.Mode == UI_INPUT_MODES.DISABLED then return end

	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
	local tycoonUI = playerGui:WaitForChild("TycoonUI", 5)

	if not tycoonUI then return end

	if buttonId == "ShopButton" or buttonId == "ShopToggle" then
		self:ToggleShop()
	elseif buttonId == "PetButton" or buttonId == "PetToggle" then
		self:TogglePetPanel()
	elseif buttonId == "PauseButton" then
		self:TogglePause()
	elseif buttonId == "PrestigeButton" then
		self:OpenPrestige()
	elseif buttonId == "InventoryButton" then
		self:ToggleInventory()
	elseif buttonId == "LeaderboardButton" then
		self:ToggleLeaderboard()
	elseif buttonId == "SettingsButton" then
		self:ToggleSettings()
	elseif buttonId == "CloseButton" then
		self:CloseActivePanel()
	elseif buttonId == "CollectButton" or buttonId == "CollectIncome" then
		self:FireServerCollect()
	elseif buttonId == "SpeedToggle" or buttonId == "ValueToggle" or buttonId == "AutoCollectToggle" then
		self:FireServerUpgrade(buttonId:gsub("Toggle", ""))
	end
end

--[[
	Toggle the shop overlay
]]
function UIInputHandler:ToggleShop()
	if self.ActivePanel == "shop" then
		self:CloseActivePanel()
	else
		self:OpenPanel("shop")
	end
end

--[[
	Toggle the pet companion panel
]]
function UIInputHandler:TogglePetPanel()
	if self.ActivePanel == "pets" then
		self:CloseActivePanel()
	else
		self:OpenPanel("pets")
	end
end

--[[
	Toggle pause state
]]
function UIInputHandler:TogglePause()
	if self.Mode == UI_INPUT_MODES.DISABLED then return end

	-- Send pause event to server
	if ReplicatedStorage:FindFirstChild("GamePhaseChanged") then
		-- Read current phase from a client-side flag
	end

	-- Fire server pause event
	if ReplicatedStorage:FindFirstChild("TogglePause") then
		ReplicatedStorage.TogglePause:FireServer()
	end

	-- Toggle local pause UI
	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
	local tycoonUI = playerGui:WaitForChild("TycoonUI", 5)

	if tycoonUI and tycoonUI:FindFirstChild("PauseOverlay") then
		local overlay = tycoonUI.PauseOverlay
		if overlay.Visible then
			overlay.Visible = false
			self.Mode = UI_INPUT_MODES.FREE
		else
			overlay.Visible = true
			self.Mode = UI_INPUT_MODES.UI_ONLY
		end
	end

	if self.OnPauseToggle then
		self.OnPauseToggle()
	end
end

--[[
	Open the prestige panel
]]
function UIInputHandler:OpenPrestige()
	self:OpenPanel("prestige")
	if self.OnPrestigeOpen then
		self.OnPrestigeOpen()
	end
end

--[[
	Toggle inventory panel
]]
function UIInputHandler:ToggleInventory()
	if self.ActivePanel == "inventory" then
		self:CloseActivePanel()
	else
		self:OpenPanel("inventory")
	end
end

--[[
	Toggle leaderboard panel
]]
function UIInputHandler:ToggleLeaderboard()
	if self.ActivePanel == "leaderboard" then
		self:CloseActivePanel()
	else
		self:OpenPanel("leaderboard")
	end
end

--[[
	Toggle settings panel
]]
function UIInputHandler:ToggleSettings()
	if self.ActivePanel == "settings" then
		self:CloseActivePanel()
	else
		self:OpenPanel("settings")
	end
end

--[[
	Open a UI panel (close others, open new one)
]]
function UIInputHandler:OpenPanel(panelId)
	-- Close any existing panel
	self:CloseActivePanel()

	self.ActivePanel = panelId
	self.Mode = UI_INPUT_MODES.UI_ONLY

	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
	local tycoonUI = playerGui:WaitForChild("TycoonUI", 5)
	if not tycoonUI then return end

	-- Show the target panel
	local panelMap = {
		shop = "ShopPanel",
		pets = "PetPanel",
		prestige = "PrestigePanel",
		inventory = "InventoryPanel",
		leaderboard = "LeaderboardPanel",
		settings = "SettingsPanel",
	}

	local panelName = panelMap[panelId]
	if panelName and tycoonUI:FindFirstChild(panelName) then
		local panel = tycoonUI[panelName]
		panel.Visible = true
		-- Pop-in animation
		panel.Position = UDim2.new(0.5, 0, 0.6, 0)
		local tween = TweenService:Create(
			panel,
			TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
			{ Position = UDim2.new(0.5, 0, 0.5, 0) }
		)
		tween:Play()
	end

	-- Notify server that a panel was opened
	if ReplicatedStorage:FindFirstChild("PanelOpened") then
		ReplicatedStorage.PanelOpened:FireServer(panelId)
	end

	if panelId == "shop" and self.OnShopToggle then
		self.OnShopToggle(true)
	elseif panelId == "pets" and self.OnPetPanelToggle then
		self.OnPetPanelToggle(true)
	end
end

--[[
	Close the currently active panel
]]
function UIInputHandler:CloseActivePanel()
	local previousPanel = self.ActivePanel
	if not previousPanel then return end

	self.ActivePanel = nil
	self.Mode = UI_INPUT_MODES.FREE

	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
	local tycoonUI = playerGui:WaitForChild("TycoonUI", 5)

	if tycoonUI then
		local panelMap = {
			shop = "ShopPanel",
			pets = "PetPanel",
			prestige = "PrestigePanel",
			inventory = "InventoryPanel",
			leaderboard = "LeaderboardPanel",
			settings = "SettingsPanel",
		}
		local panelName = panelMap[previousPanel]
		if panelName and tycoonUI:FindFirstChild(panelName) then
			local panel = tycoonUI[panelName]
			-- Fade out animation then hide
			local tween = TweenService:Create(
				panel,
				TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
				{ Position = UDim2.new(0.5, 0, 0.4, 0) }
			)
			tween:Play()
			tween.Completed:Connect(function()
				panel.Visible = false
			end)
		end
	end

	if previousPanel == "shop" and self.OnShopToggle then
		self.OnShopToggle(false)
	elseif previousPanel == "pets" and self.OnPetPanelToggle then
		self.OnPetPanelToggle(false)
	end
end

--[[
	Fire server: collect income
]]
function UIInputHandler:FireServerCollect()
	if ReplicatedStorage:FindFirstChild("CollectIncome") then
		ReplicatedStorage.CollectIncome:FireServer()
	end
end

--[[
	Fire server: purchase an upgrade
]]
function UIInputHandler:FireServerUpgrade(upgradeId, businessId)
	if ReplicatedStorage:FindFirstChild("BuyUpgrade") then
		ReplicatedStorage.BuyUpgrade:FireServer(upgradeId, businessId)
	end
end

--[[
	Set input mode externally (e.g. during cutscenes)
]]
function UIInputHandler:SetMode(newMode)
	self.Mode = newMode
	if newMode ~= UI_INPUT_MODES.UI_ONLY then
		self:CloseActivePanel()
	end
end

return UIInputHandler
