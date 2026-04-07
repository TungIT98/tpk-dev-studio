/**
 * GameScene.ts
 * Core tycoon game view — real-time multiplayer world.
 * Players appear as avatars, businesses are clickable, state syncs via Colyseus.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";
import { sendMove, sendAction } from "../network/messages";
import { HUD } from "../ui/HUD";
import { LeaderboardUI } from "../ui/LeaderboardUI";
import { PetManager } from "../pets/PetManager";
import { PetStatsPanel } from "../ui/PetStatsPanel";
import { PetEvolutionUI } from "../ui/PetEvolutionUI";
import { PetInventoryUI } from "../ui/PetInventoryUI";
import { CollectionUI } from "../ui/CollectionUI";
import { AchievementToastManager } from "../ui/AchievementToast";
import { EventScene } from "../ui/EventScene";
import { listActiveEvents } from "../events/EventClient";
import type { SeasonalEvent } from "../shared/EventTypes";
import type { RoomState, PlayerSchema, PlayerAchievement } from "../shared/types";

interface EntitySprite {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  moneyText: Phaser.GameObjects.Text;
  data: PlayerSchema | null;
}

const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;
const TILE_SIZE = 64;

export class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private localPlayerSprite!: EntitySprite;
  private playerSprites = new Map<string, EntitySprite>();
  private worldCamera!: Phaser.GameObjects.Rectangle;
  private lastMoveSend = 0;
  private MOVE_THROTTLE = 100; // ms

  // Business entities (static for now)
  private businessSprites: Phaser.GameObjects.Container[] = [];

  // ── Pet companion system ─────────────────────────────────────────────────────
  private petManager!: PetManager;
  private petStatsPanel!: PetStatsPanel;
  private petEvolutionUI!: PetEvolutionUI;
  private petInventoryUI!: PetInventoryUI;
  private hud!: HUD;
  private leaderboardUI!: LeaderboardUI;
  private collectionUI!: CollectionUI;
  private achievementToastManager!: AchievementToastManager;
  private eventScene!: EventScene;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    const { COLORS } = CONFIG;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    // Scrolling world background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.BG, 1);
    bg.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Grid
    bg.lineStyle(1, COLORS.BORDER, 0.1);
    for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) bg.lineBetween(x, 0, x, WORLD_HEIGHT);
    for (let y = 0; y < WORLD_HEIGHT; y += TILE_SIZE) bg.lineBetween(0, y, WORLD_WIDTH, y);

    // World boundary
    bg.lineStyle(3, COLORS.ACCENT, 0.4);
    bg.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Add world to camera
    this.worldCamera = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT);

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.worldCamera, true, 0.1, 0.1);

    // Spawn business entities (10 types, placed in a grid)
    this.spawnBusinessEntities();

    // Local player (spawn at center)
    this.localPlayerSprite = this.createPlayerSprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, null, true);
    this.cameras.main.startFollow(this.localPlayerSprite.container, true, 0.08, 0.08);
    (this.cameras.main as any).setDeadzone(100, 100);

    // Controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Camera panning + zoom
    this.input.keyboard!.on("keydown-MINUS", () => {
      const cam = this.cameras.main;
      cam.setZoom(Math.max(0.4, cam.zoom - 0.1));
    });
    this.input.keyboard!.on("keydown-EQUALS", () => {
      const cam = this.cameras.main;
      cam.setZoom(Math.min(2.0, cam.zoom + 0.1));
    });
    this.input.keyboard!.on("keydown-HOME", () => {
      this.cameras.main.centerOn(this.localPlayerSprite.container.x, this.localPlayerSprite.container.y);
    });

    // UI overlays
    this.hud = new HUD(this);
    this.leaderboardUI = new LeaderboardUI(this);

    // ── Pet companion system ─────────────────────────────────────────────────────
    const userId = colyseus.localPlayer?.userId ?? "guest";
    this.petManager = new PetManager(this, userId);
    this.petStatsPanel = new PetStatsPanel(this);
    this.petEvolutionUI = new PetEvolutionUI(this);
    this.petInventoryUI = new PetInventoryUI(
      this,
      this.petManager,
      userId,
      this.petEvolutionUI,
    );

    // ── Collection & Achievements UI ─────────────────────────────────────────────
    this.collectionUI = new CollectionUI(this, userId);
    this.achievementToastManager = new AchievementToastManager(this);

    // ── Seasonal Events UI ───────────────────────────────────────────────────────
    this.eventScene = new EventScene(this, userId, colyseus.localPlayer?.username ?? "Player");

    // Wire pet manager → follow the local player
    this.petManager.setFollowTarget(this.localPlayerSprite.container);
    this.petManager.startUpdateLoop();

    // Load equipped pets from backend
    this.petManager.loadEquippedPets();

    // ── Pet event handlers ────────────────────────────────────────────────────
    this.petManager.on("leveled_up", (e) => {
      if (!e.instance) return;
      this.petStatsPanel.refresh(e.instance);
      this.showFloatingText(this.localPlayerSprite.container.x, this.localPlayerSprite.container.y - 40,
        `Level Up! Lv.${e.newLevel}`, 0xffc800);
    });

    this.petManager.on("evolve_ready", (e) => {
      if (!e.instance) return;
      // Auto-show evolution panel
      this.petEvolutionUI.show(e.instance, async (action, evolvedInstance) => {
        if (action === "confirm") {
          await this.petManager.evolvePet(e.instance!.instance_id);
          const updated = this.petManager.getPet(e.instance!.instance_id);
          if (updated) this.petStatsPanel.show(updated);
        }
      });
    });

    this.petManager.on("evolved", (e) => {
      if (!e.instance) return;
      this.showFloatingText(this.localPlayerSprite.container.x, this.localPlayerSprite.container.y - 60,
        `Evolved into ${e.instance.pet_type?.name ?? "new form"}!`, 0x9933ff);
      this.petStatsPanel.show(e.instance);
    });

    // Keyboard: I → open pet inventory screen
    this.input.keyboard!.on("keydown-I", () => {
      if (this.petInventoryUI.isVisible) {
        this.petInventoryUI.close();
      } else {
        this.petInventoryUI.open();
      }
    });

    // Keyboard: P → toggle pet stats panel
    this.input.keyboard!.on("keydown-P", () => {
      const primary = this.petManager.getPrimaryPet();
      if (!primary) return;
      if (this.petStatsPanel.visible) {
        this.petStatsPanel.hide();
      } else {
        this.petStatsPanel.show(primary, () => {
          const pet = this.petManager.getPrimaryPet();
          if (pet) {
            this.petEvolutionUI.show(pet, async (action, inst) => {
              if (action === "confirm" && inst) {
                await this.petManager.evolvePet(inst.instance_id);
              }
            });
          }
        });
      }
    });

    // Keyboard: K → toggle collection / achievements UI
    this.input.keyboard!.on("keydown-K", () => {
      if (this.collectionUI.isVisible) {
        this.collectionUI.close();
      } else {
        this.collectionUI.open();
      }
    });

    // Keyboard: E → toggle seasonal events UI
    this.input.keyboard!.on("keydown-E", () => {
      if (this.eventScene.isVisible) {
        this.eventScene.close();
      } else {
        this.eventScene.open();
      }
    });

    // ── Seasonal Events — Colyseus message handlers ─────────────────────────────
    colyseus.room?.onMessage("event:start", async (msg: { event_id: string; name: string }) => {
      try {
        const events = await listActiveEvents();
        const started = events.find((e: SeasonalEvent) => e.event_id === msg.event_id);
        if (started) this.eventScene.onEventStarted(started);
      } catch { /* ignore */ }
    });

    colyseus.room?.onMessage("event:quest_completed", (msg: { quest_name: string; points: number }) => {
      this.eventScene.onQuestCompleted(msg.quest_name, msg.points);
    });

    // Grant XP to pets is handled server-side via "pet:xp_gain" room message.
    // The Colyseus event listener above dispatches it to the pet manager.

    // ESC → back to lobby
    this.input.keyboard!.on("keydown-ESC", () => {
      colyseus.leaveRoom();
      this.scene.start("LobbyScene", { username: colyseus.localPlayer?.username ?? "Player", room: "lobby" });
    });

    // Colyseus state sync
    colyseus.on("state:change", (state: RoomState) => this.onStateChange(state));
    colyseus.on("player:joined", (player: PlayerSchema) => this.onPlayerJoined(player));
    colyseus.on("player:left", (sessionId: string) => this.onPlayerLeft(sessionId));

    // Pet XP broadcast from server
    colyseus.room?.onMessage("pet:xp_gain", (msg: { instanceId: string; amount: number }) => {
      this.petManager.grantXpToPet(msg.instanceId, msg.amount);
    });

    // Pet level-up broadcast from server
    colyseus.room?.onMessage("pet:level_up", (msg: { instanceId: string; newLevel: number }) => {
      const pet = this.petManager.getPet(msg.instanceId);
      if (pet) {
        pet.level = msg.newLevel;
        this.petStatsPanel.refresh(pet);
      }
    });

    // Achievement unlock broadcast from server
    colyseus.room?.onMessage("achievement:unlocked", (msg: { achievement: PlayerAchievement }) => {
      if (msg.achievement) {
        this.achievementToastManager.show(msg.achievement);
        this.collectionUI.onAchievementUnlocked(msg.achievement);
      }
    });
  }

  update(_time: number): void {
    this.handleMovement();
    // Pet companion following is handled by petManager's own update loop
  }

  private handleMovement(): void {
    const speed = 4;
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    if (dx === 0 && dy === 0) return;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const sprite = this.localPlayerSprite;
    sprite.container.x = Phaser.Math.Clamp(sprite.container.x + dx * speed, 20, WORLD_WIDTH - 20);
    sprite.container.y = Phaser.Math.Clamp(sprite.container.y + dy * speed, 20, WORLD_HEIGHT - 20);

    // Throttled send
    const now = Date.now();
    if (now - this.lastMoveSend >= this.MOVE_THROTTLE) {
      sendMove(sprite.container.x, sprite.container.y);
      this.lastMoveSend = now;
    }
  }

  private onStateChange(state: RoomState): void {
    const mySid = colyseus.sessionId;
    if (!mySid) return;

    for (const [sid, player] of Object.entries(state.players ?? {})) {
      if (sid === mySid) {
        // Update local player HUD data
        this.localPlayerSprite.data = player;
        this.localPlayerSprite.nameText.setText(player.username + " (you)");
        this.localPlayerSprite.moneyText.setText("$" + this.formatMoney(player.money));
      } else {
        // Remote player
        if (!this.playerSprites.has(sid)) {
          this.onPlayerJoined(player);
        } else {
          const sp = this.playerSprites.get(sid)!;
          // Smooth interpolation
          this.tweens.add({
            targets: sp.container,
            x: player.x,
            y: player.y,
            duration: 200,
            ease: "Quad.easeOut",
          });
          sp.data = player;
          sp.nameText.setText(player.username);
          sp.moneyText.setText("$" + this.formatMoney(player.money));
        }
      }
    }

    // Remove disconnected
    for (const [sid, sp] of this.playerSprites.entries()) {
      if (!state.players?.[sid]) {
        sp.container.destroy();
        this.playerSprites.delete(sid);
      }
    }
  }

  private onPlayerJoined(player: PlayerSchema): void {
    if (player.sessionId === colyseus.sessionId) return; // already added as local
    if (this.playerSprites.has(player.sessionId)) return;
    const sp = this.createPlayerSprite(player.x, player.y, player, false);
    this.playerSprites.set(player.sessionId, sp);
  }

  private onPlayerLeft(sessionId: string): void {
    const sp = this.playerSprites.get(sessionId);
    if (sp) {
      this.tweens.add({
        targets: sp.container,
        alpha: 0,
        duration: 400,
        onComplete: () => sp.container.destroy(),
      });
      this.playerSprites.delete(sessionId);
    }
  }

  private createPlayerSprite(x: number, y: number, data: PlayerSchema | null, isLocal: boolean): EntitySprite {
    const { COLORS } = CONFIG;
    const SIZE = 32;

    const g = this.add.graphics();
    g.fillStyle(isLocal ? COLORS.ACCENT : 0x5588ff, 1);
    g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2);
    g.lineStyle(2, isLocal ? 0xffffff : COLORS.BORDER, 1);
    g.strokeCircle(SIZE / 2, SIZE / 2, SIZE / 2);

    // Shadow ring for local player
    if (isLocal) {
      g.lineStyle(3, 0xffffff, 0.4);
      g.strokeCircle(SIZE / 2, SIZE / 2, SIZE / 2 + 4);
    }

    const nameText = this.add.text(SIZE / 2, SIZE + 2, data?.username ?? "You", {
      fontSize: "10px", fontFamily: "Arial", color: isLocal ? "#ffc800" : "#aaddff",
    }).setOrigin(0.5, 0);

    const moneyText = this.add.text(SIZE / 2, SIZE + 14, data ? "$" + this.formatMoney(data.money) : "", {
      fontSize: "9px", fontFamily: "Arial", color: "#00d26e",
    }).setOrigin(0.5, 0);

    const container = this.add.container(x, y, [g, nameText, moneyText]);
    container.setDepth(100);
    return { container, graphics: g, nameText, moneyText, data };
  }

  private spawnBusinessEntities(): void {
    const { COLORS } = CONFIG;
    const businesses = [
      { name: "Lemonade Stand", color: 0xffdd00, income: 1 },
      { name: "Newspaper Route", color: 0xdddddd, income: 5 },
      { name: "Car Wash", color: 0x5599ff, income: 25 },
      { name: "Pizza Shop", color: 0xff6633, income: 120 },
      { name: "Donut Shop", color: 0xff88aa, income: 500 },
      { name: "Shrimp Boat", color: 0xff4488, income: 2000 },
      { name: "Spa Resort", color: 0x88ccff, income: 8000 },
      { name: "Tech Company", color: 0x4488ff, income: 35000 },
      { name: "Movie Studio", color: 0xffaa44, income: 150000 },
      { name: "Space Program", color: 0xddddff, income: 750000 },
    ];

    const cols = 5;
    const spacing = 300;
    const startX = (WORLD_WIDTH - cols * spacing) / 2 + spacing / 2;
    const startY = 200;

    businesses.forEach((biz, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * spacing;
      const by = startY + row * spacing;

      // Business "building" sprite
      const g = this.add.graphics();
      const W = 80;
      const H = 60;

      g.fillStyle(biz.color, 0.3);
      g.fillRect(0, 0, W, H);
      g.fillStyle(biz.color, 1);
      g.fillRect(4, 4, W - 8, H - 8);
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeRect(0, 0, W, H);

      const nameText = this.add.text(W / 2, 8, biz.name, {
        fontSize: "9px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
      }).setOrigin(0.5, 0);

      const incomeText = this.add.text(W / 2, 20, `$${this.formatMoney(biz.income)}/s`, {
        fontSize: "8px", fontFamily: "Arial", color: "#00d26e",
      }).setOrigin(0.5, 0);

      const container = this.add.container(bx, by, [g, nameText, incomeText]);
      container.setDepth(50);
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);

      container.on("pointerdown", () => {
        sendAction("buy_business", biz.name);
        // Visual feedback
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
          yoyo: true,
        });
      });

      this.businessSprites.push(container);
    });
  }

  private formatMoney(n: number): string {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
    return String(Math.floor(n));
  }

  /**
   * Show a floating "+XP" or "Level Up!" style text bubble above a position.
   */
  private showFloatingText(x: number, y: number, text: string, color: number): void {
    const floatText = this.add.text(x, y, text, {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#" + color.toString(16).padStart(6, "0"),
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(200);

    this.tweens.add({
      targets: floatText,
      y: y - 40,
      alpha: 0,
      duration: 1200,
      ease: "Quad.easeOut",
      onComplete: () => floatText.destroy(),
    });
  }

}
