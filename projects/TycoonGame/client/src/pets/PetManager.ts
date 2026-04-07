/**
 * PetManager.ts
 * Central orchestrator for the pet companion system.
 *
 * Responsibilities:
 * - Spawns/destroys pet sprites in the Phaser world
 * - Manages following behaviour (pets trail behind player)
 * - Applies XP from in-game events
 * - Syncs pet state with the backend via PetClient
 * - Fires UI events (level-up, evolution available)
 */

import Phaser from "phaser";
import type { PetFullInstance } from "../shared/types";
import { PetSpriteRenderer } from "./PetSpriteRenderer";
import { PetLeveling } from "./PetLeveling";
import { PetClient } from "./PetClient";
import { getPetDef } from "./petDefinitions";

const FOLLOW_DISTANCE = 48;   // pixels behind player
const FOLLOW_SPEED = 0.08;   // lerp factor (0..1, higher = snappier)
const MAX_PETS_VISIBLE = 3;   // cap on simultaneous pet sprites

export type PetEventType =
  | "pet_equipped"
  | "pet_unequipped"
  | "xp_gained"
  | "leveled_up"
  | "evolve_ready"
  | "evolved";

export interface PetEvent {
  type: PetEventType;
  instance?: PetFullInstance;
  levelsGained?: number;
  newLevel?: number;
  instanceId?: string;
}

export class PetManager {
  private scene: Phaser.Scene;
  private renderer: PetSpriteRenderer;
  private leveling: PetLeveling;
  private client: PetClient;

  /** All equipped pet instances loaded for this session. */
  private equippedPets: Map<string, PetFullInstance> = new Map();

  /** Pet IDs that are currently rendered in the world. */
  private renderedIds = new Set<string>();

  /** Target (player sprite) position to follow. */
  private followTarget: Phaser.GameObjects.Container | null = null;
  private followTargetX = 0;
  private followTargetY = 0;

  /** Event listeners. */
  private listeners = new Map<PetEventType, Set<(e: PetEvent) => void>>();

  private updateCb: ((time: number) => void) | null = null;

