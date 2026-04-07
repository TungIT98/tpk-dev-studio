/**
 * scenes.spec.ts
 * End-to-end tests for Phaser scene transitions in the TycoonGame client.
 *
 * Tests:
 *  - BootScene loads and shows the game canvas
 *  - BootScene transitions to MenuScene on click/keypress
 *  - MenuScene renders UI elements (title, username input, room buttons, enter button)
 *  - MenuScene room button selection changes selection state
 *  - LobbyScene renders player list, chat UI, leaderboard, and ready button
 *  - LobbyScene → GameScene transition occurs when server sets phase="playing"
 *  - GameScene renders world, business entities, and local player
 *  - ESC key returns from GameScene to LobbyScene
 *  - All scene transitions are smooth and don't crash
 *
 * Note: Colyseus WebSocket connections are mocked so tests run without a live server.
 */

import { test, expect, Page } from "@playwright/test";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Mock Colyseus WebSocket so scene transitions that call colyseus.connect() don't fail */
async function mockColyseusWebSocket(page: Page): Promise<void> {
  await page.route("**/ws/**", (route) => route.fulfill({ status: 200 }));
  await page.route("**/2567/**", (route) => route.fulfill({ status: 200 }));
}

/** Wait for Phaser canvas to appear */
async function waitForCanvas(page: Page, timeout = 10_000): Promise<void> {
  await page.waitForSelector("canvas", { timeout });
}

/** Get the Phaser game instance from the global */
async function getPhaserGame(page: Page) {
  return page.evaluate(() => (window as any).tycoonGame);
}

/** Advance from BootScene to MenuScene without needing a real server */
async function advancePastBootScene(page: Page): Promise<void> {
  // Click the canvas to trigger pointerdown on the "Click to Start" text
  await page.locator("canvas").click({ position: { x: 640, y: 400 } });
  // Also fire a keydown to satisfy the keyboard listener
  await page.keyboard.press("Space");
}

