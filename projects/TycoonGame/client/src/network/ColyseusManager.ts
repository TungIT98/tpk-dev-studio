/**
 * ColyseusManager.ts
 * Core Colyseus client manager for TycoonGame multiplayer.
 * Handles WebSocket connection, room management, schema state sync,
 * RPC messaging, player presence, and chat.
 */

import { Client, Room } from "colyseus.js";
import { CONFIG } from "../config";
import type { RoomState, PlayerSchema, ChatMessage, LeaderboardEntry } from "../shared/types";

// ─── Events interface ─────────────────────────────────────────────────────────
export type ColyseusEventMap = {
  "connect": () => void;
  "disconnect": (code: number, reason: string) => void;
  "error": (err: Error) => void;
  "room:joined": (room: Room<RoomState>) => void;
  "room:left": (code: number) => void;
  "player:joined": (player: PlayerSchema) => void;
  "player:left": (sessionId: string) => void;
  "state:change": (state: RoomState) => void;
  "chat:message": (msg: ChatMessage) => void;
  "leaderboard:update": (entries: LeaderboardEntry[]) => void;
  "phase:changed": (phase: string, minigameType?: string) => void;
  "minigame:start": (type: string, duration: number) => void;
  "minigame:end": (winnerId: string | undefined, scores: Record<string, number>) => void;
};

// ─── Schema → plain object helpers ───────────────────────────────────────────
function schemaToPlayer(raw: any): PlayerSchema {
  return {
    sessionId: raw.sessionId ?? "",
    userId: raw.userId ?? "",
    username: raw.username ?? "Unknown",
    money: raw.money ?? 0,
    totalEarned: raw.totalEarned ?? 0,
    prestigeLevel: raw.prestigeLevel ?? 0,
    prestigePoints: raw.prestigePoints ?? 0,
    businessCount: raw.businessCount ?? 0,
    x: raw.x ?? 0,
    y: raw.y ?? 0,
    ready: raw.ready ?? false,
  };
}

// ─── ColyseusManager singleton ─────────────────────────────────────────────────
export class ColyseusManager {
  private static _instance: ColyseusManager;
  private client!: Client;
  private currentRoom: Room<RoomState> | null = null;

  // Event emitter map: event -> Set<callback>
  private listeners = new Map<string, Set<Function>>();

  // Connection state
  public connected = false;
  public connecting = false;
  public localPlayer: PlayerSchema | null = null;

  private constructor() {}

  static get instance(): ColyseusManager {
    if (!ColyseusManager._instance) {
      ColyseusManager._instance = new ColyseusManager();
    }
    return ColyseusManager._instance;
  }

  // ── Event emitter ──────────────────────────────────────────────────────────
  on<K extends keyof ColyseusEventMap>(event: K, cb: ColyseusEventMap[K]): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  off<K extends keyof ColyseusEventMap>(event: K, cb: ColyseusEventMap[K]): void {
    this.listeners.get(event)?.delete(cb);
  }

  private emit<K extends keyof ColyseusEventMap>(event: K, ...args: Parameters<ColyseusEventMap[K]>): void {
    this.listeners.get(event)?.forEach(cb => (cb as Function)(...args));
  }

  // ── Connection ─────────────────────────────────────────────────────────────
  /**
   * Establish WebSocket connection to Colyseus gateway.
   * The ColyseusClient auto-discovers rooms at the same host.
   */
  async connect(): Promise<void> {
    if (this.connecting || this.connected) return;
    this.connecting = true;

    try {
      this.client = new Client(CONFIG.COLYEUS_URL);
      this.connected = true;
      this.connecting = false;
      console.log("[ColyseusManager] Connected to", CONFIG.COLYEUS_URL);
      this.emit("connect");
    } catch (err) {
      this.connecting = false;
      this.connected = false;
      console.error("[ColyseusManager] Connection failed:", err);
      this.emit("error", err as Error);
      throw err;
    }
  }

  /**
   * Disconnect from Colyseus server and leave current room.
   */
  disconnect(code = 1000): void {
    if (this.currentRoom) {
      this.currentRoom.leave(false);
      this.currentRoom = null;
    }
    this.connected = false;
    this.localPlayer = null;
    console.log("[ColyseusManager] Disconnected");
  }

  // ── Room management ────────────────────────────────────────────────────────
  /**
   * Join a Colyseus room by name.
   * @param roomName  One of CONFIG.ROOMS
   * @param options   Optional join options (e.g. { username, userId })
   */
  async joinRoom(
    roomName: string,
    options: Record<string, unknown> = {}
  ): Promise<Room<RoomState>> {
    if (!this.connected) await this.connect();

    // Leave previous room if any
    if (this.currentRoom) {
      this.currentRoom.leave(false);
    }

    try {
      const room: Room<RoomState> = await this.client.joinOrCreate<RoomState>(roomName, {
        username: options.username ?? `Player_${Math.floor(Math.random() * 9999)}`,
        userId: options.userId ?? "",
        ...options,
      });

      this.currentRoom = room;
      this.setupRoomListeners(room);
      console.log(`[ColyseusManager] Joined room: ${roomName}, sessionId: ${room.sessionId}`);
      this.emit("room:joined", room);
      return room;
    } catch (err) {
      console.error("[ColyseusManager] Failed to join room:", err);
      this.emit("error", err as Error);
      throw err;
    }
  }

