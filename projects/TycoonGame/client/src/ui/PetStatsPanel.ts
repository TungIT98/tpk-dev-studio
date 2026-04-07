/**
 * PetStatsPanel.ts
 * HUD overlay showing pet stats (HP / ATK / DEF / SPD) with XP bar and level.
 *
 * Shows equipped pet stats with equipment bonuses applied.
 * Click to open evolution panel when evolution is available.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import {
  type PetFullInstance,
  computeBaseStats,
  computeEquipmentBonus,
  xpProgressInLevel,
  totalXpForLevel,
} from "../shared/types";
import { RARITY_COLORS, RARITY_LABELS, getStageName } from "../pets/petDefinitions";

const PANEL_W = 220;
const PANEL_H = 200;
const STAT_ROW_H = 22;
const PADDING = 12;
const BAR_W = 100;
const BAR_H = 10;

export class PetStatsPanel {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private rarityText!: Phaser.GameObjects.Text;
  private statTexts: Record<string, Phaser.GameObjects.Text> = {};
  private bonusTexts: Record<string, Phaser.GameObjects.Text> = {};
  private evolveHint!: Phaser.GameObjects.Text;
  private currentInstanceId: string | null = null;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene as Phaser.Scene;
    this.build();
    this.container.setAlpha(0);
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH - PANEL_W - 16;
    const cy = 16;

    this.container = this.scene.add.container(cx, cy);

    // Panel background
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.95);
    bg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, 8);
    bg.lineStyle(1, COLORS.BORDER, 1);
    bg.strokeRoundedRect(0, 0, PANEL_W, PANEL_H, 8);
    this.container.add(bg);

    // ── Header: name + rarity + level ───────────────────────────────────────────
    this.nameText = this.scene.add.text(PADDING, PADDING, "No Pet Equipped", {
      fontSize: "13px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.container.add(this.nameText);

    this.rarityText = this.scene.add.text(PADDING, PADDING + 16, "", {
      fontSize: "10px",
      fontFamily: "Arial",
      color: "#aabbcc",
    });
    this.container.add(this.rarityText);

    this.levelText = this.scene.add.text(
      PANEL_W - PADDING, PADDING, "",
      { fontSize: "12px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold" }
    ).setOrigin(1, 0);
    this.container.add(this.levelText);

    // ── XP bar ──────────────────────────────────────────────────────────────────
    const xpY = PADDING + 38;
    this.xpBarBg = this.scene.add.graphics();
    this.xpBarBg.fillStyle(COLORS.BORDER, 1);
    this.xpBarBg.fillRoundedRect(PADDING, xpY, BAR_W, BAR_H, 4);
    this.container.add(this.xpBarBg);

    this.xpBar = this.scene.add.graphics();
    this.container.add(this.xpBar);

    this.xpText = this.scene.add.text(PANEL_W - PADDING, xpY, "", {
      fontSize: "9px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(1, 0);
    this.container.add(this.xpText);

    // ── Stat rows ───────────────────────────────────────────────────────────────
    const stats = [
      { key: "hp",  label: "HP",  color: "#ff6666" },
      { key: "atk", label: "ATK", color: "#ffaa44" },
      { key: "def", label: "DEF", color: "#66aaff" },
      { key: "spd", label: "SPD", color: "#66ffaa" },
    ];

    let rowY = xpY + BAR_H + 10;
    for (const stat of stats) {
      const label = this.scene.add.text(PADDING, rowY, stat.label, {
        fontSize: "11px", fontFamily: "Arial", color: stat.color, fontStyle: "bold",
      });
      this.container.add(label);

      const valueText = this.scene.add.text(PADDING + 38, rowY, "—", {
        fontSize: "11px", fontFamily: "Arial", color: "#ffffff",
      });
      this.container.add(valueText);
      this.statTexts[stat.key] = valueText;

      const bonusText = this.scene.add.text(PADDING + 70, rowY, "", {
        fontSize: "10px", fontFamily: "Arial", color: "#00d26e",
      });
      this.container.add(bonusText);
      this.bonusTexts[stat.key] = bonusText;

      rowY += STAT_ROW_H;
    }

    // ── Evolution hint ──────────────────────────────────────────────────────────
    this.evolveHint = this.scene.add.text(PADDING, PANEL_H - PADDING - 10, "", {
      fontSize: "10px", fontFamily: "Arial", color: "#ffcc00",
    });
    this.container.add(this.evolveHint);
  }

  /** Show panel and populate with pet instance data. */
  show(instance: PetFullInstance, onEvolve?: () => void): void {
    this.isVisible = true;
    const typeDef = instance.pet_type!;
    const base = computeBaseStats(typeDef, instance.level);
    const bonus = computeEquipmentBonus(instance.equipment ?? []);
    const rarityColor = "#" + RARITY_COLORS[typeDef.rarity].toString(16).padStart(6, "0");

    this.nameText.setText(instance.nickname ?? typeDef.name);
    this.nameText.setColor(rarityColor);
    this.rarityText.setText(`${RARITY_LABELS[typeDef.rarity]} · ${getStageName(typeDef.stage)}`);
    this.levelText.setText(`Lv.${instance.level}`);

    // XP bar
    const progress = this.getXpProgress(instance);
    const barColor = instance.level >= typeDef.max_level ? CONFIG.COLORS.SUCCESS : CONFIG.COLORS.ACCENT;
    this.xpBar.clear();
    if (progress > 0) {
      this.xpBar.fillStyle(barColor, 1);
      this.xpBar.fillRoundedRect(PADDING, this.xpBarBg.y, BAR_W * Math.min(1, progress), BAR_H, 4);
    }
    this.xpText.setText(instance.level >= typeDef.max_level ? "MAX" : `${Math.floor(progress * 100)}%`);

    // Stats
    for (const key of ["hp", "atk", "def", "spd"]) {
      const total = base[key as keyof typeof base] + (bonus[key as keyof typeof bonus] ?? 0);
      this.statTexts[key].setText(String(total));
      const bonusVal = bonus[key as keyof typeof bonus] ?? 0;
      this.bonusTexts[key].setText(bonusVal > 0 ? `(+${bonusVal})` : "");
    }

    // Evolution hint
    if (instance.level >= instance.evolve_level_req && typeDef.evolve_to) {
      this.evolveHint.setText(`Evolve available! Lv.${instance.evolve_level_req}+`);
      // Make hint interactive
      this.evolveHint.setInteractive(
        new Phaser.Geom.Rectangle(this.evolveHint.x, this.evolveHint.y, PANEL_W - PADDING * 2, 14),
        Phaser.Geom.Rectangle.Contains,
      );
      this.evolveHint.once("pointerdown", () => onEvolve?.());
    } else {
      this.evolveHint.setText("");
    }

    this.currentInstanceId = instance.instance_id;

    // Animate in
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 200,
    });
  }

  /** Hide the panel. */
  hide(): void {
    this.isVisible = false;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 150,
    });
    this.currentInstanceId = null;
  }

  /** Refresh stats without re-showing (call after leveling). */
  refresh(instance: PetFullInstance, onEvolve?: () => void): void {
    if (this.currentInstanceId !== instance.instance_id) {
      this.show(instance, onEvolve);
      return;
    }
    const typeDef = instance.pet_type!;
    const base = computeBaseStats(typeDef, instance.level);
    const bonus = computeEquipmentBonus(instance.equipment ?? []);
    this.levelText.setText(`Lv.${instance.level}`);

    const progress = this.getXpProgress(instance);
    this.xpBar.clear();
    if (progress > 0) {
      this.xpBar.fillStyle(CONFIG.COLORS.ACCENT, 1);
      this.xpBar.fillRoundedRect(PADDING, this.xpBarBg.y, BAR_W * Math.min(1, progress), BAR_H, 4);
    }
    this.xpText.setText(instance.level >= typeDef.max_level ? "MAX" : `${Math.floor(progress * 100)}%`);

    for (const key of ["hp", "atk", "def", "spd"]) {
      const total = base[key as keyof typeof base] + (bonus[key as keyof typeof bonus] ?? 0);
      this.statTexts[key].setText(String(total));
      const bonusVal = bonus[key as keyof typeof bonus] ?? 0;
      this.bonusTexts[key].setText(bonusVal > 0 ? `(+${bonusVal})` : "");
    }
  }

  private getXpProgress(instance: PetFullInstance): number {
    if (instance.level >= instance.pet_type!.max_level) return 1;
    return xpProgressInLevel(instance.experience, instance.level, instance.pet_type!.max_level);
  }

  get visible(): boolean {
    return this.isVisible;
  }

  destroy(): void {
    this.container.destroy();
  }
}
