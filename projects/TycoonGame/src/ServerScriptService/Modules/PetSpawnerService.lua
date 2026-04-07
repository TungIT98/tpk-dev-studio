--[[
	PetSpawnerService.lua
	Server-side module for wild pet spawning and catching mechanic.

	Design:
	- Wild pets spawn periodically at random locations in the tycoon world
	- Players can attempt to catch wild pets by clicking/tapping during a mini-game
	- Catch success rate based on reaction time and pet rarity
	- Each wild pet has a limited spawn duration before it despawns
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

-- Pet Companions module
local PetCompanions = require(script.Parent.Parent.Parent.ReplicatedStorage.Modules.PetCompanions)

-- Configuration
local CONFIG = {
	SPAWN_INTERVAL = 120, -- seconds between wild pet spawns
	MAX_WILD_PETS = 5, -- maximum wild pets at once
	WILD_PET_LIFETIME = 60, -- seconds before wild pet despawns
	CATCH_WINDOW = 3, -- seconds player has to catch after clicking
	CATCH_RADIUS = 10, -- studs distance to interact with wild pet
}

-- Wild pet state
local WildPets = {} -- { [petId] = { model, rarity, type, spawnTime, catchAttempts } }
local PetCatchingState = {} -- { [player] = { wildPetId, catchStartTime, catchClicks } }

-- Remote events
local function SetupRemoteEvents()
	local eventNames = {
		"SpawnWildPet",
		"RemoveWildPet",
		"StartCatchAttempt",
		"CatchAttemptClick",
		"CatchResult",
		"WildPetList",
	}
	for _, name in ipairs(eventNames) do
		if not ReplicatedStorage:FindFirstChild(name) then
			Instance.new("RemoteEvent", ReplicatedStorage).Name = name
		end
	end
end

-- Create wild pet model
local function CreateWildPetModel(petDef)
	local model = Instance.new("Model")
	model.Name = "WildPet_" .. petDef.id

	-- Body
	local body = Instance.new("Part")
	body.Name = "Body"
	body.Size = Vector3.new(2, 2, 2)
	body.Shape = Enum.PartType.Block
	body.Material = Enum.Material.Neon
	body.Color = petDef.rarity.color
	body.Anchored = true
	body.CanCollide = false
	body.Parent = model

	-- Billboard for pet name
	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.new(0, 100, 0, 40)
	billboard.StudsOffset = Vector3.new(0, 3, 0)
	billboard.Adornee = body
	billboard.Parent = body

	local nameLabel = Instance.new("TextLabel")
	nameLabel.Size = UDim2.new(1, 0, 1, 0)
	nameLabel.BackgroundTransparency = 0.5
	nameLabel.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
	nameLabel.TextColor3 = Color3.new(1, 1, 1)
	nameLabel.Text = petDef.name .. " (Wild!)"
	nameLabel.TextScaled = true
	nameLabel.Font = Enum.Font.GothamBold
	nameLabel.Parent = billboard

	-- Sparkle effect
	local particles = Instance.new("ParticleEmitter")
	particles.Color = ColorSequence.new(petDef.rarity.color)
	particles.LightEmission = 0.5
	particles.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.5),
		NumberSequenceKeypoint.new(1, 0),
	})
	particles.Lifetime = NumberRange.new(0.5, 1)
	particles.Rate = 20
	particles.Speed = NumberRange.new(1, 3)
	particles.SpreadAngle = Vector2.new(360, 360)
	particles.Parent = body

	-- Click detector for catch attempt
	local clickDetector = Instance.new("ClickDetector")
	clickDetector.MaxActivationDistance = CONFIG.CATCH_RADIUS
	clickDetector.CursorIcon = "rbxassetid://6031068429"
	clickDetector.Parent = body

	return model, clickDetector
end