  constructor(scene: Phaser.Scene, userId: string) {
    this.scene = scene;
    this.renderer = new PetSpriteRenderer(scene);
    this.leveling = new PetLeveling();
    this.client = new PetClient(userId);

    this.setupLevelingHandlers();
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Begin tracking a player sprite as the follow target.
   * @param playerContainer  The local player's sprite container
   */
  setFollowTarget(playerContainer: Phaser.GameObjects.Container): void {
    this.followTarget = playerContainer;
    this.followTargetX = playerContainer.x;
    this.followTargetY = playerContainer.y;
  }

  /**
   * Load all equipped pets from the backend and spawn their sprites.
   */
  async loadEquippedPets(): Promise<void> {
    try {
      const pets = await this.client.listMyPets(true);
      for (const pet of pets) {
        this.equippedPets.set(pet.instance_id, pet);
        this.spawnPetSprite(pet);
      }
    } catch (err) {
      console.warn("[PetManager] Failed to load equipped pets:", err);
    }
  }

  /**
   * Explicitly equip a pet instance and spawn its sprite.
   */
  async equipPet(instanceId: string): Promise<PetFullInstance | null> {
    try {
      const pet = await this.client.lookupPet(instanceId);
      pet.is_equipped = true;
      this.equippedPets.set(instanceId, pet);
      this.spawnPetSprite(pet);
      this.emit("pet_equipped", { type: "pet_equipped", instance: pet });
      return pet;
    } catch (err) {
      console.error("[PetManager] equipPet failed:", err);
      return null;
    }
  }

  /**
   * Unequip a pet (hide its sprite, remove from equipped list).
   */
  async unequipPet(instanceId: string): Promise<void> {
    const pet = this.equippedPets.get(instanceId);
    if (!pet) return;
    try {
      await this.client.unequipPet(instanceId, "companion");
    } catch {
      // Continue with client-side removal
    }
    pet.is_equipped = false;
    this.equippedPets.delete(instanceId);
    this.renderer.destroy(instanceId);
    this.renderedIds.delete(instanceId);
    this.emit("pet_unequipped", { type: "pet_unequipped", instance: pet });
  }

  /**
   * Grant XP to all equipped pets from a named source.
   * See PetLeveling.xpRewardTable for available sources.
   */
  grantXpToAll(source: string): void {
    const reward = PetLeveling.xpRewardTable[source];
    if (!reward) return;
    for (const pet of this.equippedPets.values()) {
      this.grantXpToPet(pet.instance_id, reward);
    }
  }

  /**
   * Grant XP to a specific pet instance.
   */
  grantXpToPet(instanceId: string, amount: number): void {
    const pet = this.equippedPets.get(instanceId);
    if (!pet || pet.level >= pet.pet_type!.max_level) return;

    const levelsGained = this.leveling.grantXp(pet, amount);
    if (levelsGained > 0) {
      this.emit("leveled_up", { type: "leveled_up", instance: pet, levelsGained, newLevel: pet.level });
    }
  }

  /**
   * Attempt to evolve a pet. Shows the evolution modal if requirements are met.
   */
  async evolvePet(instanceId: string): Promise<PetFullInstance | null> {
    const pet = this.equippedPets.get(instanceId);
    if (!pet) return null;

    if (!this.leveling.canEvolve(pet)) {
      console.warn("[PetManager] Pet cannot evolve — level requirement not met.");
      return null;
    }

    try {
      const evolved = await this.client.evolvePet(instanceId);
      this.equippedPets.set(instanceId, evolved);
      this.renderedIds.delete(instanceId);

      // Play evolution animation on sprite
      const oldSprite = this.renderer.get(instanceId);
      if (oldSprite) {
        await this.renderer.playEvolveAnimation(instanceId);
      }

      this.emit("evolved", { type: "evolved", instance: evolved });
      return evolved;
    } catch (err) {
      console.error("[PetManager] evolvePet failed:", err);
      return null;
    }
  }

  /**
   * Subscribe to pet system events.
   */
  on(event: PetEventType, cb: (e: PetEvent) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  off(event: PetEventType, cb: (e: PetEvent) => void): void {
    this.listeners.get(event)?.delete(cb);
  }

  /** Get a pet instance by ID. */
  getPet(instanceId: string): PetFullInstance | undefined {
    return this.equippedPets.get(instanceId);
  }

  /** All currently equipped pets. */
  getEquippedPets(): Iterable<PetFullInstance> {
    return this.equippedPets.values();
  }

  /** The first equipped pet (convenience for single-pet UI). */
  getPrimaryPet(): PetFullInstance | undefined {
    return this.equippedPets.values().next().value;
  }

  /** Manually trigger evolution-ready check for a pet. */
  checkEvolveReady(pet: PetFullInstance): void {
    if (this.leveling.canEvolve(pet)) {
      this.emit("evolve_ready", { type: "evolve_ready", instance: pet });
    }
  }

  // ── Per-frame update (call from scene update loop) ───────────────────────────

  update(_time: number): void {
    if (!this.followTarget) return;

    const targetX = this.followTarget.x;
    const targetY = this.followTarget.y;

    // Only update target position if the player has moved significantly
    const dx = targetX - this.followTargetX;
    const dy = targetY - this.followTargetY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      this.followTargetX = targetX;
      this.followTargetY = targetY;
      this.updatePetPositions(dx, dy);
    }
  }

  /**
   * Start the per-frame update loop.
   * Call this once the scene is ready.
   */
  startUpdateLoop(): void {
    if (this.updateCb) return;
    this.updateCb = (time: number) => this.update(time);
    this.scene.events.on("update", this.updateCb as (time: number, ...args: unknown[]) => void);
  }

  stopUpdateLoop(): void {
    if (this.updateCb) {
      this.scene.events.off("update", this.updateCb as (time: number, ...args: unknown[]) => void);
      this.updateCb = null;
    }
  }

  destroy(): void {
    this.stopUpdateLoop();
    for (const id of this.renderedIds) {
      this.renderer.destroy(id);
    }
    this.equippedPets.clear();
    this.renderedIds.clear();
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private spawnPetSprite(pet: PetFullInstance): void {
    if (this.renderedIds.size >= MAX_PETS_VISIBLE) return;
    if (this.renderedIds.has(pet.instance_id)) return;

    // Spawn at player position (offset per slot)
    const slotOffset = (this.renderedIds.size % MAX_PETS_VISIBLE) * FOLLOW_DISTANCE;
    const spawnX = this.followTarget ? this.followTarget.x - slotOffset : 100 + slotOffset;
    const spawnY = this.followTarget ? this.followTarget.y : 100;

    this.renderer.spawn(pet, spawnX, spawnY);
    this.renderedIds.add(pet.instance_id);
  }

  private updatePetPositions(_dx: number, _dy: number): void {
    // Arrange equipped pets in a loose arc behind the player
    const pets = Array.from(this.equippedPets.values()).filter(p => this.renderedIds.has(p.instance_id));
    const n = pets.length;
    if (n === 0) return;

    const baseAngle = Math.atan2(this.followTargetY, this.followTargetX) + Math.PI; // behind player
    const spread = Math.PI / 4; // 45° spread

    pets.forEach((pet, i) => {
      const offset = n > 1 ? ((i / (n - 1)) - 0.5) * 2 * spread : 0;
      const angle = baseAngle + offset;
      const dist = FOLLOW_DISTANCE + Math.abs(i - (n - 1) / 2) * 10;
      const tx = this.followTargetX + Math.cos(angle) * dist;
      const ty = this.followTargetY + Math.sin(angle) * dist;
      this.renderer.moveTo(pet.instance_id, tx, ty);
    });
  }

  private setupLevelingHandlers(): void {
    this.leveling.on("xp_gain", (data) => {
      const pet = this.equippedPets.get(data.instanceId);
      if (pet) this.emit("xp_gained", { type: "xp_gained", instance: pet, instanceId: data.instanceId });
    });

    this.leveling.on("level_up", (data) => {
      const sprite = this.renderer.get(data.instance.instance_id);
      if (sprite) this.renderer.flashLevelUp(data.instance.instance_id);
      this.emit("leveled_up", { type: "leveled_up", instance: data.instance, newLevel: data.newLevel, levelsGained: data.newLevel - data.oldLevel });
    });

    this.leveling.on("can_evolve", (data) => {
      this.emit("evolve_ready", { type: "evolve_ready", instance: data.instance });
    });
  }

  private emit(type: PetEventType, data: PetEvent): void {
    this.listeners.get(type)?.forEach(cb => cb(data));
  }
}
