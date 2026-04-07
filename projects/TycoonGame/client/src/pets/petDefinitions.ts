/**
 * petDefinitions.ts
 * Static pet type catalogue — mirrors data seeded on the backend.
 * Each pet has 2–3 evolution stages with escalating stats.
 *
 * Evolution chains:
 *   Shinx → Luxray        (2-stage: common → rare)
 *   Riolu → Lucario       (2-stage: common → epic)
 *   Bagon → Shelgon → Salamence  (3-stage: common → rare → legendary)
 *   Rowlet → Dartrix → Decidueye (3-stage: common → rare → epic)
 *   Litten → Torracat → Incineroar (3-stage: common → rare → epic)
 *   Popplio → Brionne → Primarina (3-stage: common → rare → epic)
 */

import type { PetTypeDefinition } from "../shared/types";

// Helper to build a 3-stat growth config from rarity
function growthForRarity(rarity: string): { hp: number; atk: number; def: number; spd: number } {
  switch (rarity) {
    case "legendary": return { hp: 15, atk: 14, def: 10, spd: 12 };
    case "epic":      return { hp: 12, atk: 11, def: 8,  spd: 10 };
    case "rare":      return { hp: 9,  atk: 8,  def: 6,  spd: 7  };
    default:          return { hp: 6,  atk: 5,  def: 4,  spd: 4  };
  }
}

