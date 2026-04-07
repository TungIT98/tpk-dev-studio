/**
 * CollectionUI.ts
 * Full-screen Collection & Achievements overlay for Phaser.js.
 *
 * Features:
 * (1) Albums tab: grid of collection albums with completion % and locked/unlocked
 * (2) Album detail: all items in album, owned/missing, rarity-colored slots
 *     - Tap item: detail popup (name, rarity, description, how to obtain)
 *     - Completion celebration: full-screen particle burst + reward popup
 * (3) Achievements tab: grouped by category, progress bars, hidden support
 *     - Hidden achievements show "???" + lock icon until unlocked
 *     - Unlock animation: golden badge + achievement unlock popup
 * (4) Milestones tab: tiered progress bars per collection (0→100%→reward)
 * (5) Stats tab: total items, achievement counts, rarity breakdown
 * (6) HUD integration: achievement unlock toast slides from right
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import type {
  CollectionAlbum,
  CollectionProgress,
  PlayerAchievement,
  ItemRarity,
  CollectionStats,
} from "../shared/types";
import {
  RARITY_COLORS_NUM,
  RARITY_COLORS_HEX,
  RARITY_GLOW_ALPHA,
} from "../shared/types";
import {
  listCollections,
  getCollectionProgress,
  getPlayerAchievements,
  claimAchievementReward,
  getPlayerCollectionStats,
  getItemDetail,
  type CollectionItemDetail,
} from "../collections/CollectionClient";

// ── Layout constants ──────────────────────────────────────────────────────────

const PANEL_W       = 820;
const PANEL_H       = 560;
const LEFT_W        = 280;
const RIGHT_W       = 520;
const GAP           = 10;
const PAD           = 14;
const ITEM_SLOT_SZ  = 44;
const ITEM_GAP      = 6;
const ACH_ROW_H     = 56;
const ALBUM_CARD_W  = 120;
const ALBUM_CARD_H  = 110;
const TAB_W         = 150;
const TAB_H         = 32;

// ── Rarity helpers ───────────────────────────────────────────────────────────

export function rarityHex(rarity: ItemRarity): string {
  return RARITY_COLORS_HEX[rarity] ?? "#ffffff";
}

export function rarityNum(rarity: ItemRarity): number {
  return RARITY_COLORS_NUM[rarity] ?? 0xffffff;
}

export function rarityGlowAlpha(rarity: ItemRarity): number {
  return RARITY_GLOW_ALPHA[rarity] ?? 0;
}

/**
 * Adds a glow ring behind a slot graphic using transparent Phaser Graphics
 * filled circles. Call this after adding the slot background.
 */
export function addRarityGlow(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  cx: number,
  cy: number,
  radius: number,
  rarity: ItemRarity,
): void {
  if (rarityGlowAlpha(rarity) <= 0) return;

  const glow = scene.add.graphics();
  const color = rarityNum(rarity);
  const alpha = rarityGlowAlpha(rarity);

  // Outer soft glow
  glow.fillStyle(color, alpha * 0.3);
  glow.fillCircle(cx, cy, radius * 1.5);
  glow.fillStyle(color, alpha * 0.6);
  glow.fillCircle(cx, cy, radius * 1.2);
  glow.fillStyle(color, alpha);
  glow.fillCircle(cx, cy, radius);

  container.add(glow);
}

// ── CollectionUI ────────────────────────────────────────────────────────────────

export type ActiveTab = "albums" | "achievements" | "milestones" | "stats";

export class CollectionUI {
  private scene: Phaser.Scene;
  private userId: string;

  private container!: Phaser.GameObjects.Container;
  private overlay!: Phaser.GameObjects.Rectangle;
  private visible = false;

  // Tabs: 4 tabs (Albums, Achievements, Milestones, Stats)
  private tabs: Record<ActiveTab, Phaser.GameObjects.Container> = {} as Record<ActiveTab, Phaser.GameObjects.Container>;
  private activeTab: ActiveTab = "albums";

  // Collections state
  private albums: CollectionAlbum[] = [];
  private albumProgress: Map<string, CollectionProgress> = new Map();
  private selectedAlbumId: string | null = null;

  // Achievements state
  private achievements: PlayerAchievement[] = [];

  // Stats state
  private collectionStats: CollectionStats | null = null;

  // Milestones state
  private milestoneData: { album: CollectionAlbum; progress: CollectionProgress | null }[] = [];

  // Left panel
  private leftContainer!: Phaser.GameObjects.Container;
  private albumCards: AlbumCard[] = [];
  private achievementRows: AchievementRow[] = [];
  private milestoneCards: MilestoneCard[] = [];

  // Right panel
  private rightContainer!: Phaser.GameObjects.Container;

  // Popups / overlays
  private milestonePopup: MilestonePopup | null = null;
  private itemDetailPopup: ItemDetailPopup | null = null;
  private completionCelebration: AlbumCompletionCelebration | null = null;
  private achievementUnlockPopup: AchievementUnlockPopup | null = null;

  // Loading
  private loadingText!: Phaser.GameObjects.Text;

  // Internal tracking for completion detection
  private _previousCompletion = new Set<string>();

  constructor(scene: Phaser.Scene, userId: string) {
    this.scene = scene;
    this.userId = userId;
    this.build();
  }

  // ── Public ──────────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    if (this.visible) return;
    this.visible = true;

