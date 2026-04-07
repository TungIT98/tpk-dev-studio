/**
 * ChatUI.ts
 * In-game chat overlay built with Phaser DOM elements.
 * Supports global, room, and trade channels.
 */

import Phaser from "phaser";
import { CONFIG } from "../config";
import { colyseus } from "../network/ColyseusManager";
import { sendChat } from "../network/messages";
import type { ChatMessage } from "../shared/types";

const MAX_MESSAGES = 50;
const MESSAGE_LIFETIME_MS = 120_000; // fade out after 2 min

export class ChatUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private messages: { text: Phaser.GameObjects.Text; timestamp: number; msg: ChatMessage }[] = [];
  private chatInput!: HTMLInputElement;
  private chatElement!: Phaser.GameObjects.DOMElement;
  private sendBtn!: HTMLButtonElement;
  private isVisible = false;
  private currentChannel: ChatMessage["channel"] = "room";
  private label!: Phaser.GameObjects.Text;
  private channelBtn!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
    this.subscribe();
  }

  private build(): void {
    const { COLORS } = CONFIG;
    const W = 320;
    const H = 260;
    const X = 20;
    const Y = CONFIG.CANVAS_HEIGHT - H - 20;

    // Background panel
    const panel = this.scene.add.graphics();
    panel.fillStyle(COLORS.PANEL, 0.92);
    panel.fillRoundedRect(0, 0, W, H, 8);
    panel.lineStyle(1, COLORS.BORDER, 1);
    panel.strokeRoundedRect(0, 0, W, H, 8);

    // Header
    const header = this.scene.add.graphics();
    header.fillStyle(COLORS.ACCENT, 0.15);
    header.fillRoundedRect(0, 0, W, 32, { tl: 8, tr: 8, bl: 0, br: 0 });

    this.label = this.scene.add.text(10, 8, "Room Chat", {
      fontSize: "13px",
      fontFamily: "Arial",
      color: "#ffc800",
      fontStyle: "bold",
    });

    this.channelBtn = this.scene.add.text(W - 80, 8, "Room ▼", {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#a0a0be",
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    this.channelBtn.on("pointerdown", () => this.cycleChannel());

    // Message area (DOM overlay)
    this.chatElement = this.scene.add.dom(W / 2, Y + 100).createFromHTML(`
      <div id="chat-box" style="
        width:${W - 16}px;
        height:${H - 80}px;
        overflow-y:scroll;
        background:rgba(0,0,0,0.3);
        border:1px solid #373755;
        border-radius:4px;
        padding:6px 8px;
        font-family:Arial;
        font-size:12px;
        color:#fff;
        box-sizing:border-box;
        pointer-events:none;
      "></div>
    `);

    // Input + send button
    this.chatInput = document.createElement("input") as HTMLInputElement;
    this.chatInput.type = "text";
    this.chatInput.placeholder = "Type a message...";
    this.chatInput.maxLength = 200;
    Object.assign(this.chatInput.style, {
      width: (W - 60) + "px",
      height: "28px",
      background: "rgba(0,0,0,0.4)",
      border: "1px solid #373755",
      borderRadius: "4px",
      color: "#fff",
      fontFamily: "Arial",
      fontSize: "12px",
      padding: "0 8px",
      outline: "none",
      boxSizing: "border-box",
    });

    this.chatInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.submitMessage();
      }
    });

    this.sendBtn = document.createElement("button") as HTMLButtonElement;
    this.sendBtn.textContent = "Send";
    Object.assign(this.sendBtn.style, {
      width: "48px",
      height: "28px",
      background: "#ffc800",
      border: "none",
      borderRadius: "4px",
      color: "#0a0a12",
      fontFamily: "Arial",
      fontSize: "11px",
      fontWeight: "bold",
      cursor: "pointer",
    });
    this.sendBtn.addEventListener("click", () => this.submitMessage());

    const inputContainer = this.scene.add.dom(W / 2 - 8, Y + H - 14).createFromHTML("");
    inputContainer.node.appendChild(this.chatInput);
    inputContainer.node.appendChild(this.sendBtn);

    this.container = this.scene.add.container(X, Y, [panel, header, this.label, this.channelBtn, this.chatElement, inputContainer]);
    this.container.setDepth(900);
    this.container.setVisible(false);
    this.isVisible = false;

    // Toggle with Enter key when not typing in another input
    this.scene.input.keyboard?.on("keydown-CHAT", () => this.toggle());
    this.scene.input.keyboard?.on("keydown-ENTER", () => {
      if (!this.isVisible && document.activeElement?.tagName !== "INPUT") {
        this.show();
      }
    });
  }

  toggle(): void {
    this.isVisible ? this.hide() : this.show();
  }

  show(): void {
    this.container.setVisible(true);
    this.isVisible = true;
    this.chatInput.focus();
  }

  hide(): void {
    this.container.setVisible(false);
    this.isVisible = false;
    this.chatInput.blur();
  }

  private cycleChannel(): void {
    const channels: ChatMessage["channel"][] = ["room", "global", "trade"];
    const idx = channels.indexOf(this.currentChannel);
    this.currentChannel = channels[(idx + 1) % channels.length];
    this.label.setText(`${this.currentChannel.charAt(0).toUpperCase() + this.currentChannel.slice(1)} Chat`);
  }

  private submitMessage(): void {
    const text = this.chatInput.value.trim();
    if (!text) return;
    sendChat(text, this.currentChannel);
    this.chatInput.value = "";
  }

  private addMessage(msg: ChatMessage): void {
    const box = document.getElementById("chat-box");
    if (!box) return;

    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const color = msg.senderId === colyseus.sessionId ? "#ffc800" : "#a0a0be";
    const div = document.createElement("div");
    div.style.marginBottom = "4px";
    div.style.lineHeight = "1.4";
    div.innerHTML = `<span style="color:#606080;font-size:10px">[${time}]</span> <span style="color:${color}">${this.escapeHtml(msg.senderName)}:</span> ${this.escapeHtml(msg.text)}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;

    // Cull old messages from DOM if over limit
    while (box.children.length > MAX_MESSAGES) {
      box.removeChild(box.firstChild!);
    }
  }

  private escapeHtml(text: string): string {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  private subscribe(): void {
    colyseus.on("chat:message", (msg: ChatMessage) => this.addMessage(msg));
  }

  destroy(): void {
    this.container.destroy();
  }
}
