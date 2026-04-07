--[[
	GameStateMachine.lua
	Server-side game phase state machine per the architecture plan.
	Manages global and per-player game phases.

	Phases:
	  Menu      - Player is at the main menu, no income accrues
	  Playing   - Active gameplay, income accrues normally
	  Paused    - Player paused, income continues but UI is locked
	  Prestige  - Player is in the prestige selection screen
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local GameStateMachine = {}

-- Valid phase names
local PHASES = {
	MENU = "Menu",
	PLAYING = "Playing",
	PAUSED = "Paused",
	PRESTIGE = "Prestige",
}

GameStateMachine.Phases = PHASES

--[[
	Global game state (server-wide)
]]
local GlobalState = {
	Phase = PHASES.PLAYING,  -- default to playing
	StartTime = os.time(),
	EventActive = false,
	EventType = nil,         -- "seasonal" | "daily" | nil
	EventMultiplier = 1.0,
}

--[[
	Per-player state overrides
	PlayerState[player] = { phase, pauseReason, joinTime, ... }
]]
local PlayerState = {}

-- Remote event for global phase broadcasts
local function GetOrCreatePhaseEvent()
	if not ReplicatedStorage:FindFirstChild("GamePhaseChanged") then
		Instance.new("RemoteEvent", ReplicatedStorage).Name = "GamePhaseChanged"
	end
	return ReplicatedStorage.GamePhaseChanged
end

--[[
	Change global game phase (server-wide event)
]]
function GameStateMachine.SetGlobalPhase(newPhase)
	if not PHASES[newPhase] then
		warn("[GameStateMachine] Unknown phase:", newPhase)
		return false
	end

	local oldPhase = GlobalState.Phase
	if oldPhase == newPhase then return true end

	GlobalState.Phase = newPhase
	GlobalState.StartTime = os.time()

	local event = GetOrCreatePhaseEvent()
	event:FireAllClients({
		scope = "global",
		oldPhase = oldPhase,
		newPhase = newPhase,
	})

	print("[GameStateMachine] Global phase:", oldPhase, "->", newPhase)
	return true
end

--[[
	Set a per-player phase override
	Player phase overrides global phase for that player
]]
function GameStateMachine.SetPlayerPhase(player, newPhase)
	if not PHASES[newPhase] then
		warn("[GameStateMachine] Unknown player phase:", newPhase)
		return false
	end

	local oldPhase = PlayerState[player] and PlayerState[player].phase or GlobalState.Phase
	PlayerState[player] = PlayerState[player] or {}
	PlayerState[player].phase = newPhase
	PlayerState[player].lastChange = os.time()

	ReplicatedStorage.GamePhaseChanged:FireClient(player, {
		scope = "player",
		playerId = player.UserId,
		oldPhase = oldPhase,
		newPhase = newPhase,
		-- Include effective phase
		effectivePhase = newPhase,
	})

	print("[GameStateMachine] Player", player.Name, "phase:", oldPhase, "->", newPhase)
	return true
end

--[[
	Get the effective phase for a player (player override or global)
]]
function GameStateMachine.GetEffectivePhase(player)
	local ps = PlayerState[player]
	if ps and ps.phase then
		return ps.phase
	end
	return GlobalState.Phase
end

--[[
	Check if a player is in a specific phase
]]
function GameStateMachine.IsInPhase(player, phase)
	return GameStateMachine.GetEffectivePhase(player) == phase
end

--[[
	Check if income should accrue for a player (not in Menu phase)
]]
function GameStateMachine.CanEarnIncome(player)
	local phase = GameStateMachine.GetEffectivePhase(player)
	return phase ~= PHASES.MENU
end

--[[
	Activate a game-wide event (seasonal/daily boost)
	Multiplier applies to all income while active
]]
function GameStateMachine.StartEvent(eventType, multiplier)
	GlobalState.EventActive = true
	GlobalState.EventType = eventType
	GlobalState.EventMultiplier = multiplier or 1.0

	GetOrCreatePhaseEvent():FireAllClients({
		scope = "event",
		eventType = eventType,
		multiplier = multiplier,
		active = true,
	})

	print("[GameStateMachine] Event started:", eventType, "x" .. tostring(multiplier))
end

function GameStateMachine.EndEvent()
	GlobalState.EventActive = false
	GlobalState.EventType = nil
	GlobalState.EventMultiplier = 1.0

	GetOrCreatePhaseEvent():FireAllClients({
		scope = "event",
		active = false,
	})

	print("[GameStateMachine] Event ended")
end

function GameStateMachine.GetEventMultiplier()
	if not GlobalState.EventActive then return 1.0 end
	return GlobalState.EventMultiplier
end

function GameStateMachine.GetGlobalPhase()
	return GlobalState.Phase
end

--[[
	Clean up player state on leave
]]
Players.PlayerRemoving:Connect(function(player)
	PlayerState[player] = nil
end)

return GameStateMachine
