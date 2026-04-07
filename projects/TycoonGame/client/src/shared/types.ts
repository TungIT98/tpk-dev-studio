// Shared types between Colyseus client and server
// These mirror the Colyseus schema definitions on the server side

export interface PlayerSchema {
  sessionId: string;
  userId: string;
  username: string;
  money: number;
  totalEarned: number;
  prestigeLevel: number;
  prestigePoints: number;
  businessCount: number;
  x: number;
  y: number;
  ready: boolean;
}

export interface BusinessState {
  id: number;
  ownerId: string | null;
  level: number;
  incomePerTick: number;
}

export interface RoomState {
  players: Record<string, PlayerSchema>;
  gameTick: number;
  phase: "lobby" | "playing" | "minigame" | "trading" | "results";
  minigameType: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalEarned: number;
  prestigeLevel: number;
}

// RPC message types
export interface ChatMessage {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  channel: "global" | "room" | "trade";
}

export interface RPCMessages {
  // Client -> Server
  "player:move": { x: number; y: number };
  "player:ready": { ready: boolean };
  "player:action": { action: string; targetId?: string };
  "chat:send": { text: string; channel: "global" | "room" | "trade" };
  "leaderboard:request": { type: "global" | "weekly" | "prestige" };
  "pet:xp_gain": { instanceId: string; amount: number };

  // Server -> Client (broadcasts)
  "chat:receive": ChatMessage;
  "player:joined": PlayerSchema;
  "player:left": { sessionId: string };
  "room:phaseChanged": { phase: RoomState["phase"]; minigameType?: string };
  "leaderboard:update": { entries: LeaderboardEntry[] };
  "minigame:start": { type: string; duration: number };
  "minigame:end": { winnerId?: string; scores: Record<string, number> };
  "pet:level_up": { instanceId: string; newLevel: number };
  "pet:evolved": { instanceId: string; newPetTypeId: string; newLevel: number };
}

// ── Pet System Types ──────────────────────────────────────────────────────────

export type PetRarity = "common" | "rare" | "epic" | "legendary";

export interface PetStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface PetTypeDefinition {
  pet_type_id: string;
  name: string;
  description: string;
  rarity: PetRarity;
  base_cost: number;
  unlock_level: number;
  evolve_to: string | null;       // pet_type_id of evolved form (null = final form)
  stage: number;                  // 1, 2, or 3
  base_stats: PetStats;           // stats at level 1
  growth_stats: PetStats;         // stat increase per level
  max_level: number;              // level cap
  color: number;                  // Phaser color for sprite
  shape: "circle" | "diamond" | "star" | "blob"; // sprite shape
  icon_emoji: string;              // fallback emoji
}

export interface PetInstance {
  instance_id: string;
  pet_type_id: string;
  nickname: string | null;
  level: number;
  experience: number;
  evolve_level_req: number;
  is_equipped: boolean;
  is_active: boolean;
  acquired_at: string;
  pet_type?: PetTypeDefinition;
}

export interface PetSkill {
  skill_id: string;
  name: string;
  level: number;
  cooldown_remaining: number;
  is_active: boolean;
}

export interface PetEquipment {
  equipment_id: string;
  slot: "head" | "body" | "accessory";
  name: string;
  rarity: PetRarity | null;
  bonus_type: string | null;   // "hp", "atk", "def", "spd"
  bonus_value: number;
  is_active: boolean;
}

export interface PetFullInstance extends PetInstance {
  skills: PetSkill[];
  equipment: PetEquipment[];
}

// Derived stats at a given level (before equipment bonuses)
export function computeBaseStats(petType: PetTypeDefinition, level: number): PetStats {
  return {
    hp: Math.floor(petType.base_stats.hp + petType.growth_stats.hp * (level - 1)),
    atk: Math.floor(petType.base_stats.atk + petType.growth_stats.atk * (level - 1)),
    def: Math.floor(petType.base_stats.def + petType.growth_stats.def * (level - 1)),
    spd: Math.floor(petType.base_stats.spd + petType.growth_stats.spd * (level - 1)),
  };
}

// Equipment stat bonus totals
export function computeEquipmentBonus(equipment: PetEquipment[]): PetStats {
  const bonus: PetStats = { hp: 0, atk: 0, def: 0, spd: 0 };
  for (const eq of equipment) {
    if (eq.is_active && eq.bonus_type && eq.bonus_value) {
      const key = eq.bonus_type as keyof PetStats;
      if (key in bonus) bonus[key] += eq.bonus_value;
    }
  }
  return bonus;
}

// XP needed to reach a given level (exponential curve)
export function xpForLevel(level: number, maxLevel: number = 100): number {
  const base = 100;
  const factor = 1.15;
  return Math.floor(base * Math.pow(factor, level - 1));
}

// Total XP accumulated across all levels up to (but not including) a given level
export function totalXpForLevel(level: number, maxLevel: number = 100): number {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += xpForLevel(l, maxLevel);
  }
  return total;
}

// Fraction of progress within the current level [0..1)
export function xpProgressInLevel(xp: number, level: number, maxLevel: number = 100): number {
  if (level >= maxLevel) return 1;
  const levelStart = totalXpForLevel(level, maxLevel);
  const levelEnd = totalXpForLevel(level + 1, maxLevel);
  return Math.min(1, Math.max(0, (xp - levelStart) / (levelEnd - levelStart)));
}

// ── Collection System Types ───────────────────────────────────────────────────

export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export interface CollectionAlbum {
  collection_id: string;
  name: string;
  description: string | null;
  theme: string | null;
  required_item_ids: string[];
  total_items: number;
  milestone_rewards: Record<string, MilestoneReward>;
  completion_reward: Record<string, number>;
  is_active: boolean;
}

export interface MilestoneReward {
  currency?: number;
  gems?: number;
}

export interface CollectionProgress {
  user_id: string;
  collection_id: string;
  collected_item_ids: string[];
  progress_percent: number;
  claimed_milestones: number[];
  completed: boolean;
  total_reward_claimed: number;
}

// ── Achievement Types ─────────────────────────────────────────────────────────

export interface AchievementDef {
  achievement_id: string;
  name: string;
  description: string | null;
  category: string;
  target_value: number;
  reward_currency: number;
  reward_gems: number;
  is_active: boolean;
  is_hidden: boolean;        // hidden achievements show "???" until unlocked
  how_to_obtain: string | null; // hint shown after unlock
}

export interface PlayerAchievement {
  user_id: string;
  achievement_id: string;
  achievement: AchievementDef;
  progress: number;
  completed: boolean;
  reward_claimed: boolean;
  completed_at: string | null;
}

export interface CollectionStats {
  total_items: number;
  collected_items: number;
  total_achievements: number;
  unlocked_achievements: number;
  rarity_breakdown: Record<ItemRarity, number>;
}

export interface AchievementClaimResult {
  achievement_id: string;
  user_id: string;
  reward_currency: number;
  reward_gems: number;
  already_claimed: boolean;
}

// ── Rarity helpers ─────────────────────────────────────────────────────────────

export const RARITY_COLORS_HEX: Record<ItemRarity, string> = {
  common:    "#ffffff",
  rare:      "#4488ff",
  epic:      "#aa44ff",
  legendary: "#ffcc00",
};

export const RARITY_COLORS_NUM: Record<ItemRarity, number> = {
  common:    0xffffff,
  rare:      0x4488ff,
  epic:      0xaa44ff,
  legendary: 0xffcc00,
};

export const RARITY_GLOW_ALPHA: Record<ItemRarity, number> = {
  common:    0,
  rare:      0.35,
  epic:      0.50,
  legendary: 0.70,
};