// ── Pet type registry ──────────────────────────────────────────────────────────
export const PET_DEFINITIONS: Record<string, PetTypeDefinition> = {

  // ── Shinx evolution line ──────────────────────────────────────────────────────
  shinx: {
    pet_type_id: "shinx",
    name: "Shinx",
    description: "A playful light-fox that radiates a soft glow.",
    rarity: "common",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: "luxray",
    stage: 1,
    base_stats: { hp: 45, atk: 30, def: 15, spd: 20 },
    growth_stats: growthForRarity("common"),
    max_level: 20,
    color: 0xffdd00,
    shape: "circle",
    icon_emoji: "🌟",
  },
  luxray: {
    pet_type_id: "luxray",
    name: "Luxray",
    description: "Its golden mane crackles with fierce electricity.",
    rarity: "rare",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: null,
    stage: 2,
    base_stats: { hp: 80, atk: 75, def: 35, spd: 55 },
    growth_stats: growthForRarity("rare"),
    max_level: 50,
    color: 0xffaa00,
    shape: "circle",
    icon_emoji: "⚡",
  },

  // ── Riolu evolution line ─────────────────────────────────────────────────────
  riolu: {
    pet_type_id: "riolu",
    name: "Riolu",
    description: "An energetic fighting-type with boundless stamina.",
    rarity: "common",
    base_cost: 0,
    unlock_level: 5,
    evolve_to: "lucario",
    stage: 1,
    base_stats: { hp: 40, atk: 40, def: 25, spd: 35 },
    growth_stats: growthForRarity("common"),
    max_level: 25,
    color: 0x5566ff,
    shape: "diamond",
    icon_emoji: "💪",
  },
  lucario: {
    pet_type_id: "lucario",
    name: "Lucario",
    description: "A master of aura that strikes with devastating force.",
    rarity: "epic",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: null,
    stage: 2,
    base_stats: { hp: 90, atk: 100, def: 50, spd: 80 },
    growth_stats: growthForRarity("epic"),
    max_level: 75,
    color: 0x8844ff,
    shape: "diamond",
    icon_emoji: "🔶",
  },

  // ── Bagon evolution line (3-stage) ──────────────────────────────────────────
  bagon: {
    pet_type_id: "bagon",
    name: "Bagon",
    description: "A fierce drake hatchling obsessed with flight.",
    rarity: "common",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: "shelgon",
    stage: 1,
    base_stats: { hp: 55, atk: 45, def: 30, spd: 25 },
    growth_stats: growthForRarity("common"),
    max_level: 30,
    color: 0x4488ff,
    shape: "blob",
    icon_emoji: "🐉",
  },
  shelgon: {
    pet_type_id: "shelgon",
    name: "Shelgon",
    description: "Enclosed in a steel-hard shell, it waits for transformation.",
    rarity: "rare",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: "salamence",
    stage: 2,
    base_stats: { hp: 100, atk: 85, def: 65, spd: 50 },
    growth_stats: growthForRarity("rare"),
    max_level: 55,
    color: 0x2266dd,
    shape: "blob",
    icon_emoji: "🐢",
  },
  salamence: {
    pet_type_id: "salamence",
    name: "Salamence",
    description: "Its wish to soar has become reality — a terrifying sky dragon.",
    rarity: "legendary",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: null,
    stage: 3,
    base_stats: { hp: 130, atk: 140, def: 80, spd: 110 },
    growth_stats: growthForRarity("legendary"),
    max_level: 100,
    color: 0x33aaff,
    shape: "star",
    icon_emoji: "🐲",
  },

  // ── Rowlet evolution line ─────────────────────────────────────────────────────
  rowlet: {
    pet_type_id: "rowlet",
    name: "Rowlet",
    description: "A grassy owl that strikes from the shadows.",
    rarity: "common",
    base_cost: 0,
    unlock_level: 3,
    evolve_to: "dartrix",
    stage: 1,
    base_stats: { hp: 50, atk: 35, def: 20, spd: 30 },
    growth_stats: growthForRarity("common"),
    max_level: 25,
    color: 0x88cc44,
    shape: "star",
    icon_emoji: "🌿",
  },
  dartrix: {
    pet_type_id: "dartrix",
    name: "Dartrix",
    description: "A precision archer with razor-sharp leaf blades.",
    rarity: "rare",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: "decidueye",
    stage: 2,
    base_stats: { hp: 85, atk: 80, def: 45, spd: 70 },
    growth_stats: growthForRarity("rare"),
    max_level: 65,
    color: 0x55aa33,
    shape: "star",
    icon_emoji: "🦅",
  },
  decidueye: {
    pet_type_id: "decidueye",
    name: "Decidueye",
    description: "An archer of the deep woods, swift as an arrow.",
    rarity: "epic",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: null,
    stage: 3,
    base_stats: { hp: 115, atk: 125, def: 65, spd: 95 },
    growth_stats: growthForRarity("epic"),
    max_level: 90,
    color: 0x226611,
    shape: "star",
    icon_emoji: "🏹",
  },

  // ── Litten evolution line ────────────────────────────────────────────────────
  litten: {
    pet_type_id: "litten",
    name: "Litten",
    description: "A flame-furred kitten with a fiery temper.",
    rarity: "common",
    base_cost: 0,
    unlock_level: 5,
    evolve_to: "torracat",
    stage: 1,
    base_stats: { hp: 45, atk: 42, def: 20, spd: 30 },
    growth_stats: growthForRarity("common"),
    max_level: 25,
    color: 0xff4422,
    shape: "circle",
    icon_emoji: "🔥",
  },
  torracat: {
    pet_type_id: "torracat",
    name: "Torracat",
    description: "Its bell emits a roar that strikes fear into foes.",
    rarity: "rare",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: "incineroar",
    stage: 2,
    base_stats: { hp: 90, atk: 90, def: 50, spd: 65 },
    growth_stats: growthForRarity("rare"),
    max_level: 60,
    color: 0xcc3311,
    shape: "circle",
    icon_emoji: "🔔",
  },
  incineroar: {
    pet_type_id: "incineroar",
    name: "Incineroar",
    description: "A heavyweight champion that protects the innocent.",
    rarity: "epic",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: null,
    stage: 3,
    base_stats: { hp: 135, atk: 130, def: 80, spd: 75 },
    growth_stats: growthForRarity("epic"),
    max_level: 95,
    color: 0x991100,
    shape: "circle",
    icon_emoji: "💥",
  },

  // ── Popplio evolution line ────────────────────────────────────────────────────
  popplio: {
    pet_type_id: "popplio",
    name: "Popplio",
    description: "A creative water-type that practices balloon artistry.",
    rarity: "common",
    base_cost: 0,
    unlock_level: 3,
    evolve_to: "brionne",
    stage: 1,
    base_stats: { hp: 48, atk: 35, def: 22, spd: 32 },
    growth_stats: growthForRarity("common"),
    max_level: 25,
    color: 0x33ccff,
    shape: "blob",
    icon_emoji: "🎈",
  },
  brionne: {
    pet_type_id: "brionne",
    name: "Brionne",
    description: "Its graceful dance summons waves of pure water.",
    rarity: "rare",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: "primarina",
    stage: 2,
    base_stats: { hp: 88, atk: 82, def: 48, spd: 72 },
    growth_stats: growthForRarity("rare"),
    max_level: 60,
    color: 0x0099cc,
    shape: "blob",
    icon_emoji: "🎭",
  },
  primarina: {
    pet_type_id: "primarina",
    name: "Primarina",
    description: "Its songs mesmerise enemies before delivering a fatal encore.",
    rarity: "epic",
    base_cost: 0,
    unlock_level: 1,
    evolve_to: null,
    stage: 3,
    base_stats: { hp: 120, atk: 118, def: 72, spd: 90 },
    growth_stats: growthForRarity("epic"),
    max_level: 90,
    color: 0x004488,
    shape: "blob",
    icon_emoji: "🎤",
  },
};

// ── Rarity colors for UI ───────────────────────────────────────────────────────
export const RARITY_COLORS: Record<string, number> = {
  common:    0xaabbcc,
  rare:      0x4488ff,
  epic:      0x9933ff,
  legendary: 0xffaa00,
};

// ── Rarity labels ──────────────────────────────────────────────────────────────
export const RARITY_LABELS: Record<string, string> = {
  common:    "Common",
  rare:      "Rare",
  epic:      "Epic",
  legendary: "Legendary",
};

// ── Pet type lookup helpers ────────────────────────────────────────────────────
export function getPetDef(petTypeId: string): PetTypeDefinition | undefined {
  return PET_DEFINITIONS[petTypeId];
}

export function getEvolutionChain(petTypeId: string): PetTypeDefinition[] {
  const chain: PetTypeDefinition[] = [];
  let current: PetTypeDefinition | undefined = PET_DEFINITIONS[petTypeId];
  while (current) {
    chain.push(current);
    current = current.evolve_to ? (PET_DEFINITIONS[current.evolve_to] as PetTypeDefinition | undefined) : undefined;
  }
  return chain;
}

export function getStageName(stage: number): string {
  switch (stage) {
    case 1: return "Base";
    case 2: return "Stage 2";
    case 3: return "Final";
    default: return `Stage ${stage}`;
  }
}