  /**
   * Leave the current room.
   */
  leaveRoom(code = 1000): void {
    if (!this.currentRoom) return;
    const roomId = this.currentRoom.roomId;
    this.currentRoom.leave(true);
    this.currentRoom = null;
    this.localPlayer = null;
    console.log("[ColyseusManager] Left room:", roomId);
    this.emit("room:left", code);
  }

  // ── Room state & listener setup ────────────────────────────────────────────
  private setupRoomListeners(room: Room<RoomState>): void {
    // Track local player once state is available
    room.onStateChange((state) => {
      const sid = room.sessionId;
      if (sid && !this.localPlayer) {
        const players = (state as any).players as Map<string, any> | undefined;
        const raw = players?.get?.(sid);
        if (raw) this.localPlayer = schemaToPlayer(raw);
      }
      this.emit("state:change", this.stateToPlain(state));
    });

    // Player presence via Colyseus MapSchema
    const players = (room.state as any).players as { onAdd?: Function; onRemove?: Function } | undefined;
    players?.onAdd?.((player: any, sessionId: string) => {
      if (typeof player?.onChange === "function") {
        player.onChange(() => {
          this.emit("player:joined", schemaToPlayer(player));
        }, true);
      } else {
        this.emit("player:joined", schemaToPlayer(player));
      }
    });

    players?.onRemove?.((_player: any, sessionId: string) => {
      this.emit("player:left", sessionId);
    });

    // Lifecycle
    room.onMessage("chat:receive", (message: ChatMessage) => {
      this.emit("chat:message", message);
    });

    room.onMessage("leaderboard:update", (message: { entries: LeaderboardEntry[] }) => {
      this.emit("leaderboard:update", message.entries);
    });

    room.onMessage("room:phaseChanged", (message: { phase: string; minigameType?: string }) => {
      this.emit("phase:changed", message.phase, message.minigameType);
    });

    room.onMessage("minigame:start", (message: { type: string; duration: number }) => {
      this.emit("minigame:start", message.type, message.duration);
    });

    room.onMessage("minigame:end", (message: { winnerId?: string; scores: Record<string, number> }) => {
      this.emit("minigame:end", message.winnerId, message.scores);
    });

    // Connection events
    room.onLeave((code) => {
      this.emit("room:left", code);
    });

    room.onError((code, message) => {
      console.error(`[ColyseusManager] Room error: ${code} - ${message}`);
      this.emit("error", new Error(`Room error ${code}: ${message}`));
    });
  }

  // ── State serialization ────────────────────────────────────────────────────
  private stateToPlain(state: RoomState): RoomState {
    const players: Record<string, PlayerSchema> = {};
    const rawPlayers = (state as any).players as Map<string, any> | undefined;
    if (rawPlayers) {
      for (const [sid, raw] of rawPlayers.entries()) {
        players[sid] = schemaToPlayer(raw);
      }
    }
    return {
      players,
      gameTick: (state as any).gameTick ?? 0,
      phase: (state as any).phase ?? "lobby",
      minigameType: (state as any).minigameType ?? null,
    };
  }

  // ── RPC helpers ────────────────────────────────────────────────────────────
  get room(): Room<RoomState> | null {
    return this.currentRoom;
  }

  get sessionId(): string | null {
    return this.currentRoom?.sessionId ?? null;
  }

  /**
   * Send a player movement update.
   */
  sendMove(x: number, y: number): void {
    this.currentRoom?.send("player:move", { x, y });
  }

  /**
   * Mark player as ready (for minigame / round start).
   */
  sendReady(ready: boolean): void {
    this.currentRoom?.send("player:ready", { ready });
  }

  /**
   * Send a chat message in a channel.
   */
  sendChat(text: string, channel: "global" | "room" | "trade" = "room"): void {
    if (!text.trim()) return;
    this.currentRoom?.send("chat:send", { text: text.trim().slice(0, 200), channel });
  }

  /**
   * Request leaderboard data.
   */
  requestLeaderboard(type: "global" | "weekly" | "prestige" = "global"): void {
    this.currentRoom?.send("leaderboard:request", { type });
  }

  /**
   * Perform a game action (buy business, collect income, etc.).
   */
  sendAction(action: string, targetId?: string): void {
    this.currentRoom?.send("player:action", { action, targetId });
  }
}

export const colyseus = ColyseusManager.instance;
