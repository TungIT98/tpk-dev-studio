/**
 * MemoryMatchScene.ts
 * Mini-game: Memory matching - flip cards and find matching pairs.
 * Score based on number of moves and time. Lower is better.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";

const GRID_COLS = 4;
const GRID_ROWS = 4;
const CARD_SPACING = 20;
const CARD_SIZE = 100;
const GAME_TIME = 60; // seconds

// Simple emoji icons for card faces
const CARD_ICONS = ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🥝", "🍒"];

interface Card {
  container: Phaser.GameObjects.Container;
  cardBack: Phaser.GameObjects.Graphics;
  cardFront: Phaser.GameObjects.Text;
  iconIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export class MemoryMatchScene extends Phaser.Scene {
  private cards: Card[] = [];
  private flippedCards: Card[] = [];
  private moves = 0;
  private matches = 0;
  private timeLeft = GAME_TIME;
  private score = 0;
  private isRunning = false;
  private canFlip = true;
  private timerEvent?: Phaser.Time.TimerEvent;
  private movesText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private gameId = "memory_match";

  constructor() {
    super({ key: "MemoryMatchScene" });
  }

  create(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Calculate grid size
    const gridWidth = GRID_COLS * (CARD_SIZE + CARD_SPACING) - CARD_SPACING;
    const gridHeight = GRID_ROWS * (CARD_SIZE + CARD_SPACING) - CARD_SPACING;
    const startX = cx - gridWidth / 2;
    const startY = cy - gridHeight / 2 - 40;

    // Title
    this.add.text(cx, 50, "🧠 Memory Match 🧠", {
      fontSize: "36px",
      fontFamily: "Arial",
      color: "#c850ff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Stats bar
    this.movesText = this.add.text(100, 95, "Moves: 0", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#ffffff",
    });

    this.timerText = this.add.text(cx, 95, `${this.timeLeft}s`, {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);

    this.scoreText = this.add.text(CONFIG.CANVAS_WIDTH - 100, 95, "Matches: 0/8", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#ffffff",
    }).setOrigin(1, 0.5);

    // Create and shuffle card icons (pairs)
    const iconPairs = [...CARD_ICONS, ...CARD_ICONS];
    this.shuffleArray(iconPairs);

    // Create cards
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = startX + col * (CARD_SIZE + CARD_SPACING) + CARD_SIZE / 2;
        const y = startY + row * (CARD_SIZE + CARD_SPACING) + CARD_SIZE / 2;
        const iconIndex = row * GRID_COLS + col;
        const card = this.createCard(x, y, iconPairs[iconIndex], iconIndex);
        this.cards.push(card);
      }
    }

    // Start button
    const startBtn = this.add.text(cx, CONFIG.CANVAS_HEIGHT - 60, "▶ START", {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "#c850ff",
      padding: { left: 30, right: 30, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on("pointerdown", () => this.startGame(startBtn));
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

  private createCard(x: number, y: number, icon: string, iconIndex: number): Card {
    const container = this.add.container(x, y);

    // Card back
    const cardBack = this.add.graphics();
    cardBack.fillStyle(0x373755, 1);
    cardBack.fillRoundedRect(-CARD_SIZE / 2, -CARD_SIZE / 2, CARD_SIZE, CARD_SIZE, 10);
    cardBack.lineStyle(2, 0xffffff, 0.3);
    cardBack.strokeRoundedRect(-CARD_SIZE / 2, -CARD_SIZE / 2, CARD_SIZE, CARD_SIZE, 10);

    // Card front (hidden initially)
    const cardFront = this.add.text(0, 0, icon, {
      fontSize: "48px",
      fontFamily: "Arial",
    }).setOrigin(0.5);
    cardFront.setVisible(false);

    container.add([cardBack, cardFront]);
    container.setDepth(1);

    const card: Card = {
      container,
      cardBack,
      cardFront,
      iconIndex,
      isFlipped: false,
      isMatched: false,
    };

    // Make interactive
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, CARD_SIZE, CARD_SIZE), Phaser.Geom.Rectangle.Contains);
    container.on("pointerdown", () => this.flipCard(card));

    return card;
  }

  private flipCard(card: Card): void {
    if (!this.isRunning || !this.canFlip || card.isFlipped || card.isMatched) return;
    if (this.flippedCards.length >= 2) return;

    // Flip animation
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => {
        card.isFlipped = true;
        card.cardFront.setVisible(true);
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 150,
          ease: "Quad.easeIn,
        });
      },
    });

    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.movesText.setText(`Moves: ${this.moves}`);
      this.checkMatch();
    }
  }

  private checkMatch(): void {
    this.canFlip = false;
    const [card1, card2] = this.flippedCards;

    if (card1.iconIndex === card2.iconIndex) {
      // Match!
      this.matches++;
      this.scoreText.setText(`Matches: ${this.matches}/8`);
      card1.isMatched = true;
      card2.isMatched = true;

      // Success animation
      this.tweens.add({
        targets: [card1.container, card2.container],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        onComplete: () => {
          this.flippedCards = [];
          this.canFlip = true;

          if (this.matches === 8) {
            this.endGame(true);
          }
        },
      });
    } else {
      // No match - flip back
      this.time.delayedCall(800, () => {
        this.flipBack(card1);
        this.flipBack(card2);
        this.flippedCards = [];
        this.canFlip = true;
      });
    }
  }

  private flipBack(card: Card): void {
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => {
        card.isFlipped = false;
        card.cardFront.setVisible(false);
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 150,
          ease: "Quad.easeIn",
        });
      },
    });
  }

  private startGame(startBtn: Phaser.GameObjects.Text): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.moves = 0;
    this.matches = 0;
    this.timeLeft = GAME_TIME;
    this.score = 0;

    this.movesText.setText("Moves: 0");
    this.scoreText.setText("Matches: 0/8");
    this.timerText.setText(`${this.timeLeft}s`);
    this.timerText.setColor("#ffffff");

    startBtn.setVisible(false);

    // Timer countdown
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);

        if (this.timeLeft <= 10) {
          this.timerText.setColor("#dc3737");
        }

        if (this.timeLeft <= 0) {
          this.endGame(false);
        }
      },
      repeat: GAME_TIME,
    });
  }

  private endGame(completed: boolean): void {
    this.isRunning = false;
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // Calculate score: base 10000, minus moves (100 each), minus time (10 each)
    this.score = Math.max(0, 10000 - (this.moves * 100) - ((GAME_TIME - this.timeLeft) * 10));

    if (completed) {
      this.score += 5000; // Completion bonus
    }

    this.showResults(completed);
  }

  private showResults(completed: boolean): void {
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

    this.add.text(cx, cy - 140, completed ? "🎉 Complete! 🎉" : "⏱️ Time's Up!", {
      fontSize: "32px",
      fontFamily: "Arial",
      color: completed ? "#00d26e" : "#dc3737",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(cx, cy - 90, `Moves: ${this.moves}`, {
      fontSize: "22px",
      fontFamily: "Arial",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(cx, cy - 50, `Matches: ${this.matches}/8`, {
      fontSize: "22px",
      fontFamily: "Arial",
      color: "#c850ff",
    }).setOrigin(0.5);

    this.add.text(cx, cy, `Final Score: ${this.score}`, {
      fontSize: "28px",
      fontFamily: "Arial",
      color: "#ffc800",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Buttons
    const againBtn = this.add.text(cx, cy + 80, "🔄 Play Again", {
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

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}