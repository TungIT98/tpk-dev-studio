/**
 * PlayerListUI.ts
 * Shows players currently in the room with presence indicators.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";
import type { PlayerSchema, RoomState } from "../shared/types";

const MAX_VISIBLE = 20;

export class PlayerListUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private nameTexts: Phaser.GameObjects.Text[] = [];
  private statusTexts: Phaser.GameObjects.Text[] = [];
  private dotGraphics: Phaser.GameObjects.Graphics[] = [];
  private players: Record<string, PlayerSchema> = {};
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
    this.subscribe();
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const W = 200;
    const H = 320;
    const X = 20;
    const Y = 60;

    const panel = this.scene.add.graphics();
    panel.fillStyle(COLORS.PANEL, 0.9);
    panel.fillRoundedRect(0, 0, W, H, 8);
    panel.lineStyle(1, COLORS.BORDER, 1);
    panel.strokeRoundedRect(0, 0, W, H, 8);

    const header = this.scene.add.graphics();
    header.fillStyle(COLORS.ACCENT, 0.12);
    header.fillRoundedRect(0, 0, W, 32, { tl: 8, tr: 8, bl: 0, br: 0 });

    const title = this.scene.add.text(12, 9, "Players Online", {
      fontSize: "12px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
    });

    const countLabel = this.scene.add.text(W - 12, 9, "0", {
      fontSize: "12px", fontFamily: "Arial", color: "#a0a0be", fontStyle: "bold",
    }).setOrigin(1, 0);

    this.container = this.scene.add.container(0, 0, [panel, header, title, countLabel]);
    const rowH = 22;

    for (let i = 0; i < MAX_VISIBLE; i++) {
      const rowY = 40 + i * rowH;

      const dot = this.scene.add.graphics();
      dot.fillStyle(0x00d26e, 1);
      dot.fillCircle(4, 4, 4);

      const name = this.scene.add.text(16, rowY, "", {
        fontSize: "11px", fontFamily: "Arial", color: "#ffffff",
      });

      const status = this.scene.add.text(W - 12, rowY, "", {
        fontSize: "10px", fontFamily: "Arial", color: "#606080",
      }).setOrigin(1, 0);

      this.dotGraphics.push(dot);
      this.nameTexts.push(name);
      this.statusTexts.push(status);

      this.container.add([dot, name, status]);
    }

    this.container.setPosition(X, Y);
    this.container.setDepth(850);
    this.container.setVisible(false);
    this.isVisible = false;

    this.scene.input.keyboard?.on("keydown-P", () => this.toggle());
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
    if (this.isVisible) this.render();
  }

  private render(): void {
    const players = Object.values(this.players);
    const localSid = colyseus.sessionId ?? "";
    const countLabel = this.container.list[3] as Phaser.GameObjects.Text;
    countLabel.setText(`${players.length}`);

    players.slice(0, MAX_VISIBLE).forEach((p, i) => {
      const isLocal = p.sessionId === localSid;
      this.nameTexts[i].setText(isLocal ? p.username + " (you)" : p.username).setColor(
        isLocal ? "#ffc800" : "#ffffff"
      );
      this.dotGraphics[i].clear();
      this.dotGraphics[i].fillStyle(p.ready ? 0x00d26e : 0xffc800, 1);
      this.dotGraphics[i].fillCircle(4, 4, 4);
      this.statusTexts[i].setText(p.ready ? "✓ ready" : "idle");
    });

    for (let i = players.length; i < MAX_VISIBLE; i++) {
      this.nameTexts[i].setText("");
      this.statusTexts[i].setText("");
      this.dotGraphics[i].clear();
    }
  }

  private subscribe(): void {
    colyseus.on("state:change", (state: RoomState) => {
      this.players = state.players ?? {};
      if (this.isVisible) this.render();
    });
    colyseus.on("player:joined", () => { if (this.isVisible) this.render(); });
    colyseus.on("player:left", () => { if (this.isVisible) this.render(); });
  }

  destroy(): void {
    this.container.destroy();
  }
}
