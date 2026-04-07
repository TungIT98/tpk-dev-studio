// Comprehensive scoring logic test
const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const htmlPath = path.join(__dirname, 'index.html').replace(/\\/g, '/');
  const fileUrl = `file://${htmlPath}`;

  const browser = await chromium.launch({ headless: true });

  // Test all 4 result types
  const testCases = [
    {
      name: 'Algorithm Gambler (Score 5-8)',
      answers: [0, 0, 0, 0, 0], // All A (value=1, score=5)
      expectedResult: 'The Algorithm Gambler',
      expectedEmoji: '🔥',
      expectedBgClass: 'type-1'
    },
    {
      name: 'Aesthetic Architect (Score 9-12)',
      answers: [1, 1, 1, 1, 1], // All B (value=2, score=10)
      expectedResult: 'The Aesthetic Architect',
      expectedEmoji: '✨',
      expectedBgClass: 'type-2'
    },
    {
      name: 'Comfy King/Queen (Score 13-16)',
      answers: [2, 2, 2, 2, 2], // All C (value=3, score=15)
      expectedResult: 'The Comfy King/Queen',
      expectedEmoji: '☁️',
      expectedBgClass: 'type-3'
    },
    {
      name: 'Drama Magnet (Score 17-20)',
      answers: [3, 3, 3, 3, 3], // All D (value=4, score=20)
      expectedResult: 'The Drama Magnet',
      expectedEmoji: '⭐',
      expectedBgClass: 'type-4'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`\nTesting: ${tc.name}`);
    console.log('Expected:', tc.expectedResult);

    const page = await browser.newPage();
    await page.goto(fileUrl);

    // Start quiz
    await page.evaluate(() => document.getElementById('start-btn').click());
    await page.waitForTimeout(300);

    // Answer questions
    for (const answerIdx of tc.answers) {
      await page.evaluate((idx) => {
        const btns = document.querySelectorAll('.answer-btn');
        btns[idx].click();
      }, answerIdx);
      await page.waitForTimeout(400);
    }

    // Wait for loading + result
    await page.waitForTimeout(2000);

    // Verify result
    const resultName = await page.locator('#result-name').textContent();
    const resultEmoji = await page.locator('#result-emoji').textContent();
    const resultBg = await page.locator('#result-bg');

    console.log('Got:', resultName, resultEmoji);
    console.log('BG class:', await resultBg.evaluate(el => el.className));

    if (resultName.includes(tc.expectedResult.split(' ').pop())) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL - Expected', tc.expectedResult, 'got', resultName);
      failed++;
    }

    await page.close();
  }

  // Test boundary scores
  console.log('\n--- Testing boundary scores ---');

  // Score 8 should still be Algorithm Gambler
  // Q1=A(1), Q2=A(1), Q3=A(1), Q4=D(4), Q5=D(4) = 11 -> Aesthetic
  // Score 8 = Q1=A(1), Q2=A(1), Q3=D(4), Q4=A(1), Q5=A(1) = 8 (Algo Gambler)

  await browser.close();

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});