/**
 * LobbyScene.ts
 * Main multiplayer lobby: player list, chat, leaderboard, room info.
 * Hosts ChatUI, LeaderboardUI, PlayerListUI, and HUD.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";
import { ChatUI } from "../ui/ChatUI";
import { LeaderboardUI } from "../ui/LeaderboardUI";
import { PlayerListUI } from "../ui/PlayerListUI";
import { HUD } from "../ui/HUD";
import { GameScene } from "./GameScene";
import type { RoomState, PlayerSchema } from "../shared/types";
import { sendReady } from "../network/messages";

export class LobbyScene extends Phaser.Scene {
  private chatUI!: ChatUI;
  private leaderboardUI!: LeaderboardUI;
  private playerListUI!: PlayerListUI;
  private hud!: HUD;
  private phaseText!: Phaser.GameObjects.Text;
  private readyButton!: Phaser.GameObjects.Container;
  private isReady = false;
  private roomInfoText!: Phaser.GameObjects.Text;
  private playerAvatars: Record<string, Phaser.GameObjects.Graphics> = {};

  constructor() {
    super({ key: "LobbyScene" });
  }

  init(data: { username: string; room: string }): void {
    console.log(`[LobbyScene] Joined as ${data.username}, room: ${data.room}`);
  }

  create(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Background
    this.add.rectangle(cx, cy, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, COLORS.BG);

    // Subtle grid pattern
    const grid = this.add.graphics();
    grid.lineStyle(1, COLORS.BORDER, 0.15);
    for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 64) {
      grid.lineBetween(x, 0, x, CONFIG.CANVAS_HEIGHT);
    }
    for (let y = 0; y < CONFIG.CANVAS_HEIGHT; y += 64) {
      grid.lineBetween(0, y, CONFIG.CANVAS_WIDTH, y);
    }

    // Room title
    const roomName = (colyseus.room as any)?.roomName ?? "Lobby";
    this.add.text(cx, 30, `Room: ${roomName}`, {
      fontSize: "16px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5, 0);

    // Room info
    this.roomInfoText = this.add.text(cx, 52, "Waiting for players...", {
      fontSize: "11px", fontFamily: "Arial", color: "#606080",
    }).setOrigin(0.5, 0);

    // Ready button (for minigame / game start)
    this.readyButton = this.makeReadyButton(cx, CONFIG.CANVAS_HEIGHT - 60);
    this.readyButton.setInteractive({ useHandCursor: true });
    this.readyButton.on("pointerdown", () => this.toggleReady());

    // Placeholder "game world" — other player avatars in a simple grid
    this.add.text(cx, 110, "Players in Room", {
      fontSize: "12px", fontFamily: "Arial", color: "#606080", fontStyle: "bold",
    }).setOrigin(0.5, 0);

    // Draw a 5x4 grid of player slots
    const slotW = 80;
    const slotH = 90;
    const gridCols = Math.floor((CONFIG.CANVAS_WIDTH - 300) / slotW);
    const gridRows = 3;
    const gridStartX = 300;
    const gridStartY = 120;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const sx = gridStartX + c * slotW + slotW / 2;
        const sy = gridStartY + r * slotH + slotH / 2;
        const g = this.add.graphics();
        g.fillStyle(COLORS.PANEL, 0.5);
        g.fillRoundedRect(sx - slotW / 2 + 2, sy - slotH / 2 + 2, slotW - 4, slotH - 4, 6);
        g.lineStyle(1, COLORS.BORDER, 0.3);
        g.strokeRoundedRect(sx - slotW / 2 + 2, sy - slotH / 2 + 2, slotW - 4, slotH - 4, 6);
        const name = this.add.text(sx, sy + 20, "", {
          fontSize: "10px", fontFamily: "Arial", color: "#ffffff",
        }).setOrigin(0.5, 0).setAlpha(0.7);
        this.add.container(0, 0, [g, name]);
      }
    }

    // Back to menu
    const backBtn = this.add.text(20, CONFIG.CANVAS_HEIGHT - 20, "← Leave Room", {
      fontSize: "12px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    backBtn.on("pointerover", () => backBtn.setColor("#ffc800"));
    backBtn.on("pointerout", () => backBtn.setColor("#a0a0be"));
    backBtn.on("pointerdown", () => {
      colyseus.leaveRoom();
      this.scene.start("MenuScene");
    });

    // UI overlays
    this.chatUI = new ChatUI(this);
    this.leaderboardUI = new LeaderboardUI(this);
    this.playerListUI = new PlayerListUI(this);
    this.hud = new HUD(this);

    // Keyboard shortcuts hint is in HUD

    // ESC → menu
    this.input.keyboard?.on("keydown-ESC", () => {
      colyseus.leaveRoom();
      this.scene.start("MenuScene");
    });

    // Tab → toggle chat
    this.input.keyboard?.on("keydown-TAB", (e: KeyboardEvent) => {
      e.preventDefault();
      this.chatUI.toggle();
    });

    // Colyseus events
    colyseus.on("state:change", (state: RoomState) => this.onStateChange(state));
    colyseus.on("room:left", () => {
      this.scene.start("MenuScene");
    });
  }

  private makeReadyButton(x: number, y: number): Phaser.GameObjects.Container {
    const W = 160;
    const H = 40;
    const g = this.add.graphics();
    const text = this.add.text(x, y, "Ready (R)", {
      fontSize: "15px", fontFamily: "Arial", color: "#0a0a12", fontStyle: "bold",
    }).setOrigin(0.5);

    const draw = (ready: boolean) => {
      g.clear();
      g.fillStyle(ready ? 0x00d26e : 0xffc800, 1);
      g.fillRoundedRect(x - W / 2, y - H / 2, W, H, 8);
    };
    draw(false);

    const c = this.add.container(x, y, [g, text]);
    c.setPosition(x, y);

    // Override draw via a tag
    (c as any)._draw = draw;
    return c;
  }

  private toggleReady(): void {
    this.isReady = !this.isReady;
    sendReady(this.isReady);
    const draw = (this.readyButton as any)._draw as (r: boolean) => void;
    draw(this.isReady);
    (this.readyButton.list[1] as Phaser.GameObjects.Text)
      .setText(this.isReady ? "✓ Ready!" : "Ready (R)")
      .setColor(this.isReady ? "#0a0a12" : "#0a0a12");
  }

  private onStateChange(state: RoomState): void {
    const playerCount = Object.keys(state.players ?? {}).length;
    this.roomInfoText.setText(
      `${playerCount} player${playerCount !== 1 ? "s" : ""} online · Phase: ${state.phase}`
    );

    // Auto-switch to GameScene when phase changes to "playing"
    if (state.phase === "playing" && this.scene.key === "LobbyScene") {
      this.scene.start("GameScene");
    }
  }
}
