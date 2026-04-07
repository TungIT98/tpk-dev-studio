// QA Test Script for TikTok Character Quiz
// Runs E2E tests against index.html using Playwright

const { chromium } = require('playwright');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'index.html');

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 900 } });
  const page = await context.newPage();

  const results = [];
  let passCount = 0;
  let failCount = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`  PASS: ${name}`);
        results.push({ name, status: 'PASS' });
        passCount++;
      } catch (err) {
        console.log(`  FAIL: ${name} — ${err.message}`);
        results.push({ name, status: 'FAIL', error: err.message });
        failCount++;
      }
    })();
  }

  async function clickSelector(sel) {
    await page.click(sel);
    await page.waitForTimeout(400); // Allow transitions
  }

  // ===== TEST SUITE =====
  console.log('\n=== TikTok Character Quiz — QA Test Suite ===\n');

  // TEST 1: Start screen loads correctly
  await test('Start screen: Title and subtitle visible', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(500);
    const title = await page.locator('.quiz-title').textContent();
    if (!title.includes('TikTok')) throw new Error('Title not found');
    const subtitle = await page.locator('.quiz-subtitle').textContent();
    if (!subtitle.includes('5 questions')) throw new Error('Subtitle incorrect');
    const startBtn = await page.locator('#start-btn').textContent();
    if (!startBtn.includes('Start Quiz')) throw new Error('Start button not found');
  });

  // TEST 2: Start button navigates to Q1
  await test('Start button: Transitions to question screen', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    const qScreen = await page.locator('#question-screen');
    const hasActive = await qScreen.evaluate(el => el.classList.contains('active'));
    if (!hasActive) throw new Error('Question screen not active after start');
  });

  // TEST 3: Q1 displays correctly
  await test('Q1: Displays first question text', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    const qText = await page.locator('#question-text').textContent();
    if (!qText.includes('Pick your vibe')) throw new Error(`Wrong question: ${qText}`);
  });

  // TEST 4: Q1 progress bar shows 1/5
  await test('Q1: Progress shows "Question 1 of 5"', async () => {
    const pText = await page.locator('#progress-text').textContent();
    if (!pText.includes('1 of 5')) throw new Error(`Wrong progress: ${pText}`);
  });

  // TEST 5: Q1 has 4 answer buttons
  await test('Q1: 4 answer buttons rendered', async () => {
    const count = await page.locator('.answer-btn').count();
    if (count !== 4) throw new Error(`Expected 4 answers, got ${count}`);
  });

  // TEST 6: Tapping answer advances to Q2
  await test('Answer tap: Advances to Q2', async () => {
    await clickSelector('.answer-btn:first-child');
    await page.waitForTimeout(400);
    const qText = await page.locator('#question-text').textContent();
    if (!qText.includes('ideal upload time')) throw new Error(`Should be Q2, got: ${qText}`);
  });

  // TEST 7: Progress updates after Q1
  await test('Progress: Updates to "2 of 5" after Q1 answer', async () => {
    const pText = await page.locator('#progress-text').textContent();
    if (!pText.includes('2 of 5')) throw new Error(`Wrong progress: ${pText}`);
  });

  // TEST 8: Q5 → Loading screen
  await test('Q5 answer: Transitions to loading screen', async () => {
    // Answer Q1-Q4 quickly
    for (let i = 0; i < 4; i++) {
      await clickSelector('.answer-btn:first-child');
      await page.waitForTimeout(400);
    }
    // Now on Q5, tap answer and wait for loading screen
    await clickSelector('.answer-btn:first-child');
    // Wait for loading screen to appear (up to 1 second)
    await page.waitForSelector('#loading-screen.active', { timeout: 1000 });
    const loadingScreen = await page.locator('#loading-screen');
    const hasActive = await loadingScreen.evaluate(el => el.classList.contains('active'));
    if (!hasActive) throw new Error('Loading screen not shown after Q5');
  });

  // TEST 9: Loading screen shows correct text
  await test('Loading screen: Shows "Calculating your type" text', async () => {
    const loadingText = await page.locator('.loading-text').textContent();
    if (!loadingText.includes('Calculating')) throw new Error(`Wrong loading text: ${loadingText}`);
  });

  // TEST 10: Result screen appears after loading
  await test('Result: Appears after 1.5s loading delay', async () => {
    await page.waitForTimeout(2000);
    const resultScreen = await page.locator('#result-screen');
    const hasActive = await resultScreen.evaluate(el => el.classList.contains('active'));
    if (!hasActive) throw new Error('Result screen not shown');
  });

  // TEST 11: Result screen has emoji, name, description
  await test('Result: Shows emoji, name, and description', async () => {
    const emoji = await page.locator('#result-emoji').textContent();
    if (!emoji || emoji.length === 0) throw new Error('Emoji is empty');
    const name = await page.locator('#result-name').textContent();
    if (!name || name.length === 0) throw new Error('Result name is empty');
    const desc = await page.locator('#result-description').textContent();
    if (!desc || desc.length === 0) throw new Error('Result description is empty');
  });

  // TEST 12: Retake button resets to Q1
  await test('Retake button: Resets quiz to Q1', async () => {
    await clickSelector('#retake-btn');
    await page.waitForTimeout(300);
    const qText = await page.locator('#question-text').textContent();
    if (!qText.includes('Pick your vibe')) throw new Error(`Retake failed, at: ${qText}`);
  });

  // TEST 13: All answers D=4 (max score=20) → Drama Magnet (Type 4)
  await test('Max score (all D): Returns Drama Magnet (Type 4)', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    // Answer all Q with D (value=4)
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(300);
      // D is the 4th answer (index 3)
      await page.locator('.answer-btn').nth(3).click();
      await page.waitForTimeout(400);
    }
    // Skip loading
    await page.waitForTimeout(2000);
    const name = await page.locator('#result-name').textContent();
    if (!name.includes('Drama Magnet')) throw new Error(`Expected Drama Magnet, got: ${name}`);
  });

  // TEST 14: All answers A=1 (min score=5) → Algorithm Gambler (Type 1)
  await test('Min score (all A): Returns Algorithm Gambler (Type 1)', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(300);
      await page.locator('.answer-btn').nth(0).click();
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2000);
    const name = await page.locator('#result-name').textContent();
    if (!name.includes('Algorithm Gambler')) throw new Error(`Expected Algorithm Gambler, got: ${name}`);
  });

  // TEST 15: Mixed answers B=2 (score=10) → Aesthetic Architect (Type 2)
  await test('Mid score (all B, score=10): Returns Aesthetic Architect (Type 2)', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(300);
      await page.locator('.answer-btn').nth(1).click();
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2000);
    const name = await page.locator('#result-name').textContent();
    if (!name.includes('Aesthetic Architect')) throw new Error(`Expected Aesthetic Architect, got: ${name}`);
  });

  // TEST 16: Mixed answers C=3 (score=15) → Comfy King (Type 3)
  await test('Mid-high score (all C, score=15): Returns Comfy King/Queen (Type 3)', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(300);
      await page.locator('.answer-btn').nth(2).click();
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2000);
    const name = await page.locator('#result-name').textContent();
    if (!name.includes('Comfy')) throw new Error(`Expected Comfy King/Queen, got: ${name}`);
  });

  // TEST 17: Double-tap prevention on answer
  await test('Double-tap prevention: Second tap on same answer ignored', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    await page.waitForTimeout(400);
    // Click Q1 answer A
    const firstAnswerBtn = page.locator('.answer-btn').nth(0);
    await firstAnswerBtn.click();
    // Immediately click the SAME DOM element again (within 100ms, before setTimeout fires)
    await page.waitForTimeout(50);
    await firstAnswerBtn.click(); // Same button element - should be blocked by guard
    // Wait for the 300ms setTimeout to advance to Q2 (first click worked, not second)
    await page.waitForTimeout(400);
    const qText = await page.locator('#question-text').textContent();
    // Should be at Q2 ("ideal upload time"), NOT Q3 ("Sound matters")
    // If double-tap guard fails: Q3. If works: Q2 (first click only).
    if (qText.includes('Sound matters')) throw new Error(`Double-tap bypassed guard: ${qText}`);
    if (!qText.includes('ideal upload time')) throw new Error(`Should be Q2, got: ${qText}`);
  });

  // TEST 18: Share button present
  await test('Share button: Present on result screen', async () => {
    const shareBtn = await page.locator('#share-btn').count();
    if (shareBtn !== 1) throw new Error('Share button missing');
  });

  // TEST 19: Progress bar width matches question
  await test('Progress bar: Width updates per question', async () => {
    // Q1 should be 20%, Q2 40%, etc.
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    const fill1 = await page.locator('#progress-fill').evaluate(el => el.style.width);
    await page.waitForTimeout(400);
    await page.locator('.answer-btn').nth(0).click();
    await page.waitForTimeout(400);
    const fill2 = await page.locator('#progress-fill').evaluate(el => el.style.width);
    if (fill1 === fill2) throw new Error(`Progress didn't update: ${fill1} vs ${fill2}`);
  });

  // TEST 20: Particle canvas exists
  await test('Particle system: Canvas element present', async () => {
    const canvas = await page.locator('#particle-canvas').count();
    if (canvas !== 1) throw new Error('Particle canvas missing');
  });

  // TEST 21: Result background has type class
  await test('Result background: Applies correct type class', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForTimeout(300);
    await clickSelector('#start-btn');
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(300);
      await page.locator('.answer-btn').nth(0).click();
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2000);
    const bgClass = await page.locator('#result-bg').evaluate(el => el.className);
    if (!bgClass.includes('type-1') && !bgClass.includes('type-2')) throw new Error(`Unexpected bg class: ${bgClass}`);
  });

  // TEST 22: Answer labels A-D
  await test('Answer labels: All 4 answers have A/B/C/D labels', async () => {
    const labels = await page.locator('.answer-label').allTextContents();
    const expected = ['A', 'B', 'C', 'D'];
    for (const exp of expected) {
      if (!labels.includes(exp)) throw new Error(`Missing label ${exp} in ${labels.join(',')}`);
    }
  });

  // ===== SUMMARY =====
  console.log(`\n=== Test Results: ${passCount} passed, ${failCount} failed ===\n`);

  if (failCount > 0) {
    console.log('Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  await browser.close();
  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
