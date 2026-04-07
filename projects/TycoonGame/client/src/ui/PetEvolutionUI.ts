/**
 * PetEvolutionUI.ts
 * Modal overlay shown when a pet can evolve.
 * Displays current form → evolved form comparison and triggers the evolve action.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import type { PetFullInstance, PetTypeDefinition } from "../shared/types";
import { computeBaseStats } from "../shared/types";
import { getPetDef, RARITY_COLORS, RARITY_LABELS, getStageName } from "../pets/petDefinitions";

const MODAL_W = 360;
const MODAL_H = 260;

export type EvolveAction = "confirm" | "cancel";

export class PetEvolutionUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private visible = false;
  private pendingInstance: PetFullInstance | null = null;
  private onAction: ((action: EvolveAction, instance?: PetFullInstance) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    this.container = this.scene.add.container(cx, cy);
    this.container.setDepth(999);
    this.container.setAlpha(0);
    this.container.setScale(0.8);

    // Dim overlay
    const overlay = this.scene.add.rectangle(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 0x000000, 0.7);
    overlay.setInteractive(); // absorb clicks
    this.container.add(overlay);

    // Modal background
    const modalBg = this.scene.add.graphics();
    modalBg.fillStyle(COLORS.PANEL, 0.98);
    modalBg.fillRoundedRect(-MODAL_W / 2, -MODAL_H / 2, MODAL_W, MODAL_H, 12);
    modalBg.lineStyle(2, COLORS.ACCENT, 1);
    modalBg.strokeRoundedRect(-MODAL_W / 2, -MODAL_H / 2, MODAL_W, MODAL_H, 12);
    this.container.add(modalBg);

    // Title
    const title = this.scene.add.text(0, -MODAL_H / 2 + 20, "✨ Evolution Available!", {
      fontSize: "16px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5, 0);
    this.container.add(title);

    // ── Left pet (current) ──────────────────────────────────────────────────────
    const leftX = -80;
    this.renderPetIcon(leftX, 20, "current");

    // ── Arrow ───────────────────────────────────────────────────────────────────
    const arrow = this.scene.add.text(0, 30, "➜", {
      fontSize: "28px", fontFamily: "Arial", color: "#ffffff",
    }).setOrigin(0.5, 0.5);
    this.container.add(arrow);

    // ── Right pet (evolved) ─────────────────────────────────────────────────────
    const rightX = 80;
    this.renderPetIcon(rightX, 20, "evolved");

    // ── Stat comparison ────────────────────────────────────────────────────────
    const stats = [
      { key: "hp",  label: "HP",  color: "#ff6666" },
      { key: "atk", label: "ATK", color: "#ffaa44" },
      { key: "def", label: "DEF", color: "#66aaff" },
      { key: "spd", label: "SPD", color: "#66ffaa" },
    ];

    const statsY = 80;
    for (let i = 0; i < stats.length; i++) {
      const { key, label, color } = stats[i];
      const y = statsY + i * 20;

      const labelText = this.scene.add.text(-MODAL_W / 2 + 20, y, label, {
        fontSize: "11px", fontFamily: "Arial", color,
      });
      this.container.add(labelText);

      const currentText = this.scene.add.text(-MODAL_W / 2 + 55, y, "—", {
        fontSize: "11px", fontFamily: "Arial", color: "#aabbcc",
      }).setName(`stat_cur_${key}`);
      this.container.add(currentText);

      const arrow2 = this.scene.add.text(0, y, "→", {
        fontSize: "10px", fontFamily: "Arial", color: "#ffffff",
      }).setName(`stat_arrow_${key}`);
      this.container.add(arrow2);

      const evolvedText = this.scene.add.text(MODAL_W / 2 - 20, y, "—", {
        fontSize: "11px", fontFamily: "Arial", color: "#00d26e",
      }).setOrigin(1, 0).setName(`stat_evo_${key}`);
      this.container.add(evolvedText);
    }

    // ── Buttons ─────────────────────────────────────────────────────────────────
    const btnY = MODAL_H / 2 - 35;

    // Cancel button
    const cancelBg = this.scene.add.graphics();
    cancelBg.fillStyle(COLORS.BORDER, 1);
    cancelBg.fillRoundedRect(-MODAL_W / 2 + 20, btnY, 100, 28, 6);
    this.container.add(cancelBg);

    const cancelBtn = this.scene.add.text(-MODAL_W / 2 + 70, btnY + 14, "Not Yet", {
      fontSize: "12px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(0.5, 0.5).setInteractive();
    this.container.add(cancelBtn);

    cancelBtn.on("pointerdown", () => this.dismiss("cancel"));
    cancelBtn.on("pointerover", () => cancelBtn.setColor("#ffffff"));
    cancelBtn.on("pointerout", () => cancelBtn.setColor("#a0a0be"));

    // Evolve button
    const evolveBg = this.scene.add.graphics();
    evolveBg.fillStyle(COLORS.ACCENT, 1);
    evolveBg.fillRoundedRect(MODAL_W / 2 - 120, btnY, 100, 28, 6);
    this.container.add(evolveBg);

    const evolveBtn = this.scene.add.text(MODAL_W / 2 - 70, btnY + 14, "Evolve!", {
      fontSize: "12px", fontFamily: "Arial", color: "#000000", fontStyle: "bold",
    }).setOrigin(0.5, 0.5).setInteractive();
    this.container.add(evolveBtn);

    evolveBtn.on("pointerdown", () => this.dismiss("confirm", this.pendingInstance!));
    evolveBtn.on("pointerover", () => {
      evolveBg.clear();
      evolveBg.fillStyle(COLORS.ACCENT_DARK, 1);
      evolveBg.fillRoundedRect(MODAL_W / 2 - 120, btnY, 100, 28, 6);
      evolveBtn.setColor("#ffffff");
    });
    evolveBtn.on("pointerout", () => {
      evolveBg.clear();
      evolveBg.fillStyle(COLORS.ACCENT, 1);
      evolveBg.fillRoundedRect(MODAL_W / 2 - 120, btnY, 100, 28, 6);
      evolveBtn.setColor("#000000");
    });

    // Hint text
    const hint = this.scene.add.text(0, MODAL_H / 2 - 50, "", {
      fontSize: "10px", fontFamily: "Arial", color: "#ffcc00",
    }).setOrigin(0.5, 0).setName("hint_text");
    this.container.add(hint);
  }

  private renderPetIcon(x: number, y: number, name: string): void {
    const { COLORS } = CONFIG;
    const size = 48;

    // Placeholder circles — replaced when instance is set
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x333344, 0.8);
    bg.fillCircle(x, y, size / 2);
    bg.lineStyle(2, COLORS.BORDER, 1);
    bg.strokeCircle(x, y, size / 2);
    bg.setName(`pet_icon_bg_${name}`);
    this.container.add(bg);

    const emoji = this.scene.add.text(x, y, "?", {
      fontSize: "22px",
    }).setOrigin(0.5, 0.5).setName(`pet_icon_emoji_${name}`);
    this.container.add(emoji);

    const label = this.scene.add.text(x, y + size / 2 + 4, name === "current" ? "Current" : "Next", {
      fontSize: "10px", fontFamily: "Arial", color: "#aabbcc",
    }).setOrigin(0.5, 0).setName(`pet_icon_label_${name}`);
    this.container.add(label);
  }

  /**
   * Show the evolution modal for a pet instance.
   * @param instance  The pet that can evolve
   * @param onAction Callback with the user's choice and updated instance
   */
  show(instance: PetFullInstance, onAction: (action: EvolveAction, instance?: PetFullInstance) => void): void {
    this.pendingInstance = instance;
    this.onAction = onAction;

    const currentDef = instance.pet_type!;
    const evolvedDef = currentDef.evolve_to ? getPetDef(currentDef.evolve_to) : null;

    // Update icons
    this.updatePetIcon("current", currentDef, currentDef.color);
    if (evolvedDef) {
      this.updatePetIcon("evolved", evolvedDef, evolvedDef.color);
    }

    // Update stat comparison
    const stats = ["hp", "atk", "def", "spd"] as const;
    const currentLvl = instance.level;
    const evolvedLvl = 1; // evolved pets start at level 1 (defined in pet_definitions via growth stats)

    const currentBase = computeBaseStats(currentDef, currentLvl);
    const evolvedBase = evolvedDef ? computeBaseStats(evolvedDef, evolvedLvl) : currentBase;

    for (const key of stats) {
      const curText = this.container.list.find((obj: Phaser.GameObjects.GameObject) => (obj as Phaser.GameObjects.Text).name === `stat_cur_${key}`) as Phaser.GameObjects.Text | undefined;
      const evoText = this.container.list.find((obj: Phaser.GameObjects.GameObject) => (obj as Phaser.GameObjects.Text).name === `stat_evo_${key}`) as Phaser.GameObjects.Text | undefined;
      if (curText) curText.setText(String(currentBase[key]));
      if (evoText) {
        const diff = evolvedBase[key] - currentBase[key];
        evoText.setText(`${evolvedBase[key]} ${diff > 0 ? `(+${diff})` : ""}`);
      }
    }

    // Update hint
    const hint = this.container.list.find((obj: Phaser.GameObjects.GameObject) => (obj as Phaser.GameObjects.Text).name === "hint_text") as Phaser.GameObjects.Text | undefined;
    if (hint) {
      hint.setText(`Reach level ${instance.evolve_level_req} to evolve into ${evolvedDef?.name ?? "next form"}!`);
    }

    this.visible = true;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 250,
      ease: "Back.easeOut",
    });
  }

  private updatePetIcon(slot: string, typeDef: PetTypeDefinition, color: number): void {
    // Determine fixed position based on slot
    const iconX = slot === "current" ? -80 : 80;
    const iconY = 20;

    const bg = this.container.list.find(obj => (obj as Phaser.GameObjects.Graphics).name === `pet_icon_bg_${slot}`) as Phaser.GameObjects.Graphics | undefined;
    if (bg) {
      bg.clear();
      bg.fillStyle(color, 0.3);
      bg.fillCircle(iconX, iconY, 24);
      bg.lineStyle(2, RARITY_COLORS[typeDef.rarity] ?? 0xffffff, 0.8);
      bg.strokeCircle(iconX, iconY, 24);
    }

    const emoji = this.container.list.find(obj => (obj as Phaser.GameObjects.Text).name === `pet_icon_emoji_${slot}`) as Phaser.GameObjects.Text | undefined;
    if (emoji) {
      emoji.setText(typeDef.icon_emoji);
      emoji.setPosition(iconX, iconY);
    }

    const label = this.container.list.find(obj => (obj as Phaser.GameObjects.Text).name === `pet_icon_label_${slot}`) as Phaser.GameObjects.Text | undefined;
    if (label) label.setText(typeDef.name);
  }

  private dismiss(action: EvolveAction, instance?: PetFullInstance): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 0.8,
      duration: 180,
      ease: "Back.easeIn",
      onComplete: () => {
        this.visible = false;
        this.onAction?.(action, instance);
      },
    });
  }

  get isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    this.container.destroy();
  }
}
