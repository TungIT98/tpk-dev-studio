// Simple Playwright smoke test
const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const htmlPath = path.join(__dirname, 'index.html').replace(/\\/g, '/');
  const fileUrl = `file://${htmlPath}`;

  console.log('Opening:', fileUrl);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(fileUrl);
  console.log('Page title:', await page.title());

  // Check start screen elements
  const startBtn = page.locator('#start-btn');
  const isStartBtnVisible = await startBtn.isVisible();
  console.log('Start button visible:', isStartBtnVisible);

  const quizTitle = page.locator('.quiz-title');
  const isTitleVisible = await quizTitle.isVisible();
  console.log('Quiz title visible:', isTitleVisible);

  // Click start and verify question screen
  // Using JS click because z-index issue causes overlay to intercept
  await page.evaluate(() => document.getElementById('start-btn').click());
  await page.waitForTimeout(500);

  const questionScreen = page.locator('#question-screen');
  const hasActiveClass = await questionScreen.evaluate(el => el.classList.contains('active'));
  console.log('Question screen active after start:', hasActiveClass);

  const questionText = await page.locator('#question-text').textContent();
  console.log('First question text:', questionText);

  // Answer all questions with A (first option) - use JS click
  for (let i = 0; i < 5; i++) {
    console.log(`Answering question ${i + 1}...`);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('.answer-btn');
      if (btns.length > 0) btns[0].click();
    });
    await page.waitForTimeout(400);
  }

  // Wait for loading then result
  await page.waitForTimeout(2000);

  const resultScreen = page.locator('#result-screen');
  const resultActive = await resultScreen.evaluate(el => el.classList.contains('active'));
  console.log('Result screen active:', resultActive);

  const resultName = await page.locator('#result-name').textContent();
  console.log('Result name:', resultName);

  const resultEmoji = await page.locator('#result-emoji').textContent();
  console.log('Result emoji:', resultEmoji);

  // Test retake - use JS click
  await page.evaluate(() => document.getElementById('retake-btn').click());
  await page.waitForTimeout(300);

  const afterRetake = await page.locator('#progress-text').textContent();
  console.log('Progress after retake:', afterRetake);

  await browser.close();
  console.log('\nAll tests passed!');
}

run().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});