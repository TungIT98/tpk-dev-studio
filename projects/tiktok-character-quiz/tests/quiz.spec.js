// TikTok Character Quiz - Playwright Test Suite
// Tests the HTML5 prototype (index.html)

const { test, expect } = require('@playwright/test');
const path = require('path');

const HTML_FILE = path.join(__dirname, '..', 'index.html');

test.describe('Which TikTok Character Are You? - Quiz Prototype', () => {
  let browser;

  test.beforeAll(async () => {
    browser = await test.info().project._browserType.launch();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${HTML_FILE}`);
  });

  // ===== START SCREEN =====
  test('START SCREEN: displays title and start button', async ({ page }) => {
    await expect(page.locator('.quiz-title')).toBeVisible();
    await expect(page.locator('.quiz-subtitle')).toContainText('5 questions');
    await expect(page.locator('#start-btn')).toBeVisible();
    await expect(page.locator('#start-btn')).toHaveText('Start Quiz ✨');
  });

  test('START SCREEN: particle system is running', async ({ page }) => {
    const canvas = page.locator('#particle-canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  // ===== QUIZ FLOW =====
  test('QUESTION FLOW: clicking start shows first question', async ({ page }) => {
    await page.click('#start-btn');
    await expect(page.locator('#question-screen')).toHaveClass(/active/);
    await expect(page.locator('#question-text')).toContainText('Pick your vibe');
    await expect(page.locator('#progress-text')).toContainText('Question 1 of 5');
    const answerButtons = page.locator('.answer-btn');
    await expect(answerButtons).toHaveCount(4);
  });

  test('QUESTION FLOW: can answer all 5 questions', async ({ page }) => {
    await page.click('#start-btn');

    for (let i = 0; i < 5; i++) {
      await expect(page.locator('#question-text')).toBeVisible();
      await page.locator('.answer-btn').first().click();
      await page.waitForTimeout(400);
    }

    await expect(page.locator('#loading-screen')).toHaveClass(/active/);
    await expect(page.locator('.loading-text')).toContainText('Calculating');
  });

  // ===== RESULT CALCULATION =====
  test('RESULT: minimum score (all A) shows Algorithm Gambler', async ({ page }) => {
    await page.click('#start-btn');

    for (let i = 0; i < 5; i++) {
      await page.locator('.answer-btn').first().click();
      await page.waitForTimeout(400);
    }

    await expect(page.locator('#loading-screen')).toHaveClass(/active/, { timeout: 2000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('#result-screen')).toHaveClass(/active/);
    await expect(page.locator('#result-name')).toContainText('Algorithm Gambler');
  });

  test('RESULT: maximum score (all D) shows Drama Magnet', async ({ page }) => {
    await page.click('#start-btn');

    for (let i = 0; i < 5; i++) {
      await page.locator('.answer-btn').last().click();
      await page.waitForTimeout(400);
    }

    await expect(page.locator('#loading-screen')).toHaveClass(/active/, { timeout: 2000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('#result-screen')).toHaveClass(/active/);
    await expect(page.locator('#result-name')).toContainText('Drama Magnet');
  });

  test('RESULT: middle score shows Aesthetic Architect', async ({ page }) => {
    await page.click('#start-btn');

    // B=2 for all 5 questions = score 10
    for (let i = 0; i < 5; i++) {
      await page.locator('.answer-btn').nth(1).click();
      await page.waitForTimeout(400);
    }

    await expect(page.locator('#loading-screen')).toHaveClass(/active/, { timeout: 2000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('#result-screen')).toHaveClass(/active/);
    await expect(page.locator('#result-name')).toContainText('Aesthetic Architect');
  });

  // ===== UI INTERACTIONS =====
  test('RETAKE: clicking retake starts new quiz', async ({ page }) => {
    await page.click('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.locator('.answer-btn').first().click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('#loading-screen')).toHaveClass(/active/, { timeout: 2000 });
    await page.waitForTimeout(2000);

    await page.click('#retake-btn');
    await expect(page.locator('#question-screen')).toHaveClass(/active/);
    await expect(page.locator('#question-text')).toContainText('Pick your vibe');
  });

  test('SHARE: share button shows copied feedback', async ({ page }) => {
    await page.click('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.locator('.answer-btn').first().click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('#loading-screen')).toHaveClass(/active/, { timeout: 2000 });
    await page.waitForTimeout(2000);

    await page.click('#share-btn');
    const btnText = await page.locator('#share-btn').textContent();
    expect(btnText).not.toBe('📤 Share');
  });

  test('NO DOUBLE-TAP: same answer cannot be selected twice', async ({ page }) => {
    await page.click('#start-btn');

    const firstBtn = page.locator('.answer-btn').first();
    await firstBtn.click();
    await firstBtn.click();
    await firstBtn.click();

    await page.waitForTimeout(400);
    const progressText = await page.locator('#progress-text').textContent();
    expect(progressText).toContain('Question 2 of 5');
  });

  // ===== VISUAL =====
  test('VISUAL: result background type is correct', async ({ page }) => {
    await page.click('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.locator('.answer-btn').first().click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('#loading-screen')).toHaveClass(/active/, { timeout: 2000 });
    await page.waitForTimeout(2000);

    const resultBg = page.locator('#result-bg');
    await expect(resultBg).toHaveClass(/type-1/);
  });

  test('VISUAL: particle burst on result reveal', async ({ page }) => {
    await page.click('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.locator('.answer-btn').first().click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('#loading-screen')).toHaveClass(/active/, { timeout: 2000 });
    await page.waitForTimeout(2000);

    const hasParticles = await page.evaluate(() => {
      return window.QuizApp?.particles?.particles?.length > 0;
    });
    expect(hasParticles).toBeTruthy();
  });

  // ===== RESET =====
  test('RESET: quiz state is reset on retake', async ({ page }) => {
    await page.click('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.locator('.answer-btn').first().click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('#loading-screen')).toHaveClass(/active/, { timeout: 2000 });
    await page.waitForTimeout(2000);

    await page.click('#retake-btn');

    const progressText = await page.locator('#progress-text').textContent();
    expect(progressText).toContain('Question 1 of 5');

    const score = await page.evaluate(() => window.QuizApp?.totalScore ?? -1);
    expect(score).toBe(0);
  });
});