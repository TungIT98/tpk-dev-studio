--[[
	WorkspaceSetup.lua
	Server script that creates the Tycoon game world.
]]

local Workspace = game:GetService("Workspace")

-- Create a simple spawn platform
local function CreateSpawnPoint()
	-- Spawn platform
	local platform = Instance.new("Part")
	platform.Name = "SpawnPlatform"
	platform.Size = Vector3.new(20, 1, 20)
	platform.Position = Vector3.new(0, 0, 0)
	platform.Anchored = true
	platform.CanCollide = true
	platform.Material = Enum.Material.SmoothPlastic
	platform.Color = Color3.fromRGB(40, 40, 60)
	platform.Parent = Workspace

	-- Spawn location
	local spawnLocation = Instance.new("SpawnLocation")
	spawnLocation.Size = Vector3.new(8, 1, 8)
	spawnLocation.Position = Vector3.new(0, 0.5, 0)
	spawnLocation.Anchored = true
	spawnLocation.Transparency = 1
	spawnLocation.CanCollide = false
	spawnLocation.Neutral = true
	spawnLocation.Parent = platform

	-- Tycoon base (per-player plot)
	-- We'll create a visual tycoon base that players will own
	local baseTemplate = Instance.new("Part")
	baseTemplate.Name = "TycoonBaseTemplate"
	baseTemplate.Size = Vector3.new(30, 2, 30)
	baseTemplate.Position = Vector3.new(0, -1, 0)
	baseTemplate.Anchored = true
	baseTemplate.Material = Enum.Material.Neon
	baseTemplate.Color = Color3.fromRGB(60, 60, 90)
	baseTemplate.CanCollide = true
	baseTemplate.Transparency = 0.3
	baseTemplate.Parent = Workspace

	-- World environment
	-- Floor
	local floor = Instance.new("Part")
	floor.Name = "WorldFloor"
	floor.Size = Vector3.new(200, 2, 200)
	floor.Position = Vector3.new(0, -3, 0)
	floor.Anchored = true
	floor.Material = Enum.Material.SmoothPlastic
	floor.Color = Color3.fromRGB(25, 25, 35)
	floor.CanCollide = true
	floor.Parent = Workspace

	-- Ambient lighting
	workspace.Terrain:Destroy() -- Clean workspace
	local lighting = game:GetService("Lighting")
	lighting.Ambient = Color3.fromRGB(30, 30, 50)
	lighting.Brightness = 1
	lighting.OutdoorAmbient = Color3.fromRGB(100, 120, 180)
	lighting.ClockTime = 14 -- Daytime

	-- Sky
	local sky = Instance.new("Sky")
	sky.Parent = lighting
	sky.CelestialBodiesShown = true
	sky.SkyboxBk = "rbxassetid://0"
	sky.SkyboxFt = "rbxassetid://0"

	print("[WorkspaceSetup] Tycoon world created")
end

CreateSpawnPoint()
