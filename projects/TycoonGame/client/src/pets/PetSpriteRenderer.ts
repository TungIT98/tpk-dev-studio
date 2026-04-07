/**
 * PetSpriteRenderer.ts
 * Phaser 3 sprite rendering for pet companions.
 *
 * Renders pets as animated containers with:
 * - Body shape (circle / diamond / star / blob) tinted by pet color
 * - Rarity glow ring
 * - Level badge
 * - Idle bounce animation
 * - "!" alert when evolution is available
 */

import Phaser from "phaser";
import type { PetTypeDefinition, PetFullInstance } from "../shared/types";
import { computeBaseStats } from "../shared/types";
import { RARITY_COLORS } from "./petDefinitions";

const RARITY_GLOW_WIDTHS: Record<string, number> = {
  common:    1,
  rare:      2,
  epic:      3,
  legendary: 4,
};

const BASE_SIZE = 28;

export interface PetSpriteData {
  container: Phaser.GameObjects.Container;
  typeDef: PetTypeDefinition;
  instance: PetFullInstance;
  alertIcon?: Phaser.GameObjects.Text;
}

export class PetSpriteRenderer {
  private scene: Phaser.Scene;
  private sprites = new Map<string, PetSpriteData>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Spawn a pet sprite at (x, y) and attach it to a follow target.
   * Returns the PetSpriteData needed for the PetManager.
   */
  spawn(instance: PetFullInstance, x: number, y: number): PetSpriteData {
    const typeDef = instance.pet_type!;
    const size = BASE_SIZE;
    const container = this.scene.add.container(x, y);
    container.setDepth(90); // slightly above players

    // ── Rarity glow ring ────────────────────────────────────────────────────────
    const glowColor = RARITY_COLORS[typeDef.rarity] ?? 0xffffff;
    const glowSize = RARITY_GLOW_WIDTHS[typeDef.rarity] ?? 1;

    const glow = this.scene.add.graphics();
    glow.lineStyle(glowSize + 1, glowColor, 0.5);
    glow.strokeCircle(size / 2, size / 2, size / 2 + 2);
    container.add(glow);

    // ── Body shape ─────────────────────────────────────────────────────────────
    const body = this.buildBody(typeDef, size);
    container.add(body);

    // ── Rarity inner fill ──────────────────────────────────────────────────────
    const innerFill = this.scene.add.graphics();
    innerFill.fillStyle(typeDef.color, 0.85);
    this.fillShape(innerFill, typeDef.shape, size);
    container.add(innerFill);

    // ── Level badge (top-right) ─────────────────────────────────────────────────
    const levelBadge = this.scene.add.graphics();
    levelBadge.fillStyle(0x222233, 0.9);
    levelBadge.fillCircle(size - 4, 4, 7);
    container.add(levelBadge);

    const levelText = this.scene.add.text(size - 4, 4, String(instance.level), {
      fontSize: "8px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    container.add(levelText);

    // ── Idle bounce tween ───────────────────────────────────────────────────────
    this.scene.tweens.add({
      targets: container,
      y: y - 4,
      duration: 600 + Math.random() * 200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // ── Evolution alert (hidden until triggered) ────────────────────────────────
    const alertIcon = this.scene.add.text(size / 2, -size, "!", {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#ffcc00",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5).setAlpha(0);
    container.add(alertIcon);

    // Pulse the alert when shown
    if (instance.level >= instance.evolve_level_req && typeDef.evolve_to) {
      this.showEvolutionAlert(alertIcon);
    }

    const data: PetSpriteData = { container, typeDef, instance, alertIcon };
    this.sprites.set(instance.instance_id, data);
    return data;
  }

  /** Remove a pet sprite with a fade-out animation. */
  destroy(instanceId: string): void {
    const data = this.sprites.get(instanceId);
    if (!data) return;
    this.scene.tweens.add({
      targets: data.container,
      alpha: 0,
      scale: 0,
      duration: 300,
      onComplete: () => {
        data.container.destroy();
        this.sprites.delete(instanceId);
      },
    });
  }

  /** Move a pet sprite to a new position with smooth interpolation. */
  moveTo(instanceId: string, x: number, y: number, duration = 250): void {
    const data = this.sprites.get(instanceId);
    if (!data) return;
    this.scene.tweens.add({
      targets: data.container,
      x, y,
      duration,
      ease: "Quad.easeOut",
    });
  }

  /** Briefly flash the pet sprite on level-up. */
  flashLevelUp(instanceId: string): void {
    const data = this.sprites.get(instanceId);
    if (!data) return;
    this.scene.tweens.add({
      targets: data.container,
      scale: 1.4,
      alpha: 0.6,
      duration: 150,
      yoyo: true,
      repeat: 2,
    });
  }

  /** Play evolution transformation animation and return a promise. */
  async playEvolveAnimation(instanceId: string): Promise<void> {
    const data = this.sprites.get(instanceId);
    if (!data) return;

    // Big scale-up + glow burst
    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: data.container,
        scale: 2.0,
        duration: 400,
        ease: "Back.easeOut",
        onComplete: () => resolve(),
      });
    });

    // Swap colour
    data.instance.pet_type_id = data.typeDef.evolve_to ?? data.instance.pet_type_id;

    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: data.container,
        scale: 1.0,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          data.container.removeAll(true);
          // Rebuild the body in the new colour
          const size = BASE_SIZE;
          const glowColor = RARITY_COLORS[data.typeDef.rarity] ?? 0xffffff;
          const glow = this.scene.add.graphics();
          glow.lineStyle(3, glowColor, 0.6);
          glow.strokeCircle(size / 2, size / 2, size / 2 + 2);
          data.container.add(glow);

          const body = this.buildBody(data.typeDef, size);
          data.container.add(body);

          const innerFill = this.scene.add.graphics();
          innerFill.fillStyle(data.typeDef.color, 0.85);
          this.fillShape(innerFill, data.typeDef.shape, size);
          data.container.add(innerFill);

          resolve();
        },
      });
    });

    // Snap back
    this.scene.tweens.add({
      targets: data.container,
      alpha: 1,
      scale: 1.0,
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  /** Trigger the evolution-available "!" alert pulse. */
  showEvolutionAlert(alertIcon: Phaser.GameObjects.Text): void {
    alertIcon.setAlpha(1);
    this.scene.tweens.add({
      targets: alertIcon,
      scale: 1.4,
      alpha: 0.6,
      duration: 300,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /** Get a sprite data entry by instance ID. */
  get(instanceId: string): PetSpriteData | undefined {
    return this.sprites.get(instanceId);
  }

  /** All active pet sprites. */
  getAll(): Map<string, PetSpriteData> {
    return this.sprites;
  }

  // ── Private shape builders ────────────────────────────────────────────────────

  private buildBody(typeDef: PetTypeDefinition, size: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.lineStyle(2, 0xffffff, 0.4);
    this.strokeShape(g, typeDef.shape, size);
    return g;
  }

  private strokeShape(g: Phaser.GameObjects.Graphics, shape: string, size: number): void {
    const r = size / 2;
    switch (shape) {
      case "diamond":
        g.strokePoints([
          { x: r, y: 0 },
          { x: size, y: r },
          { x: r, y: size },
          { x: 0, y: r },
        ], true);
        break;
      case "star":
        this.strokeStar(g, r, r, 5, r, r * 0.45);
        break;
      case "blob":
        g.strokeEllipse(r, r, size * 0.9, size * 0.75);
        break;
      default: // circle
        g.strokeCircle(r, r, r - 2);
    }
  }

  private fillShape(g: Phaser.GameObjects.Graphics, shape: string, size: number): void {
    const r = size / 2;
    switch (shape) {
      case "diamond":
        g.fillPoints([
          { x: r, y: 0 },
          { x: size, y: r },
          { x: r, y: size },
          { x: 0, y: r },
        ], true);
        break;
      case "star":
        this.fillStar(g, r, r, 5, r, r * 0.45);
        break;
      case "blob":
        g.fillEllipse(r, r, size * 0.85, size * 0.7);
        break;
      default:
        g.fillCircle(r, r, r - 2);
    }
  }

  /** Stroke a 5-pointed star centred at (cx, cy). */
  private strokeStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, points: number, outerR: number, innerR: number): void {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    g.strokePoints(pts, true);
  }

  /** Fill a 5-pointed star centred at (cx, cy). */
  private fillStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, points: number, outerR: number, innerR: number): void {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    g.fillPoints(pts, true);
  }
}
