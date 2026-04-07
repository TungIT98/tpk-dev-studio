/**
 * MiniGameHubScene.ts
 * Hub scene for selecting between different mini-games.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";

interface MiniGameEntry {
  key: string;
  name: string;
  icon: string;
  description: string;
  color: number;
  bestScore?: number;
}

export class MiniGameHubScene extends Phaser.Scene {
  private games: MiniGameEntry[] = [
    {
      key: "ClickerChallengeScene",
      name: "Clicker Challenge",
      icon: "⚡",
      description: "Click as fast as you can in 10 seconds!",
      color: 0xffc800,
    },
    {
      key: "MemoryMatchScene",
      name: "Memory Match",
      icon: "🧠",
      description: "Find all matching pairs in 60 seconds!",
      color: 0xc850ff,
    },
    {
      key: "ObstacleCourseScene",
      name: "Obstacle Course",
      icon: "🏃",
      description: "Race through obstacles as fast as possible!",
      color: 0x00d26e,
    },
  ];

  constructor() {
    super({ key: "MiniGameHubScene" });
  }

  create(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Title
    this.add.text(cx, 60, "🎮 Mini-Games 🎮", {
      fontSize: "42px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(cx, 110, "Choose a game to play!", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setOrigin(0.5);

    // Game cards
    const cardWidth = 280;
    const cardHeight = 200;
    const spacing = 30;
    const startX = cx - ((this.games.length * cardWidth + (this.games.length - 1) * spacing) / 2);

    for (let i = 0; i < this.games.length; i++) {
      const game = this.games[i];
      const x = startX + i * (cardWidth + spacing);
      const y = cy - 20;

      this.createGameCard(x, y, cardWidth, cardHeight, game);
    }

    // Rewards info
    this.add.text(cx, CONFIG.CANVAS_HEIGHT - 120, "🏆 Top 3 scores earn rewards! 🏆", {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#ffc800",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(50, CONFIG.CANVAS_HEIGHT - 50, "← Back", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setInteractive({ useHandCursor: true });

    backBtn.on("pointerdown", () => {
      this.scene.stop();
      this.scene.resume("GameScene");
    });
  }

  private createGameCard(x: number, y: number, width: number, height: number, game: MiniGameEntry): void {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x1c1c2c, 1);
    bg.fillRoundedRect(0, 0, width, height, 15);
    bg.lineStyle(3, game.color, 0.8);
    bg.strokeRoundedRect(0, 0, width, height, 15);
    container.add(bg);

    // Icon
    const iconText = this.add.text(width / 2, 50, game.icon, {
      fontSize: "48px",
      fontFamily: "Arial",
    }).setOrigin(0.5);
    container.add(iconText);

    // Name
    const nameText = this.add.text(width / 2, 100, game.name, {
      fontSize: "22px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    container.add(nameText);

    // Description
    const descText = this.add.text(width / 2, 130, game.description, {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setOrigin(0.5);
    container.add(descText);

    // Play button
    const playBtn = this.add.text(width / 2, 170, "▶ PLAY", {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: game.color,
      padding: { left: 20, right: 20, top: 8, bottom: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    container.add(playBtn);

    // Interactions
    playBtn.on("pointerdown", () => {
      this.scene.pause("GameScene");
      this.scene.start(game.key);
    });

    playBtn.on("pointerover", () => {
      playBtn.setAlpha(0.8);
      bg.clear();
      bg.fillStyle(0x1c1c2c, 1);
      bg.fillRoundedRect(0, 0, width, height, 15);
      bg.lineStyle(4, game.color, 1);
      bg.strokeRoundedRect(0, 0, width, height, 15);
    });

    playBtn.on("pointerout", () => {
      playBtn.setAlpha(1);
      bg.clear();
      bg.fillStyle(0x1c1c2c, 1);
      bg.fillRoundedRect(0, 0, width, height, 15);
      bg.lineStyle(3, game.color, 0.8);
      bg.strokeRoundedRect(0, 0, width, height, 15);
    });

    // Hover effect on container
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    container.on("pointerover", () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    container.on("pointerout", () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
  }
}