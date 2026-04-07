/**
 * ClickerChallengeScene.ts
 * Mini-game: Rapid click challenge - click as many times as possible in 10 seconds.
 * Score is submitted to the backend for ranking and rewards.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";

const GAME_DURATION = 10; // seconds
const TARGET_CLICKS = 50;

export class ClickerChallengeScene extends Phaser.Scene {
  private clickCount = 0;
  private timeLeft = GAME_DURATION;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private clickZone!: Phaser.GameObjects.Container;
  private isRunning = false;
  private timerEvent?: Phaser.Time.TimerEvent;
  private gameId = "clicker_challenge";

  constructor() {
    super({ key: "ClickerChallengeScene" });
  }

  create(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Title
    this.add.text(cx, 80, "⚡ Clicker Challenge ⚡", {
      fontSize: "36px",
      fontFamily: "Arial",
      color: "#ffc800",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Instructions
    this.add.text(cx, 140, "Click the target as many times as possible!", {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(cx, 200, `${this.timeLeft}s`, {
      fontSize: "48px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Score display
    this.add.text(cx, 280, "Clicks:", {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setOrigin(0.5, 0.5);

    this.scoreText = this.add.text(cx, 330, "0", {
      fontSize: "64px",
      fontFamily: "Arial",
      color: "#00d26e",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);

    // Click target zone
    this.clickZone = this.createClickTarget(cx, cy + 80);
    this.clickZone.setInteractive();

    this.input.on("pointerdown", () => {
      if (this.isRunning) {
        this.registerClick();
      }
    });

    // Start button
    const startBtn = this.add.text(cx, CONFIG.CANVAS_HEIGHT - 100, "▶ START", {
      fontSize: "28px",
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "#00d26e",
      padding: { left: 30, right: 30, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on("pointerdown", () => this.startGame());
    startBtn.on("pointerover", () => startBtn.setAlpha(0.8));
    startBtn.on("pointerout", () => startBtn.setAlpha(1));

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

  private createClickTarget(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const size = 120;

    // Outer glow ring
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xffc800, 0.6);
    ring.strokeCircle(0, 0, size / 2 + 10);
    container.add(ring);

    // Main circle
    const circle = this.add.graphics();
    circle.fillStyle(0xffc800, 1);
    circle.fillCircle(0, 0, size / 2);
    container.add(circle);

    // Inner highlight
    const highlight = this.add.graphics();
    highlight.fillStyle(0xffffff, 0.3);
    highlight.fillCircle(-10, -10, size / 4);
    container.add(highlight);

    // Center text
    const label = this.add.text(0, 0, "CLICK!", {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#0f0f19",
      fontStyle: "bold",
    }).setOrigin(0.5);
    container.add(label);

    // Pulse animation
    this.tweens.add({
      targets: container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return container;
  }

  private startGame(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.clickCount = 0;
    this.timeLeft = GAME_DURATION;
    this.scoreText.setText("0");
    this.timerText.setText(`${this.timeLeft}s`);
    this.timerText.setColor("#ffffff");

    // Timer countdown
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);

        // Color change as time runs out
        if (this.timeLeft <= 3) {
          this.timerText.setColor("#dc3737");
        }

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      repeat: GAME_DURATION,
    });

    // Scale pop animation on click
    this.tweens.add({
      targets: this.clickZone,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
    });
  }

  private registerClick(): void {
    this.clickCount++;
    this.scoreText.setText(String(this.clickCount));

    // Visual feedback
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 50,
      yoyo: true,
    });

    // Particle burst effect
    this.createClickParticle(this.clickZone.x, this.clickZone.y);
  }

  private createClickParticle(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0xffc800, 1);
      particle.fillCircle(0, 0, 4);
      particle.x = x;
      particle.y = y;
      this.add.existing(particle);

      const angle = (Math.PI * 2 / 5) * i;
      const dist = 30 + Math.random() * 20;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300,
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private async endGame(): Promise<void> {
    this.isRunning = false;
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // Submit score to backend
    const sessionId = colyseus.sessionId;
    const username = colyseus.localPlayer?.username ?? "Guest";

    try {
      const response = await fetch(
        `http://localhost:8000/api/minigames/${this.gameId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: username,
            score: this.clickCount,
            game_data: { username },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        this.showResults(result.rank, result.reward_granted);
      } else {
        this.showResults(0, 0);
      }
    } catch {
      // If backend not available, just show local results
      this.showResults(0, 0);
    }
  }

  private showResults(rank: number, reward: number): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Results panel
    const panel = this.add.graphics();
    panel.fillStyle(0x1c1c2c, 0.95);
    panel.fillRoundedRect(cx - 200, cy - 150, 400, 300, 20);
    panel.lineStyle(3, 0xffc800, 1);
    panel.strokeRoundedRect(cx - 200, cy - 150, 400, 300, 20);

    this.add.text(cx, cy - 110, "⏱️ Time's Up!", {
      fontSize: "32px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(cx, cy - 60, `Final Score: ${this.clickCount} clicks`, {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#00d26e",
    }).setOrigin(0.5);

    if (rank > 0) {
      this.add.text(cx, cy - 10, `🏆 Rank: #${rank}`, {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffc800",
      }).setOrigin(0.5);
    }

    if (reward > 0) {
      this.add.text(cx, cy + 30, `💰 Reward: $${reward}`, {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#00d26e",
      }).setOrigin(0.5);
    }

    // Play again button
    const againBtn = this.add.text(cx, cy + 90, "🔄 Play Again", {
      fontSize: "22px",
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "#00d26e",
      padding: { left: 20, right: 20, top: 8, bottom: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    againBtn.on("pointerdown", () => {
      panel.clear();
      this.scene.restart();
    });

    // Exit button
    const exitBtn = this.add.text(cx, cy + 140, "← Back to Game", {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    exitBtn.on("pointerdown", () => {
      this.scene.stop();
      this.scene.resume("GameScene");
    });
  }
}