-- Select random wild pet based on rarity weights
local function SelectRandomWildPet()
	local pets = PetCompanions.Pets
	-- Weight by rarity: Common 50%, Rare 30%, Epic 15%, Legendary 5%
	local roll = math.random()
	local rarityTarget
	if roll < 0.50 then
		rarityTarget = "common"
	elseif roll < 0.80 then
		rarityTarget = "rare"
	elseif roll < 0.95 then
		rarityTarget = "epic"
	else
		rarityTarget = "legendary"
	end

	-- Filter by rarity and pick random
	local candidates = {}
	for _, pet in ipairs(pets) do
		if pet.rarity.id == rarityTarget then
			table.insert(candidates, pet)
		end
	end

	if #candidates == 0 then
		candidates = pets -- fallback to any pet
	end

	return candidates[math.random(1, #candidates)]
end

-- Get random spawn position in the world
local function GetRandomSpawnPosition()
	-- Spawn within a ring around the tycoon area
	local angle = math.random() * math.pi * 2
	local distance = 50 + math.random() * 50 -- 50-100 studs from center
	local x = math.cos(angle) * distance
	local z = math.sin(angle) * distance
	return Vector3.new(x, 3, z) -- y=3 for floating pet
end

-- Spawn a wild pet
local function SpawnWildPet()
	if #WildPets >= CONFIG.MAX_WILD_PETS then
		return nil -- Max pets reached
	end

	local petDef = SelectRandomWildPet()
	local position = GetRandomSpawnPosition()

	local model, clickDetector = CreateWildPetModel(petDef)
	model.PrimaryPart = model:FindFirstChild("Body")
	if model.PrimaryPart then
		model:SetPrimaryPartCFrame(CFrame.new(position))
	end
	model.Parent = workspace

	local wildPetId = #WildPets + 1
	WildPets[wildPetId] = {
		model = model,
		petDef = petDef,
		spawnTime = tick(),
		catchAttempts = 0,
		position = position,
	}

	-- Notify all clients
	ReplicatedStorage.SpawnWildPet:FireAllClients(wildPetId, petDef.id, petDef.name, petDef.rarity.id, position)

	-- Schedule despawn
	task.delay(CONFIG.WILD_PET_LIFETIME, function()
		if WildPets[wildPetId] then
			RemoveWildPet(wildPetId)
		end
	end)

	return wildPetId
end

-- Remove a wild pet
function RemoveWildPet(wildPetId)
	local wildPet = WildPets[wildPetId]
	if wildPet then
		-- Despawn animation
		if wildPet.model and wildPet.model.Parent then
			local body = wildPet.model:FindFirstChild("Body")
			if body then
				local tween = TweenService:Create(
					body,
					TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					{ Transparency = 1, Size = Vector3.new(0.1, 0.1, 0.1) }
				)
				tween:Play()
				tween.Completed:Wait()
			end
			wildPet.model:Destroy()
		end

		WildPets[wildPetId] = nil
		ReplicatedStorage.RemoveWildPet:FireAllClients(wildPetId)
	end
end

-- Calculate catch chance based on clicks and time
local function CalculateCatchChance(wildPetId, clickCount, elapsedTime)
	local wildPet = WildPets[wildPetId]
	if not wildPet then return 0 end

	local baseChance = 0.1 -- 10% base chance

	-- More clicks = higher chance (up to a point)
	local clickBonus = math.min(clickCount * 0.05, 0.3) -- up to +30%

	-- Faster clicks = higher chance
	local timeBonus = math.max(0, (CONFIG.CATCH_WINDOW - elapsedTime) / CONFIG.CATCH_WINDOW) * 0.2

	-- Rarity affects catch difficulty (legendary is harder)
	local rarityMult = {
		common = 1.0,
		rare = 0.8,
		epic = 0.6,
		legendary = 0.4,
	}
	local rarityModifier = rarityMult[wildPet.petDef.rarity.id] or 1.0

	local totalChance = (baseChance + clickBonus + timeBonus) * rarityModifier
	return math.min(totalChance, 0.95) -- Cap at 95%
end

-- Handle catch attempt click
local function OnCatchClick(player, wildPetId)
	local wildPet = WildPets[wildPetId]
	if not wildPet then
		return false
	end

	-- Check if player is within range
	local character = player.Character
	if not character then return false end

	local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
	if not humanoidRootPart then return false end

	local distance = (humanoidRootPart.Position - wildPet.position).Magnitude
	if distance > CONFIG.CATCH_RADIUS then
		return false
	end

	-- Initialize catching state if not already catching
	if not PetCatchingState[player] or PetCatchingState[player].wildPetId ~= wildPetId then
		PetCatchingState[player] = {
			wildPetId = wildPetId,
			catchStartTime = tick(),
			catchClicks = 0,
		}
		-- Notify client of catch start
		ReplicatedStorage.StartCatchAttempt:FireClient(player, wildPetId, CONFIG.CATCH_WINDOW)
	end

	-- Increment click count
	PetCatchingState[player].catchClicks = PetCatchingState[player].catchClicks + 1

	-- Notify client of click
	ReplicatedStorage.CatchAttemptClick:FireClient(player, PetCatchingState[player].catchClicks)

	-- Check if catch window expired
	local elapsed = tick() - PetCatchingState[player].catchStartTime
	if elapsed >= CONFIG.CATCH_WINDOW then
		-- Window expired, failed catch
		local chance = CalculateCatchChance(wildPetId, PetCatchingState[player].catchClicks, elapsed)
		local success = math.random() < chance

		ReplicatedStorage.CatchResult:FireClient(player, wildPetId, success, chance)

		if success then
			-- Transfer pet to player (would need to add to their pet inventory)
			-- For now, we just remove the wild pet
			RemoveWildPet(wildPetId)
		end

		PetCatchingState[player] = nil
		return success
	end

	return nil -- Still in progress
end

-- Get list of current wild pets (for newly joining players)
local function GetWildPetList(player)
	local list = {}
	for petId, petData in pairs(WildPets) do
		table.insert(list, {
			wildPetId = petId,
			petId = petData.petDef.id,
			petName = petData.petDef.name,
			rarity = petData.petDef.rarity.id,
			position = petData.position,
		})
	end
	return list
end

-- Setup event handlers
local function SetupEventHandlers()
	-- Client requests wild pet list
	ReplicatedStorage.WildPetList.OnServerEvent:Connect(function(player)
		local list = GetWildPetList(player)
		ReplicatedStorage.WildPetList:FireClient(player, list)
	end)

	-- Client catch click
	ReplicatedStorage.StartCatchAttempt.OnServerEvent:Connect(function(player, wildPetId)
		OnCatchClick(player, wildPetId)
	end)

	-- Catch click repeated (player clicking rapidly)
	ReplicatedStorage.CatchAttemptClick.OnServerEvent:Connect(function(player)
		local state = PetCatchingState[player]
		if state then
			OnCatchClick(player, state.wildPetId)
		end
	end)
end

-- Spawn loop
local function StartSpawnLoop()
	task.spawn(function()
		while true do
			task.wait(CONFIG.SPAWN_INTERVAL)
			if #WildPets < CONFIG.MAX_WILD_PETS then
				SpawnWildPet()
			end
		end
	end)
end

-- Player left - clean up catching state
local function OnPlayerRemoving(player)
	PetCatchingState[player] = nil
end

-- Initialize
SetupRemoteEvents()
SetupEventHandlers()
Players.PlayerRemoving:Connect(OnPlayerRemoving)

-- Spawn initial wild pet after short delay
task.delay(5, function()
	SpawnWildPet()
end)

StartSpawnLoop()

return {
	SpawnWildPet = SpawnWildPet,
	RemoveWildPet = RemoveWildPet,
	GetWildPets = function() return WildPets end,
}