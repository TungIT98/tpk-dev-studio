/**
 * HUD.ts
 * In-game HUD overlay: money counter, phase indicator, player count, connection status.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";
import type { RoomState } from "../shared/types";

export class HUD {
  private scene: Phaser.Scene;
  private moneyText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private playerCountText!: Phaser.GameObjects.Text;
  private connectionDot!: Phaser.GameObjects.Graphics;
  private container!: Phaser.GameObjects.Container;
  private lastMoney = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
    this.subscribe();
  }

  private build(): void {
    const { COLORS } = CONFIG;

    // Top bar
    const bar = this.scene.add.graphics();
    bar.fillStyle(COLORS.PANEL, 0.88);
    bar.fillRect(0, 0, CONFIG.CANVAS_WIDTH, 50);
    bar.lineStyle(1, COLORS.BORDER, 0.5);
    bar.lineBetween(0, 50, CONFIG.CANVAS_WIDTH, 50);

    // Money
    this.moneyText = this.scene.add.text(CONFIG.CANVAS_WIDTH / 2, 14, "$0", {
      fontSize: "22px", fontFamily: "Arial Black", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5, 0);

    // Phase indicator
    this.phaseText = this.scene.add.text(CONFIG.CANVAS_WIDTH / 2, 34, "Lobby", {
      fontSize: "11px", fontFamily: "Arial", color: "#606080",
    }).setOrigin(0.5, 0);

    // Player count (top-left)
    this.playerCountText = this.scene.add.text(16, 16, "Players: 0", {
      fontSize: "12px", fontFamily: "Arial", color: "#a0a0be",
    });

    // Connection dot (top-right)
    this.connectionDot = this.scene.add.graphics();
    this.drawDot(false);

    const connLabel = this.scene.add.text(CONFIG.CANVAS_WIDTH - 80, 16, "Offline", {
      fontSize: "11px", fontFamily: "Arial", color: "#dc3737",
    });

    this.container = this.scene.add.container(0, 0, [
      bar, this.moneyText, this.phaseText,
      this.playerCountText, this.connectionDot, connLabel,
    ]);
    this.container.setDepth(950);

    // Key hint
    const hint = this.scene.add.text(
      CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 10,
      "  C: Chat  L: Leaderboard  P: Players  I: Pets  K: Collections  E: Events  ESC: Menu",
      { fontSize: "10px", fontFamily: "Arial", color: "#404060" }
    ).setOrigin(0.5, 1).setDepth(950);
  }

  private drawDot(connected: boolean): void {
    this.connectionDot.clear();
    this.connectionDot.fillStyle(connected ? 0x00d26e : 0xdc3737, 1);
    this.connectionDot.fillCircle(4, 4, 4);
    this.connectionDot.setPosition(CONFIG.CANVAS_WIDTH - 100, 18);
  }

  private formatMoney(n: number): string {
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(2) + "K";
    return "$" + Math.floor(n);
  }

  private subscribe(): void {
    colyseus.on("connect", () => {
      this.drawDot(true);
    });
    colyseus.on("disconnect", () => {
      this.drawDot(false);
    });
    colyseus.on("state:change", (state: RoomState) => {
      const players = Object.values(state.players ?? {});
      this.playerCountText.setText(`Players: ${players.length}`);

      const phase = state.phase ?? "lobby";
      const phaseLabel = phase.charAt(0).toUpperCase() + phase.slice(1);
      this.phaseText.setText(phaseLabel);

      // Find local player money
      const localSid = colyseus.sessionId;
      const localPlayer = localSid ? state.players?.[localSid] : null;
      if (localPlayer) {
        const money = localPlayer.money ?? 0;
        this.moneyText.setText(this.formatMoney(money));
        if (money > this.lastMoney) {
          this.moneyText.setColor("#00d26e");
          this.scene.time.delayedCall(300, () => this.moneyText.setColor("#ffc800"));
        }
        this.lastMoney = money;
      }
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