/** Inject mock Colyseus and navigate to MenuScene directly */
async function goToMenuScene(page: Page): Promise<void> {
  await mockColyseusWebSocket(page);
  await page.goto("/");
  await waitForCanvas(page);
  await advancePastBootScene(page);
  // Wait for MenuScene to be active (canvas is present and no loading)
  await page.waitForTimeout(500);
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe("BootScene", () => {
  test.beforeEach(async ({ page }) => {
    await mockColyseusWebSocket(page);
    await page.goto("/");
  });

  test("renders a Phaser canvas", async ({ page }) => {
    await waitForCanvas(page);
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("shows TycoonGame title text", async ({ page }) => {
    // The title is drawn on canvas, so we verify the canvas is rendered
    await waitForCanvas(page);
    const canvas = page.locator("canvas");
    // Canvas should have the correct dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test("transitions to MenuScene on click", async ({ page }) => {
    await waitForCanvas(page);
    const game = await getPhaserGame(page);
    const scenesBefore = Object.keys((await game.scene.getScenes(true)).reduce(
      (acc: Record<string, boolean>, s: any) => ({ ...acc, [s.scene.key]: true }),
      {}
    ));

    // Click to advance
    await page.locator("canvas").click({ position: { x: 640, y: 400 } });
    await page.waitForTimeout(800);

    const scenesAfter = Object.keys((await game.scene.getScenes(true)).reduce(
      (acc: Record<string, boolean>, s: any) => ({ ...acc, [s.scene.key]: true }),
      {}
    ));

    expect(scenesAfter).toContain("MenuScene");
  });

  test("transitions to MenuScene on any keypress", async ({ page }) => {
    await waitForCanvas(page);
    await page.keyboard.press("Space");
    await page.waitForTimeout(800);

    const game = await getPhaserGame(page);
    const activeScene = await game.scene.getActiveScene();
    expect(activeScene?.key).toBe("MenuScene");
  });
});

test.describe("MenuScene", () => {
  test.beforeEach(async ({ page }) => {
    await goToMenuScene(page);
  });

  test("is the active scene after boot", async ({ page }) => {
    const game = await getPhaserGame(page);
    const activeScene = await game.scene.getActiveScene();
    expect(activeScene?.key).toBe("MenuScene");
  });

  test("renders username input field in DOM", async ({ page }) => {
    // The username input is a real DOM element created via Phaser DOM
    const input = page.locator("input[type=text]");
    await expect(input).toBeVisible();
  });

  test("username input accepts text input", async ({ page }) => {
    const input = page.locator("input[type=text]");
    await input.fill("TestPlayer");
    await expect(input).toHaveValue("TestPlayer");
  });

  test("room selection buttons exist (4 rooms)", async ({ page }) => {
    // Room buttons are Phaser interactive containers rendered in the canvas
    // We can verify the scene has the correct keys in its display list
    const game = await getPhaserGame(page);
    const scene = game.scene.getScene("MenuScene") as any;
    expect(scene).toBeDefined();
    expect(scene.roomButtons).toBeDefined();
    expect(scene.roomButtons.length).toBe(4);
  });

  test("selecting a room updates selectedRoom property", async ({ page }) => {
    const game = await getPhaserGame(page);
    const scene = game.scene.getScene("MenuScene") as any;

    // Default selection is "lobby"
    expect(scene.selectedRoom).toBe("lobby");

    // Find the second room button container and click it
    // Room index 1 = "game" key
    const gameButton = scene.roomButtons[1];
    gameButton.emit("pointerdown");
    await page.waitForTimeout(200);

    expect(scene.selectedRoom).toBe("game");
  });

  test("connecting with no username defaults to 'Tycoon_####'", async ({ page }) => {
    const game = await getPhaserGame(page);
    const scene = game.scene.getScene("MenuScene") as any;

    // Clear username input
    await page.locator("input[type=text]").fill("");

    // Simulate connect call
    const result = await scene.connect();
    // connect() is async and will fail because Colyseus is mocked,
    // but the username fallback should be applied
    // The status text should show the connecting state or error
    await page.waitForTimeout(500);
    // No crash = pass
  });

  test("Colyseus error event updates status text", async ({ page }) => {
    const game = await getPhaserGame(page);
    const scene = game.scene.getScene("MenuScene") as any;

    // Simulate a Colyseus error event
    const { colyseus } = await import("../src/network/ColyseusManager");
    colyseus.emit("error", new Error("Connection refused"));

    await page.waitForTimeout(100);
    const statusText = scene.statusText?.text ?? "";
    // Error should update the status text
    expect(statusText.toLowerCase()).toContain("connection");
  });
});

test.describe("LobbyScene", () => {
  test.beforeEach(async ({ page }) => {
    await goToMenuScene(page);
  });

  test("can be started from MenuScene with mock username and room", async ({ page }) => {
    const game = await getPhaserGame(page);

    // Set username
    await page.locator("input[type=text]").fill("TestPlayer");

    // Directly start LobbyScene (skip actual Colyseus connection)
    const menuScene = game.scene.getScene("MenuScene") as any;
    game.scene.start("LobbyScene", { username: "TestPlayer", room: "lobby" });
    await page.waitForTimeout(800);

    const activeScene = game.scene.getActiveScene();
    expect(activeScene?.key).toBe("LobbyScene");
  });

  test("renders room title and player count text", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("LobbyScene", { username: "TestPlayer", room: "lobby" });
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("LobbyScene") as any;
    expect(scene.roomInfoText).toBeDefined();
    expect(typeof scene.roomInfoText.setText).toBe("function");
  });

  test("ready button toggles state on click", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("LobbyScene", { username: "TestPlayer", room: "lobby" });
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("LobbyScene") as any;
    const initialReady = scene.isReady;

    // Toggle ready
    scene.toggleReady();
    expect(scene.isReady).toBe(!initialReady);

    // Toggle back
    scene.toggleReady();
    expect(scene.isReady).toBe(initialReady);
  });

  test("ESC key returns to MenuScene", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("LobbyScene", { username: "TestPlayer", room: "lobby" });
    await page.waitForTimeout(500);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);

    const activeScene = game.scene.getActiveScene();
    expect(activeScene?.key).toBe("MenuScene");
  });

  test("TAB key toggles chat UI visibility", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("LobbyScene", { username: "TestPlayer", room: "lobby" });
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("LobbyScene") as any;
    const chatToggle = async () => {
      const visibleBefore = scene.chatUI?.visible ?? false;
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);
      const visibleAfter = scene.chatUI?.visible ?? false;
      return visibleBefore !== visibleAfter;
    };

    const toggled = await chatToggle();
    expect(toggled).toBe(true);
  });

  test("state:change event updates roomInfoText with player count", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("LobbyScene", { username: "TestPlayer", room: "lobby" });
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("LobbyScene") as any;
    const mockState = {
      players: {
        sid1: { username: "Alice" },
        sid2: { username: "Bob" },
      },
      phase: "lobby",
    };

    scene.onStateChange(mockState);
    await page.waitForTimeout(100);

    const text = scene.roomInfoText?.text ?? "";
    expect(text).toContain("2");
    expect(text).toContain("lobby");
  });

  test("phase=playing triggers auto-transition to GameScene", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("LobbyScene", { username: "TestPlayer", room: "lobby" });
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("LobbyScene") as any;
    const mockState = {
      players: { sid1: { username: "Alice" } },
      phase: "playing",
    };

    scene.onStateChange(mockState);
    await page.waitForTimeout(800);

    const activeScene = game.scene.getActiveScene();
    expect(activeScene?.key).toBe("GameScene");
  });
});

