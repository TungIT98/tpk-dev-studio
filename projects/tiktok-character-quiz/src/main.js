// main.js — TikTok Effect House Entry Point
// Effect: "Which TikTok Character Are You?"

// NOTE: This file uses the Effect House SDK API.
// To test locally, open index.html in a browser.
// To deploy to TikTok: import this project into Effect House editor.

import { QuizManager, QuizState } from './QuizManager.js';
import { QUIZ_QUESTIONS, RESULT_TYPES } from './quizData.js';

// GDD Colors from Section 2
const COLORS = {
  background: '#0D0D0D',
  primary: '#FE2C55',
  secondary: '#25F4EE',
  black: '#000000',
  white: '#FFFFFF'
};

class TikTokQuizEffect {
  constructor() {
    this.currentScreen = null;
    this.quizManager = new QuizManager(this.onStateChange.bind(this));
  }

  // Called when Effect House starts the effect
  async onStart() {
    console.log('[TikTokQuiz] Effect started');
    this.showScreen('start');
  }

  // Called when user taps the screen
  onTap(x, y) {
    console.log(`[TikTokQuiz] Tap at (${x}, ${y})`);
    if (this.currentScreen && this.currentScreen.onTap) {
      this.currentScreen.onTap(x, y);
    }
  }

  onStateChange(state, manager) {
    switch (state) {
      case QuizState.START:
        this.showScreen('start');
        break;
      case QuizState.QUESTION:
        this.showScreen('question');
        break;
      case QuizState.LOADING:
        this.showScreen('loading');
        break;
      case QuizState.RESULT:
        this.showScreen('result');
        break;
    }
  }

  showScreen(screenName) {
    // Clear previous screen
    this.currentScreen = null;

    switch (screenName) {
      case 'start':
        this.currentScreen = new StartScreen(this.quizManager);
        break;
      case 'question':
        this.currentScreen = new QuestionScreen(this.quizManager, this.quizManager.getCurrentQuestion());
        break;
      case 'loading':
        this.currentScreen = new LoadingScreen();
        break;
      case 'result':
        this.currentScreen = new ResultScreen(this.quizManager, this.quizManager.getResult());
        break;
    }
  }
}

// ============ SCREENS ============

class StartScreen {
  constructor(quizManager) {
    this.quizManager = quizManager;
    this.render();
  }

  render() {
    // Title card with animated entrance
    console.log('[Screen] START - Rendering title card');
    // Animation: slide up + fade in (300ms ease-out per GDD)
  }

  onTap(x, y) {
    // Check if tap is within "Start Quiz" button bounds
    const buttonBounds = { x: 340, y: 1200, width: 400, height: 120 };
    if (this.isInBounds(x, y, buttonBounds)) {
      this.quizManager.startQuiz();
    }
  }

  isInBounds(x, y, bounds) {
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
}

class QuestionScreen {
  constructor(quizManager, question) {
    this.quizManager = quizManager;
    this.question = question;
    this.answerButtons = [];
    this.render();
  }

  render() {
    const q = this.question;
    const progress = this.quizManager.getProgress();

    console.log(`[Screen] QUESTION ${progress.current}/${progress.total}: ${q.text}`);
    console.log('[Answers]', q.answers.map(a => `${a.label}) ${a.text}`).join(' | '));

    // Create 4 answer cards at positions
    // GDD: Answer selection = scale pulse (1.0→1.1→1.0, 200ms)
  }

  onTap(x, y) {
    // Check which answer was tapped (A=0, B=1, C=2, D=3)
    // Answer positions: 4 cards stacked vertically
    const answerBounds = [
      { x: 90, y: 500, width: 900, height: 200 },  // A
      { x: 90, y: 720, width: 900, height: 200 },  // B
      { x: 90, y: 940, width: 900, height: 200 },  // C
      { x: 90, y: 1160, width: 900, height: 200 }   // D
    ];

    for (let i = 0; i < answerBounds.length; i++) {
      if (this.isInBounds(x, y, answerBounds[i])) {
        const answer = this.question.answers[i];
        console.log(`[Answer] Selected: ${answer.label}) ${answer.text}`);
        this.quizManager.answerQuestion(answer.value);
        return;
      }
    }
  }

  isInBounds(x, y, bounds) {
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
}

class LoadingScreen {
  constructor() {
    this.render();
  }

  render() {
    console.log('[Screen] LOADING - "Calculating your type..."');
    // 1s suspense build per GDD
    // Animated dots or spinning loader
  }
}

class ResultScreen {
  constructor(quizManager, result) {
    this.quizManager = quizManager;
    this.result = result;
    this.render();
  }

  render() {
    const r = this.result;
    console.log('[Screen] RESULT REVEAL');
    console.log(`🎉 ${r.name} (Score: ${r.scoreRange})`);
    console.log(`   "${r.description}"`);
    console.log(`   Theme: ${r.visualTheme.backgroundColor} + ${r.visualTheme.emoji}`);

    // GDD: 1.5s cinematic reveal
    // - Particle burst
    // - Zoom + glow
    // - Result title (large, bold)
    // - 1-line description
    // - "Tap to retake" + "Share" buttons
  }

  onTap(x, y) {
    const retakeBounds = { x: 290, y: 1550, width: 220, height: 80 };
    const shareBounds = { x: 570, y: 1550, width: 220, height: 80 };

    if (this.isInBounds(x, y, retakeBounds)) {
      console.log('[Action] Retake quiz');
      this.quizManager.retakeQuiz();
    } else if (this.isInBounds(x, y, shareBounds)) {
      console.log('[Action] Share result');
      // Effect House share API
    }
  }

  isInBounds(x, y, bounds) {
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
}

// ============ EFFECT HOUSE SDK BOOTSTRAP ============
// This replaces the typical Effect House `main()` entry point

// For Effect House, export the effect class
// The Effect House runtime will call onStart() when the effect begins
export default TikTokQuizEffect;

// For local testing without Effect House SDK:
if (typeof window !== 'undefined') {
  window.TikTokQuizEffect = TikTokQuizEffect;
}
