/**
 * ObstacleCourseScene.ts
 * Mini-game: Obstacle course - navigate through obstacles as fast as possible.
 * Score based on completion time. Lower is better.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";

const GAME_TIME = 30; // seconds
const PLAYER_SIZE = 32;
const OBSTACLE_SIZE = 40;
const PLAYER_SPEED = 300;

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ObstacleCourseScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Graphics;
  private obstacles: Obstacle[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private isRunning = false;
  private timeLeft = GAME_TIME;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timerText!: Phaser.GameObjects.Text;
  private startTime = 0;
  private finishLine!: Phaser.GameObjects.Graphics;
  private gameId = "obstacle_course";

  constructor() {
    super({ key: "ObstacleCourseScene" });
  }

  create(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Title
    this.add.text(cx, 50, "🏃 Obstacle Course 🏃", {
      fontSize: "36px",
      fontFamily: "Arial",
      color: "#00d26e",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Instructions
    this.add.text(cx, 100, "Use WASD or Arrow keys to navigate!", {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(cx, 140, `${this.timeLeft}s`, {
      fontSize: "48px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Game area bounds
    const gameArea = {
      x: 50,
      y: 180,
      width: CONFIG.CANVAS_WIDTH - 100,
      height: CONFIG.CANVAS_HEIGHT - 280,
    };

    // Create obstacles
    this.createObstacles(gameArea);

    // Create finish line (right side)
    this.finishLine = this.add.graphics();
    this.finishLine.lineStyle(4, 0xffc800, 1);
    this.finishLine.lineBetween(
      gameArea.x + gameArea.width - 10,
      gameArea.y,
      gameArea.x + gameArea.width - 10,
      gameArea.y + gameArea.height
    );
    this.finishLine.setDepth(0);

    // "FINISH" text at top of finish line
    this.add.text(gameArea.x + gameArea.width - 10, gameArea.y - 10, "FINISH", {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#ffc800",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Create player (start at left)
    this.player = this.add.graphics();
    this.player.fillStyle(0x00d26e, 1);
    this.player.fillCircle(PLAYER_SIZE / 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2);
    this.player.x = gameArea.x + PLAYER_SIZE;
    this.player.y = gameArea.y + gameArea.height / 2;
    this.player.setDepth(1);

    // Game area border
    const border = this.add.graphics();
    border.lineStyle(2, 0x373755, 1);
    border.strokeRect(gameArea.x, gameArea.y, gameArea.width, gameArea.height);

    // Start zone indicator
    this.add.text(gameArea.x + 30, gameArea.y + 10, "START", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#00d26e",
      fontStyle: "bold",
    });

    // Keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Start button
    const startBtn = this.add.text(cx, CONFIG.CANVAS_HEIGHT - 80, "▶ START", {
      fontSize: "28px",
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "#00d26e",
      padding: { left: 30, right: 30, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on("pointerdown", () => this.startGame(startBtn, gameArea));
    startBtn.on("pointerover", () => startBtn.setAlpha(0.8));
    startBtn.on("pointerout", () => startBtn.setAlpha(1));

    // Back button
    const backBtn = this.add.text(50, CONFIG.CANVAS_HEIGHT - 50, "← Back", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setInteractive({ useHandCursor: true });

    backBtn.on("pointerdown", () => {
      if (this.timerEvent) this.timerEvent.destroy();
      this.scene.stop();
      this.scene.resume("GameScene");
    });
  }

  private createObstacles(gameArea: { x: number; y: number; width: number; height: number }): void {
    this.obstacles = [];

    // Create a series of obstacles forming a challenging course
    const obstaclePositions = [
      { x: 0.2, y: 0.2, w: 0.08, h: 0.3 },
      { x: 0.35, y: 0.5, w: 0.1, h: 0.25 },
      { x: 0.5, y: 0.1, w: 0.08, h: 0.35 },
      { x: 0.5, y: 0.6, w: 0.12, h: 0.2 },
      { x: 0.65, y: 0.25, w: 0.1, h: 0.3 },
      { x: 0.7, y: 0.7, w: 0.08, h: 0.25 },
      { x: 0.8, y: 0.1, w: 0.06, h: 0.4 },
      { x: 0.8, y: 0.6, w: 0.07, h: 0.3 },
    ];

    const obsGraphics = this.add.graphics();

    for (const pos of obstaclePositions) {
      const x = gameArea.x + pos.x * gameArea.width;
      const y = gameArea.y + pos.y * gameArea.height;
      const w = pos.w * gameArea.width;
      const h = pos.h * gameArea.height;

      this.obstacles.push({ x, y, width: w, height: h });

      obsGraphics.fillStyle(0xdc3737, 1);
      obsGraphics.fillRoundedRect(x, y, w, h, 5);
      obsGraphics.lineStyle(2, 0xff6b6b, 0.5);
      obsGraphics.strokeRoundedRect(x, y, w, h, 5);
    }
  }

  private startGame(startBtn: Phaser.GameObjects.Text, gameArea: { x: number; y: number; width: number; height: number }): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.timeLeft = GAME_TIME;
    this.startTime = 0;

    // Reset player position
    this.player.x = gameArea.x + PLAYER_SIZE;
    this.player.y = gameArea.y + gameArea.height / 2;

    this.timerText.setText(`${this.timeLeft}s`);
    this.timerText.setColor("#ffffff");

    startBtn.setVisible(false);

    // Start timer
    this.startTime = Date.now();
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);

        if (this.timeLeft <= 5) {
          this.timerText.setColor("#dc3737");
        }

        if (this.timeLeft <= 0) {
          this.endGame(false);
        }
      },
      repeat: GAME_TIME,
    });
  }

  update(): void {
    if (!this.isRunning) return;

    const gameArea = {
      x: 50,
      y: 180,
      width: CONFIG.CANVAS_WIDTH - 100,
      height: CONFIG.CANVAS_HEIGHT - 280,
    };

    // Player movement
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = PLAYER_SPEED;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = PLAYER_SPEED;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    // Calculate new position
    const newX = this.player.x + (vx * this.getFrameTime()) / 1000;
    const newY = this.player.y + (vy * this.getFrameTime()) / 1000;

    // Boundary check
    const playerLeft = newX;
    const playerRight = newX + PLAYER_SIZE;
    const playerTop = newY;
    const playerBottom = newY + PLAYER_SIZE;

    // Check wall collisions
    if (playerLeft >= gameArea.x && playerRight <= gameArea.x + gameArea.width) {
      if (!this.checkObstacleCollision(newX, this.player.y, PLAYER_SIZE)) {
        this.player.x = newX;
      }
    }
    if (playerTop >= gameArea.y && playerBottom <= gameArea.y + gameArea.height) {
      if (!this.checkObstacleCollision(this.player.x, newY, PLAYER_SIZE)) {
        this.player.y = newY;
      }
    }

    // Check finish line
    if (playerRight >= gameArea.x + gameArea.width - 10) {
      this.endGame(true);
    }
  }

  private checkObstacleCollision(px: number, py: number, size: number): boolean {
    for (const obs of this.obstacles) {
      if (
        px < obs.x + obs.width &&
        px + size > obs.x &&
        py < obs.y + obs.height &&
        py + size > obs.y
      ) {
        return true;
      }
    }
    return false;
  }

  private getFrameTime(): number {
    return this.game.loop.delta;
  }

  private async endGame(completed: boolean): Promise<void> {
    this.isRunning = false;
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    const elapsed = completed ? (Date.now() - this.startTime) / 1000 : GAME_TIME;
    const timeScore = completed ? Math.max(0, 10000 - Math.floor(elapsed * 100)) : 0;

    // Submit to backend
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
            score: timeScore,
            game_data: { elapsed_time: elapsed, completed },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        this.showResults(completed, elapsed, result.rank, result.reward_granted);
      } else {
        this.showResults(completed, elapsed, 0, 0);
      }
    } catch {
      this.showResults(completed, elapsed, 0, 0);
    }
  }

  private showResults(completed: boolean, elapsed: number, rank: number, reward: number): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0f0f19, 0.9);
    overlay.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Results panel
    const panel = this.add.graphics();
    panel.fillStyle(0x1c1c2c, 1);
    panel.fillRoundedRect(cx - 200, cy - 180, 400, 360, 20);
    panel.lineStyle(3, completed ? 0x00d26e : 0xdc3737, 1);
    panel.strokeRoundedRect(cx - 200, cy - 180, 400, 360, 20);

    this.add.text(cx, cy - 140, completed ? "🏆 Finished! 🏆" : "⏱️ Time's Up!", {
      fontSize: "32px",
      fontFamily: "Arial",
      color: completed ? "#00d26e" : "#dc3737",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(cx, cy - 90, `Time: ${elapsed.toFixed(2)}s`, {
      fontSize: "22px",
      fontFamily: "Arial",
      color: "#ffffff",
    }).setOrigin(0.5);

    const score = completed ? Math.max(0, 10000 - Math.floor(elapsed * 100)) : 0;
    this.add.text(cx, cy - 50, `Score: ${score}`, {
      fontSize: "22px",
      fontFamily: "Arial",
      color: "#c850ff",
    }).setOrigin(0.5);

    if (rank > 0) {
      this.add.text(cx, cy, `🏆 Rank: #${rank}`, {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffc800",
      }).setOrigin(0.5);
    }

    if (reward > 0) {
      this.add.text(cx, cy + 35, `💰 Reward: $${reward}`, {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#00d26e",
      }).setOrigin(0.5);
    }

    // Buttons
    const againBtn = this.add.text(cx, cy + 90, "🔄 Play Again", {
      fontSize: "22px",
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "#00d26e",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    againBtn.on("pointerdown", () => {
      overlay.clear();
      panel.clear();
      this.scene.restart();
    });

    const exitBtn = this.add.text(cx, cy + 150, "← Back to Game", {
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