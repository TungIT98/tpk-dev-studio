/**
 * EventScene.ts
 * Full-screen Seasonal Events UI overlay for Phaser.js.
 *
 * Features:
 * (1) Event Calendar — all events (active/upcoming/ended) with countdown timers and type filter
 * (2) Active Event detail — banner, currency counter, quest tracker, leaderboard, store, exclusive items
 * (3) Notifications — toast when event starts, quest completion popups
 * (4) Seasonal Store — grid of exclusive items purchasable with event currency
 * (5) Theme overlay — event-specific ambient particles in the background
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import type {
  SeasonalEvent,
  EventQuest,
  EventLeaderboardEntry,
  PlayerEventStatus,
  EventType,
  PlayerQuestProgress,
} from "../shared/EventTypes";
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_HEX,
  EVENT_TYPE_EMOJI,
  formatCountdown,
  formatTimeUntil,
} from "../shared/EventTypes";
import {
  listEvents,
  listActiveEvents,
  getEventQuests,
  getEventLeaderboard,
  joinEvent,
  earnPoints,
  claimQuestReward,
  getPlayerEventStatus,
} from "../events/EventClient";

// ── Layout constants ──────────────────────────────────────────────────────────

const PANEL_W       = 900;
const PANEL_H       = 600;
const PAD           = 16;
const LEFT_W        = 320;
const RIGHT_W       = 548;
const GAP           = 10;
const EVENT_CARD_H  = 72;
const EVENT_CARD_W  = LEFT_W - PAD * 2;
const QUEST_ROW_H   = 62;
const LB_ROW_H      = 40;
const STORE_ITEM_SZ = 80;
const STORE_ITEM_GAP = 10;
const FILTER_BTN_W  = 70;
const FILTER_BTN_H  = 26;

// ── EventScene ────────────────────────────────────────────────────────────────

export class EventScene {
  private scene: Phaser.Scene;
  private userId: string;
  private username: string;

  private container!: Phaser.GameObjects.Container;
  private overlay!: Phaser.GameObjects.Rectangle;
  private visible = false;

  // State
  private allEvents: SeasonalEvent[] = [];
  private activeEvents: SeasonalEvent[] = [];
  private selectedEventId: string | null = null;
  private playerStatus: Map<string, PlayerEventStatus> = new Map();
  private eventQuests: Map<string, EventQuest[]> = new Map();
  private activeTab: "calendar" | "detail" = "calendar";
  private detailTab: "quests" | "leaderboard" | "store" | "exclusive" = "quests";
  private filterStatus: "all" | "active" | "upcoming" | "ended" = "all";

  // Child containers
  private leftContainer!: Phaser.GameObjects.Container;
  private rightContainer!: Phaser.GameObjects.Container;
  private eventCards: EventCard[] = [];
  private questRows: QuestRow[] = [];
  private lbRows: LbRow[] = [];

  // Theme overlay
  private themeParticleTimer: Phaser.Time.TimerEvent | null = null;
  private themeParticles: Phaser.GameObjects.Graphics | null = null;

  // Toast queue
  private toasts: ToastNotification[] = [];

  // Loading
  private loadingText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, userId: string, username: string) {
    this.scene = scene;
    this.userId = userId;
    this.username = username;
    this.build();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    if (this.visible) return;
    this.visible = true;

    this.container.setAlpha(0);
    this.container.setScale(0.9);
    this.container.setVisible(true);
    this.themeParticles?.setVisible(true);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1, scale: 1,
      duration: 220,
      ease: "Back.easeOut",
    });

    this.overlay.setAlpha(0);
    this.scene.tweens.add({ targets: this.overlay, alpha: 0.78, duration: 200 });

    await this.loadData();

    if (this.activeEvents.length > 0) {
      this.selectEvent(this.activeEvents[0].event_id);
    }
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0, scale: 0.9,
      duration: 180,
      ease: "Back.easeIn",
      onComplete: () => this.container.setVisible(false),
    });
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 180 });
    this.themeParticles?.setVisible(false);

    for (const toast of this.toasts) toast.destroy();
    this.toasts = [];
  }

  get isVisible(): boolean { return this.visible; }

  /** Call from Colyseus "event:start" message to show a start notification */
  onEventStarted(event: SeasonalEvent): void {
    this.showToast(
      `${EVENT_TYPE_EMOJI[event.event_type]} ${event.name} has started!`,
      EVENT_TYPE_HEX[event.event_type],
    );
  }

  /** Call when a quest completes to show a popup */
  onQuestCompleted(questName: string, points: number): void {
    this.showQuestPopup(questName, points);
  }

  destroy(): void {
    this.container.destroy();
    this.overlay.destroy();
    this.themeParticleTimer?.destroy();
    this.themeParticles?.destroy();
    for (const toast of this.toasts) toast.destroy();
  }

  // ── Build ───────────────────────────────────────────────────────────────────

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

    // Theme particle layer (behind everything)
    this.themeParticles = this.scene.add.graphics().setDepth(993).setVisible(false);
    this.container.add(this.themeParticles);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.97);
    bg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, 12);
    bg.lineStyle(1.5, COLORS.ACCENT, 0.7);
    bg.strokeRoundedRect(0, 0, PANEL_W, PANEL_H, 12);
    this.container.add(bg);

    this.buildTitleBar(COLORS);
    this.buildFilterBar(COLORS);
    this.buildLeftPanel(COLORS);
    this.buildRightPanel(COLORS);

    this.scene.input.keyboard?.once("keydown-ESC", () => this.close());
  }

  private buildTitleBar(COLORS: typeof CONFIG.COLORS): void {
    const strip = this.scene.add.graphics();
    strip.fillStyle(COLORS.ACCENT, 0.08);
    strip.fillRoundedRect(0, 0, PANEL_W, 44, 12);
    strip.fillRect(0, 22, PANEL_W, 22);
    this.container.add(strip);

    const title = this.scene.add.text(PANEL_W / 2, 22, "Seasonal Events", {
      fontSize: "15px", fontFamily: "Arial",
      color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(title);

    const hint = this.scene.add.text(PANEL_W - PAD, 22, "ESC to close", {
      fontSize: "10px", fontFamily: "Arial", color: "#505060",
    }).setOrigin(1, 0.5);
    this.container.add(hint);
  }

  private buildFilterBar(COLORS: typeof CONFIG.COLORS): void {
    const barY = 46;
    const filters: Array<{ label: string; key: "all" | "active" | "upcoming" | "ended" }> = [
      { label: "All", key: "all" },
      { label: "Active", key: "active" },
      { label: "Upcoming", key: "upcoming" },
      { label: "Ended", key: "ended" },
    ];

    const filterContainer = this.scene.add.container(0, 0);
    this.container.add(filterContainer);

    let bx = PAD;
    for (const f of filters) {
      const btn = this.scene.add.container(bx, barY);
      const bg = this.scene.add.graphics();
      bg.fillStyle(COLORS.BORDER, 0.5);
      bg.fillRoundedRect(0, 0, FILTER_BTN_W, FILTER_BTN_H, 5);
      bg.lineStyle(1, COLORS.BORDER, 0.5);
      bg.strokeRoundedRect(0, 0, FILTER_BTN_W, FILTER_BTN_H, 5);
      bg.setName("filter_bg");
      btn.add(bg);

      const txt = this.scene.add.text(FILTER_BTN_W / 2, FILTER_BTN_H / 2, f.label, {
        fontSize: "11px", fontFamily: "Arial",
        color: "#808090", fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      txt.setName("filter_txt");
      btn.add(txt);

      const hit = this.scene.add.rectangle(FILTER_BTN_W / 2, FILTER_BTN_H / 2, FILTER_BTN_W, FILTER_BTN_H)
        .setInteractive({ useHandCursor: true });
      hit.setAlpha(0.001);
      btn.add(hit);

      hit.on("pointerdown", () => {
        this.filterStatus = f.key;
        this.updateFilterAppearance(filterContainer, f.key, filters, COLORS);
        this.rebuildEventList();
      });

      filterContainer.add(btn);
      bx += FILTER_BTN_W + 6;
    }

    // Active filter appearance
    this.updateFilterAppearance(filterContainer, "all", filters, COLORS);
  }

  private updateFilterAppearance(
    container: Phaser.GameObjects.Container,
    activeKey: string,
    filters: Array<{ label: string; key: string }>,
    COLORS: typeof CONFIG.COLORS,
  ): void {
    let idx = 0;
    for (const f of filters) {
      const btn = container.list[idx] as Phaser.GameObjects.Container;
      const isActive = f.key === activeKey;
      btn.list.forEach(obj => {
        const bg = obj as Phaser.GameObjects.Graphics;
        const txt = obj as Phaser.GameObjects.Text;
        if (bg.name === "filter_bg" && bg.clear) {
          bg.clear();
          bg.fillStyle(isActive ? COLORS.ACCENT : COLORS.BORDER, isActive ? 0.4 : 0.5);
          bg.fillRoundedRect(0, 0, FILTER_BTN_W, FILTER_BTN_H, 5);
          bg.lineStyle(1, isActive ? COLORS.ACCENT : COLORS.BORDER, isActive ? 0.9 : 0.5);
          bg.strokeRoundedRect(0, 0, FILTER_BTN_W, FILTER_BTN_H, 5);
        }
        if (txt.name === "filter_txt" && txt.setColor) {
          txt.setColor(isActive ? "#ffc800" : "#808090");
        }
      });
      idx++;
    }
  }

  private buildLeftPanel(COLORS: typeof CONFIG.COLORS): void {
    const panelX = PAD;
    const panelY = 80;
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
    const panelY = 80;
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
      const [all, active] = await Promise.all([
        listEvents().catch(() => [] as SeasonalEvent[]),
        listActiveEvents().catch(() => [] as SeasonalEvent[]),
      ]);

      this.allEvents = all;
      this.activeEvents = active;

      if (this.filterStatus !== "all") {
        this.rebuildEventList();
      } else {
        this.rebuildEventList();
      }

      // Refresh countdowns every 30s
      this.scene.time.addEvent({
        delay: 30_000,
        callback: () => this.rebuildEventList(),
        loop: true,
      });
    } catch (err) {
      console.warn("[EventScene] loadData failed:", err);
    } finally {
      this.loadingText.setVisible(false);
    }
  }

  private rebuildEventList(): void {
    this.leftContainer.removeAll(true);
    this.eventCards = [];

    const filtered = this.allEvents.filter(e => {
      if (this.filterStatus === "all") return true;
      return e.status === this.filterStatus;
    });

    if (filtered.length === 0) {
      const empty = this.scene.add.text(
        EVENT_CARD_W / 2, 80,
        "No events",
        { fontSize: "12px", fontFamily: "Arial", color: "#505060" },
      ).setOrigin(0.5, 0.5);
      this.leftContainer.add(empty);
      return;
    }

    filtered.forEach((event, i) => {
      const card = new EventCard(
        this.scene,
        event,
        event.event_id === this.selectedEventId,
        i * (EVENT_CARD_H + 6),
        (id) => this.selectEvent(id),
      );
      this.leftContainer.add(card.container);
      this.eventCards.push(card);
    });
  }

  private async selectEvent(eventId: string): Promise<void> {
    this.selectedEventId = eventId;
    this.activeTab = "detail";

    for (const card of this.eventCards) {
      card.setSelected(card.event.event_id === eventId);
    }

    const event = this.allEvents.find(e => e.event_id === eventId);
    if (!event) return;

    // Load quests + player status in parallel
    const [quests, status] = await Promise.all([
      getEventQuests(eventId).catch(() => [] as EventQuest[]),
      getPlayerEventStatus(eventId, this.userId).catch(() => null as PlayerEventStatus | null),
    ]);

    this.eventQuests.set(eventId, quests);
    if (status) this.playerStatus.set(eventId, status);

    // Update theme overlay
    this.applyThemeOverlay(event);

    // Show detail
    if (event.status === "active") {
      this.showActiveEventDetail(event, quests, status ?? null);
    } else {
      this.showEventPreview(event);
    }
  }

  // ── Detail: Active event ───────────────────────────────────────────────────

  private showActiveEventDetail(
    event: SeasonalEvent,
    quests: EventQuest[],
    status: PlayerEventStatus | null,
  ): void {
    this.rightContainer.removeAll(true);
    this.questRows = [];
    this.lbRows = [];

    // Join event if not yet joined
    if (!status) {
      joinEvent(event.event_id, { user_id: this.userId, username: this.username }).catch(() => {});
    }

    this.buildEventDetailTabs(event, quests, status);

    let y = 0;
    y = this.renderEventBanner(event, status, y);
    y = this.renderDetailTabs(event, quests, status, y);
  }

  private buildEventDetailTabs(
    event: SeasonalEvent,
    quests: EventQuest[],
    status: PlayerEventStatus | null,
  ): void {
    const tabY = 0;
    const tabH = 32;
    const subTabs: Array<{ label: string; key: "quests" | "leaderboard" | "store" | "exclusive" }> = [
      { label: "Quests", key: "quests" },
      { label: "Leaderboard", key: "leaderboard" },
      { label: "Store", key: "store" },
      { label: "Exclusive", key: "exclusive" },
    ];

    const tabContainer = this.scene.add.container(0, tabY);
    this.rightContainer.add(tabContainer);

    let bx = 0;
    for (const st of subTabs) {
      const btn = this.scene.add.container(bx, 0);
      const bg = this.scene.add.graphics();
      const isActive = st.key === this.detailTab;
      bg.fillStyle(CONFIG.COLORS.ACCENT, isActive ? 0.18 : 0.06);
      bg.fillRoundedRect(0, 0, 100, tabH, 6);
      bg.lineStyle(1, CONFIG.COLORS.ACCENT, isActive ? 0.9 : 0.4);
      bg.strokeRoundedRect(0, 0, 100, tabH, 6);
      bg.setName("subtab_bg");
      btn.add(bg);

      const txt = this.scene.add.text(50, tabH / 2, st.label, {
        fontSize: "11px", fontFamily: "Arial",
        color: isActive ? "#ffc800" : "#606080", fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      txt.setName("subtab_txt");
      btn.add(txt);

      const hit = this.scene.add.rectangle(50, tabH / 2, 100, tabH).setInteractive({ useHandCursor: true });
      hit.setAlpha(0.001);
      btn.add(hit);

      hit.on("pointerdown", () => {
        this.detailTab = st.key;
        this.buildEventDetailTabs(event, quests, status);
        this.renderDetailTabContent(event, quests, status, tabH + 10);
      });

      tabContainer.add(btn);
      bx += 108;
    }
  }

  private renderEventBanner(
    event: SeasonalEvent,
    status: PlayerEventStatus | null,
    y: number,
  ): number {
    const { COLORS } = CONFIG;
    const innerW = RIGHT_W - PAD * 2;
    const bannerH = 80;

    // Banner background with event type color
    const bannerColor = this.eventBannerColor(event);
    const bannerBg = this.scene.add.graphics();
    bannerBg.fillStyle(bannerColor, 0.15);
    bannerBg.fillRoundedRect(0, y, innerW, bannerH, 8);
    bannerBg.lineStyle(1.5, bannerColor, 0.6);
    bannerBg.strokeRoundedRect(0, y, innerW, bannerH, 8);
    this.rightContainer.add(bannerBg);

    // Event name + type badge
    const typeBadgeColor = EVENT_TYPE_COLORS[event.event_type];
    const badgeBg = this.scene.add.graphics();
    badgeBg.fillStyle(typeBadgeColor, 0.9);
    badgeBg.fillRoundedRect(0, y + 8, 14, 14, 3);
    this.rightContainer.add(badgeBg);

    const badgeTxt = this.scene.add.text(7, y + 15, EVENT_TYPE_EMOJI[event.event_type], {
      fontSize: "9px",
    }).setOrigin(0.5, 0.5);
    this.rightContainer.add(badgeTxt);

    const nameTxt = this.scene.add.text(22, y + 8, event.name, {
      fontSize: "16px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
    });
    this.rightContainer.add(nameTxt);

    const endTime = formatCountdown(event.end_date);
    const endTxt = this.scene.add.text(innerW, y + 8, `Ends: ${endTime}`, {
      fontSize: "11px", fontFamily: "Arial", color: EVENT_TYPE_HEX[event.event_type],
    }).setOrigin(1, 0);
    this.rightContainer.add(endTxt);

    if (event.description) {
      const descTxt = this.scene.add.text(22, y + 28, event.description, {
        fontSize: "11px", fontFamily: "Arial", color: "#9090a8",
        wordWrap: { width: innerW - 22 },
      });
      this.rightContainer.add(descTxt);
    }

    // Currency counter
    if (event.reward_currency_name && status?.event_currency) {
      const currencyTxt = this.scene.add.text(22, y + 54, `${status.event_currency.name}: ${Math.floor(status.event_currency.balance)}`, {
        fontSize: "13px", fontFamily: "Arial", color: EVENT_TYPE_HEX[event.event_type], fontStyle: "bold",
      });
      this.rightContainer.add(currencyTxt);

      const pointsTxt = this.scene.add.text(innerW, y + 54, `${Math.floor(status.total_points)} pts`, {
        fontSize: "12px", fontFamily: "Arial", color: "#ffc800",
      }).setOrigin(1, 0);
      this.rightContainer.add(pointsTxt);
    } else if (event.reward_currency_name) {
      const currencyTxt = this.scene.add.text(22, y + 54, `${event.reward_currency_name}: 0`, {
        fontSize: "13px", fontFamily: "Arial", color: EVENT_TYPE_HEX[event.event_type], fontStyle: "bold",
      });
      this.rightContainer.add(currencyTxt);
    }

    return y + bannerH + 10;
  }

  private renderDetailTabs(
    event: SeasonalEvent,
    quests: EventQuest[],
    status: PlayerEventStatus | null,
    y: number,
  ): number {
    this.buildEventDetailTabs(event, quests, status);
    return y + 42;
  }

  private renderDetailTabContent(
    event: SeasonalEvent,
    quests: EventQuest[],
    status: PlayerEventStatus | null,
    startY: number,
  ): void {
    // Remove everything below the tabs
    for (let i = this.rightContainer.list.length - 1; i >= 0; i--) {
      const child = this.rightContainer.list[i] as Phaser.GameObjects.Container;
      if ((child as any).y > startY - 20) {
        child.destroy();
      }
    }

    switch (this.detailTab) {
      case "quests":   this.renderQuestList(event, quests, status, startY); break;
      case "leaderboard": this.renderLeaderboard(event, startY); break;
      case "store":     this.renderStore(event, startY); break;
      case "exclusive": this.renderExclusiveItems(event, startY); break;
    }
  }

  private renderQuestList(
    event: SeasonalEvent,
    quests: EventQuest[],
    status: PlayerEventStatus | null,
    startY: number,
  ): void {
    const progressMap = new Map<string, PlayerQuestProgress>();
    if (status) {
      for (const q of status.quests) progressMap.set(q.quest_id, q);
    }

    const innerW = RIGHT_W - PAD * 2;
    let y = startY;

    const label = this.scene.add.text(0, y, "EVENT QUESTS", {
      fontSize: "10px", fontFamily: "Arial", color: "#505060", fontStyle: "bold",
    });
    this.rightContainer.add(label);
    y += 20;

    if (quests.length === 0) {
      const empty = this.scene.add.text(innerW / 2, y + 60, "No quests available", {
        fontSize: "12px", fontFamily: "Arial", color: "#505060",
      }).setOrigin(0.5, 0.5);
      this.rightContainer.add(empty);
      return;
    }

    for (const quest of quests) {
      const prog = progressMap.get(quest.quest_id) ?? null;
      const row = new QuestRow(
        this.scene,
        this.rightContainer,
        quest,
        prog,
        0, y,
        innerW,
        async () => this.handleQuestClaim(event.event_id, quest, prog),
      );
      this.questRows.push(row);
      y += QUEST_ROW_H + 4;
    }
  }

  private async renderLeaderboard(event: SeasonalEvent, startY: number): Promise<void> {
    const innerW = RIGHT_W - PAD * 2;
    let y = startY;

    const label = this.scene.add.text(0, y, "EVENT LEADERBOARD", {
      fontSize: "10px", fontFamily: "Arial", color: "#505060", fontStyle: "bold",
    });
    this.rightContainer.add(label);
    y += 20;

    const loading = this.scene.add.text(innerW / 2, y + 30, "Loading…", {
      fontSize: "12px", fontFamily: "Arial", color: "#606060",
    }).setOrigin(0.5, 0.5);
    this.rightContainer.add(loading);

    try {
      const lb = await getEventLeaderboard(event.event_id);
      loading.destroy();

      if (lb.entries.length === 0) {
        this.scene.add.text(innerW / 2, y + 30, "No participants yet", {
          fontSize: "12px", fontFamily: "Arial", color: "#505060",
        }).setOrigin(0.5, 0.5);
        return;
      }

      // Show top 10 + nearby
      const top10 = lb.entries.slice(0, 10);
      for (const entry of top10) {
        const row = new LbRow(this.scene, this.rightContainer, entry, 0, y, innerW);
        this.lbRows.push(row);
        y += LB_ROW_H + 2;
      }

      // Player's own rank if not in top 10
      const myRank = lb.entries.findIndex(e => e.user_id === this.userId);
      if (myRank >= 10) {
        const myEntry = lb.entries[myRank];
        const row = new LbRow(this.scene, this.rightContainer, myEntry, 0, y, innerW, true);
        this.lbRows.push(row);
      }
    } catch {
      loading.setText("Failed to load leaderboard");
    }
  }

  private renderStore(event: SeasonalEvent, startY: number): void {
    const innerW = RIGHT_W - PAD * 2;
    let y = startY;

    const header = this.scene.add.text(0, y, "SEASONAL STORE", {
      fontSize: "10px", fontFamily: "Arial", color: "#505060", fontStyle: "bold",
    });
    this.rightContainer.add(header);
    y += 18;

    if (!event.reward_currency_name) {
      this.scene.add.text(innerW / 2, y + 40, "No store items available", {
        fontSize: "12px", fontFamily: "Arial", color: "#505060",
      }).setOrigin(0.5, 0.5);
      return;
    }

    // Demo store items derived from exclusive_item_ids
    const items = event.exclusive_item_ids.length > 0
      ? event.exclusive_item_ids.map((id, i) => ({
          item_id: id,
          name: `Exclusive Item ${i + 1}`,
          cost: (i + 1) * 50,
          rarity: ["common", "rare", "epic", "legendary"][i % 4] as string,
        }))
      : [
          { item_id: `${event.event_id}_gem_pack`, name: "Gem Pack (50)", cost: 200, rarity: "rare" },
          { item_id: `${event.event_id}_coin_boost`, name: "Coin Boost (1h)", cost: 150, rarity: "common" },
          { item_id: `${event.event_id}_pet_ticket`, name: "Pet Summon Ticket", cost: 500, rarity: "epic" },
        ];

    const cols = 3;
    const itemW = STORE_ITEM_SZ;
    const itemGap = STORE_ITEM_GAP;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = col * (itemW + itemGap);
      const sy = y + row * (itemW + itemGap + 24);

      new StoreItem(
        this.scene,
        this.rightContainer,
        item.item_id,
        item.name,
        item.cost,
        event.reward_currency_name ?? "Tokens",
        item.rarity,
        sx, sy, itemW,
        () => this.handleStorePurchase(event, item.item_id, item.cost),
      );
    });
  }

  private renderExclusiveItems(event: SeasonalEvent, startY: number): void {
    const innerW = RIGHT_W - PAD * 2;
    let y = startY;

    const header = this.scene.add.text(0, y, "EXCLUSIVE ITEMS", {
      fontSize: "10px", fontFamily: "Arial", color: "#505060", fontStyle: "bold",
    });
    this.rightContainer.add(header);
    y += 20;

    if (event.exclusive_item_ids.length === 0) {
      this.scene.add.text(innerW / 2, y + 60, "No exclusive items for this event", {
        fontSize: "12px", fontFamily: "Arial", color: "#505060",
      }).setOrigin(0.5, 0.5);
      return;
    }

    const cols = 4;
    const sz = 56;
    const gap = 8;

    event.exclusive_item_ids.forEach((itemId, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = col * (sz + gap);
      const sy = y + row * (sz + gap + 16);
      this.renderExclusiveItemCard(sx, sy, itemId, event.event_type);
    });
  }

  private renderExclusiveItemCard(x: number, y: number, itemId: string, type: EventType): void {
    const { COLORS } = CONFIG;
    const sz = 56;
    const rarity = this.deriveRarity(itemId);
    const color = this.rarityColor(rarity);

    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 0.1);
    bg.fillRoundedRect(x, y, sz, sz, 6);
    bg.lineStyle(1.5, color, 0.8);
    bg.strokeRoundedRect(x, y, sz, sz, 6);
    this.rightContainer.add(bg);

    const label = this.scene.add.text(x + sz / 2, y + sz / 2, itemId.slice(-2).toUpperCase(), {
      fontSize: "11px", fontFamily: "Arial", color: "#" + color.toString(16).padStart(6, "0"), fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.rightContainer.add(label);

    const hint = this.scene.add.text(x + sz / 2, y + sz + 4, rarity, {
      fontSize: "9px", fontFamily: "Arial", color: "#606070",
    }).setOrigin(0.5, 0);
    this.rightContainer.add(hint);

    void type;
  }

  // ── Detail: Upcoming / Ended preview ─────────────────────────────────────

  private showEventPreview(event: SeasonalEvent): void {
    this.rightContainer.removeAll(true);
    this.questRows = [];

    const innerW = RIGHT_W - PAD * 2;
    const bannerColor = this.eventBannerColor(event);

    let y = 0;

    // Banner
    const bannerBg = this.scene.add.graphics();
    bannerBg.fillStyle(bannerColor, 0.12);
    bannerBg.fillRoundedRect(0, y, innerW, 100, 8);
    bannerBg.lineStyle(1.5, bannerColor, 0.5);
    bannerBg.strokeRoundedRect(0, y, innerW, 100, 8);
    this.rightContainer.add(bannerBg);

    const emoji = this.scene.add.text(innerW / 2, y + 20, EVENT_TYPE_EMOJI[event.event_type], {
      fontSize: "32px",
    }).setOrigin(0.5, 0.5);
    this.rightContainer.add(emoji);

    const nameTxt = this.scene.add.text(innerW / 2, y + 55, event.name, {
      fontSize: "18px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.rightContainer.add(nameTxt);

    const statusTxt = this.scene.add.text(innerW / 2, y + 78, event.status.toUpperCase(), {
      fontSize: "11px", fontFamily: "Arial",
      color: event.status === "ended" ? "#606060" : EVENT_TYPE_HEX[event.event_type],
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.rightContainer.add(statusTxt);
    y += 110;

    if (event.description) {
      const descTxt = this.scene.add.text(0, y, event.description, {
        fontSize: "12px", fontFamily: "Arial", color: "#9090a8",
        wordWrap: { width: innerW },
      });
      this.rightContainer.add(descTxt);
      y += 50;
    }

    // Countdown
    if (event.status === "upcoming") {
      const timeUntil = formatTimeUntil(event.start_date);
      const countdownBg = this.scene.add.graphics();
      countdownBg.fillStyle(CONFIG.COLORS.PANEL, 0.8);
      countdownBg.fillRoundedRect(0, y, innerW, 50, 8);
      this.rightContainer.add(countdownBg);

      const countdownTxt = this.scene.add.text(innerW / 2, y + 25, timeUntil, {
        fontSize: "22px", fontFamily: "Arial Black", color: EVENT_TYPE_HEX[event.event_type],
        fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      this.rightContainer.add(countdownTxt);

      const subTxt = this.scene.add.text(innerW / 2, y + 42, "until event starts", {
        fontSize: "10px", fontFamily: "Arial", color: "#606080",
      }).setOrigin(0.5, 0.5);
      this.rightContainer.add(subTxt);
    } else if (event.status === "ended") {
      const endedTxt = this.scene.add.text(innerW / 2, y + 40, "This event has ended", {
        fontSize: "14px", fontFamily: "Arial", color: "#606060",
      }).setOrigin(0.5, 0.5);
      this.rightContainer.add(endedTxt);
    }
  }

  // ── Quest claim ─────────────────────────────────────────────────────────────

  private async handleQuestClaim(
    eventId: string,
    quest: EventQuest,
    progress: PlayerQuestProgress | null,
  ): Promise<void> {
    if (!progress?.completed || progress.reward_claimed) return;

    try {
      const result = await claimQuestReward(eventId, {
        quest_id: quest.quest_id,
        user_id: this.userId,
      });

      if (!result.already_claimed) {
        this.showQuestPopup(quest.name, result.points_earned);

        // Refresh player status
        const updated = await getPlayerEventStatus(eventId, this.userId);
        this.playerStatus.set(eventId, updated);

        // Update UI
        const row = this.questRows.find(r => r.quest.quest_id === quest.quest_id);
        if (row) row.markClaimed();

        const event = this.allEvents.find(e => e.event_id === eventId);
        if (event) {
          const quests = this.eventQuests.get(eventId) ?? [];
          this.renderEventBanner(event, updated, 0);
        }
      }
    } catch (err) {
      console.warn("[EventScene] claim failed:", err);
    }
  }

  // ── Store purchase ─────────────────────────────────────────────────────────

  private handleStorePurchase(event: SeasonalEvent, itemId: string, cost: number): void {
    const status = this.playerStatus.get(event.event_id);
    const balance = status?.event_currency?.balance ?? 0;

    if (balance < cost) {
      this.showToast(`Not enough ${event.reward_currency_name ?? "tokens"}!`, "#dc3737");
      return;
    }

    // TODO: wire up POST /api/events/{id}/store/purchase when backend supports it
    this.showToast(`Purchased ${itemId}! (API pending)`, EVENT_TYPE_HEX[event.event_type]);
    void itemId;
  }

  // ── Theme overlay ──────────────────────────────────────────────────────────

  private applyThemeOverlay(event: SeasonalEvent): void {
    this.themeParticleTimer?.destroy();
    this.themeParticles?.clear();

    const color = EVENT_TYPE_COLORS[event.event_type];

    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number }> = [];

    this.themeParticleTimer = this.scene.time.addEvent({
      delay: 800,
      callback: () => {
        if (!this.visible) return;
        const { COLORS: _C } = CONFIG;
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: Math.random() * PANEL_W,
            y: -10,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0.3 + Math.random() * 0.4,
            life: 1.0,
            size: 2 + Math.random() * 3,
          });
        }

        this.themeParticles!.clear();
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.004;
          if (p.life > 0) {
            this.themeParticles!.fillStyle(color, p.life * 0.6);
            this.themeParticles!.fillCircle(p.x, p.y, p.size);
          }
        }

        // Remove dead particles
        for (let i = particles.length - 1; i >= 0; i--) {
          if (particles[i].life <= 0) particles.splice(i, 1);
        }
      },
      loop: true,
    });
  }

  // ── Toast notifications ────────────────────────────────────────────────────

  showToast(message: string, color = "#ffc800"): void {
    const toast = new ToastNotification(this.scene, this.container, message, color);
    this.toasts.push(toast);
  }

  private showQuestPopup(questName: string, points: number): void {
    this.showToast(`Quest complete: ${questName} (+${points} pts)`, "#00d26e");
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private eventBannerColor(event: SeasonalEvent): number {
    if (event.banner_color) {
      const hex = event.banner_color.replace("#", "");
      return parseInt(hex, 16) || EVENT_TYPE_COLORS[event.event_type];
    }
    return EVENT_TYPE_COLORS[event.event_type];
  }

  private rarityColor(rarity: string): number {
    const map: Record<string, number> = {
      common: 0x9d9d9d, rare: 0x0070dd, epic: 0xa335ee,
      legendary: 0xff8000, mythic: 0xe6cc80,
    };
    return map[rarity] ?? 0x9d9d9d;
  }

  private deriveRarity(itemId: string): string {
    const h = itemId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const roll = h % 100;
    if (roll < 3) return "legendary";
    if (roll < 12) return "epic";
    if (roll < 35) return "rare";
    return "common";
  }
}

// ── EventCard ─────────────────────────────────────────────────────────────────

class EventCard {
  public readonly event: SeasonalEvent;
  public readonly container: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    event: SeasonalEvent,
    selected: boolean,
    y: number,
    onClick: (id: string) => void,
  ) {
    this.event = event;
    this.container = scene.add.container(0, y);
    const { COLORS } = CONFIG;

    const borderColor = event.status === "active"
      ? EVENT_TYPE_COLORS[event.event_type]
      : COLORS.BORDER;

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.BG, 0.65);
    bg.fillRoundedRect(0, 0, EVENT_CARD_W, EVENT_CARD_H, 8);
    bg.lineStyle(1.5, borderColor, selected ? 1 : (event.status === "active" ? 0.6 : 0.3));
    bg.strokeRoundedRect(0, 0, EVENT_CARD_W, EVENT_CARD_H, 8);
    bg.setName("card_bg");
    this.container.add(bg);

    // Type emoji
    const emojiBg = scene.add.graphics();
    emojiBg.fillStyle(EVENT_TYPE_COLORS[event.event_type], 0.2);
    emojiBg.fillRoundedRect(8, 8, 36, 36, 6);
    this.container.add(emojiBg);

    const emojiTxt = scene.add.text(26, 26, EVENT_TYPE_EMOJI[event.event_type], {
      fontSize: "18px",
    }).setOrigin(0.5, 0.5);
    this.container.add(emojiTxt);

    // Event name
    const nameTxt = scene.add.text(52, 10, event.name, {
      fontSize: "12px", fontFamily: "Arial", color: selected ? "#ffffff" : "#c0c0d8",
      fontStyle: "bold", wordWrap: { width: EVENT_CARD_W - 130 },
    });
    this.container.add(nameTxt);

    // Status badge
    const statusColor = event.status === "active" ? 0x00d26e
      : event.status === "upcoming" ? EVENT_TYPE_COLORS[event.event_type]
      : 0x606060;
    const badgeBg = scene.add.graphics();
    badgeBg.fillStyle(statusColor, 0.9);
    badgeBg.fillRoundedRect(52, 30, 60, 14, 4);
    this.container.add(badgeBg);

    const badgeTxt = scene.add.text(82, 37, event.status.toUpperCase(), {
      fontSize: "9px", fontFamily: "Arial", color: "#000000", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(badgeTxt);

    // Countdown
    const countdown = event.status === "active"
      ? formatCountdown(event.end_date)
      : event.status === "upcoming"
        ? formatTimeUntil(event.start_date)
        : "Ended";
    const countdownTxt = scene.add.text(EVENT_CARD_W - 8, EVENT_CARD_H - 10, countdown, {
      fontSize: "10px", fontFamily: "Arial",
      color: event.status === "active" ? EVENT_TYPE_HEX[event.event_type] : "#606060",
    }).setOrigin(1, 1);
    countdownTxt.setName("countdown");
    this.container.add(countdownTxt);

    // Hit area
    const hit = scene.add.rectangle(EVENT_CARD_W / 2, EVENT_CARD_H / 2, EVENT_CARD_W, EVENT_CARD_H)
      .setInteractive({ useHandCursor: true });
    hit.setAlpha(0.001);
    this.container.add(hit);
    hit.on("pointerdown", () => onClick(event.event_id));
  }

  setSelected(active: boolean): void {
    let bg: Phaser.GameObjects.Graphics | undefined;
    for (const obj of this.container.list) {
      if ((obj as Phaser.GameObjects.Graphics).name === "card_bg") {
        bg = obj as Phaser.GameObjects.Graphics;
        break;
      }
    }
    if (!bg) return;
    bg.clear();

    const borderColor = this.event.status === "active"
      ? EVENT_TYPE_COLORS[this.event.event_type]
      : CONFIG.COLORS.BORDER;

    bg.fillStyle(CONFIG.COLORS.BG, active ? 0.85 : 0.65);
    bg.fillRoundedRect(0, 0, EVENT_CARD_W, EVENT_CARD_H, 8);
    bg.lineStyle(1.5, borderColor, active ? 1 : (this.event.status === "active" ? 0.6 : 0.3));
    bg.strokeRoundedRect(0, 0, EVENT_CARD_W, EVENT_CARD_H, 8);
  }
}

// ── QuestRow ──────────────────────────────────────────────────────────────────

class QuestRow {
  public readonly quest: EventQuest;

  constructor(
    private scene: Phaser.Scene,
    private parent: Phaser.GameObjects.Container,
    quest: EventQuest,
    progress: PlayerQuestProgress | null,
    x: number,
    y: number,
    innerW: number,
    onClaim: () => void,
  ) {
    this.quest = quest;
    const { COLORS } = CONFIG;
    const h = QUEST_ROW_H;
    const completed = progress?.completed ?? false;
    const rewardClaimed = progress?.reward_claimed ?? false;

    const container = scene.add.container(x, y);
    parent.add(container);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, completed && !rewardClaimed ? 0.4 : 0.25);
    bg.fillRoundedRect(0, 0, innerW, h, 6);
    bg.lineStyle(1, completed ? COLORS.SUCCESS : COLORS.BORDER, completed ? 0.7 : 0.3);
    bg.strokeRoundedRect(0, 0, innerW, h, 6);
    container.add(bg);

    // Progress bar
    const pct = progress
      ? Math.min(100, (progress.progress / quest.target_value) * 100)
      : 0;

    const barBg = scene.add.graphics();
    barBg.fillStyle(COLORS.BORDER, 1);
    barBg.fillRoundedRect(70, h - 14, innerW - 170, 8, 4);
    container.add(barBg);

    if (pct > 0) {
      const barFill = scene.add.graphics();
      barFill.fillStyle(completed ? COLORS.SUCCESS : COLORS.ACCENT, 1);
      barFill.fillRoundedRect(70, h - 14, Math.max(4, (pct / 100) * (innerW - 170)), 8, 4);
      container.add(barFill);
    }

    const pctTxt = scene.add.text(70, h - 26, `${Math.floor(pct)}%`, {
      fontSize: "9px", fontFamily: "Arial", color: "#808090",
    });
    container.add(pctTxt);

    // Quest name
    const nameTxt = scene.add.text(8, 6, quest.name, {
      fontSize: "12px", fontFamily: "Arial", color: completed ? "#aaffaa" : "#d0d0e8", fontStyle: "bold",
    });
    container.add(nameTxt);

    // Rewards
    const rewards: string[] = [];
    if (quest.points_reward > 0) rewards.push(`${quest.points_reward} pts`);
    if (quest.currency_reward > 0) rewards.push(`$${quest.currency_reward}`);
    if (quest.gem_reward > 0) rewards.push(`${quest.gem_reward} gems`);
    const rewardTxt = scene.add.text(8, 22, rewards.join(" · "), {
      fontSize: "10px", fontFamily: "Arial", color: "#707088",
    });
    container.add(rewardTxt);

    // Claim button
    const bw = 60;
    const bh = 22;
    const btnBg = scene.add.graphics();
    this.drawClaimBtn(btnBg, 0, 0, bw, bh, completed, rewardClaimed);
    container.add(btnBg);

    const btnTxt = scene.add.text(bw / 2, bh / 2, this.claimLabel(completed, rewardClaimed), {
      fontSize: "10px", fontFamily: "Arial",
      color: this.claimColor(completed, rewardClaimed), fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    container.add(btnTxt);

    const hit = scene.add.rectangle(innerW - bw / 2, h / 2, bw, bh)
      .setInteractive({ useHandCursor: completed && !rewardClaimed });
    hit.setAlpha(0.001);
    container.add(hit);

    if (completed && !rewardClaimed) {
      hit.on("pointerdown", onClaim);
    }
  }

  private drawClaimBtn(
    bg: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    completed: boolean, claimed: boolean,
  ): void {
    const { COLORS } = CONFIG;
    if (claimed) {
      bg.fillStyle(COLORS.SUCCESS, 0.3);
      bg.fillRoundedRect(x, y, w, h, 5);
      bg.lineStyle(1, COLORS.SUCCESS, 0.5);
      bg.strokeRoundedRect(x, y, w, h, 5);
    } else if (completed) {
      bg.fillStyle(COLORS.ACCENT, 1);
      bg.fillRoundedRect(x, y, w, h, 5);
    } else {
      bg.fillStyle(COLORS.BORDER, 1);
      bg.fillRoundedRect(x, y, w, h, 5);
    }
  }

  private claimLabel(completed: boolean, claimed: boolean): string {
    if (claimed) return "Claimed";
    if (completed) return "Claim!";
    return "Locked";
  }

  private claimColor(completed: boolean, claimed: boolean): string {
    if (claimed) return "#00d26e";
    if (completed) return "#000000";
    return "#505060";
  }

  markClaimed(): void {
    // Refresh handled by parent re-render
  }
}

// ── LbRow ─────────────────────────────────────────────────────────────────────

class LbRow {
  constructor(
    private scene: Phaser.Scene,
    private parent: Phaser.GameObjects.Container,
    entry: EventLeaderboardEntry,
    x: number, y: number, innerW: number,
    isPlayer = false,
  ) {
    const { COLORS } = CONFIG;
    const container = scene.add.container(x, y);
    parent.add(container);

    const bg = scene.add.graphics();
    bg.fillStyle(isPlayer ? COLORS.ACCENT : COLORS.PANEL, isPlayer ? 0.15 : 0.3);
    bg.fillRoundedRect(0, 0, innerW, LB_ROW_H, 4);
    bg.lineStyle(1, isPlayer ? COLORS.ACCENT : COLORS.BORDER, isPlayer ? 0.7 : 0.2);
    bg.strokeRoundedRect(0, 0, innerW, LB_ROW_H, 4);
    container.add(bg);

    // Rank
    const rankColor = entry.rank === 1 ? "#ffd700"
      : entry.rank === 2 ? "#c0c0c0"
      : entry.rank === 3 ? "#cd7f32"
      : "#808090";
    const rankTxt = scene.add.text(10, LB_ROW_H / 2, `#${entry.rank}`, {
      fontSize: "12px", fontFamily: "Arial", color: rankColor, fontStyle: "bold",
    }).setOrigin(0, 0.5);
    container.add(rankTxt);

    // Username
    const nameTxt = scene.add.text(50, LB_ROW_H / 2, entry.username ?? "Unknown", {
      fontSize: "12px", fontFamily: "Arial",
      color: isPlayer ? "#ffc800" : "#d0d0e8",
      fontStyle: isPlayer ? "bold" : "normal",
    }).setOrigin(0, 0.5);
    container.add(nameTxt);

    // Score
    const scoreTxt = scene.add.text(innerW - 8, LB_ROW_H / 2, `${Math.floor(entry.score)} pts`, {
      fontSize: "12px", fontFamily: "Arial", color: "#ffc800",
    }).setOrigin(1, 0.5);
    container.add(scoreTxt);
  }
}

// ── StoreItem ─────────────────────────────────────────────────────────────────

class StoreItem {
  constructor(
    private scene: Phaser.Scene,
    private parent: Phaser.GameObjects.Container,
    itemId: string,
    name: string,
    cost: number,
    currencyName: string,
    rarity: string,
    x: number, y: number, sz: number,
    onBuy: () => void,
  ) {
    const { COLORS } = CONFIG;
    const color = this.rarityColor(rarity);

    const bg = scene.add.graphics();
    bg.fillStyle(color, 0.1);
    bg.fillRoundedRect(x, y, sz, sz, 8);
    bg.lineStyle(1.5, color, 0.8);
    bg.strokeRoundedRect(x, y, sz, sz, 8);
    parent.add(bg);

    const iconTxt = scene.add.text(x + sz / 2, y + sz / 2 - 6, name.slice(0, 2).toUpperCase(), {
      fontSize: "14px", fontFamily: "Arial", color: "#" + color.toString(16).padStart(6, "0"), fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    parent.add(iconTxt);

    const costTxt = scene.add.text(x + sz / 2, y + sz + 2, `${cost}`, {
      fontSize: "9px", fontFamily: "Arial", color: "#ffc800",
    }).setOrigin(0.5, 0);
    parent.add(costTxt);

    const hit = scene.add.rectangle(x + sz / 2, y + sz / 2, sz, sz + 16)
      .setInteractive({ useHandCursor: true });
    hit.setAlpha(0.001);
    parent.add(hit);
    hit.on("pointerdown", onBuy);

    void itemId;
  }

  private rarityColor(rarity: string): number {
    const map: Record<string, number> = {
      common: 0x9d9d9d, rare: 0x0070dd, epic: 0xa335ee,
      legendary: 0xff8000, mythic: 0xe6cc80,
    };
    return map[rarity] ?? 0x9d9d9d;
  }
}

// ── ToastNotification ─────────────────────────────────────────────────────────

class ToastNotification {
  private container!: Phaser.GameObjects.Container;
  private startTime: number;
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    message: string,
    color = "#ffc800",
  ) {
    const cw = CONFIG.CANVAS_WIDTH;
    this.scene = scene;
    const w = 360;
    const h = 44;
    const x = cw - w / 2 - 20;
    const y = 60;

    this.startTime = Date.now();
    this.container = scene.add.container(x, y);
    this.container.setDepth(1200);
    this.container.setAlpha(0);
    parent.add(this.container);

    const bg = scene.add.graphics();
    bg.fillStyle(0x1c1c2c, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(1.5, parseInt(color.replace("#", ""), 16), 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.container.add(bg);

    const txt = scene.add.text(0, 0, message, {
      fontSize: "12px", fontFamily: "Arial", color: color, fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(txt);

    scene.tweens.add({
      targets: this.container,
      alpha: 1, y: y + 10,
      duration: 200,
      ease: "Back.easeOut",
    });

    scene.time.delayedCall(3500, () => this.destroy());
  }

  destroy(): void {
    if (!this.container?.scene) return;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0, y: this.container.y - 20,
      duration: 250,
      ease: "Back.easeIn",
      onComplete: () => this.container.destroy(),
    });
  }
}
