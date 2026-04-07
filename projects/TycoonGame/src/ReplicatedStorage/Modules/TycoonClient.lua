--[[
	TycoonClient.lua
	Client-side module for managing local UI state and remote event bindings.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local REMOTE_EVENTS = {
	PurchaseBusiness = ReplicatedStorage:WaitForChild("PurchaseBusiness"),
	SellBusiness = ReplicatedStorage:WaitForChild("SellBusiness"),
	BuyUpgrade = ReplicatedStorage:WaitForChild("BuyUpgrade"),
	Prestige = ReplicatedStorage:WaitForChild("Prestige"),
	CollectIncome = ReplicatedStorage:WaitForChild("CollectIncome"),
	DataUpdated = ReplicatedStorage:WaitForChild("DataUpdated"),
	OfflineEarnings = ReplicatedStorage:WaitForChild("OfflineEarnings"),
	PlaySound = ReplicatedStorage:WaitForChild("PlaySound"),
	PurchasePet = ReplicatedStorage:WaitForChild("PurchasePet"),
	LevelUpPet = ReplicatedStorage:WaitForChild("LevelUpPet"),
}

local TycoonClient = {
	Events = REMOTE_EVENTS,
	PlayerData = nil,
	OnDataUpdated = nil, -- callback
}

-- Format large numbers nicely (K, M, B, T)
function TycoonClient.FormatMoney(amount)
	local n = tonumber(amount) or 0
	if n >= 1e12 then
		return string.format("%.2fT", n / 1e12)
	elseif n >= 1e9 then
		return string.format("%.2fB", n / 1e9)
	elseif n >= 1e6 then
		return string.format("%.2fM", n / 1e6)
	elseif n >= 1e3 then
		return string.format("%.2fK", n / 1e3)
	else
		return string.format("%.0f", math.floor(n))
	end
end

-- Animate a UI element with a pop effect
function TycoonClient.UI_Pop(frame)
	local originalSize = frame.Size
	local tween = TweenService:Create(
		frame,
		TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		{ Size = UDim2.new(originalSize.X.Scale * 1.1, originalSize.X.Offset, originalSize.Y.Scale * 1.1, originalSize.Y.Offset) }
	)
	local tweenBack = TweenService:Create(
		frame,
		TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
		{ Size = originalSize }
	)
	tween:Play()
	tween.Completed:Connect(function()
		tweenBack:Play()
	end)
end

-- Animate money counter flash
function TycoonClient.UI_MoneyFlash(label, oldAmount, newAmount)
	local delta = newAmount - oldAmount
	if delta <= 0 then return end

	-- Brief highlight
	local tween = TweenService:Create(
		label,
		TweenInfo.new(0.2),
		{ TextColor3 = Color3.fromRGB(0, 255, 100) }
	)
	local tweenBack = TweenService:Create(
		label,
		TweenInfo.new(0.4),
		{ TextColor3 = Color3.fromRGB(255, 255, 255) }
	)
	tween:Play()
	tween.Completed:Connect(function()
		tweenBack:Play()
	end)
end

-- Play a UI sound
function TycoonClient.UI_PlaySound(soundType)
	REMOTE_EVENTS.PlaySound:FireServer(soundType)
end

-- Bind data update from server
function TycoonClient.ListenForDataUpdates(callback)
	TycoonClient.OnDataUpdated = callback
	REMOTE_EVENTS.DataUpdated.OnClientEvent:Connect(function(data)
		TycoonClient.PlayerData = data
		if TycoonClient.OnDataUpdated then
			TycoonClient.OnDataUpdated(data)
		end
	end)
end

-- Listen for offline earnings popup
function TycoonClient.ListenForOfflineEarnings(callback)
	REMOTE_EVENTS.OfflineEarnings.OnClientEvent:Connect(function(amount)
		if callback then callback(amount) end
	end)
end

return TycoonClient
