// ── Seasonal Event Types ───────────────────────────────────────────────────────
// Mirrors backend FastAPI schemas in app/schemas/schemas.py

export type EventStatus = "upcoming" | "active" | "ended";
export type EventType = "holiday" | "limited_quest" | "competitive" | "story";

export interface SeasonalEvent {
  event_id: string;
  name: string;
  description: string | null;
  event_type: EventType;
  start_date: string;    // ISO datetime string
  end_date: string;      // ISO datetime string
  status: EventStatus;
  reward_currency_name: string | null;
  exclusive_item_ids: string[];
  banner_color: string | null;
}

export interface EventQuest {
  quest_id: string;
  event_id: string;
  name: string;
  description: string | null;
  mission_type: string;
  target_value: number;
  points_reward: number;
  currency_reward: number;
  gem_reward: number;
  is_active: boolean;
}

export interface EventLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  score: number;
  rewards_distributed: boolean;
}

export interface EventLeaderboardResponse {
  event_id: string;
  entries: EventLeaderboardEntry[];
  total: number;
}

export interface PlayerQuestProgress {
  quest_id: string;
  name: string;
  completed: boolean;
  reward_claimed: boolean;
  progress: number;
  target: number;
}

export interface PlayerEventCurrency {
  name: string;
  balance: number;
}

export interface PlayerEventStatus {
  event_id: string;
  user_id: string;
  event_status: EventStatus;
  total_points: number;
  event_currency: PlayerEventCurrency | null;
  quests: PlayerQuestProgress[];
}

// ── Event Join ──────────────────────────────────────────────────────────────

export interface JoinEventRequest {
  user_id: string;
  username: string;
}

export interface JoinEventResponse {
  joined: boolean;
  already_joined: boolean;
}

// ── Event Earn ──────────────────────────────────────────────────────────────

export interface EarnPointsRequest {
  quest_id: string;
  user_id: string;
  delta: number;
}

export interface EarnPointsResponse {
  quest_id: string;
  new_progress: number;
  target: number;
  completed: boolean;
  total_points: number;
}

// ── Event Claim ─────────────────────────────────────────────────────────────

export interface ClaimQuestRequest {
  quest_id: string;
  user_id: string;
}

export interface ClaimQuestResponse {
  event_id: string;
  quest_id: string;
  user_id: string;
  points_earned: number;
  currency_reward: number;
  gem_reward: number;
  already_claimed: boolean;
}

// ── UI helpers ──────────────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  holiday: "Holiday",
  limited_quest: "Limited Quest",
  competitive: "Competitive",
  story: "Story",
};

export const EVENT_TYPE_COLORS: Record<EventType, number> = {
  holiday: 0xff6644,
  limited_quest: 0x44aaff,
  competitive: 0xff4488,
  story: 0xcc88ff,
};

export const EVENT_TYPE_HEX: Record<EventType, string> = {
  holiday: "#ff6644",
  limited_quest: "#44aaff",
  competitive: "#ff4488",
  story: "#cc88ff",
};

export const EVENT_TYPE_EMOJI: Record<EventType, string> = {
  holiday: "🎉",
  limited_quest: "📋",
  competitive: "🏆",
  story: "📖",
};

/**
 * Format a countdown string from an end_date ISO string.
 * Returns e.g. "2d 5h", "3h 12m", "45m", "ended"
 */
export function formatCountdown(endDateIso: string, now?: Date): string {
  const end = new Date(endDateIso).getTime();
  const start = (now ?? new Date()).getTime();
  const diffMs = end - start;

  if (diffMs <= 0) return "Ended";

  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Format a countdown from start_date (time until event begins)
 */
export function formatTimeUntil(startDateIso: string, now?: Date): string {
  const start = new Date(startDateIso).getTime();
  const cur = (now ?? new Date()).getTime();
  const diffMs = start - cur;

  if (diffMs <= 0) return "Starting now!";

  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);

  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${mins}m`;
  return `Starts in ${mins}m`;
}
