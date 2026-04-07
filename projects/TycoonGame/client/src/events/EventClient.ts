/**
 * EventClient.ts
 * Typed HTTP client for the FastAPI /events endpoints.
 */

import type {
  SeasonalEvent,
  EventQuest,
  EventLeaderboardResponse,
  PlayerEventStatus,
  JoinEventRequest,
  JoinEventResponse,
  EarnPointsRequest,
  EarnPointsResponse,
  ClaimQuestRequest,
  ClaimQuestResponse,
} from "../shared/EventTypes";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new EventApiError(res.status, path, body);
  }
  return res.json() as Promise<T>;
}

export class EventApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: string,
  ) {
    super(`EventAPI ${status} ${path}: ${body}`);
    this.name = "EventApiError";
  }
}

// ── Event Calendar ─────────────────────────────────────────────────────────────

export async function listEvents(status?: string): Promise<SeasonalEvent[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<SeasonalEvent[]>(`/api/events${qs}`);
}

export async function listActiveEvents(): Promise<SeasonalEvent[]> {
  return apiFetch<SeasonalEvent[]>("/api/events/active");
}

export async function getEvent(eventId: string): Promise<SeasonalEvent> {
  return apiFetch<SeasonalEvent>(`/api/events/${encodeURIComponent(eventId)}`);
}

export async function getEventQuests(eventId: string): Promise<EventQuest[]> {
  return apiFetch<EventQuest[]>(`/api/events/${encodeURIComponent(eventId)}/quests`);
}

// ── Event Leaderboard ────────────────────────────────────────────────────────

export async function getEventLeaderboard(
  eventId: string,
  limit = 100,
): Promise<EventLeaderboardResponse> {
  return apiFetch<EventLeaderboardResponse>(
    `/api/events/${encodeURIComponent(eventId)}/leaderboard?limit=${limit}`,
  );
}

// ── Join / Earn ───────────────────────────────────────────────────────────────

export async function joinEvent(
  eventId: string,
  req: JoinEventRequest,
): Promise<JoinEventResponse> {
  return apiFetch<JoinEventResponse>(
    `/api/events/${encodeURIComponent(eventId)}/join`,
    { method: "POST", body: JSON.stringify(req) },
  );
}

export async function earnPoints(
  eventId: string,
  req: EarnPointsRequest,
): Promise<EarnPointsResponse> {
  return apiFetch<EarnPointsResponse>(
    `/api/events/${encodeURIComponent(eventId)}/earn`,
    { method: "POST", body: JSON.stringify(req) },
  );
}

// ── Claim ─────────────────────────────────────────────────────────────────────

export async function claimQuestReward(
  eventId: string,
  req: ClaimQuestRequest,
): Promise<ClaimQuestResponse> {
  return apiFetch<ClaimQuestResponse>(
    `/api/events/${encodeURIComponent(eventId)}/claim`,
    { method: "POST", body: JSON.stringify(req) },
  );
}

// ── Player Status ─────────────────────────────────────────────────────────────

export async function getPlayerEventStatus(
  eventId: string,
  userId: string,
): Promise<PlayerEventStatus> {
  return apiFetch<PlayerEventStatus>(
    `/api/events/${encodeURIComponent(eventId)}/player/${encodeURIComponent(userId)}`,
  );
}
