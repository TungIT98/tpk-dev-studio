/**
 * BootScene.ts
 * Initial loading screen — sets up DOM input handling and displays logo.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Show loading bar
    const bar = this.add.graphics();
    const bx = this.cameras.main.width / 2 - 150;
    const by = this.cameras.main.height / 2 + 20;
    bar.fillStyle(0x373755, 1);
    bar.fillRect(bx, by, 300, 20);
    bar.lineStyle(1, 0xffc800, 1);
    bar.strokeRect(bx, by, 300, 20);

    this.load.on("progress", (v: number) => {
      bar.clear();
      bar.fillStyle(0x373755, 1);
      bar.fillRect(bx, by, 300, 20);
      bar.fillStyle(0xffc800, 1);
      bar.fillRect(bx + 2, by + 2, (300 - 4) * v, 16);
    });

    // Load any assets here when added to the project
    // this.load.image("logo", "assets/logo.png");
  }

  create(): void {
    // Title
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 60,
      "TycoonGame",
      {
        fontSize: "52px",
        fontFamily: "Arial Black",
        color: "#ffc800",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 10,
      "Multiplayer Beta",
      {
        fontSize: "18px",
        fontFamily: "Arial",
        color: "#a0a0be",
      }
    ).setOrigin(0.5);

    const startText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 80,
      "Click to Start",
      { fontSize: "16px", fontFamily: "Arial", color: "#ffffff" }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startText.on("pointerover", () => startText.setColor("#ffc800"));
    startText.on("pointerout", () => startText.setColor("#ffffff"));
    startText.on("pointerdown", () => this.scene.start("MenuScene"));

    // Also allow any keypress to continue
    this.input.keyboard?.once("keydown", () => this.scene.start("MenuScene"));
  }
}
