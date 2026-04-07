/**
 * AchievementToast.ts
 * HUD-level achievement unlock notification.
 * Slides in from the right side of the screen, stays for 4 seconds, then slides out.
 * Multiple toasts stack vertically.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import type { PlayerAchievement } from "../shared/types";

export class AchievementToastManager {
  private scene: Phaser.Scene;
  private toasts: AchievementToast[] = [];
  private maxVisible = 3;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show an achievement unlock toast.
   * Automatically manages stacking and dismissal.
   */
  show(achievement: PlayerAchievement): void {
    const toast = new AchievementToast(this.scene, achievement, this.toasts.length);
    this.toasts.push(toast);

    // Dismiss oldest if overflowing
    while (this.toasts.length > this.maxVisible) {
      const oldest = this.toasts.shift();
      oldest?.dismiss();
    }

    // Reposition visible toasts
    this.reposition();
  }

  private reposition(): void {
    this.toasts.forEach((toast, i) => {
      toast.slideIn(i);
    });
  }

  destroy(): void {
    this.toasts.forEach(t => t.destroy());
    this.toasts = [];
  }
}

class AchievementToast {
  private container!: Phaser.GameObjects.Container;
  private readonly W = 280;
  private readonly H = 72;
  private readonly MARGIN = 8;
  private readonly OFFSET_X = 16; // from right edge
  private row: number;
  private dismissed = false;

  constructor(
    private scene: Phaser.Scene,
    private achievement: PlayerAchievement,
    row: number,
  ) {
    this.row = row;
    this.build();
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const cw = CONFIG.CANVAS_WIDTH;
    const ch = CONFIG.CANVAS_HEIGHT;

    this.container = this.scene.add.container(cw + this.W, 0);
    this.container.setDepth(1050);
    this.container.setAlpha(0);

    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.96);
    bg.fillRoundedRect(0, 0, this.W, this.H, 8);
    bg.lineStyle(2, 0xffc800, 0.9);
    bg.strokeRoundedRect(0, 0, this.W, this.H, 8);
    this.container.add(bg);

    // Golden left accent bar
    const accent = this.scene.add.graphics();
    accent.fillStyle(0xffc800, 1);
    accent.fillRoundedRect(0, 0, 6, this.H, 4);
    this.container.add(accent);

    // Trophy badge
    const badgeBg = this.scene.add.graphics();
    badgeBg.fillStyle(0xffc800, 0.2);
    badgeBg.fillCircle(28, this.H / 2, 18);
    badgeBg.lineStyle(1.5, 0xffc800, 0.8);
    badgeBg.strokeCircle(28, this.H / 2, 18);
    this.container.add(badgeBg);

    const badgeTxt = this.scene.add.text(28, this.H / 2, "🏆", {
      fontSize: "18px",
    }).setOrigin(0.5, 0.5);
    this.container.add(badgeTxt);

    // Text content
    const titleTxt = this.scene.add.text(54, 10, "ACHIEVEMENT!", {
      fontSize: "9px", fontFamily: "Arial",
      color: "#ffc800", fontStyle: "bold",
    });
    this.container.add(titleTxt);

    const nameTxt = this.scene.add.text(54, 22, this.achievement.achievement.name, {
      fontSize: "12px", fontFamily: "Arial",
      color: "#ffffff", fontStyle: "bold",
      wordWrap: { width: this.W - 64 },
    });
    this.container.add(nameTxt);

    // Reward
    const parts: string[] = [];
    if (this.achievement.achievement.reward_currency) {
      parts.push(`+$${this.achievement.achievement.reward_currency.toLocaleString()}`);
    }
    if (this.achievement.achievement.reward_gems) {
      parts.push(`+${this.achievement.achievement.reward_gems} gems`);
    }
    if (parts.length > 0) {
      const rewardTxt = this.scene.add.text(54, 44, parts.join("  "), {
        fontSize: "10px", fontFamily: "Arial",
        color: "#aaffaa",
      });
      this.container.add(rewardTxt);
    }

    this.scene.children.add(this.container);
  }

  slideIn(row: number): void {
    this.row = row;
    const y = 60 + row * (this.H + this.MARGIN);

    // Start off-screen right
    const cw = CONFIG.CANVAS_WIDTH;
    this.container.x = cw + this.W;
    this.container.y = y;

    // Slide in
    this.scene.tweens.add({
      targets: this.container,
      x: cw - this.W - 16,
      alpha: 1,
      duration: 350,
      ease: "Back.easeOut",
    });

    // Auto-dismiss after 4 seconds
    this.scene.time.delayedCall(4000, () => this.dismiss());
  }

  dismiss(): void {
    if (this.dismissed) return;
    this.dismissed = true;

    const cw = CONFIG.CANVAS_WIDTH;
    this.scene.tweens.add({
      targets: this.container,
      x: cw + this.W,
      alpha: 0,
      duration: 250,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.container.destroy();
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
