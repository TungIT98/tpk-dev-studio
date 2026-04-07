/**
 * LeaderboardUI.ts
 * Leaderboard panel showing top players by earnings / prestige.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";
import { sendLeaderboardRequest } from "../network/messages";
import type { LeaderboardEntry } from "../shared/types";

const MAX_VISIBLE = 15;

export class LeaderboardUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private entryTexts: Phaser.GameObjects.Text[] = [];
  private rankTexts: Phaser.GameObjects.Text[] = [];
  private nameTexts: Phaser.GameObjects.Text[] = [];
  private scoreTexts: Phaser.GameObjects.Text[] = [];
  private entries: LeaderboardEntry[] = [];
  private isVisible = false;
  private tabLabels: Phaser.GameObjects.Text[] = [];
  private currentTab: "global" | "weekly" | "prestige" = "global";

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
    this.subscribe();
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const W = 260;
    const H = 380;
    const X = CONFIG.CANVAS_WIDTH - W - 20;
    const Y = 60;

    // Panel
    const panel = this.scene.add.graphics();
    panel.fillStyle(COLORS.PANEL, 0.92);
    panel.fillRoundedRect(0, 0, W, H, 8);
    panel.lineStyle(1, COLORS.BORDER, 1);
    panel.strokeRoundedRect(0, 0, W, H, 8);

    // Header
    const header = this.scene.add.graphics();
    header.fillStyle(COLORS.ACCENT, 0.15);
    header.fillRoundedRect(0, 0, W, 36, { tl: 8, tr: 8, bl: 0, br: 0 });

    const title = this.scene.add.text(W / 2, 10, "Leaderboard", {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#ffc800",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    // Tab bar
    const tabs: Array<{ label: string; key: LeaderboardUI["currentTab"] }> = [
      { label: "Global", key: "global" },
      { label: "Weekly", key: "weekly" },
      { label: "Prestige", key: "prestige" },
    ];
    const tabY = 38;
    const tabW = W / tabs.length;

    tabs.forEach((tab, i) => {
      const bg = this.scene.add.graphics();
      bg.fillStyle(COLORS.ACCENT, i === 0 ? 0.25 : 0);
      bg.fillRect(i * tabW, tabY, tabW, 26);
      const label = this.scene.add.text(i * tabW + tabW / 2, tabY + 6, tab.label, {
        fontSize: "11px",
        fontFamily: "Arial",
        color: i === 0 ? "#ffc800" : "#a0a0be",
        fontStyle: i === 0 ? "bold" : "normal",
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

      label.on("pointerdown", () => {
        this.switchTab(tab.key);
      });

      bg.on("pointerdown", () => this.switchTab(tab.key));
      bg.setInteractive(new Phaser.Geom.Rectangle(i * tabW, tabY, tabW, 26), Phaser.Geom.Rectangle.Contains);

      this.tabLabels.push(label);
    });

    // Column headers
    const colY = tabY + 30;
    const rankCol = this.scene.add.text(12, colY, "#", {
      fontSize: "10px", fontFamily: "Arial", color: "#606080", fontStyle: "bold",
    });
    const nameCol = this.scene.add.text(40, colY, "Player", {
      fontSize: "10px", fontFamily: "Arial", color: "#606080", fontStyle: "bold",
    });
    const scoreCol = this.scene.add.text(W - 12, colY, "Earned", {
      fontSize: "10px", fontFamily: "Arial", color: "#606080", fontStyle: "bold",
    }).setOrigin(1, 0);

    // Player rows (pre-allocate)
    const rowH = 22;
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const rowY = colY + 12 + i * rowH;

      const rank = this.scene.add.text(12, rowY, "", {
        fontSize: "11px", fontFamily: "Arial", color: "#a0a0be",
      });
      const name = this.scene.add.text(40, rowY, "", {
        fontSize: "11px", fontFamily: "Arial", color: "#ffffff",
      });
      const score = this.scene.add.text(W - 12, rowY, "", {
        fontSize: "11px", fontFamily: "Arial", color: "#ffc800",
      }).setOrigin(1, 0);

      this.rankTexts.push(rank);
      this.nameTexts.push(name);
      this.scoreTexts.push(score);
      this.entryTexts.push(rank, name, score);
    }

    // Refresh button
    const refreshBtn = this.scene.add.text(W / 2, H - 20, "⟳ Refresh", {
      fontSize: "11px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    refreshBtn.on("pointerdown", () => sendLeaderboardRequest(this.currentTab));

    this.container = this.scene.add.container(0, 0, [
      panel, header, title,
      ...this.tabLabels,
      rankCol, nameCol, scoreCol,
      ...this.entryTexts,
      refreshBtn,
    ]);
    this.container.setPosition(X, Y);
    this.container.setDepth(850);
    this.container.setVisible(false);
    this.isVisible = false;

    // Toggle with L key
    this.scene.input.keyboard?.on("keydown-L", () => this.toggle());
  }

  toggle(): void {
    if (this.isVisible) {
      this.container.setVisible(false);
      this.isVisible = false;
    } else {
      this.container.setVisible(true);
      this.isVisible = true;
      sendLeaderboardRequest(this.currentTab);
    }
  }

  private switchTab(tab: LeaderboardUI["currentTab"]): void {
    this.currentTab = tab;
    const tabs: Array<{ key: LeaderboardUI["currentTab"]; label: string }> = [
      { key: "global", label: "Global" },
      { key: "weekly", label: "Weekly" },
      { key: "prestige", label: "Prestige" },
    ];
    tabs.forEach((t, i) => {
      this.tabLabels[i].setStyle({
        fontSize: "11px", fontFamily: "Arial",
        color: t.key === tab ? "#ffc800" : "#a0a0be",
        fontStyle: t.key === tab ? "bold" : "normal",
      });
    });
    sendLeaderboardRequest(tab);
  }

  private render(entries: LeaderboardEntry[]): void {
    this.entries = entries;
    const localSid = colyseus.sessionId;

    entries.slice(0, MAX_VISIBLE).forEach((entry, i) => {
      const isLocal = entry.userId === localSid;
      this.rankTexts[i].setText(String(entry.rank)).setColor(
        entry.rank <= 3 ? ["#ffd700", "#c0c0c0", "#cd7f32"][entry.rank - 1] : "#a0a0be"
      );
      this.nameTexts[i].setText(entry.username).setColor(isLocal ? "#ffc800" : "#ffffff");
      this.scoreTexts[i].setText(this.formatMoney(entry.totalEarned));
    });

    // Clear unused rows
    for (let i = entries.length; i < MAX_VISIBLE; i++) {
      this.rankTexts[i].setText("");
      this.nameTexts[i].setText("");
      this.scoreTexts[i].setText("");
    }
  }

  private formatMoney(n: number): string {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
    return "$" + Math.floor(n);
  }

  private subscribe(): void {
    colyseus.on("leaderboard:update", (entries: LeaderboardEntry[]) => this.render(entries));
  }

  destroy(): void {
    this.container.destroy();
  }
}
