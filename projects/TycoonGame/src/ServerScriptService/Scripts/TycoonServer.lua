--[[
	TycoonServer.lua
	Main server controller — implements the game loop per the architecture plan (TKPA-40).

	Core loop (from plan):
	  - Heartbeat every 1 second
	  - For each owned business: income = base_income * quantity * (1 + 0.25 * level)
	  - income *= prestige_multiplier
	  - Batch-save to backend every 60 seconds
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

-- Modules
local DataStoreService = require(script.Parent.Modules.DataStoreService)
local BackendService = require(script.Parent.Modules.BackendService)
local BusinessConfig = require(ReplicatedStorage.Modules.BusinessConfig)
local UpgradeConfig = require(ReplicatedStorage.Modules.UpgradeConfig)
local BusinessManager = require(script.Parent.Modules.BusinessManager)
local UpgradeService = require(script.Parent.Modules.UpgradeService)
local PrestigeService = require(script.Parent.Modules.PrestigeService)
local IncomeService = require(script.Parent.Modules.IncomeService)
local GameStateMachine = require(script.Parent.Modules.GameStateMachine)
local PlayerEntity = require(script.Parent.Modules.PlayerEntity)
local PetCompanions = require(ReplicatedStorage.Modules.PetCompanions)
local PetSpawnerService = require(script.Parent.Modules.PetSpawnerService)

-- Player data cache
local PlayerDataCache = {}

-- Timers
local SAVE_INTERVAL = 60  -- seconds (from plan: batch-save every 60s)
local lastSaveTime = {}

-- Pet data per player: { [petId] = { owned = true, level = 1 } }
local PlayerPetData = {}

-- Setup remote events
local function SetupRemoteEvents()
	local eventNames = {
		"PurchaseBusiness",
		"SellBusiness",
		"BuyUpgrade",
		"Prestige",
		"CollectIncome",
		"DataUpdated",
		"OfflineEarnings",
		"PlaySound",
		"PurchasePet",
		"LevelUpPet",
		"PanelOpened",
		"TogglePause",
	}
	for _, name in ipairs(eventNames) do
		if not ReplicatedStorage:FindFirstChild(name) then
			Instance.new("RemoteEvent", ReplicatedStorage).Name = name
		end
	end
end

-- Sync player data to client
local function SyncDataToClient(player)
	local data = PlayerDataCache[player]
	if not data then return end

	ReplicatedStorage.DataUpdated:FireClient(player, {
		money = data.Money,
		totalEarned = data.TotalEarned,
		totalEarnedEver = data.TotalEarnedEver,
		businesses = data.Businesses,
		upgrades = data.Upgrades,
		pets = PlayerPetData[player] or {},
		prestigeLevel = data.PrestigeLevel,
		prestigePoints = data.PrestigePoints,
	})
end

-- Save player data (to DataStoreService, optionally to BackendService)
local function SavePlayerData(player)
	local data = PlayerDataCache[player]
	if not data then return end

	-- Always save to local DataStoreService
	DataStoreService.SavePlayerData(player, data)

	-- Also try to sync to backend
	local userId = player.UserId
	task.spawn(function()
		BackendService.SavePlayerData(userId, data)
	end)
end

-- Player joined
local function OnPlayerAdded(player)
	-- Try to load from backend first
	local userId = player.UserId
	local backendData = task.spawn(function()
		return BackendService.LoadPlayerData(userId)
	end)

	-- If backend has data, use it; otherwise fall back to local DataStore
	local data
	if backendData and backendData.success and backendData.data then
		data = backendData.data
		-- Convert backend format to local format
		data = {
			Money = data.total_currency or 0,
			TotalEarned = data.total_earned or 0,
			TotalEarnedEver = data.total_earned_ever or 0,
			Businesses = data.businesses or {},
			Upgrades = data.upgrades or {},
			PrestigeLevel = data.prestige_level or 0,
			PrestigePoints = data.prestige_points or 0,
			LastSaveTime = data.saved_at or os.time(),
		}
	else
		data = DataStoreService.LoadPlayerData(player)
	end

	PlayerDataCache[player] = data
	lastSaveTime[player] = os.time()

	-- Load pet data (persisted alongside player data)
	PlayerPetData[player] = data.PetData or {}

	-- Offline earnings: try backend first, then local calc
	local offlineEarnings = 0
	if data.LastSaveTime and os.time() - data.LastSaveTime > 60 then
		-- Try backend
		local offlineResult = task.spawn(function()
			return BackendService.GetOfflineEarnings(userId, data.LastSaveTime)
		end)

		if offlineResult and offlineResult.success and offlineResult.data then
			offlineEarnings = offlineResult.data.offline_earnings or 0
		else
			-- Fallback to local calculation
			offlineEarnings = IncomeService.CalcOfflineEarnings(data, data.LastSaveTime)
		end
	end

	if offlineEarnings > 0 then
		data.Money = (data.Money or 0) + offlineEarnings
		data.TotalEarned = (data.TotalEarned or 0) + offlineEarnings
		data.TotalEarnedEver = (data.TotalEarnedEver or 0) + offlineEarnings
	end

	SyncDataToClient(player)

	-- Send offline earnings popup
	if offlineEarnings > 0 then
		task.wait(1)
		ReplicatedStorage.OfflineEarnings:FireClient(player, offlineEarnings)
	end

	-- Auto-save loop every SAVE_INTERVAL seconds
	task.spawn(function()
		while task.wait(SAVE_INTERVAL) do
			if PlayerDataCache[player] then
				SavePlayerData(player)
				lastSaveTime[player] = os.time()
			end
		end
	end)

	print("[TycoonServer] Player joined:", player.Name, "| Backend:", backendData and backendData.success)
end

-- Player left
local function OnPlayerRemoving(player)
	if PlayerDataCache[player] then
		PlayerDataCache[player].LastSaveTime = os.time()
		PlayerDataCache[player].PetData = PlayerPetData[player] or {}
		SavePlayerData(player)
		PlayerDataCache[player] = nil
	end
	PlayerPetData[player] = nil
end

--[[
	Income loop — runs every Heartbeat tick
	From plan: Heartbeat every 1 second
]]
local incomeAccumulator = {}

RunService.Heartbeat:Connect(function(deltaTime)
	for player, data in pairs(PlayerDataCache) do
		local playerData = data
		if not playerData then continue end

		-- Skip income if player is in Menu phase
		if not GameStateMachine.CanEarnIncome(player) then continue end

		-- Per-business tick accumulation
		playerData._bizTickAccum = playerData._bizTickAccum or {}

		for businessId, bizData in pairs(playerData.Businesses) do
			local owned = bizData.owned or 0
			if owned <= 0 then continue end

			local business = BusinessConfig.BusinessById[businessId]
			if not business then continue end

			local tickRate = business.tickRate
			-- Apply pet speed bonus to tick rate
			local petSpeedMult = PetCompanions.CalcSynergyBonuses(PlayerPetData[player]).speed_mult
			local effectiveTickRate = tickRate / petSpeedMult

			playerData._bizTickAccum[businessId] = (playerData._bizTickAccum[businessId] or 0) + deltaTime

			while playerData._bizTickAccum[businessId] >= effectiveTickRate do
				playerData._bizTickAccum[businessId] = playerData._bizTickAccum[businessId] - effectiveTickRate

				local income = IncomeService.CalcBusinessTickIncome(
					businessId,
					owned,
					bizData.level or 1,
					playerData.PrestigeLevel or 0,
					playerData.Upgrades or {}
				)

				-- Apply pet companion bonuses (income multiplier + luck)
				income = PetCompanions.ApplyBonusesToIncome(
					income,
					PlayerPetData[player],
					playerData.PrestigeLevel or 0
				)

				-- Apply global event multiplier
				income = income * GameStateMachine.GetEventMultiplier()

				playerData.Money = (playerData.Money or 0) + income
				playerData.TotalEarned = (playerData.TotalEarned or 0) + income
				playerData.TotalEarnedEver = (playerData.TotalEarnedEver or 0) + income
			end
		end
	end
end)

--[[
	Periodic sync to clients every 5 seconds (UI updates)
]]
RunService.Heartbeat:Connect(function()
	task.wait(5)
	for player, _ in pairs(PlayerDataCache) do
		SyncDataToClient(player)
	end
end)

--[[
	Leaderboard sync every 60 seconds
]]
task.spawn(function()
	while task.wait(60) do
		for player, data in pairs(PlayerDataCache) do
			local earned = data.TotalEarned or 0
			if earned > 0 then
				task.spawn(function()
					BackendService.SubmitScore(player.UserId, earned)
				end)
			end
		end
	end
end)

--[[
	Remote event handlers
]]
local function SetupRemoteHandlers()

	ReplicatedStorage.PurchaseBusiness.OnServerEvent:Connect(function(player, businessId)
		local data = PlayerDataCache[player]
		if not data then return end

		local result = BusinessManager.PurchaseBusiness(data, businessId)
		SyncDataToClient(player)

		if result.success then
			ReplicatedStorage.PlaySound:FireClient(player, "purchase")
			SavePlayerData(player)
		else
			ReplicatedStorage.PlaySound:FireClient(player, "error")
		end
	end)

	ReplicatedStorage.SellBusiness.OnServerEvent:Connect(function(player, businessId)
		local data = PlayerDataCache[player]
		if not data then return end

		local result = BusinessManager.SellBusiness(data, businessId)
		SyncDataToClient(player)
		SavePlayerData(player)
	end)

	ReplicatedStorage.BuyUpgrade.OnServerEvent:Connect(function(player, upgradeId, businessId)
		local data = PlayerDataCache[player]
		if not data then return end

		local result = UpgradeService.PurchaseUpgrade(data, upgradeId, businessId)
		SyncDataToClient(player)

		if result.success then
			ReplicatedStorage.PlaySound:FireClient(player, "upgrade")
			SavePlayerData(player)
		else
			ReplicatedStorage.PlaySound:FireClient(player, "error")
		end
	end)

	ReplicatedStorage.Prestige.OnServerEvent:Connect(function(player)
		local data = PlayerDataCache[player]
		if not data then return end

		local result = PrestigeService.DoPrestige(data)
		SyncDataToClient(player)

		if result.success then
			ReplicatedStorage.PlaySound:FireClient(player, "prestige")
			SavePlayerData(player)
		end
	end)

	ReplicatedStorage.CollectIncome.OnServerEvent:Connect(function(player)
		-- Income auto-collects via the Heartbeat loop
		ReplicatedStorage.PlaySound:FireClient(player, "income")
	end)

	-- Pet purchase
	ReplicatedStorage:WaitForChild("PurchasePet").OnServerEvent:Connect(function(player, petId)
		local data = PlayerDataCache[player]
		if not data then return end

		local pets = PlayerPetData[player] or {}
		local result = PetCompanions.CanPurchasePet(petId, pets, data.Money)

		if not result.success then
			ReplicatedStorage.PlaySound:FireClient(player, "error")
			return
		end

		data.Money = data.Money - result.cost
		pets[petId] = { owned = true, level = 1 }
		PlayerPetData[player] = pets
		data.PetData = pets

		SyncDataToClient(player)
		ReplicatedStorage.PlaySound:FireClient(player, "purchase")
		SavePlayerData(player)
	end)

	-- Pet level up
	ReplicatedStorage:WaitForChild("LevelUpPet").OnServerEvent:Connect(function(player, petId)
		local data = PlayerDataCache[player]
		if not data then return end

		local pets = PlayerPetData[player] or {}
		local petInfo = pets[petId]
		if not petInfo or not petInfo.owned then
			ReplicatedStorage.PlaySound:FireClient(player, "error")
			return
		end

		local petDef = PetCompanions.PetById[petId]
		if not petDef then return end

		local currentLevel = petInfo.level or 1
		if currentLevel >= petDef.rarity.maxLevel then
			ReplicatedStorage.PlaySound:FireClient(player, "error")
			return
		end

		local cost = PetCompanions.GetLevelUpCost(petId, currentLevel)
		if data.Money < cost then
			ReplicatedStorage.PlaySound:FireClient(player, "error")
			return
		end

		data.Money = data.Money - cost
		pets[petId].level = currentLevel + 1
		PlayerPetData[player] = pets
		data.PetData = pets

		SyncDataToClient(player)
		ReplicatedStorage.PlaySound:FireClient(player, "upgrade")
		SavePlayerData(player)
	end)

	-- UI panel opened: set player phase to UI_ONLY equivalent
	if ReplicatedStorage:FindFirstChild("PanelOpened") then
		ReplicatedStorage.PanelOpened.OnServerEvent:Connect(function(player, panelId)
			GameStateMachine.SetPlayerPhase(player, GameStateMachine.Phases.PLAYING)
		end)
	end

	-- Pause toggle
	if ReplicatedStorage:FindFirstChild("TogglePause") then
		ReplicatedStorage.TogglePause.OnServerEvent:Connect(function(player)
			local current = GameStateMachine.GetEffectivePhase(player)
			if current == GameStateMachine.Phases.PAUSED then
				GameStateMachine.SetPlayerPhase(player, GameStateMachine.Phases.PLAYING)
			else
				GameStateMachine.SetPlayerPhase(player, GameStateMachine.Phases.PAUSED)
			end
		end)
	end
end

--[[
	Initialize
]]
SetupRemoteEvents()
Players.PlayerAdded:Connect(OnPlayerAdded)
Players.PlayerRemoving:Connect(OnPlayerRemoving)

for _, player in ipairs(Players:GetPlayers()) do
	task.spawn(OnPlayerAdded, player)
end

SetupRemoteHandlers()

print("[TycoonServer] Initialized — backend: http://localhost:8000")
