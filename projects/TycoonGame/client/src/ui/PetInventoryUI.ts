/**
 * PetInventoryUI.ts
 * Full-screen pet management overlay.
 *
 * Features:
 * - Pet list (left panel): owned pets with icon, level, rarity badge, equipped indicator
 * - Pet detail (right panel): name, level, XP bar, stat breakdown, equipment slots, skills
 * - Equip / Unequip toggle per pet
 * - Evolution flow (reuses PetEvolutionUI)
 * - Responsive: stacks vertically on narrow viewports
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import type { PetFullInstance, PetEquipment } from "../shared/types";
import { computeBaseStats, computeEquipmentBonus, xpProgressInLevel } from "../shared/types";
import { PetManager } from "../pets/PetManager";
import { PetClient } from "../pets/PetClient";
import { PetEvolutionUI } from "./PetEvolutionUI";
import { RARITY_COLORS, RARITY_LABELS, getStageName } from "../pets/petDefinitions";
import { rarityGlowAlpha } from "./CollectionUI";

// ── Layout constants ───────────────────────────────────────────────────────────

const LIST_PANEL_W    = 260;
const DETAIL_PANEL_W  = 480;
const TOTAL_W         = 740;          // LIST_PANEL_W + DETAIL_PANEL_W + GAP
const TOTAL_H         = 480;
const GAP             = 12;
const PADDING         = 14;
const ROW_H           = 64;
const SLOT_SIZE       = 48;

const STAT_COLORS: Record<string, string> = {
  hp:  "#ff6666",
  atk: "#ffaa44",
  def: "#66aaff",
  spd: "#66ffaa",
};

// ── PetInventoryUI ────────────────────────────────────────────────────────────

export class PetInventoryUI {
  private scene: Phaser.Scene;
  private petManager: PetManager;
  private petClient: PetClient;
  private evolutionUI: PetEvolutionUI;

  private container!: Phaser.GameObjects.Container;
  private overlay!: Phaser.GameObjects.Rectangle;
  private visible = false;

  // Left panel
  private listContainer!: Phaser.GameObjects.Container;
  private listItems: PetListItem[] = [];
  private selectedId: string | null = null;

  // Right panel
  private detailContainer!: Phaser.GameObjects.Container;
  private detailPet: PetFullInstance | null = null;

  // Equip slot buttons (head / body / accessory)
  private equipSlotBtns: Record<string, Phaser.GameObjects.Container> = {};

  // Loading state
  private loadingText!: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    petManager: PetManager,
    userId: string,
    evolutionUI: PetEvolutionUI,
  ) {
    this.scene          = scene;
    this.petManager     = petManager;
    this.petClient      = new PetClient(userId);
    this.evolutionUI    = evolutionUI;
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

    // Dim game world
    this.overlay.setAlpha(0);
    this.scene.tweens.add({ targets: this.overlay, alpha: 0.75, duration: 200 });

    // Load / refresh pet list
    await this.refreshPetList();

    // Select first if nothing selected
    if (!this.selectedId && this.listItems.length > 0) {
      this.selectPet(this.listItems[0].instance.instance_id);
    } else if (this.detailPet) {
      this.showDetail(this.detailPet);
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

  async refreshPetList(): Promise<void> {
    this.loadingText.setVisible(true);
    try {
      const pets = await this.petClient.listMyPets(false);
      this.rebuildList(pets);
    } catch (err) {
      console.warn("[PetInventoryUI] Failed to load pets:", err);
    } finally {
      this.loadingText.setVisible(false);
    }
  }

  destroy(): void {
    this.container.destroy();
    this.overlay.destroy();
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  private build(): void {
    const { COLORS } = CONFIG;
    const cw = CONFIG.CANVAS_WIDTH;
    const ch = CONFIG.CANVAS_HEIGHT;

    // Responsive: shrink if viewport is narrow
    const isNarrow = cw < 900;
    const panelW  = isNarrow ? cw - 20 : TOTAL_W;
    const listW   = isNarrow ? Math.min(LIST_PANEL_W, panelW - 20) : LIST_PANEL_W;
    const detailW = isNarrow ? panelW - listW - GAP : DETAIL_PANEL_W;

    const x0 = (cw - panelW) / 2;
    const y0 = (ch - TOTAL_H) / 2;

    // ── Overlay ───────────────────────────────────────────────────────────────
    this.overlay = this.scene.add.rectangle(
      cw / 2, ch / 2, cw, ch, 0x000000, 0.75,
    ).setDepth(990).setInteractive();
    this.overlay.on("pointerdown", () => this.close());

    // ── Root container ────────────────────────────────────────────────────────
    this.container = this.scene.add.container(x0, y0);
    this.container.setDepth(995);
    this.container.setVisible(false);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.PANEL, 0.97);
    bg.fillRoundedRect(0, 0, panelW, TOTAL_H, 10);
    bg.lineStyle(1.5, COLORS.ACCENT, 0.8);
    bg.strokeRoundedRect(0, 0, panelW, TOTAL_H, 10);
    this.container.add(bg);

    // Title bar
    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(COLORS.ACCENT, 0.12);
    titleBg.fillRoundedRect(0, 0, panelW, 40, 10);
    titleBg.fillRect(0, 20, panelW, 20);
    this.container.add(titleBg);

    const title = this.scene.add.text(panelW / 2, 20, "Pet Companions", {
      fontSize: "15px",
      fontFamily: "Arial",
      color: "#ffc800",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.container.add(title);

    // ESC / close hint
    const closeHint = this.scene.add.text(panelW - PADDING, 20, "ESC to close", {
      fontSize: "10px", fontFamily: "Arial", color: "#606080",
    }).setOrigin(1, 0.5);
    this.container.add(closeHint);

    // ── Left panel: pet list ──────────────────────────────────────────────────
    const listX = PADDING;
    const listY = 48;
    const listH = TOTAL_H - listY - PADDING;

    const listBg = this.scene.add.graphics();
    listBg.fillStyle(COLORS.BG, 0.5);
    listBg.fillRoundedRect(listX, listY, listW, listH, 6);
    this.container.add(listBg);

    this.listContainer = this.scene.add.container(listX, listY);
    this.container.add(this.listContainer);

    // Loading placeholder
    this.loadingText = this.scene.add.text(listX + listW / 2, listY + listH / 2, "Loading…", {
      fontSize: "12px", fontFamily: "Arial", color: "#606080",
    }).setOrigin(0.5, 0.5).setVisible(false);
    this.container.add(this.loadingText);

    // ── Right panel: pet detail ───────────────────────────────────────────────
    const detailX = listX + listW + GAP;
    const detailY = listY;
    const innerDetailW = detailW - PADDING * 2;

    const detailBg = this.scene.add.graphics();
    detailBg.fillStyle(COLORS.BG, 0.4);
    detailBg.fillRoundedRect(detailX, detailY, detailW, listH, 6);
    this.container.add(detailBg);

    this.detailContainer = this.scene.add.container(detailX + PADDING, detailY + PADDING);
    this.container.add(this.detailContainer);

    this.buildEmptyDetail(innerDetailW);

    // ESC to close
    this.scene.input.keyboard?.once("keydown-ESC", () => this.close());
  }

  private buildEmptyDetail(innerW: number): void {
    const placeholder = this.scene.add.text(innerW / 2, 120, "Select a pet to view details", {
      fontSize: "13px", fontFamily: "Arial", color: "#606080",
    }).setOrigin(0.5, 0.5);
    placeholder.setName("empty_detail");
    this.detailContainer.add(placeholder);
  }

  // ── Pet list ────────────────────────────────────────────────────────────────

  private rebuildList(pets: PetFullInstance[]): void {
    this.listContainer.removeAll(true);
    this.listItems = [];

    const equipped = new Set(
      [...this.petManager.getEquippedPets()].map(p => p.instance_id),
    );

    pets.forEach((pet, i) => {
      const item = new PetListItem(
        this.scene,
        this.listContainer,
        pet,
        equipped.has(pet.instance_id),
        (id) => this.selectPet(id),
      );
      item.setPosition(6, i * (ROW_H + 4));
      this.listItems.push(item);
    });
  }

  private selectPet(instanceId: string): void {
    this.selectedId = instanceId;

    // Highlight selected in list
    for (const item of this.listItems) {
      item.setSelected(item.instance.instance_id === instanceId);
    }

    // Find the pet data
    const found = this.listItems.find(it => it.instance.instance_id === instanceId)?.instance;
    if (!found) return;

    // Fetch latest from backend to ensure stats are up to date
    this.petClient.lookupPet(instanceId).then(pet => {
      this.detailPet = pet;
      this.showDetail(pet);
    }).catch(() => {
      this.detailPet = found;
      this.showDetail(found);
    });
  }

  // ── Pet detail panel ───────────────────────────────────────────────────────

  private showDetail(pet: PetFullInstance): void {
    this.detailContainer.removeAll(true);
    this.detailPet = pet;

    const { COLORS } = CONFIG;
    const innerW = DETAIL_PANEL_W - PADDING * 2 - PADDING; // DETAIL_PANEL_W - outer padding

    const typeDef = pet.pet_type!;
    const base    = computeBaseStats(typeDef, pet.level);
    const bonus   = computeEquipmentBonus(pet.equipment ?? []);
    const rarColorHex = "#" + RARITY_COLORS[typeDef.rarity].toString(16).padStart(6, "0");

    let y = 0;

    // ── Header: icon + name + meta ─────────────────────────────────────────
    const iconSize = 56;
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(typeDef.color, 0.25);
    iconBg.fillCircle(iconSize / 2, iconSize / 2, iconSize / 2);
    iconBg.lineStyle(2.5, RARITY_COLORS[typeDef.rarity], 1);
    iconBg.strokeCircle(iconSize / 2, iconSize / 2, iconSize / 2);
    this.detailContainer.add(iconBg);

    const emoji = this.scene.add.text(iconSize / 2, iconSize / 2, typeDef.icon_emoji, {
      fontSize: "28px",
    }).setOrigin(0.5, 0.5);
    this.detailContainer.add(emoji);

    const headerX = iconSize + 14;

    const petName = this.scene.add.text(headerX, 4, pet.nickname ?? typeDef.name, {
      fontSize: "17px", fontFamily: "Arial", color: rarColorHex, fontStyle: "bold",
    });
    this.detailContainer.add(petName);

    const metaText = this.scene.add.text(headerX, 26,
      `${RARITY_LABELS[typeDef.rarity]} · ${getStageName(typeDef.stage)} · Lv.${pet.level}`, {
      fontSize: "11px", fontFamily: "Arial", color: "#aabbcc",
    });
    this.detailContainer.add(metaText);

    // ── XP bar ───────────────────────────────────────────────────────────────
    y = iconSize + 16;

    const xpLabel = this.scene.add.text(0, y, "XP", {
      fontSize: "10px", fontFamily: "Arial", color: "#606080", fontStyle: "bold",
    });
    this.detailContainer.add(xpLabel);

    const xpBarBg = this.scene.add.graphics();
    xpBarBg.fillStyle(COLORS.BORDER, 1);
    xpBarBg.fillRoundedRect(36, y + 1, 180, 10, 4);
    this.detailContainer.add(xpBarBg);

    const xpBarFill = this.scene.add.graphics();
    this.detailContainer.add(xpBarFill);

    const xpPct = pet.level >= typeDef.max_level
      ? 1
      : xpProgressInLevel(pet.experience, pet.level, typeDef.max_level);
    if (xpPct > 0) {
      xpBarFill.fillStyle(COLORS.ACCENT, 1);
      xpBarFill.fillRoundedRect(36, y + 1, Math.min(180, 180 * xpPct), 10, 4);
    }

    const xpText = this.scene.add.text(220, y + 2, pet.level >= typeDef.max_level ? "MAX" : `${Math.floor(xpPct * 100)}%`, {
      fontSize: "9px", fontFamily: "Arial", color: "#808090",
    });
    this.detailContainer.add(xpText);

    // ── Stats ────────────────────────────────────────────────────────────────
    y += 30;
    const stats = (["hp", "atk", "def", "spd"] as const);
    const statX = [0, 120, 220, 320];

    // Column headers
    for (let i = 0; i < stats.length; i++) {
      const col = this.scene.add.text(statX[i], y, stats[i].toUpperCase(), {
        fontSize: "10px", fontFamily: "Arial", color: STAT_COLORS[stats[i]], fontStyle: "bold",
      });
      this.detailContainer.add(col);
    }
    y += 18;

    // Base values
    for (let i = 0; i < stats.length; i++) {
      const val = base[stats[i]];
      const bns = bonus[stats[i]] ?? 0;
      const col = this.scene.add.text(statX[i], y, `${val}${bns > 0 ? `(+${bns})` : ""}`, {
        fontSize: "12px", fontFamily: "Arial", color: bns > 0 ? "#ffffff" : "#c0c0d0",
      });
      this.detailContainer.add(col);
    }
    y += 28;

    // ── Equipment slots ──────────────────────────────────────────────────────
    const slotLabel = this.scene.add.text(0, y, "EQUIPMENT", {
      fontSize: "10px", fontFamily: "Arial", color: "#606080", fontStyle: "bold",
    });
    this.detailContainer.add(slotLabel);
    y += 18;

    const slots: Array<{ key: string; label: string; icon: string }> = [
      { key: "head",       label: "Head",       icon: "🪖" },
      { key: "body",       label: "Body",       icon: "🎽" },
      { key: "accessory",  label: "Accessory",  icon: "💎" },
    ];

    slots.forEach((slot, idx) => {
      const eq = (pet.equipment ?? []).find(e => e.slot === slot.key && e.is_active);
      this.buildEquipSlot(slot.key, slot.label, slot.icon, eq ?? null, innerW, y, idx, pet);
      y += SLOT_SIZE + 6;
    });

    y += 4;

    // ── Skills ───────────────────────────────────────────────────────────────
    if (pet.skills && pet.skills.length > 0) {
      const skillsLabel = this.scene.add.text(0, y, "SKILLS", {
        fontSize: "10px", fontFamily: "Arial", color: "#606080", fontStyle: "bold",
      });
      this.detailContainer.add(skillsLabel);
      y += 18;

      for (const skill of pet.skills) {
        if (!skill.is_active) continue;
        const skillText = this.scene.add.text(0, y,
          `${skill.name}  Lv.${skill.level}${skill.cooldown_remaining > 0 ? `  CD: ${skill.cooldown_remaining}s` : ""}`, {
          fontSize: "11px", fontFamily: "Arial", color: "#aaddff",
        });
        this.detailContainer.add(skillText);
        y += 18;
      }
      y += 6;
    }

    // ── Evolution hint ───────────────────────────────────────────────────────
    if (typeDef.evolve_to) {
      const canEvolve = pet.level >= pet.evolve_level_req;
      const evoHint = this.scene.add.text(0, y,
        canEvolve
          ? `✨ Ready to evolve! (Reach Lv.${pet.evolve_level_req})`
          : `Evolve at Lv.${pet.evolve_level_req} → ${typeDef.evolve_to}`,
        { fontSize: "11px", fontFamily: "Arial", color: canEvolve ? "#ffcc00" : "#606080" }
      );
      this.detailContainer.add(evoHint);
      y += 20;
    }

    // ── Action buttons ───────────────────────────────────────────────────────
    const btnY = Math.max(y + 10, 340); // ensure buttons are in the lower section

    this.buildButton(0,       btnY, 110, 30, "Equip / Unequip", COLORS.ACCENT, () => this.toggleEquip(pet));
    this.buildButton(120,     btnY, 90,  30, "Evolve",  canEvolve(pet, typeDef) ? 0x9933ff : COLORS.BORDER,
      () => { this.evolutionUI.show(pet, async (action) => { if (action === "confirm") await this.petManager.evolvePet(pet.instance_id); }); }
    );
    this.buildButton(220,     btnY, 90,  30, "Rename",  COLORS.BORDER, () => this.promptRename(pet));
    this.buildButton(320,     btnY, 100, 30, "Release", COLORS.DANGER, () => this.promptRelease(pet));
  }

  private buildEquipSlot(
    key: string,
    label: string,
    icon: string,
    equipped: PetEquipment | null,
    _innerW: number,
    y: number,
    _idx: number,
    pet: PetFullInstance,
  ): void {
    const { COLORS } = CONFIG;
    const slotCenterX = 24; // center of the 48px slot area
    const slotCenterY = y + SLOT_SIZE / 2;

    // Rarity glow behind slot for rare+
    if (equipped?.rarity) {
      const glowAlpha = rarityGlowAlpha(equipped.rarity);
      if (glowAlpha > 0) {
        const glow = this.scene.add.graphics();
        const color = RARITY_COLORS[equipped.rarity];
        glow.fillStyle(color, glowAlpha * 0.3);
        glow.fillCircle(slotCenterX, slotCenterY, SLOT_SIZE * 0.8);
        glow.fillStyle(color, glowAlpha * 0.6);
        glow.fillCircle(slotCenterX, slotCenterY, SLOT_SIZE * 0.55);
        this.detailContainer.add(glow);
      }
    }

    const slotBg = this.scene.add.graphics();
    const isActive = !!equipped;
    slotBg.fillStyle(isActive ? 0x2a2a3e : COLORS.BG, 1);
    slotBg.fillRoundedRect(0, y, SLOT_SIZE + 80, SLOT_SIZE, 6);
    if (isActive) {
      slotBg.lineStyle(1.5, RARITY_COLORS[equipped.rarity ?? "common"], 0.7);
    } else {
      slotBg.lineStyle(1, COLORS.BORDER, 0.5);
    }
    slotBg.strokeRoundedRect(0, y, SLOT_SIZE + 80, SLOT_SIZE, 6);
    this.detailContainer.add(slotBg);

    // Slot icon placeholder
    const slotIcon = this.scene.add.text(8, y + SLOT_SIZE / 2, equipped ? icon : icon, {
      fontSize: "20px",
    }).setOrigin(0.5, 0.5);
    this.detailContainer.add(slotIcon);

    // Slot name
    const slotName = this.scene.add.text(SLOT_SIZE + 14, y + 10, label, {
      fontSize: "11px", fontFamily: "Arial", color: "#c0c0d0", fontStyle: "bold",
    });
    this.detailContainer.add(slotName);

    if (equipped) {
      const eqName = this.scene.add.text(SLOT_SIZE + 14, y + 26, equipped.name, {
        fontSize: "10px", fontFamily: "Arial", color: "#aabbcc",
      });
      this.detailContainer.add(eqName);

      if (equipped.bonus_type) {
        const bonusTxt = this.scene.add.text(SLOT_SIZE + 14, y + 38,
          `+${equipped.bonus_value} ${equipped.bonus_type.toUpperCase()}`, {
          fontSize: "10px", fontFamily: "Arial", color: "#00d26e",
        });
        this.detailContainer.add(bonusTxt);
      }
    } else {
      const emptyTxt = this.scene.add.text(SLOT_SIZE + 14, y + 26, "Empty", {
        fontSize: "10px", fontFamily: "Arial", color: "#404050",
      });
      this.detailContainer.add(emptyTxt);
    }

    // Equip slot container for click
    const hitArea = this.scene.add.rectangle(
      (SLOT_SIZE + 80) / 2, y + SLOT_SIZE / 2,
      SLOT_SIZE + 80, SLOT_SIZE,
    ).setInteractive({ useHandCursor: true });
    hitArea.setAlpha(0.001);
    this.detailContainer.add(hitArea);

    hitArea.on("pointerdown", () => this.onEquipSlotClick(key, pet));
  }

  private buildButton(
    x: number, y: number, w: number, h: number,
    label: string, color: number, onClick: () => void,
  ): void {
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(color, 1);
    btnBg.fillRoundedRect(x, y, w, h, 6);
    this.detailContainer.add(btnBg);

    const btn = this.scene.add.text(x + w / 2, y + h / 2, label, {
      fontSize: "11px",
      fontFamily: "Arial",
      color: color === CONFIG.COLORS.BORDER ? "#808090" : "#000000",
      fontStyle: "bold",
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    this.detailContainer.add(btn);

    btn.on("pointerdown", onClick);
    btn.on("pointerover", () => {
      btnBg.clear();
      btnBg.fillStyle(color === CONFIG.COLORS.BORDER ? 0x444460 : color, 1);
      btnBg.fillRoundedRect(x, y, w, h, 6);
    });
    btn.on("pointerout", () => {
      btnBg.clear();
      btnBg.fillStyle(color, 1);
      btnBg.fillRoundedRect(x, y, w, h, 6);
    });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  private async toggleEquip(pet: PetFullInstance): Promise<void> {
    if (pet.is_equipped) {
      await this.petManager.unequipPet(pet.instance_id);
      pet.is_equipped = false;
    } else {
      const updated = await this.petManager.equipPet(pet.instance_id);
      if (updated) pet.is_equipped = true;
    }
    this.showDetail(pet);
    await this.refreshPetList();
  }

  private promptRename(pet: PetFullInstance): void {
    // Simple inline prompt using a text input simulation with a single input field
    // In Phaser we create a small modal with an input box
    const { COLORS } = CONFIG;
    const modalW = 300;
    const modalH = 130;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    const mc = this.scene.add.container(cx, cy).setDepth(1100);
    mc.setAlpha(0); mc.setScale(0.85);

    const overlay2 = this.scene.add.rectangle(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 0x000000, 0.6)
      .setInteractive().setDepth(1099);
    overlay2.on("pointerdown", () => { mc.destroy(); overlay2.destroy(); });

    const mBg = this.scene.add.graphics();
    mBg.fillStyle(COLORS.PANEL, 0.98);
    mBg.fillRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 8);
    mBg.lineStyle(1.5, COLORS.ACCENT, 0.8);
    mBg.strokeRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 8);
    mc.add(mBg);

    const mTitle = this.scene.add.text(0, -modalH / 2 + 14, "Rename Pet", {
      fontSize: "14px", fontFamily: "Arial", color: "#ffc800", fontStyle: "bold",
    }).setOrigin(0.5, 0);
    mc.add(mTitle);

    // HTML input overlay (Phaser doesn't have native text input — we use DOM)
    const inputEl = document.createElement("input") as HTMLInputElement;
    inputEl.type = "text";
    inputEl.maxLength = 20;
    inputEl.value = pet.nickname ?? "";
    inputEl.placeholder = "Enter nickname…";
    inputEl.style.cssText = `
      position: fixed; top: ${cy - 10}px; left: ${cx - modalW / 2 + 16}px;
      width: ${modalW - 32}px; height: 28px; font-size: 13px;
      background: #0f0f19; border: 1px solid #ffc800; border-radius: 4px;
      color: #ffffff; padding: 0 8px; outline: none; z-index: 2000; font-family: Arial;
    `;
    document.body.appendChild(inputEl);
    inputEl.focus();

    const confirmBtn = this.scene.add.text(modalW / 2 - 80, modalH / 2 - 28, "Save", {
      fontSize: "12px", fontFamily: "Arial", color: "#000000", fontStyle: "bold",
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    mc.add(confirmBtn);

    const cancelBtn2 = this.scene.add.text(-modalW / 2 + 80, modalH / 2 - 28, "Cancel", {
      fontSize: "12px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    mc.add(cancelBtn2);

    const confirmBg = this.scene.add.graphics();
    confirmBg.fillStyle(COLORS.ACCENT, 1);
    confirmBg.fillRoundedRect(modalW / 2 - 110, modalH / 2 - 44, 60, 26, 5);
    mc.add(confirmBg);

    const cancelBg2 = this.scene.add.graphics();
    cancelBg2.fillStyle(COLORS.BORDER, 1);
    cancelBg2.fillRoundedRect(-modalW / 2 + 50, modalH / 2 - 44, 60, 26, 5);
    mc.add(cancelBg2);

    confirmBtn.on("pointerdown", async () => {
      const nickname = inputEl.value.trim() || "";
      document.body.removeChild(inputEl);
      mc.destroy(); overlay2.destroy();
      try {
        const updated = await this.petClient.renamePet(pet.instance_id, nickname);
        this.showDetail(updated);
        await this.refreshPetList();
      } catch (err) {
        console.warn("[PetInventoryUI] rename failed:", err);
      }
    });

    cancelBtn2.on("pointerdown", () => {
      document.body.removeChild(inputEl);
      mc.destroy(); overlay2.destroy();
    });

    this.scene.tweens.add({ targets: mc, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
  }

  private promptRelease(pet: PetFullInstance): void {
    const { COLORS } = CONFIG;
    const modalW = 300;
    const modalH = 120;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = CONFIG.CANVAS_HEIGHT / 2;

    const mc = this.scene.add.container(cx, cy).setDepth(1100);
    mc.setAlpha(0); mc.setScale(0.85);

    const overlay2 = this.scene.add.rectangle(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 0x000000, 0.6)
      .setInteractive().setDepth(1099);
    overlay2.on("pointerdown", () => { mc.destroy(); overlay2.destroy(); });

    const mBg = this.scene.add.graphics();
    mBg.fillStyle(COLORS.PANEL, 0.98);
    mBg.fillRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 8);
    mBg.lineStyle(1.5, COLORS.DANGER, 0.8);
    mBg.strokeRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 8);
    mc.add(mBg);

    const mTitle = this.scene.add.text(0, -modalH / 2 + 14, "Release Pet?", {
      fontSize: "14px", fontFamily: "Arial", color: "#dc3737", fontStyle: "bold",
    }).setOrigin(0.5, 0);
    mc.add(mTitle);

    const mBody = this.scene.add.text(0, -modalH / 2 + 38,
      `This will permanently release ${pet.nickname ?? pet.pet_type?.name}.`, {
      fontSize: "11px", fontFamily: "Arial", color: "#aabbcc",
    }).setOrigin(0.5, 0);
    mc.add(mBody);

    const yesBg = this.scene.add.graphics();
    yesBg.fillStyle(COLORS.DANGER, 1);
    yesBg.fillRoundedRect(modalW / 2 - 110, modalH / 2 - 38, 60, 26, 5);
    mc.add(yesBg);

    const noBg = this.scene.add.graphics();
    noBg.fillStyle(COLORS.BORDER, 1);
    noBg.fillRoundedRect(-modalW / 2 + 50, modalH / 2 - 38, 60, 26, 5);
    mc.add(noBg);

    const yesBtn = this.scene.add.text(modalW / 2 - 80, modalH / 2 - 25, "Release", {
      fontSize: "12px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    mc.add(yesBtn);

    const noBtn = this.scene.add.text(-modalW / 2 + 80, modalH / 2 - 25, "Cancel", {
      fontSize: "12px", fontFamily: "Arial", color: "#a0a0be",
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    mc.add(noBtn);

    yesBtn.on("pointerdown", async () => {
      mc.destroy(); overlay2.destroy();
      try {
        await this.petClient.releasePet(pet.instance_id);
        this.selectedId = null;
        this.detailPet = null;
        this.detailContainer.removeAll(true);
        this.buildEmptyDetail(DETAIL_PANEL_W - PADDING * 2 - PADDING);
        await this.refreshPetList();
      } catch (err) {
        console.warn("[PetInventoryUI] release failed:", err);
      }
    });

    noBtn.on("pointerdown", () => { mc.destroy(); overlay2.destroy(); });

    this.scene.tweens.add({ targets: mc, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
  }

  private onEquipSlotClick(slot: string, pet: PetFullInstance): void {
    // In a full implementation this would open an equipment selection modal.
    // For now show a brief hint.
    const hint = this.scene.add.text(
      CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 60,
      `Equipment browser for ${slot} slot — coming soon!`, {
        fontSize: "12px", fontFamily: "Arial", color: "#aabbcc",
      }
    ).setOrigin(0.5, 0.5).setDepth(1100).setAlpha(0);
    this.scene.tweens.add({
      targets: hint, alpha: 1, duration: 200,
      delay: 1500,
      onComplete: () => hint.destroy(),
    });
    this.scene.tweens.add({ targets: hint, alpha: 0, duration: 300, delay: 1600 });
    void slot; // slot used in future full implementation
    void pet;
  }
}

// ── PetListItem ───────────────────────────────────────────────────────────────

class PetListItem {
  public instance: PetFullInstance;
  private container: Phaser.GameObjects.Container;
  private onClick: (id: string) => void;
  private selected = false;

  constructor(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    pet: PetFullInstance,
    isEquipped: boolean,
    onClick: (id: string) => void,
  ) {
    this.instance = pet;
    this.container = scene.add.container(0, 0);
    this.onClick = onClick;
    parent.add(this.container);

    const { COLORS } = CONFIG;
    const typeDef = pet.pet_type!;
    const rarColor = RARITY_COLORS[typeDef.rarity];

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.BG, 0.6);
    bg.fillRoundedRect(0, 0, LIST_PANEL_W - 20, ROW_H, 6);
    bg.setName("item_bg");
    this.container.add(bg);

    // Rarity left border
    const border = scene.add.graphics();
    border.fillStyle(rarColor, 0.7);
    border.fillRect(0, 0, 4, ROW_H);
    border.setName("rarity_border");
    this.container.add(border);

    // Pet icon
    const iconBg = scene.add.graphics();
    iconBg.fillStyle(typeDef.color, 0.2);
    iconBg.fillCircle(24, ROW_H / 2, 20);
    iconBg.lineStyle(1.5, rarColor, 0.8);
    iconBg.strokeCircle(24, ROW_H / 2, 20);
    this.container.add(iconBg);

    const emoji = scene.add.text(24, ROW_H / 2, typeDef.icon_emoji, {
      fontSize: "20px",
    }).setOrigin(0.5, 0.5);
    this.container.add(emoji);

    // Pet name
    const nameText = scene.add.text(56, 10, pet.nickname ?? typeDef.name, {
      fontSize: "12px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
    });
    this.container.add(nameText);

    // Level + rarity
    const metaText = scene.add.text(56, 28, `Lv.${pet.level}  ${RARITY_LABELS[typeDef.rarity]}`, {
      fontSize: "10px", fontFamily: "Arial", color: "#aabbcc",
    });
    this.container.add(metaText);

    // Equipped badge
    if (isEquipped) {
      const badge = scene.add.graphics();
      badge.fillStyle(COLORS.SUCCESS, 1);
      badge.fillRoundedRect(LIST_PANEL_W - 68, ROW_H / 2 - 9, 48, 18, 4);
      this.container.add(badge);

      const badgeTxt = scene.add.text(LIST_PANEL_W - 44, ROW_H / 2, "Active", {
        fontSize: "9px", fontFamily: "Arial", color: "#000000", fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      this.container.add(badgeTxt);
    }

    // Click area
    const hitArea = scene.add.rectangle(
      (LIST_PANEL_W - 20) / 2, ROW_H / 2,
      LIST_PANEL_W - 20, ROW_H,
    ).setInteractive({ useHandCursor: true });
    this.container.add(hitArea);
    hitArea.on("pointerdown", () => this.onClick(pet.instance_id));
    hitArea.on("pointerover", () => {
      if (!this.selected) {
        bg.clear();
        bg.fillStyle(0x2a2a40, 0.8);
        bg.fillRoundedRect(0, 0, LIST_PANEL_W - 20, ROW_H, 6);
      }
    });
    hitArea.on("pointerout", () => {
      if (!this.selected) {
        bg.clear();
        bg.fillStyle(COLORS.BG, 0.6);
        bg.fillRoundedRect(0, 0, LIST_PANEL_W - 20, ROW_H, 6);
      }
    });
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setSelected(active: boolean): void {
    this.selected = active;
    const scene = this.container.scene;
    const bg = this.container.list.find(o => (o as Phaser.GameObjects.Graphics).name === "item_bg") as Phaser.GameObjects.Graphics | undefined;
    if (!bg) return;
    bg.clear();
    if (active) {
      bg.fillStyle(0x3a3a55, 1);
      bg.fillRoundedRect(0, 0, LIST_PANEL_W - 20, ROW_H, 6);
      bg.lineStyle(2, CONFIG.COLORS.ACCENT, 0.8);
      bg.strokeRoundedRect(0, 0, LIST_PANEL_W - 20, ROW_H, 6);
    } else {
      bg.fillStyle(CONFIG.COLORS.BG, 0.6);
      bg.fillRoundedRect(0, 0, LIST_PANEL_W - 20, ROW_H, 6);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function canEvolve(pet: PetFullInstance, typeDef: { evolve_to: string | null }): boolean {
  return !!(typeDef.evolve_to && pet.level >= pet.evolve_level_req);
}
