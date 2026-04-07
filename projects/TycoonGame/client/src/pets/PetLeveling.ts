/**
 * PetLeveling.ts
 * Client-side leveling logic for pet companions.
 *
 * - XP gain sources
 * - Level cap enforcement
 * - Level-up events
 * - Evolution readiness check
 */

import type { PetFullInstance, PetTypeDefinition } from "../shared/types";
import {
  xpForLevel,
  totalXpForLevel,
  xpProgressInLevel,
} from "../shared/types";

export type LevelUpCallback = (instance: PetFullInstance, newLevel: number) => void;

/** Events emitted by the PetLeveling manager. */
export interface PetLevelingEvents {
  "xp_gain": { instanceId: string; amount: number; newTotalXp: number };
  "level_up": { instance: PetFullInstance; newLevel: number; oldLevel: number };
  "can_evolve": { instance: PetFullInstance };
  "max_level": { instance: PetFullInstance };
}

export class PetLeveling {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof PetLevelingEvents>(event: K, cb: (data: PetLevelingEvents[K]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  off<K extends keyof PetLevelingEvents>(event: K, cb: (data: PetLevelingEvents[K]) => void): void {
    this.listeners.get(event)?.delete(cb);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit<K extends keyof PetLevelingEvents>(event: K, data: PetLevelingEvents[K]): void {
    this.listeners.get(event)?.forEach(cb => (cb as any)(data));
  }

  /**
   * Grant XP to a pet instance.
   * Handles level-ups and evolution readiness automatically.
   * Returns the number of levels gained (0 if none).
   */
  grantXp(instance: PetFullInstance, amount: number): number {
    const typeDef = instance.pet_type!;
    const maxLevel = typeDef.max_level;

    if (instance.level >= maxLevel) {
      // Already at max level — XP just accumulates (stored on backend)
      return 0;
    }

    const oldLevel = instance.level;
    const newTotalXp = instance.experience + amount;
    instance.experience = newTotalXp;

    this.emit("xp_gain", { instanceId: instance.instance_id, amount, newTotalXp });

    let levelsGained = 0;
    let currentXp = newTotalXp;

    // Loop through possible level-ups
    while (instance.level < maxLevel) {
      const needed = xpForLevel(instance.level + 1, maxLevel);
      if (currentXp >= needed) {
        currentXp -= needed;
        instance.level += 1;
        instance.experience = currentXp; // store remainder
        levelsGained++;
        this.emit("level_up", { instance, newLevel: instance.level, oldLevel: instance.level - 1 });
      } else {
        break;
      }
    }

    if (instance.level >= maxLevel) {
      instance.experience = totalXpForLevel(maxLevel, maxLevel);
      this.emit("max_level", { instance });
    }

    // Evolution check after all level-ups settled
    if (instance.level >= instance.evolve_level_req && typeDef.evolve_to) {
      this.emit("can_evolve", { instance });
    }

    return levelsGained;
  }

  /** Check whether a pet can evolve right now. */
  canEvolve(instance: PetFullInstance): boolean {
    const typeDef = instance.pet_type!;
    return typeDef.evolve_to !== null && instance.level >= instance.evolve_level_req;
  }

  /** Return XP progress fraction [0..1] within the current level. */
  getProgress(instance: PetFullInstance): number {
    return xpProgressInLevel(instance.experience, instance.level, instance.pet_type!.max_level);
  }

  /** Return a human-readable XP string like "450 / 1200 XP". */
  getXpText(instance: PetFullInstance): string {
    const currentLevelXp = totalXpForLevel(instance.level, instance.pet_type!.max_level);
    const nextLevelXp = totalXpForLevel(instance.level + 1, instance.pet_type!.max_level);
    const xpInLevel = instance.experience - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;
    if (instance.level >= instance.pet_type!.max_level) return "MAX LEVEL";
    return `${Math.floor(xpInLevel)} / ${xpNeeded} XP`;
  }

  /** XP reward table for various in-game actions (per pet, scaled by level). */
  static xpRewardTable: Record<string, number> = {
    business_collect:   5,    // collecting business income
    minigame_win:      100,    // winning a mini-game
    minigame_participate: 30,  // just playing a mini-game
    quest_complete:     25,
    trade_success:      15,
    login_bonus:        20,
    daily_mission:      40,
    gift_sent:          10,
    gift_received:      15,
  };
}