    this.container.setAlpha(0);
    this.container.setScale(0.9);
    this.container.setVisible(true);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 220,
      ease: "Back.easeOut",
    });

    this.overlay.setAlpha(0);
    this.scene.tweens.add({ targets: this.overlay, alpha: 0.78, duration: 200 });

    await this.loadData();

    // Remember which albums were previously complete (for completion detection)
    this._previousCompletion = new Set(
      [...this.albumProgress.values()].filter(p => p.completed).map(p => p.collection_id)
    );

    if (this.activeTab === "albums" && this.albums.length > 0 && !this.selectedAlbumId) {
      this.selectAlbum(this.albums[0].collection_id);
    }
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 0.9,
      duration: 180,
      ease: "Back.easeIn",
      onComplete: () => this.container.setVisible(false),
    });
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 180 });
  }

  get isVisible(): boolean { return this.visible; }

  /**
   * Called by the parent scene when the server pushes an achievement unlock event.
   * Shows the achievement unlock toast (HUD-level, outside the panel).
   */
  onAchievementUnlocked(achievement: PlayerAchievement): void {
    this.showAchievementUnlockToast(achievement);
  }

  destroy(): void {
    this.container.destroy();
    this.overlay.destroy();
    this.milestonePopup?.destroy();
    this.itemDetailPopup?.destroy();
    this.completionCelebration?.destroy();
    this.achievementUnlockPopup?.destroy();
  }

  // ── Build ─────────────────────────────────────────────────────────────────────

  private build(): void {
    const { COLORS } = CONFIG;
    const cw = CONFIG.CANVAS_WIDTH;
    const ch = CONFIG.CANVAS_HEIGHT;
    const x0 = (cw - PANEL_W) / 2;
    const y0 = (ch - PANEL_H) / 2;

    // Overlay backdrop
    this.overlay = this.scene.add.rectangle(cw / 2, ch / 2, cw, ch, 0x000000, 0.78)
      .setDepth(990).setInteractive();
    this.overlay.on("pointerdown", () => this.close());

    // Root container
    this.container = this.scene.add.container(x0, y0);
    this.container.setDepth(995);
    this.container.setVisible(false);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.97);
    bg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, 12);
    bg.lineStyle(1.5, COLORS.ACCENT, 0.7);
    bg.strokeRoundedRect(0, 0, PANEL_W, PANEL_H, 12);
    this.container.add(bg);

    // Title bar
    this.buildTitleBar(COLORS);

    // Tab bar (4 tabs)
    this.buildTabs(COLORS);

    // Left panel (list view)
    this.buildLeftPanel(COLORS);

    // Right panel (detail / stats)
    this.buildRightPanel(COLORS);

    // ESC to close
    this.scene.input.keyboard?.once("keydown-ESC", () => this.close());
  }

  private buildTitleBar(COLORS: typeof CONFIG.COLORS): void {
    // Title strip
    const strip = this.scene.add.graphics();
    strip.fillStyle(COLORS.ACCENT, 0.08);
    strip.fillRoundedRect(0, 0, PANEL_W, 44, 12);
    strip.fillRect(0, 22, PANEL_W, 22);
    this.container.add(strip);

    const title = this.scene.add.text(PANEL_W / 2, 22, "Collections & Achievements", {
      fontSize: "15px",
      fontFamily: "Arial",
      color: "#ffc800",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(title);

    const hint = this.scene.add.text(PANEL_W - PAD, 22, "ESC to close", {
      fontSize: "10px", fontFamily: "Arial", color: "#505060",
    }).setOrigin(1, 0.5);
    this.container.add(hint);
  }

  private buildTabs(COLORS: typeof CONFIG.COLORS): void {
    const tabY = 46;
    const labels: { key: ActiveTab; label: string }[] = [
      { key: "albums",        label: "Albums" },
      { key: "achievements",  label: "Achievements" },
      { key: "milestones",    label: "Milestones" },
      { key: "stats",         label: "Stats" },
    ];

    for (const { key, label } of labels) {
      const container = this.scene.add.container(0, 0);
      this.tabs[key] = container;
      this.container.add(container);
    }

    const placeTab = (key: ActiveTab, label: string, x: number): void => {
      const container = this.tabs[key];
      const bg = this.scene.add.graphics();
      bg.fillStyle(COLORS.ACCENT, 0.18);
      bg.fillRoundedRect(x, tabY, TAB_W, TAB_H, 6);
      bg.lineStyle(1.5, COLORS.ACCENT, 0.9);
      bg.strokeRoundedRect(x, tabY, TAB_W, TAB_H, 6);
      bg.setName("tab_bg");
      bg.setData("tab_x", x);
      container.add(bg);

      const txt = this.scene.add.text(x + TAB_W / 2, tabY + TAB_H / 2, label, {
        fontSize: "11px",
        fontFamily: "Arial",
        color: "#ffc800",
        fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      txt.setName("tab_label");
      container.add(txt);

      const hit = this.scene.add.rectangle(x + TAB_W / 2, tabY + TAB_H / 2, TAB_W, TAB_H)
        .setInteractive({ useHandCursor: true });
      hit.setAlpha(0.001);
      container.add(hit);
      hit.on("pointerdown", () => this.switchTab(key));
    };

    placeTab("albums",       "Albums",       PAD);
    placeTab("achievements", "Achievements", PAD + TAB_W + 8);
    placeTab("milestones",   "Milestones",   PAD + (TAB_W + 8) * 2);
    placeTab("stats",        "Stats",        PAD + (TAB_W + 8) * 3);

    this.updateTabAppearance("albums");
  }

  private switchTab(tab: ActiveTab): void {
    this.activeTab = tab;
    this.updateTabAppearance(tab);

    this.leftContainer.removeAll(true);
    this.rightContainer.removeAll(true);
    this.selectedAlbumId = null;
    this.albumCards = [];
    this.achievementRows = [];
    this.milestoneCards = [];

    switch (tab) {
      case "albums":
        this.rebuildAlbumGrid();
        break;
      case "achievements":
        this.rebuildAchievementList();
        break;
      case "milestones":
        this.rebuildMilestonesList();
        break;
      case "stats":
        this.showStatsPanel();
        break;
    }
  }

  private updateTabAppearance(activeTab: ActiveTab): void {
    const { COLORS } = CONFIG;
    const tabY = 46;
    const labels: ActiveTab[] = ["albums", "achievements", "milestones", "stats"];

    labels.forEach((key, i) => {
      const isActive = key === activeTab;
      const x = PAD + i * (TAB_W + 8);
      const container = this.tabs[key];

      container.list.forEach(obj => {
        const bg = obj as Phaser.GameObjects.Graphics;
        const txt = obj as Phaser.GameObjects.Text;

        if (bg.clear && bg.name === "tab_bg") {
          bg.clear();
          bg.fillStyle(COLORS.ACCENT, isActive ? 0.18 : 0.06);
          bg.fillRoundedRect(x, tabY, TAB_W, TAB_H, 6);
          bg.lineStyle(1.5, COLORS.ACCENT, isActive ? 0.9 : 0.4);
          bg.strokeRoundedRect(x, tabY, TAB_W, TAB_H, 6);
        }
        if (txt.setOrigin !== undefined && txt.name === "tab_label") {
          txt.setColor(isActive ? "#ffc800" : "#606080");
        }
      });
    });
  }

  private buildLeftPanel(COLORS: typeof CONFIG.COLORS): void {
    const panelX = PAD;
    const panelY = 82;
    const panelH = PANEL_H - panelY - PAD;

    const listBg = this.scene.add.graphics();
    listBg.fillStyle(COLORS.BG, 0.45);
    listBg.fillRoundedRect(panelX, panelY, LEFT_W, panelH, 8);
    this.container.add(listBg);

    this.leftContainer = this.scene.add.container(panelX, panelY);
    this.container.add(this.leftContainer);

    this.loadingText = this.scene.add.text(
      panelX + LEFT_W / 2, panelY + panelH / 2,
      "Loading…",
      { fontSize: "12px", fontFamily: "Arial", color: "#606060" },
    ).setOrigin(0.5, 0.5).setVisible(false);
    this.container.add(this.loadingText);
  }

  private buildRightPanel(COLORS: typeof CONFIG.COLORS): void {
    const panelX = PAD + LEFT_W + GAP;
    const panelY = 82;
    const panelH = PANEL_H - panelY - PAD;

    const detailBg = this.scene.add.graphics();
    detailBg.fillStyle(COLORS.BG, 0.35);
    detailBg.fillRoundedRect(panelX, panelY, RIGHT_W, panelH, 8);
    this.container.add(detailBg);

    this.rightContainer = this.scene.add.container(panelX + PAD, panelY + PAD);
    this.container.add(this.rightContainer);
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  private async loadData(): Promise<void> {
    this.loadingText.setVisible(true);
    try {
      const [albums, achievements, stats] = await Promise.all([
        listCollections().catch(() => [] as CollectionAlbum[]),
        getPlayerAchievements(this.userId).catch(() => [] as PlayerAchievement[]),
        getPlayerCollectionStats(this.userId).catch(() => null as CollectionStats | null),
      ]);

      this.albums = albums;
      this.achievements = achievements;
      this.collectionStats = stats;

      const progressPromises = albums.map(a =>
        getCollectionProgress(a.collection_id, this.userId)
          .then(p => this.albumProgress.set(a.collection_id, p))
          .catch(() => { /* no progress yet */ }),
      );
      await Promise.all(progressPromises);

      // Build milestones data
      this.milestoneData = albums.map(album => ({
        album,
        progress: this.albumProgress.get(album.collection_id) ?? null,
      }));

      // Detect newly completed albums
      this.checkAlbumCompletions();

      switch (this.activeTab) {
        case "albums":
          this.rebuildAlbumGrid();
          if (albums.length > 0) this.selectAlbum(albums[0].collection_id);
          break;
        case "achievements":
          this.rebuildAchievementList();
          break;
        case "milestones":
          this.rebuildMilestonesList();
          break;
        case "stats":
          this.showStatsPanel();
          break;
      }
    } catch (err) {
      console.warn("[CollectionUI] loadData failed:", err);
    } finally {
      this.loadingText.setVisible(false);
    }
  }

  private checkAlbumCompletions(): void {
    for (const album of this.albums) {
      const progress = this.albumProgress.get(album.collection_id);
      if (progress?.completed && !this._previousCompletion.has(album.collection_id)) {
        // New album completion!
        this.showAlbumCompletionCelebration(album, progress);
      }
    }
  }

  private showAlbumCompletionCelebration(album: CollectionAlbum, progress: CollectionProgress): void {
    if (this.completionCelebration) this.completionCelebration.destroy();
    this.completionCelebration = new AlbumCompletionCelebration(
      this.scene,
      album,
      progress,
      () => { this.completionCelebration = null; },
    );
  }

  // ── Album grid ───────────────────────────────────────────────────────────────

  private rebuildAlbumGrid(): void {
    this.leftContainer.removeAll(true);
    this.albumCards = [];

    const COLS = 2;
    const cardX = 8;
    const cardY = 8;
    const spacingX = ALBUM_CARD_W + 8;
    const spacingY = ALBUM_CARD_H + 8;

    this.albums.forEach((album, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const progress = this.albumProgress.get(album.collection_id);
      const card = new AlbumCard(
        this.scene,
        album,
        progress ?? null,
        cardX + col * spacingX,
        cardY + row * spacingY,
        (id) => this.selectAlbum(id),
      );
      this.leftContainer.add(card.container);
      this.albumCards.push(card);
    });

    if (this.albums.length === 0) {
      const empty = this.scene.add.text(
        LEFT_W / 2, 120,
        "No albums available",
        { fontSize: "12px", fontFamily: "Arial", color: "#505060" },
      ).setOrigin(0.5, 0.5);
      this.leftContainer.add(empty);
    }
  }

  private selectAlbum(collectionId: string): void {
    this.selectedAlbumId = collectionId;

    for (const card of this.albumCards) {
      card.setSelected(card.album.collection_id === collectionId);
    }

    const album = this.albums.find(a => a.collection_id === collectionId);
    const progress = this.albumProgress.get(collectionId);
    if (album) this.showAlbumDetail(album, progress ?? null);
  }

  // ── Album detail ─────────────────────────────────────────────────────────────

  private showAlbumDetail(album: CollectionAlbum, progress: CollectionProgress | null): void {
    this.rightContainer.removeAll(true);
    const { COLORS } = CONFIG;
    const innerW = RIGHT_W - PAD * 2;

    let y = 0;

    // ── Header ──────────────────────────────────────────────────────────────
    const nameTxt = this.scene.add.text(0, y, album.name, {
      fontSize: "16px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
    });
    this.rightContainer.add(nameTxt);

    if (album.theme) {
      const themeTxt = this.scene.add.text(0, y + 22, `Theme: ${album.theme}`, {
        fontSize: "11px", fontFamily: "Arial", color: "#808098",
      });
      this.rightContainer.add(themeTxt);
    }
    y += album.theme ? 44 : 26;

    if (album.description) {
      const descTxt = this.scene.add.text(0, y, album.description, {
        fontSize: "11px", fontFamily: "Arial", color: "#aabbcc", wordWrap: { width: innerW } });
      this.rightContainer.add(descTxt);
      y += 28;
    }

    // ── Progress bar ─────────────────────────────────────────────────────────
    const pct = progress?.progress_percent ?? 0;
    const barBg = this.scene.add.graphics();
    barBg.fillStyle(COLORS.BORDER, 1);
    barBg.fillRoundedRect(0, y, innerW, 16, 6);
    this.rightContainer.add(barBg);

    if (pct > 0) {
      const barFill = this.scene.add.graphics();
      barFill.fillStyle(COLORS.SUCCESS, 1);
      const fillW = Math.max(8, (pct / 100) * innerW);
      barFill.fillRoundedRect(0, y, fillW, 16, 6);
      this.rightContainer.add(barFill);
    }

    const pctTxt = this.scene.add.text(innerW, y + 8, `${Math.floor(pct)}% complete`, {
      fontSize: "10px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(1, 0.5);
    this.rightContainer.add(pctTxt);
    y += 26;

    // Milestone badges
    y += 8;
    const milestoneRow = this.scene.add.container(0, y);
    for (const milestone of [25, 50, 75, 100]) {
      const claimed = progress?.claimed_milestones?.includes(milestone) ?? false;
      const reached = pct >= milestone;
      this.addMilestoneBadge(milestoneRow, milestone, reached, claimed);
    }
    this.rightContainer.add(milestoneRow);
    y += 36;

    // ── Item grid ────────────────────────────────────────────────────────────
    y += 12;
    const itemLabel = this.scene.add.text(0, y, "COLLECTION ITEMS", {
      fontSize: "10px", fontFamily: "Arial", color: "#505060", fontStyle: "bold",
    });
    this.rightContainer.add(itemLabel);
    y += 18;

    const collected = new Set(progress?.collected_item_ids ?? []);
    const gridCols = Math.floor((innerW + ITEM_GAP) / (ITEM_SLOT_SZ + ITEM_GAP));

    album.required_item_ids.forEach((itemId, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const slotX = col * (ITEM_SLOT_SZ + ITEM_GAP);
      const slotY = y + row * (ITEM_SLOT_SZ + ITEM_GAP);

      const rarity = this.deriveItemRarity(itemId);
      const owned = collected.has(itemId);

      new ItemSlot(
        this.scene,
        this.rightContainer,
        slotX,
        slotY,
        itemId,
        rarity,
        owned,
        (item, rar, owned) => this.showItemDetailPopup(album.collection_id, item, rar, owned),
      );

      void gridCols;
    });
  }

  private showItemDetailPopup(collectionId: string, itemId: string, rarity: ItemRarity, owned: boolean): void {
    if (this.itemDetailPopup) this.itemDetailPopup.destroy();
    this.itemDetailPopup = new ItemDetailPopup(
      this.scene,
      collectionId,
      itemId,
      rarity,
      owned,
      () => { this.itemDetailPopup = null; },
    );
  }

  private addMilestoneBadge(
    parent: Phaser.GameObjects.Container,
    milestone: number,
    reached: boolean,
    claimed: boolean,
  ): void {
    const bw = 52;
    const bh = 22;
    const x = parent.list.length * (bw + 6);

    const badgeBg = this.scene.add.graphics();
    if (claimed) {
      badgeBg.fillStyle(0x00d26e, 1);
    } else if (reached) {
      badgeBg.fillStyle(CONFIG.COLORS.ACCENT, 0.7);
    } else {
      badgeBg.fillStyle(CONFIG.COLORS.BORDER, 1);
    }
    badgeBg.fillRoundedRect(x, 0, bw, bh, 5);
    parent.add(badgeBg);

    const icon = claimed ? "★" : reached ? "◆" : "○";
    const pctTxt = this.scene.add.text(x + bw / 2, bh / 2, `${milestone}%`, {
      fontSize: "11px", fontFamily: "Arial",
      color: reached ? "#000000" : "#505060",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    parent.add(pctTxt);
  }

  private deriveItemRarity(itemId: string): ItemRarity {
    const h = itemId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const roll = h % 100;
    if (roll < 3) return "legendary";
    if (roll < 12) return "epic";
    if (roll < 35) return "rare";
    return "common";
  }

  // ── Achievement list ─────────────────────────────────────────────────────────

  private rebuildAchievementList(): void {
    this.leftContainer.removeAll(true);
    this.achievementRows = [];

    // Group achievements by category
    const grouped = new Map<string, PlayerAchievement[]>();
    for (const ach of this.achievements) {
      const cat = ach.achievement.category;
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(ach);
    }

    let rowY = 8;

    for (const [category, achs] of grouped.entries()) {
      // Category header
      const headerTxt = this.scene.add.text(8, rowY, category.toUpperCase(), {
        fontSize: "10px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
      });
      this.leftContainer.add(headerTxt);
      rowY += 18;

      for (const ach of achs) {
        const row = new AchievementRow(
          this.scene,
          this.leftContainer,
          8,
          rowY,
          ach,
          LEFT_W - 16,
          async () => this.handleAchievementClaim(ach),
        );
        this.achievementRows.push(row);
        rowY += ACH_ROW_H + 4;
      }

      rowY += 8;
    }

    if (this.achievements.length === 0) {
      const empty = this.scene.add.text(LEFT_W / 2, 120, "No achievements yet", {
        fontSize: "12px", fontFamily: "Arial", color: "#505060",
      }).setOrigin(0.5, 0.5);
      this.leftContainer.add(empty);
    }
  }

  private async handleAchievementClaim(ach: PlayerAchievement): Promise<void> {
    if (!ach.completed || ach.reward_claimed) return;

    try {
      await claimAchievementReward(ach.achievement_id, this.userId);
      ach.reward_claimed = true;

      const row = this.achievementRows.find(r => r.ach.achievement_id === ach.achievement_id);
      row?.refreshClaimButton(true);

      const updated = await getPlayerAchievements(this.userId);
      this.achievements = updated;
    } catch (err) {
      console.warn("[CollectionUI] claim failed:", err);
    }
  }

  // ── Milestones ────────────────────────────────────────────────────────────────

  private rebuildMilestonesList(): void {
    this.leftContainer.removeAll(true);
    this.milestoneCards = [];

    let y = 8;

    for (const { album, progress } of this.milestoneData) {
      const pct = progress?.progress_percent ?? 0;
      const claimedMilestones = progress?.claimed_milestones ?? [];
      const card = new MilestoneCard(
        this.scene,
        this.leftContainer,
        8,
        y,
        album,
        pct,
        claimedMilestones,
        LEFT_W - 16,
        (milestone, reward) => this.handleMilestoneClaim(album.collection_id, milestone, reward),
      );
      this.milestoneCards.push(card);
      y += card.height + 8;
    }

    if (this.milestoneData.length === 0) {
      const empty = this.scene.add.text(LEFT_W / 2, 120, "No collections yet", {
        fontSize: "12px", fontFamily: "Arial", color: "#505060",
      }).setOrigin(0.5, 0.5);
      this.leftContainer.add(empty);
    }
  }

  private handleMilestoneClaim(collectionId: string, milestone: number, reward: { currency?: number; gems?: number }): void {
    if (this.milestonePopup) this.milestonePopup.destroy();
    this.milestonePopup = new MilestonePopup(
      this.scene,
      milestone,
      reward,
      () => { this.milestonePopup = null; },
    );
    // Refresh milestones
    this.rebuildMilestonesList();
  }

  // ── Stats panel ───────────────────────────────────────────────────────────────

  private showStatsPanel(): void {
    this.rightContainer.removeAll(true);
    const { COLORS } = CONFIG;
    const innerW = RIGHT_W - PAD * 2;
    let y = 0;

    const stats = this.collectionStats;

    // Title
    const title = this.scene.add.text(0, y, "COLLECTION STATS", {
      fontSize: "13px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
    });
    this.rightContainer.add(title);
    y += 28;

    // ── Total items ──────────────────────────────────────────────────────────
    const totalItems = stats?.total_items ?? 0;
    const collectedItems = stats?.collected_items ?? 0;
    const itemPct = totalItems > 0 ? Math.floor((collectedItems / totalItems) * 100) : 0;

    this.addStatRow(y, "Total Items Collected", `${collectedItems} / ${totalItems}`, itemPct / 100, innerW);
    y += 36;

    // ── Total achievements ─────────────────────────────────────────────────────
    const totalAch = stats?.total_achievements ?? this.achievements.length;
    const unlockedAch = stats?.unlocked_achievements ?? this.achievements.filter(a => a.completed).length;
    const achPct = totalAch > 0 ? unlockedAch / totalAch : 0;

    this.addStatRow(y, "Achievements Unlocked", `${unlockedAch} / ${totalAch}`, achPct, innerW);
    y += 36;

    // ── Albums completed ──────────────────────────────────────────────────────
    const completedAlbums = [...this.albumProgress.values()].filter(p => p.completed).length;
    const totalAlbums = this.albums.length;
    const albPct = totalAlbums > 0 ? completedAlbums / totalAlbums : 0;

    this.addStatRow(y, "Albums Completed", `${completedAlbums} / ${totalAlbums}`, albPct, innerW);
    y += 36;

    // ── Rarity breakdown ──────────────────────────────────────────────────────
    y += 8;
    const rarityLabel = this.scene.add.text(0, y, "RARITY BREAKDOWN", {
      fontSize: "10px", fontFamily: "Arial", color: "#808098", fontStyle: "bold",
    });
    this.rightContainer.add(rarityLabel);
    y += 18;

    const rarities: ItemRarity[] = ["common", "rare", "epic", "legendary"];
    const rarityBreakdown = stats?.rarity_breakdown ?? { common: 0, rare: 0, epic: 0, legendary: 0 };

    for (const rarity of rarities) {
      const count = rarityBreakdown[rarity] ?? 0;
      const color = rarityNum(rarity);
      const barH = 20;
      const barW = innerW * 0.4;

      const rowBg = this.scene.add.graphics();
      rowBg.fillStyle(COLORS.BG, 0.5);
      rowBg.fillRoundedRect(0, y, innerW, barH + 4, 4);
      this.rightContainer.add(rowBg);

      // Color swatch
      const swatch = this.scene.add.graphics();
      swatch.fillStyle(color, 1);
      swatch.fillRoundedRect(4, y + 2, 14, barH, 3);
      this.rightContainer.add(swatch);

      // Rarity name
      const nameTxt = this.scene.add.text(22, y + barH / 2, rarity.charAt(0).toUpperCase() + rarity.slice(1), {
        fontSize: "11px", fontFamily: "Arial", color: rarityHex(rarity), fontStyle: "bold",
      }).setOrigin(0, 0.5);
      this.rightContainer.add(nameTxt);

      // Count
      const countTxt = this.scene.add.text(innerW - 4, y + barH / 2, `${count} items`, {
        fontSize: "11px", fontFamily: "Arial", color: "#aabbcc",
      }).setOrigin(1, 0.5);
      this.rightContainer.add(countTxt);

      y += barH + 8;
    }
  }

  private addStatRow(y: number, label: string, value: string, progress: number, innerW: number): void {
    const { COLORS } = CONFIG;

    const labelTxt = this.scene.add.text(0, y, label, {
      fontSize: "11px", fontFamily: "Arial", color: "#c0c0d8",
    });
    this.rightContainer.add(labelTxt);

    const valueTxt = this.scene.add.text(innerW, y, value, {
      fontSize: "11px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(1, 0);
    this.rightContainer.add(valueTxt);

    const barBg = this.scene.add.graphics();
    barBg.fillStyle(COLORS.BORDER, 1);
    barBg.fillRoundedRect(0, y + 16, innerW, 8, 4);
    this.rightContainer.add(barBg);

    if (progress > 0) {
      const barFill = this.scene.add.graphics();
      barFill.fillStyle(COLORS.SUCCESS, 0.8);
      barFill.fillRoundedRect(0, y + 16, Math.max(4, progress * innerW), 8, 4);
      this.rightContainer.add(barFill);
    }
  }

  // ── Achievement unlock toast (HUD-level, outside panel) ────────────────────

  private showAchievementUnlockToast(achievement: PlayerAchievement): void {
    if (this.achievementUnlockPopup) this.achievementUnlockPopup.destroy();

    this.achievementUnlockPopup = new AchievementUnlockPopup(
      this.scene,
      achievement,
      () => { this.achievementUnlockPopup = null; },
    );
  }
}

// ── AlbumCard ─────────────────────────────────────────────────────────────────

class AlbumCard {
  public readonly album: CollectionAlbum;
  public readonly container: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    album: CollectionAlbum,
    progress: CollectionProgress | null,
    x: number,
    y: number,
    onClick: (id: string) => void,
  ) {
    this.album = album;
    this.container = scene.add.container(x, y);
    const { COLORS } = CONFIG;

    const pct = progress?.progress_percent ?? 0;
    const isComplete = progress?.completed ?? false;
    const borderColor = isComplete ? COLORS.SUCCESS : COLORS.BORDER;

    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.BG, 0.65);
    bg.fillRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
    bg.lineStyle(1.5, borderColor, isComplete ? 0.9 : 0.5);
    bg.strokeRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
    bg.setName("card_bg");
    this.container.add(bg);

    // Completion badge
    const pctBadge = scene.add.graphics();
    if (isComplete) {
      pctBadge.fillStyle(COLORS.SUCCESS, 1);
      pctBadge.fillRoundedRect(ALBUM_CARD_W - 28, 4, 24, 18, 4);
    }
    this.container.add(pctBadge);

    const badgeTxt = scene.add.text(ALBUM_CARD_W - 16, 13, isComplete ? "✓" : `${Math.floor(pct)}%`, {
      fontSize: isComplete ? "12px" : "9px",
      fontFamily: "Arial",
      color: isComplete ? "#000000" : "#808090",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(badgeTxt);

    // Album icon
    const rarity = this.deriveRarity(album.collection_id);
    const iconBg = scene.add.graphics();
    iconBg.fillStyle(rarityNum(rarity), 0.2);
    iconBg.fillRoundedRect(ALBUM_CARD_W / 2 - 22, 22, 44, 44, 8);
    iconBg.lineStyle(1.5, rarityNum(rarity), 0.8);
    iconBg.strokeRoundedRect(ALBUM_CARD_W / 2 - 22, 22, 44, 44, 8);
    this.container.add(iconBg);

    const iconEmoji = scene.add.text(ALBUM_CARD_W / 2, 44, this.albumEmoji(album.theme ?? ""), {
      fontSize: "24px",
    }).setOrigin(0.5, 0.5);
    this.container.add(iconEmoji);

    const nameTxt = scene.add.text(ALBUM_CARD_W / 2, 72, album.name, {
      fontSize: "10px", fontFamily: "Arial",
      color: "#c0c0d8", fontStyle: "bold",
      wordWrap: { width: ALBUM_CARD_W - 8 },
      align: "center",
    }).setOrigin(0.5, 0);
    this.container.add(nameTxt);

    const countTxt = scene.add.text(ALBUM_CARD_W / 2, 86, `${album.total_items} items`, {
      fontSize: "9px", fontFamily: "Arial", color: "#606070",
    }).setOrigin(0.5, 0);
    this.container.add(countTxt);

    const barBg = scene.add.graphics();
    barBg.fillStyle(COLORS.BORDER, 1);
    barBg.fillRoundedRect(8, ALBUM_CARD_H - 16, ALBUM_CARD_W - 16, 6, 3);
    this.container.add(barBg);

    if (pct > 0) {
      const barFill = scene.add.graphics();
      barFill.fillStyle(COLORS.SUCCESS, 0.8);
      barFill.fillRoundedRect(8, ALBUM_CARD_H - 16, Math.max(4, (pct / 100) * (ALBUM_CARD_W - 16)), 6, 3);
      this.container.add(barFill);
    }

    const hit = scene.add.rectangle(ALBUM_CARD_W / 2, ALBUM_CARD_H / 2, ALBUM_CARD_W, ALBUM_CARD_H)
      .setInteractive({ useHandCursor: true });
    hit.setAlpha(0.001);
    this.container.add(hit);
    hit.on("pointerdown", () => onClick(album.collection_id));
    hit.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(COLORS.BG, 0.9);
      bg.fillRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
      bg.lineStyle(1.5, COLORS.ACCENT, 0.7);
      bg.strokeRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
    });
    hit.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(COLORS.BG, 0.65);
      bg.fillRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
      bg.lineStyle(1.5, borderColor, isComplete ? 0.9 : 0.5);
      bg.strokeRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
    });
  }

  setSelected(active: boolean): void {
    const bg = this.container.list.find(o => (o as Phaser.GameObjects.Graphics).name === "card_bg") as Phaser.GameObjects.Graphics | undefined;
    if (!bg) return;
    bg.clear();
    const { COLORS } = CONFIG;
    if (active) {
      bg.fillStyle(COLORS.BG, 0.9);
      bg.fillRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
      bg.lineStyle(2, COLORS.ACCENT, 1);
      bg.strokeRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
    } else {
      bg.fillStyle(COLORS.BG, 0.65);
      bg.fillRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
      bg.lineStyle(1.5, COLORS.BORDER, 0.5);
      bg.strokeRoundedRect(0, 0, ALBUM_CARD_W, ALBUM_CARD_H, 8);
    }
  }

  private albumEmoji(theme: string): string {
    const map: Record<string, string> = {
      animals: "🐾", nature: "🌿", space: "🚀", monsters: "👾",
      ocean: "🌊", fire: "🔥", ice: "❄️", electric: "⚡",
    };
    return map[theme.toLowerCase()] ?? "📦";
  }

  private deriveRarity(collectionId: string): ItemRarity {
    const h = collectionId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const roll = h % 100;
    if (roll < 5) return "legendary";
    if (roll < 20) return "epic";
    if (roll < 50) return "rare";
    return "common";
  }
}

// ── ItemSlot ───────────────────────────────────────────────────────────────────

class ItemSlot {
  constructor(
    private scene: Phaser.Scene,
    private parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    itemId: string,
    rarity: ItemRarity,
    owned: boolean,
    onTap?: (itemId: string, rarity: ItemRarity, owned: boolean) => void,
  ) {
    const { COLORS } = CONFIG;
    const sz = ITEM_SLOT_SZ;

    addRarityGlow(scene, parent, x + sz / 2, y + sz / 2, sz / 2, rarity);

    const bg = scene.add.graphics();
    bg.fillStyle(owned ? 0x1a1a2e : COLORS.BG, 1);
    bg.fillRoundedRect(x, y, sz, sz, 6);
    bg.lineStyle(1, owned ? rarityNum(rarity) : COLORS.BORDER, owned ? 0.8 : 0.4);
    bg.strokeRoundedRect(x, y, sz, sz, 6);
    parent.add(bg);

    const label = owned ? itemId.slice(-2).toUpperCase() : "?";
    const itemTxt = scene.add.text(x + sz / 2, y + sz / 2, label, {
      fontSize: "10px",
      fontFamily: "Arial",
      color: owned ? rarityHex(rarity) : "#404050",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    parent.add(itemTxt);

    if (owned) {
      const checkBg = scene.add.graphics();
      checkBg.fillStyle(COLORS.SUCCESS, 1);
      checkBg.fillCircle(x + sz - 8, y + sz - 8, 7);
      parent.add(checkBg);

      const checkTxt = scene.add.text(x + sz - 8, y + sz - 8, "✓", {
        fontSize: "9px", fontFamily: "Arial", color: "#000000", fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      parent.add(checkTxt);
    }

    const hit = scene.add.rectangle(x + sz / 2, y + sz / 2, sz, sz)
      .setInteractive({ useHandCursor: !!onTap });
    hit.setAlpha(0.001);
    parent.add(hit);

    hit.on("pointerover", () => {
      if (owned) {
        const tip = scene.add.text(x + sz / 2, y - 14, owned ? `${itemId} (${rarity})` : "???", {
          fontSize: "9px", fontFamily: "Arial", color: "#ffffff",
          backgroundColor: "#1c1c2c",
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5, 1).setDepth(1200);
        hit.setData("tip", tip);
      }
    });
    hit.on("pointerout", () => {
      const tip = hit.getData("tip") as Phaser.GameObjects.Text | undefined;
      tip?.destroy();
    });
    hit.on("pointerdown", () => {
      if (onTap) onTap(itemId, rarity, owned);
    });
  }
}

// ── ItemDetailPopup ────────────────────────────────────────────────────────────

class ItemDetailPopup {
  private container!: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private collectionId: string,
    private itemId: string,
    private rarity: ItemRarity,
    private owned: boolean,
    private onDismiss: () => void,
  ) {
    this.build();
  }

  private async build(): Promise<void> {
    const { COLORS } = CONFIG;
    const pw = 300;
    const ph = 180;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    this.container = this.scene.add.container(cx, cy);
    this.container.setDepth(1200);
    this.container.setAlpha(0);
    this.container.setScale(0.8);
    this.scene.children.add(this.container);

    const backdrop = this.scene.add.rectangle(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 0x000000, 0.5)
      .setDepth(1199).setInteractive();
    backdrop.on("pointerdown", () => this.dismiss());
    this.container.add(backdrop);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.98);
    bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 12);
    bg.lineStyle(2, rarityNum(this.rarity), 1);
    bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 12);
    this.container.add(bg);

    // Glow behind item icon
    addRarityGlow(this.scene, this.container, 0, -ph / 2 + 40, 24, this.rarity);

    // Item icon circle
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(rarityNum(this.rarity), 0.2);
    iconBg.fillCircle(0, -ph / 2 + 40, 24);
    iconBg.lineStyle(2, rarityNum(this.rarity), 0.9);
    iconBg.strokeCircle(0, -ph / 2 + 40, 24);
    this.container.add(iconBg);

    const iconTxt = this.scene.add.text(0, -ph / 2 + 40, this.owned ? this.itemId.slice(-2).toUpperCase() : "???", {
      fontSize: "14px", fontFamily: "Arial",
      color: this.owned ? rarityHex(this.rarity) : "#404050",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(iconTxt);

    // Fetch live detail from API (gracefully fallback)
    let itemDetail: { name: string; description: string | null; how_to_obtain: string | null } | null = null;
    if (this.owned) {
      try {
        itemDetail = await getItemDetail(this.collectionId, this.itemId);
      } catch {
        itemDetail = { name: this.itemId, description: null, how_to_obtain: null };
      }
    }

    const itemName = itemDetail?.name ?? (this.owned ? this.itemId : "Unknown Item");
    const itemDesc = itemDetail?.description ?? (this.owned ? "No description available." : "Collect this item to reveal details.");
    const howTo = itemDetail?.how_to_obtain ?? "How to obtain: Complete collection milestones.";

    const nameTxt = this.scene.add.text(0, -ph / 2 + 72, itemName, {
      fontSize: "14px", fontFamily: "Arial", color: rarityHex(this.rarity), fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(nameTxt);

    const rarityTxt = this.scene.add.text(0, -ph / 2 + 90, this.rarity.toUpperCase(), {
      fontSize: "10px", fontFamily: "Arial", color: rarityHex(this.rarity),
    }).setOrigin(0.5, 0.5);
    this.container.add(rarityTxt);

    const descTxt = this.scene.add.text(
      0, -ph / 2 + 108,
      itemDesc,
      {
        fontSize: "10px", fontFamily: "Arial", color: "#aabbcc",
        wordWrap: { width: pw - 24 },
        align: "center",
      },
    ).setOrigin(0.5, 0);
    this.container.add(descTxt);

    const obtainTxt = this.scene.add.text(
      0, -ph / 2 + 138,
      howTo,
      {
        fontSize: "9px", fontFamily: "Arial", color: "#707088",
        wordWrap: { width: pw - 24 },
        align: "center",
      },
    ).setOrigin(0.5, 0);
    this.container.add(obtainTxt);

    const btnTxt = this.scene.add.text(0, ph / 2 - 22, "Close", {
      fontSize: "11px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(btnTxt);

    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(COLORS.ACCENT, 0.2);
    btnBg.fillRoundedRect(-30, ph / 2 - 32, 60, 22, 5);
    btnBg.lineStyle(1, COLORS.ACCENT, 0.6);
    btnBg.strokeRoundedRect(-30, ph / 2 - 32, 60, 22, 5);
    this.container.add(btnBg);

    const hit = this.scene.add.rectangle(0, ph / 2 - 21, 60, 22)
      .setInteractive({ useHandCursor: true });
    hit.setAlpha(0.001);
    this.container.add(hit);
    hit.on("pointerdown", () => this.dismiss());

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: "Back.easeOut",
    });

    // Auto-dismiss after 8 seconds
    this.scene.time.delayedCall(8000, () => this.dismiss());
  }

  private dismiss(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 0.8,
      duration: 150,
      ease: "Back.easeIn",
      onComplete: () => {
        this.container.destroy();
        this.onDismiss();
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}

// ── AchievementRow ─────────────────────────────────────────────────────────────

class AchievementRow {
  public readonly ach: PlayerAchievement;

  constructor(
    private scene: Phaser.Scene,
    private parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    ach: PlayerAchievement,
    innerW: number,
    onClaim: () => void,
  ) {
    this.ach = ach;
    const { COLORS } = CONFIG;
    const h = ACH_ROW_H;

    this.container = scene.add.container(x, y);
    this.parent.add(this.container);

    const isHidden = ach.achievement.is_hidden && !ach.completed;

    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.BG, ach.completed ? 0.5 : 0.55);
    bg.fillRoundedRect(0, 0, innerW, h, 6);
    bg.lineStyle(1, ach.completed ? COLORS.SUCCESS : COLORS.BORDER, 0.5);
    bg.strokeRoundedRect(0, 0, innerW, h, 6);
    this.container.add(bg);

    // Achievement icon area
    const iconBg = scene.add.graphics();
    iconBg.fillStyle(COLORS.ACCENT, 0.2);
    iconBg.fillRoundedRect(4, 4, 40, h - 8, 6);
    iconBg.lineStyle(1, COLORS.ACCENT, 0.6);
    iconBg.strokeRoundedRect(4, 4, 40, h - 8, 6);
    this.container.add(iconBg);

    if (isHidden) {
      // Hidden: lock icon
      const lockTxt = scene.add.text(24, h / 2, "🔒", { fontSize: "16px" }).setOrigin(0.5, 0.5);
      this.container.add(lockTxt);

      // Name as "???"
      const nameTxt = scene.add.text(54, 6, "???", {
        fontSize: "12px", fontFamily: "Arial", color: "#606080", fontStyle: "bold",
      });
      this.container.add(nameTxt);

      const descTxt = scene.add.text(54, 22, "Hidden achievement — unlock to reveal", {
        fontSize: "10px", fontFamily: "Arial", color: "#404060",
      });
      this.container.add(descTxt);
    } else {
      // Normal achievement
      const iconTxt = scene.add.text(24, h / 2, this.categoryEmoji(ach.achievement.category), {
        fontSize: "18px",
      }).setOrigin(0.5, 0.5);
      this.container.add(iconTxt);

      const nameTxt = scene.add.text(54, 6, ach.achievement.name, {
        fontSize: "12px", fontFamily: "Arial", color: "#e0e0f0", fontStyle: "bold",
      });
      this.container.add(nameTxt);

      const descTxt = scene.add.text(54, 22, ach.achievement.description ?? "", {
        fontSize: "10px", fontFamily: "Arial", color: "#707088",
        wordWrap: { width: innerW - 120 },
      });
      this.container.add(descTxt);

      // Progress bar (skip for hidden)
      const pct = ach.achievement.target_value > 0
        ? Math.min(100, (ach.progress / ach.achievement.target_value) * 100)
        : 0;

      const barBg = scene.add.graphics();
      barBg.fillStyle(COLORS.BORDER, 1);
      barBg.fillRoundedRect(54, h - 14, innerW - 130, 8, 4);
      this.container.add(barBg);

      if (pct > 0) {
        const barFill = scene.add.graphics();
        barFill.fillStyle(ach.completed ? COLORS.SUCCESS : COLORS.ACCENT, 1);
        barFill.fillRoundedRect(54, h - 14, Math.max(4, (pct / 100) * (innerW - 130)), 8, 4);
        this.container.add(barFill);
      }

      const pctTxt = scene.add.text(54, h - 24, `${Math.floor(pct)}%`, {
        fontSize: "9px", fontFamily: "Arial", color: "#808090",
      });
      this.container.add(pctTxt);

      // Claim button
      this.claimBtn = this.buildClaimBtn(innerW - 80, h / 2, ach, onClaim);
      this.container.add(this.claimBtn.container);

      // Unclaimed dot
      if (ach.completed && !ach.reward_claimed) {
        const dot = scene.add.graphics();
        dot.fillStyle(COLORS.SUCCESS, 1);
        dot.fillCircle(innerW - 72, h / 2, 4);
        this.container.add(dot);
      }
    }
  }

  private container!: Phaser.GameObjects.Container;
  private claimBtn!: { container: Phaser.GameObjects.Container; refresh: (claimed: boolean) => void };

  private buildClaimBtn(
    bx: number,
    by: number,
    ach: PlayerAchievement,
    onClaim: () => void,
  ): { container: Phaser.GameObjects.Container; refresh: (claimed: boolean) => void } {
    const { COLORS } = CONFIG;
    const bw = 60;
    const bh = 22;

    const btnContainer = this.scene.add.container(bx, by);

    const btnBg = this.scene.add.graphics();
    this.drawClaimBtn(btnBg, 0, 0, bw, bh, ach);
    btnContainer.add(btnBg);

    const btnTxt = this.scene.add.text(bw / 2, bh / 2, this.claimLabel(ach), {
      fontSize: "10px", fontFamily: "Arial",
      color: this.claimColor(ach),
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    btnContainer.add(btnTxt);

    const hit = this.scene.add.rectangle(bw / 2, bh / 2, bw, bh)
      .setInteractive({ useHandCursor: ach.completed && !ach.reward_claimed });
    hit.setAlpha(0.001);
    btnContainer.add(hit);

    if (ach.completed && !ach.reward_claimed) {
      hit.on("pointerdown", onClaim);
    }

    const refresh = (claimed: boolean) => {
      btnBg.clear();
      this.drawClaimBtn(btnBg, 0, 0, bw, bh, { ...ach, reward_claimed: claimed });
      btnTxt.setText(this.claimLabel({ ...ach, reward_claimed: claimed }));
      btnTxt.setColor(this.claimColor({ ...ach, reward_claimed: claimed }));
    };

    return { container: btnContainer, refresh };
  }

  private drawClaimBtn(
    bg: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    ach: PlayerAchievement,
  ): void {
    const { COLORS } = CONFIG;
    if (ach.reward_claimed) {
      bg.fillStyle(COLORS.SUCCESS, 0.3);
      bg.fillRoundedRect(x, y, w, h, 5);
      bg.lineStyle(1, COLORS.SUCCESS, 0.5);
      bg.strokeRoundedRect(x, y, w, h, 5);
    } else if (ach.completed) {
      bg.fillStyle(COLORS.ACCENT, 1);
      bg.fillRoundedRect(x, y, w, h, 5);
    } else {
      bg.fillStyle(COLORS.BORDER, 1);
      bg.fillRoundedRect(x, y, w, h, 5);
    }
  }

  private claimLabel(ach: PlayerAchievement): string {
    if (ach.reward_claimed) return "Claimed";
    if (ach.completed) return "Claim!";
    return "Locked";
  }

  private claimColor(ach: PlayerAchievement): string {
    if (ach.reward_claimed) return "#00d26e";
    if (ach.completed) return "#000000";
    return "#505060";
  }

  refreshClaimButton(claimed: boolean): void {
    this.claimBtn.refresh(claimed);
  }

  private categoryEmoji(category: string): string {
    const map: Record<string, string> = {
      currency: "💰", gems: "💎", pets: "🐾",
      business: "🏪", social: "🤝", milestones: "🏆",
    };
    return map[category.toLowerCase()] ?? "⭐";
  }
}

// ── MilestoneCard ─────────────────────────────────────────────────────────────

class MilestoneCard {
  public readonly height = 80;

  constructor(
    private scene: Phaser.Scene,
    private parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    private album: CollectionAlbum,
    private pct: number,
    private claimedMilestones: number[],
    private innerW: number,
    private onMilestoneClaim: (milestone: number, reward: { currency?: number; gems?: number }) => void,
  ) {
    const { COLORS } = CONFIG;
    const h = this.height;

    const container = scene.add.container(x, y);
    parent.add(container);

    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.BG, 0.5);
    bg.fillRoundedRect(0, 0, innerW, h, 6);
    bg.lineStyle(1, COLORS.BORDER, 0.5);
    bg.strokeRoundedRect(0, 0, innerW, h, 6);
    container.add(bg);

    const nameTxt = scene.add.text(8, 6, album.name, {
      fontSize: "11px", fontFamily: "Arial", color: "#e0e0f0", fontStyle: "bold",
    });
    container.add(nameTxt);

    // Milestone tiers
    const milestones = [25, 50, 75, 100];
    const tierY = 26;
    const tierW = (innerW - 16) / milestones.length;

    milestones.forEach((milestone, i) => {
      const tx = 8 + i * tierW;
      const reached = pct >= milestone;
      const claimed = claimedMilestones.includes(milestone);
      const reward = album.milestone_rewards[String(milestone)] ?? { currency: 0 };

      // Tier background
      const tierBg = scene.add.graphics();
      if (claimed) {
        tierBg.fillStyle(COLORS.SUCCESS, 0.3);
      } else if (reached) {
        tierBg.fillStyle(COLORS.ACCENT, 0.2);
      } else {
        tierBg.fillStyle(COLORS.BORDER, 0.3);
      }
      tierBg.fillRoundedRect(tx + 2, tierY, tierW - 4, h - tierY - 6, 4);
      container.add(tierBg);

      // Checkmark or percentage
      const iconTxt = scene.add.text(tx + tierW / 2, tierY + 12, claimed ? "✓" : `${milestone}%`, {
        fontSize: claimed ? "12px" : "10px",
        fontFamily: "Arial",
        color: reached ? "#ffc800" : "#505060",
        fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      container.add(iconTxt);

      // Reward icon
      const rewardIcon = scene.add.text(tx + tierW / 2, tierY + 26, reward.gems ? "💎" : "💰", {
        fontSize: "10px",
      }).setOrigin(0.5, 0.5);
      if (!reached) rewardIcon.setAlpha(0.3);
      container.add(rewardIcon);

      // Claim button (if reached and not claimed)
      if (reached && !claimed) {
        const claimBtn = scene.add.text(tx + tierW / 2, tierY + 40, "CLAIM", {
          fontSize: "8px", fontFamily: "Arial",
          color: "#ffc800", fontStyle: "bold",
        }).setOrigin(0.5, 0.5);
        container.add(claimBtn);

        const hit = scene.add.rectangle(tx + tierW / 2, tierY + 40, tierW - 4, 16)
          .setInteractive({ useHandCursor: true });
        hit.setAlpha(0.001);
        container.add(hit);
        hit.on("pointerdown", () => onMilestoneClaim(milestone, reward));
      }
    });
  }
}

// ── MilestonePopup ─────────────────────────────────────────────────────────────

class MilestonePopup {
  private container!: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private milestone: number,
    private reward: { currency?: number; gems?: number },
    private onDismiss: () => void,
  ) {
    this.build();
    this.animate();
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const pw = 320;
    const ph = 160;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    this.container = this.scene.add.container(cx, cy);
    this.container.setDepth(1200);
    this.container.setAlpha(0);
    this.container.setScale(0.5);

    const backdrop = this.scene.add.rectangle(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 0x000000, 0.6)
      .setDepth(1199).setInteractive();
    backdrop.on("pointerdown", () => this.dismiss());
    this.container.add(backdrop);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.98);
    bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 12);
    bg.lineStyle(2, COLORS.ACCENT, 1);
    bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 12);
    this.container.add(bg);

    for (let i = 0; i < 5; i++) {
      const star = this.scene.add.text(
        -pw / 2 + 20 + i * (pw - 40) / 4,
        -ph / 2 + 18,
        "✦",
        { fontSize: "14px", color: "#ffc800" },
      ).setOrigin(0.5, 0.5);
      this.container.add(star);
    }

    const title = this.scene.add.text(0, -ph / 2 + 38, "MILESTONE REACHED!", {
      fontSize: "18px", fontFamily: "Arial Black", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(title);

    const badge = this.scene.add.text(0, -ph / 2 + 64, `${this.milestone}%`, {
      fontSize: "28px", fontFamily: "Arial Black", color: "#ffffff",
    }).setOrigin(0.5, 0.5);
    this.container.add(badge);

    const rewardParts: string[] = [];
    if (this.reward.currency) rewardParts.push(`$${this.reward.currency.toLocaleString()}`);
    if (this.reward.gems) rewardParts.push(`${this.reward.gems} gems`);
    const rewardTxt = this.scene.add.text(0, -ph / 2 + 92,
      rewardParts.length > 0 ? `Reward: ${rewardParts.join(", ")}` : "Reward unlocked!",
      { fontSize: "13px", fontFamily: "Arial", color: "#aaffaa", fontStyle: "bold" },
    ).setOrigin(0.5, 0.5);
    this.container.add(rewardTxt);

    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(COLORS.ACCENT, 1);
    btnBg.fillRoundedRect(-50, ph / 2 - 36, 100, 26, 6);
    this.container.add(btnBg);

    const btnTxt = this.scene.add.text(0, ph / 2 - 23, "Awesome!", {
      fontSize: "12px", fontFamily: "Arial", color: "#000000", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(btnTxt);

    const hit = this.scene.add.rectangle(0, ph / 2 - 23, 100, 26)
      .setInteractive({ useHandCursor: true });
    hit.setAlpha(0.001);
    this.container.add(hit);
    hit.on("pointerdown", () => this.dismiss());

    this.scene.children.add(this.container);
  }

  private animate(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 350,
      ease: "Back.easeOut",
    });

    this.scene.tweens.add({
      targets: this.container,
      angle: 2,
      duration: 100,
      yoyo: true,
      repeat: 3,
    });

    this.scene.time.delayedCall(6000, () => this.dismiss());
  }

  private dismiss(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 0.8,
      duration: 200,
      ease: "Back.easeIn",
      onComplete: () => {
        this.container.destroy();
        this.onDismiss();
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}

// ── AlbumCompletionCelebration ─────────────────────────────────────────────────

class AlbumCompletionCelebration {
  private container!: Phaser.GameObjects.Container;
  private particles: Phaser.GameObjects.Graphics[] = [];

  constructor(
    private scene: Phaser.Scene,
    private album: CollectionAlbum,
    private progress: CollectionProgress,
    private onDismiss: () => void,
  ) {
    this.build();
    this.spawnParticles();
    this.animate();
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const cw = CONFIG.CANVAS_WIDTH;
    const ch = CONFIG.CANVAS_HEIGHT;

    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1300);
    this.container.setAlpha(0);

    // Full-screen backdrop
    const backdrop = this.scene.add.rectangle(cw / 2, ch / 2, cw, ch, 0x000000, 0.7)
      .setInteractive();
    this.container.add(backdrop);

    const pw = 460;
    const ph = 280;
    const cx = cw / 2;
    const cy = ch / 2;

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.98);
    bg.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 16);
    bg.lineStyle(3, 0xffc800, 1);
    bg.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 16);
    this.container.add(bg);

    // Star row
    for (let i = 0; i < 7; i++) {
      const star = this.scene.add.text(
        cx - pw / 2 + 30 + i * (pw - 60) / 6,
        cy - ph / 2 + 24,
        "★",
        { fontSize: "20px", color: "#ffc800" },
      ).setOrigin(0.5, 0.5);
      this.container.add(star);
    }

    const title = this.scene.add.text(cx, cy - ph / 2 + 58, "ALBUM COMPLETE!", {
      fontSize: "26px", fontFamily: "Arial Black", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(title);

    const albumTxt = this.scene.add.text(cx, cy - ph / 2 + 86, this.album.name, {
      fontSize: "16px", fontFamily: "Arial", color: "#ffffff",
    }).setOrigin(0.5, 0.5);
    this.container.add(albumTxt);

    const collected = this.progress.collected_item_ids.length;
    const total = this.album.required_item_ids.length;
    const statsTxt = this.scene.add.text(cx, cy - ph / 2 + 112,
      `${collected} / ${total} items collected`,
      { fontSize: "12px", fontFamily: "Arial", color: "#aabbcc" },
    ).setOrigin(0.5, 0.5);
    this.container.add(statsTxt);

    // Reward
    const reward = this.album.completion_reward;
    const currencyReward = reward?.["currency"] ?? 0;
    const gemsReward = reward?.["gems"] ?? 0;
    const rewardParts: string[] = [];
    if (currencyReward > 0) rewardParts.push(`$${currencyReward.toLocaleString()}`);
    if (gemsReward > 0) rewardParts.push(`${gemsReward} gems`);

    const rewardTxt = this.scene.add.text(cx, cy - ph / 2 + 140,
      rewardParts.length > 0 ? `Reward: ${rewardParts.join(", ")}` : "Album Mastery Reward!",
      { fontSize: "14px", fontFamily: "Arial", color: "#aaffaa", fontStyle: "bold" },
    ).setOrigin(0.5, 0.5);
    this.container.add(rewardTxt);

    // Claim button
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0xffc800, 1);
    btnBg.fillRoundedRect(cx - 70, cy - ph / 2 + 165, 140, 32, 8);
    this.container.add(btnBg);

    const btnTxt = this.scene.add.text(cx, cy - ph / 2 + 181, "AMAZING!", {
      fontSize: "14px", fontFamily: "Arial", color: "#000000", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(btnTxt);

    const hit = this.scene.add.rectangle(cx, cy - ph / 2 + 181, 140, 32)
      .setInteractive({ useHandCursor: true });
    hit.setAlpha(0.001);
    this.container.add(hit);
    hit.on("pointerdown", () => this.dismiss());

    // Click anywhere to dismiss
    backdrop.on("pointerdown", () => this.dismiss());

    this.scene.children.add(this.container);
  }

  private spawnParticles(): void {
    const colors = [0xffc800, 0xffcc00, 0xffffff, 0xaa44ff, 0x4488ff];
    const cw = CONFIG.CANVAS_WIDTH;
    const ch = CONFIG.CANVAS_HEIGHT;

    for (let i = 0; i < 60; i++) {
      const size = Phaser.Math.Between(4, 10);
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const x = Phaser.Math.Between(0, cw);
      const y = Phaser.Math.Between(-100, ch);

      const p = this.scene.add.graphics();
      p.fillStyle(color, 1);
      p.fillCircle(0, 0, size);
      p.x = x;
      p.y = y;
      p.setDepth(1301);
      this.container.add(p);
      this.particles.push(p);

      // Fall + drift animation
      this.scene.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-120, 120),
        y: ch + 50,
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(2000, 4000),
        ease: "Quad.easeIn",
        delay: Phaser.Math.Between(0, 1500),
      });
    }
  }

  private animate(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: "Back.easeOut",
    });

    this.scene.time.delayedCall(8000, () => this.dismiss());
  }

  private dismiss(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 0.7,
      duration: 300,
      ease: "Back.easeIn",
      onComplete: () => {
        this.container.destroy();
        this.onDismiss();
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}

// ── AchievementUnlockPopup ────────────────────────────────────────────────────

class AchievementUnlockPopup {
  private container!: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private achievement: PlayerAchievement,
    private onDismiss: () => void,
  ) {
    this.build();
    this.animate();
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const pw = 340;
    const ph = 160;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    this.container = this.scene.add.container(cx, cy);
    this.container.setDepth(1100);
    this.container.setAlpha(0);
    this.container.setScale(0.5);

    const backdrop = this.scene.add.rectangle(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 0x000000, 0.5)
      .setDepth(1099).setInteractive();
    backdrop.on("pointerdown", () => this.dismiss());
    this.container.add(backdrop);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.98);
    bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 12);
    bg.lineStyle(3, 0xffc800, 1);
    bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 12);
    this.container.add(bg);

    // Golden badge icon
    const badgeBg = this.scene.add.graphics();
    badgeBg.fillStyle(0xffc800, 1);
    badgeBg.fillCircle(-pw / 2 + 44, -ph / 2 + 44, 28);
    this.container.add(badgeBg);

    const badgeTxt = this.scene.add.text(-pw / 2 + 44, -ph / 2 + 44, "🏆", {
      fontSize: "24px",
    }).setOrigin(0.5, 0.5);
    this.container.add(badgeTxt);

    const title = this.scene.add.text(-pw / 2 + 80, -ph / 2 + 30, "ACHIEVEMENT UNLOCKED!", {
      fontSize: "13px", fontFamily: "Arial Black", color: "#ffc800", fontStyle: "bold",
    });
    this.container.add(title);

    const nameTxt = this.scene.add.text(-pw / 2 + 80, -ph / 2 + 50, this.achievement.achievement.name, {
      fontSize: "14px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
    });
    this.container.add(nameTxt);

    if (this.achievement.achievement.description) {
      const descTxt = this.scene.add.text(
        -pw / 2 + 80, -ph / 2 + 68,
        this.achievement.achievement.description,
        {
          fontSize: "10px", fontFamily: "Arial", color: "#aabbcc",
          wordWrap: { width: pw - 100 },
        },
      );
      this.container.add(descTxt);
    }

    const rewardParts: string[] = [];
    if (this.achievement.achievement.reward_currency) {
      rewardParts.push(`$${this.achievement.achievement.reward_currency.toLocaleString()}`);
    }
    if (this.achievement.achievement.reward_gems) {
      rewardParts.push(`${this.achievement.achievement.reward_gems} gems`);
    }
    if (rewardParts.length > 0) {
      const rewardTxt = this.scene.add.text(-pw / 2 + 80, -ph / 2 + 92,
        `Reward: ${rewardParts.join(", ")}`,
        { fontSize: "12px", fontFamily: "Arial", color: "#aaffaa", fontStyle: "bold" },
      );
      this.container.add(rewardTxt);
    }

    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0xffc800, 1);
    btnBg.fillRoundedRect(-pw / 2 + pw / 2 - 50, ph / 2 - 34, 100, 24, 6);
    this.container.add(btnBg);

    const btnTxt = this.scene.add.text(-pw / 2 + pw / 2, ph / 2 - 22, "Awesome!", {
      fontSize: "11px", fontFamily: "Arial", color: "#000000", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(btnTxt);

    const hit = this.scene.add.rectangle(-pw / 2 + pw / 2, ph / 2 - 22, 100, 24)
      .setInteractive({ useHandCursor: true });
    hit.setAlpha(0.001);
    this.container.add(hit);
    hit.on("pointerdown", () => this.dismiss());

    this.scene.children.add(this.container);
  }

  private animate(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 350,
      ease: "Back.easeOut",
    });

    this.scene.tweens.add({
      targets: this.container,
      angle: 2,
      duration: 80,
      yoyo: true,
      repeat: 3,
    });

    this.scene.time.delayedCall(6000, () => this.dismiss());
  }

  private dismiss(): void {
    if (!this.container || !this.container.scene) return;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 0.8,
      duration: 200,
      ease: "Back.easeIn",
      onComplete: () => {
        this.container.destroy();
        this.onDismiss();
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
