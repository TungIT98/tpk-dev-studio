/**
 * main.ts
 * Entry point — creates the Phaser game with all scenes.
 */

import Phaser from "phaser";
import { CONFIG } from "./config";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { LobbyScene } from "./scenes/LobbyScene";
import { GameScene } from "./scenes/GameScene";

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.CANVAS_WIDTH,
  height: CONFIG.CANVAS_HEIGHT,
  backgroundColor: CONFIG.COLORS.BG,
  parent: "game-container",
  dom: {
    createContainer: true,
  },
  scene: [BootScene, MenuScene, LobbyScene, GameScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Boot the game
const game = new Phaser.Game(gameConfig);

// Expose game globally for debugging
(window as any).tycoonGame = game;

export default game;
