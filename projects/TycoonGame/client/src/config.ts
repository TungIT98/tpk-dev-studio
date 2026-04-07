/// <reference types="vite/client" />

// Game configuration
export const CONFIG = {
  // Colyseus server endpoint
  COLYEUS_URL: import.meta.env.VITE_COLYSEUS_URL || "ws://localhost:2567",

  // Room names (must match Colyseus server definitions)
  ROOMS: {
    LOBBY: "lobby",
    GAME: "game",
    MINIGAME: "minigame",
    TRADING: "trading",
  },

  // UI constants
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,

  // Theme colors (match Roblox UI)
  COLORS: {
    BG: 0x0f0f19,
    PANEL: 0x1c1c2c,
    ACCENT: 0xffc800,
    ACCENT_DARK: 0xb48c00,
    SUCCESS: 0x00d26e,
    DANGER: 0xdc3737,
    TEXT: 0xffffff,
    TEXT_DIM: 0xa0a0be,
    BORDER: 0x373755,
    PRESTIGE: 0xc850ff,
  },

  // Player presence
  MAX_PLAYERS_PER_ROOM: 100,
};
