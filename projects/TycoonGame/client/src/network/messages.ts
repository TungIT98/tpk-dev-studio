/**
 * messages.ts
 * Typed wrappers around Colyseus send() calls.
 * Centralises all client->server RPC so scene code stays clean.
 */

import { colyseus } from "./ColyseusManager";
import type { RPCMessages } from "../shared/types";

export function sendMove(x: number, y: number): void {
  colyseus.sendMove(x, y);
}

export function sendReady(ready: boolean): void {
  colyseus.sendReady(ready);
}

export function sendChat(text: string, channel: "global" | "room" | "trade" = "room"): void {
  colyseus.sendChat(text, channel);
}

export function sendLeaderboardRequest(type: "global" | "weekly" | "prestige" = "global"): void {
  colyseus.requestLeaderboard(type);
}

export function sendAction(action: string, targetId?: string): void {
  colyseus.sendAction(action, targetId);
}
