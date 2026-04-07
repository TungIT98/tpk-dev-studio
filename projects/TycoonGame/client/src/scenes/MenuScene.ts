/**
 * MenuScene.ts
 * Main menu — connect to Colyseus, enter username, pick room type.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";
import { LobbyScene } from "./LobbyScene";

interface MenuRoom {
  key: string;
  label: string;
  desc: string;
}

const ROOMS: MenuRoom[] = [
  { key: "lobby", label: "Main Lobby", desc: "Chat & meet other tycoons" },
  { key: "game", label: "Tycoon Game", desc: "Compete in the idle tycoon game" },
  { key: "trading", label: "Trading Floor", desc: "Buy & sell with other players" },
  { key: "minigame", label: "Minigames", desc: "Quick mini-games for bonus rewards" },
];

export class MenuScene extends Phaser.Scene {
  private usernameInput!: HTMLInputElement;
  private selectedRoom = "lobby";
  private roomButtons: Phaser.GameObjects.Container[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private roomContainers: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Background
    this.add.rectangle(cx, cy, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, COLORS.BG);

    // Title
    this.add.text(cx, 80, "TycoonGame", {
      fontSize: "44px", fontFamily: "Arial Black", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(cx, 120, "Enhanced Tycoon v2 — Multiplayer", {
      fontSize: "14px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(0.5);

    // Username input (DOM)
    const inputLabel = this.add.text(cx, 165, "Your Username", {
      fontSize: "13px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(0.5);

    this.usernameInput = document.createElement("input") as HTMLInputElement;
    this.usernameInput.type = "text";
    this.usernameInput.placeholder = "Enter a username...";
    this.usernameInput.maxLength = 20;
    this.usernameInput.value = localStorage.getItem("tycoon_username") ?? "";
    Object.assign(this.usernameInput.style, {
      width: "240px", height: "36px",
      background: "rgba(28,28,44,0.9)", border: "1px solid #373755",
      borderRadius: "6px", color: "#ffffff",
      fontFamily: "Arial", fontSize: "14px",
      padding: "0 12px", textAlign: "center",
      outline: "none", boxSizing: "border-box",
    });

    const inputDom = this.add.dom(cx, 198).createFromHTML("");
    inputDom.node.appendChild(this.usernameInput);

    // Room selection
    this.add.text(cx, 250, "Select Room", {
      fontSize: "13px", fontFamily: "Arial", color: "#a0a0be", fontStyle: "bold",
    }).setOrigin(0.5);

    ROOMS.forEach((room, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const bx = cx - 260 + col * 270;
      const by = 275 + row * 72;
      const c = this.makeRoomButton(room, bx, by, i === 0);
      this.roomContainers.push(c);
      this.roomButtons.push(c);
    });

    // Connect button
    const btn = this.makeButton(cx, 440, "Enter Game", 0xffc800, COLORS.ACCENT_DARK);
    btn.setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => (btn as Phaser.GameObjects.Container).list[0] &&
      ((btn.list[0] as Phaser.GameObjects.Graphics).fillStyle(0xffd84d, 1)));
    btn.on("pointerdown", () => this.connect());

    // Status text
    this.statusText = this.add.text(cx, 490, "", {
      fontSize: "12px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(0.5);

    // Enter key shortcut
    this.input.keyboard?.on("keydown-ENTER", () => this.connect());

    // Listen for Colyseus events
    colyseus.on("error", (err: Error) => {
      this.statusText.setText("Connection error: " + err.message).setColor("#dc3737");
    });
  }

  private makeRoomButton(room: MenuRoom, x: number, y: number, selected: boolean): Phaser.GameObjects.Container {
    const { COLORS } = CONFIG;
    const W = 240;
    const H = 58;
    const g = this.add.graphics();
    const isSelected = this.selectedRoom === room.key;

    const draw = () => {
      g.clear();
      g.fillStyle(isSelected ? COLORS.ACCENT : COLORS.PANEL, isSelected ? 0.3 : 0.8);
      g.fillRoundedRect(-W / 2, -H / 2, W, H, 8);
      g.lineStyle(1, isSelected ? COLORS.ACCENT : COLORS.BORDER, 1);
      g.strokeRoundedRect(-W / 2, -H / 2, W, H, 8);
    };
    draw();

    const label = this.add.text(0, -10, room.label, {
      fontSize: "14px", fontFamily: "Arial", color: isSelected ? "#ffc800" : "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5);

    const desc = this.add.text(0, 10, room.desc, {
      fontSize: "11px", fontFamily: "Arial", color: "#606080",
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [g, label, desc]);
    container.setInteractive(new Phaser.Geom.Rectangle(x, y, W, H), Phaser.Geom.Rectangle.Contains);
    container.on("pointerdown", () => {
      this.selectedRoom = room.key;
      this.roomButtons.forEach((c, i) => {
        const isSel = ROOMS[i].key === this.selectedRoom;
        (c.list[1] as Phaser.GameObjects.Text).setColor(isSel ? "#ffc800" : "#ffffff");
      });
      draw();
    });
    return container;
  }

  private makeButton(x: number, y: number, label: string, color: number, dark: number): Phaser.GameObjects.Container {
    const W = 200;
    const H = 44;
    const g = this.add.graphics();
    const text = this.add.text(x, y, label, {
      fontSize: "16px", fontFamily: "Arial", color: "#0a0a12", fontStyle: "bold",
    }).setOrigin(0.5);

    const draw = () => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRoundedRect(x - W / 2, y - H / 2, W, H, 8);
      g.fillStyle(dark, 1);
      g.fillRoundedRect(x - W / 2, y - H / 2 + H - 6, W, 6, { bl: 8, br: 8 });
    };
    draw();

    const container = this.add.container(0, 0, [g, text]);
    container.setPosition(x, y);
    return container;
  }

  private async connect(): Promise<void> {
    const username = (this.usernameInput.value.trim() || "Tycoon_" + Math.floor(Math.random() * 9999));
    localStorage.setItem("tycoon_username", username);
    this.statusText.setText(`Connecting as "${username}"...`).setColor("#a0a0be");

    try {
      this.statusText.setText("Connecting to server...");
      await colyseus.connect();
      this.statusText.setText("Joining room...");
      await colyseus.joinRoom(this.selectedRoom, { username });
      this.scene.start("LobbyScene", { username, room: this.selectedRoom });
    } catch (err) {
      this.statusText.setText("Could not connect. Is the server running?").setColor("#dc3737");
    }
  }
}