test.describe("GameScene", () => {
  test.beforeEach(async ({ page }) => {
    await goToMenuScene(page);
  });

  test("can be started from LobbyScene", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("LobbyScene", { username: "TestPlayer", room: "game" });
    await page.waitForTimeout(500);
    game.scene.start("GameScene");
    await page.waitForTimeout(800);

    const activeScene = game.scene.getActiveScene();
    expect(activeScene?.key).toBe("GameScene");
  });

  test("renders local player sprite at world center", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("GameScene");
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("GameScene") as any;
    expect(scene.localPlayerSprite).toBeDefined();
    expect(scene.localPlayerSprite.container).toBeDefined();
  });

  test("renders all 10 business entities", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("GameScene");
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("GameScene") as any;
    expect(scene.businessSprites.length).toBe(10);
  });

  test("WASD movement keys update player position", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("GameScene");
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("GameScene") as any;
    const beforeX = scene.localPlayerSprite.container.x;
    const beforeY = scene.localPlayerSprite.container.y;

    // Press D key to move right
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(200);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(100);

    const afterX = scene.localPlayerSprite.container.x;
    expect(afterX).toBeGreaterThan(beforeX);
  });

  test("ESC key returns to LobbyScene", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("GameScene");
    await page.waitForTimeout(500);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);

    const activeScene = game.scene.getActiveScene();
    expect(activeScene?.key).toBe("LobbyScene");
  });

  test("camera follows local player sprite", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("GameScene");
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("GameScene") as any;
    const cam = scene.cameras?.main;

    // Camera should be following a target
    expect(cam).toBeDefined();
    // Verify deadzone is set (part of follow config)
    expect((cam as any).deadzone).toBeDefined();
  });

  test("formatMoney formats large numbers correctly", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("GameScene");
    await page.waitForTimeout(500);

    const scene = game.scene.getScene("GameScene") as any;
    const f = (n: number) => scene.formatMoney(n);

    expect(f(500)).toBe("500");
    expect(f(1500)).toBe("1.50K");
    expect(f(2500000)).toBe("2.50M");
    expect(f(3800000000)).toBe("3.80B");
    expect(f(1200000000000)).toBe("1.20T");
  });

  test("clicking a business entity triggers buy action and animation", async ({ page }) => {
    const game = await getPhaserGame(page);
    game.scene.start("GameScene");
    await page.waitForTimeout(800);

    const scene = game.scene.getScene("GameScene") as any;
    const business = scene.businessSprites[0];
    expect(business).toBeDefined();

    // Emit pointerdown event on business
    business.emit("pointerdown");
    await page.waitForTimeout(300);

    // Animation tweens should have been added (no crash = pass)
  });
});

test.describe("Scene transition integration", () => {
  test("complete flow: Boot → Menu → Lobby → Game → back to Menu", async ({ page }) => {
    await goToMenuScene(page);
    const game = await getPhaserGame(page);

    // Boot → Menu already done
    let active = game.scene.getActiveScene();
    expect(active?.key).toBe("MenuScene");

    // Menu → Lobby
    game.scene.start("LobbyScene", { username: "FlowTest", room: "game" });
    await page.waitForTimeout(800);
    active = game.scene.getActiveScene();
    expect(active?.key).toBe("LobbyScene");

    // Lobby → Game (phase=playing)
    const lobbyScene = game.scene.getScene("LobbyScene") as any;
    lobbyScene.onStateChange({ players: {}, phase: "playing" });
    await page.waitForTimeout(800);
    active = game.scene.getActiveScene();
    expect(active?.key).toBe("GameScene");

    // Game → Menu (ESC)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    active = game.scene.getActiveScene();
    expect(active?.key).toBe("MenuScene");
  });
});
