/**
 * CollectionClient.ts
 * Typed HTTP client for the FastAPI /collections and /achievements endpoints.
 */

import type {
  CollectionAlbum,
  CollectionProgress,
  PlayerAchievement,
  AchievementClaimResult,
  CollectionStats,
  ItemRarity,
} from "../shared/types";

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
    throw new CollectionApiError(res.status, path, body);
  }
  return res.json() as Promise<T>;
}

export class CollectionApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: string,
  ) {
    super(`CollectionAPI ${status} ${path}: ${body}`);
    this.name = "CollectionApiError";
  }
}

// ── Collections ────────────────────────────────────────────────────────────────

export async function listCollections(theme?: string): Promise<CollectionAlbum[]> {
  const qs = theme ? `?theme=${encodeURIComponent(theme)}` : "";
  return apiFetch<CollectionAlbum[]>(`/api/collections${qs}`);
}

export async function getCollection(collectionId: string): Promise<CollectionAlbum> {
  return apiFetch<CollectionAlbum>(`/api/collections/${collectionId}`);
}

export async function getCollectionProgress(
  collectionId: string,
  userId: string,
): Promise<CollectionProgress> {
  return apiFetch<CollectionProgress>(
    `/api/collections/${collectionId}/progress?user_id=${encodeURIComponent(userId)}`,
  );
}

export async function claimAchievementReward(
  achievementId: string,
  userId: string,
): Promise<AchievementClaimResult> {
  return apiFetch<AchievementClaimResult>(
    `/api/achievements/${achievementId}/claim?user_id=${encodeURIComponent(userId)}`,
    { method: "POST" },
  );
}

// ── Achievements ───────────────────────────────────────────────────────────────

export async function listAchievements(category?: string): Promise<PlayerAchievement[]> {
  return apiFetch<PlayerAchievement[]>(`/api/achievements`);
}

export async function getPlayerAchievements(userId: string): Promise<PlayerAchievement[]> {
  return apiFetch<PlayerAchievement[]>(`/api/player/${encodeURIComponent(userId)}/achievements`);
}

export async function getPlayerCollectionStats(userId: string): Promise<CollectionStats> {
  return apiFetch<CollectionStats>(`/api/player/${encodeURIComponent(userId)}/collection-stats`);
}

export interface CollectionItemDetail {
  item_id: string;
  name: string;
  rarity: ItemRarity;
  description: string | null;
  how_to_obtain: string | null;
}

export async function getItemDetail(collectionId: string, itemId: string): Promise<CollectionItemDetail> {
  return apiFetch<CollectionItemDetail>(`/api/collections/${collectionId}/items/${encodeURIComponent(itemId)}`);
}
