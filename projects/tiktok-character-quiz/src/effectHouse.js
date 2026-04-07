// effectHouse.js — TikTok Effect House SDK Module
// Compatible with Effect House SDK 3.x
// Replace this file's contents into Effect House's script editor

// ============================================================
// EFFECT HOUSE SDK BOOTSTRAP
// Effect House calls onStart() when the effect begins
// ============================================================

// GDD Section 2: Visual Style constants
const COLORS = {
  background: '#0D0D0D',
  primary: '#FE2C55',     // TikTok red/pink
  secondary: '#25F4EE',   // TikTok cyan
  black: '#000000',
  white: '#FFFFFF'
};

// GDD Section 3: Quiz questions
const QUESTIONS = [
  {
    id: 1,
    text: 'Pick your vibe',
    answers: [
      { label: 'A', text: 'Chaos king/queen — wild energy', value: 1 },
      { label: 'B', text: 'Clean and aesthetic — curated perfection', value: 2 },
      { label: 'C', text: 'Comfy king — lounging content', value: 3 },
      { label: 'D', text: 'Drama llama — always something going on', value: 4 }
    ]
  },
  {
    id: 2,
    text: 'Your ideal upload time',
    answers: [
      { label: 'A', text: '3AM — no sleep, no filter', value: 1 },
      { label: 'B', text: 'Peak hours — 6-9PM for max views', value: 2 },
      { label: 'C', text: 'Golden hour — soft lighting aesthetic', value: 3 },
      { label: 'D', text: 'When the drama is hot — moment matters most', value: 4 }
    ]
  },
  {
    id: 3,
    text: 'Sound matters because...',
    answers: [
      { label: 'A', text: 'The beat is the story', value: 1 },
      { label: 'B', text: 'It sets the aesthetic mood', value: 2 },
      { label: 'C', text: 'Good sound = cozy ASMR vibes', value: 3 },
      { label: 'D', text: "It's the tea announcer", value: 4 }
    ]
  },
  {
    id: 4,
    text: 'Pick a collaboration style',
    answers: [
      { label: 'A', text: 'Tag everyone, duel anyone', value: 1 },
      { label: 'B', text: 'Matching aesthetics only', value: 2 },
      { label: 'C', text: 'Duets only, I\'m chill', value: 3 },
      { label: 'D', text: 'I start the trends they follow', value: 4 }
    ]
  },
  {
    id: 5,
    text: 'Your comment section energy',
    answers: [
      { label: 'A', text: "I'm in the replies starting discourse", value: 1 },
      { label: 'B', text: 'I reply to spread positivity', value: 2 },
      { label: 'C', text: 'I read every reply like a cozy newsletter', value: 3 },
      { label: 'D', text: 'I screenshot and react', value: 4 }
    ]
  }
];

// GDD Section 4: Result types
const RESULT_TYPES = [
  {
    id: 'TYPE_1',
    name: 'The Algorithm Gambler',
    range: [5, 8],
    scoreRange: '5–8',
    description: "Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both).",
    visualTheme: { bgColor: '#FE2C55', particleColor: '#FF6B8A', emoji: 'fire', accentColor: '#FF9EC4' }
  },
  {
    id: 'TYPE_2',
    name: 'The Aesthetic Architect',
    range: [9, 12],
    scoreRange: '9–12',
    description: 'Every frame a mood board. Your content is clean, curated, and effortlessly gorgeous. Beauty is the brand.',
    visualTheme: { bgColor: '#25F4EE', particleColor: '#7FFEFF', emoji: 'sparkle', accentColor: '#FFE29A' }
  },
  {
    id: 'TYPE_3',
    name: 'The Comfy King/Queen',
    range: [13, 16],
    scoreRange: '13–16',
    description: 'Cozy content, warm vibes, ASMR-lite. You turned comfort into a lifestyle brand.',
    visualTheme: { bgColor: '#FF8C42', particleColor: '#FFB347', emoji: 'cloud', accentColor: '#FFD1DC' }
  },
  {
    id: 'TYPE_4',
    name: 'The Drama Magnet',
    range: [17, 20],
    scoreRange: '17–20',
    description: 'The comment section is your stage. Every post is a chapter in an ongoing saga. Your life is content.',
    visualTheme: { bgColor: '#9B59B6', particleColor: '#D4A5FF', emoji: 'star', accentColor: '#FF79C6' }
  }
];

// ============================================================
// STATE MACHINE
// ============================================================
const STATE = { START: 0, QUESTION: 1, LOADING: 2, RESULT: 3 };

class QuizEffect {
  constructor() {
    this.state = STATE.START;
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.answerButtons = [];
  }

  // GDD Section 5: Entry point
  onStart() {
    print('[TikTokQuiz] Effect started — "Which TikTok Character Are You?"');
    this.showStartScreen();
  }

  // Called when user taps screen
  onTap(x, y) {
    switch (this.state) {
      case STATE.START:
        this.handleStartTap(x, y);
        break;
      case STATE.QUESTION:
        this.handleQuestionTap(x, y);
        break;
      case STATE.RESULT:
        this.handleResultTap(x, y);
        break;
    }
  }

  // --- Screen: Start ---
  showStartScreen() {
    this.state = STATE.START;
    // Create title text, subtitle, and start button
    // Per GDD: cinematic title card, tap to start
  }

  handleStartTap(x, y) {
    // Check if tap is within start button bounds (example: center button)
    // Start the quiz
    this.startQuiz();
  }

  // --- Screen: Question ---
  startQuiz() {
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.showQuestion();
  }

  showQuestion() {
    this.state = STATE.QUESTION;
    const q = QUESTIONS[this.currentQuestionIndex];
    const progress = `${this.currentQuestionIndex + 1}/${QUESTIONS.length}`;

    print(`[Q${progress}] ${q.text}`);
    q.answers.forEach(a => print(`  ${a.label}) ${a.text}`));

    // Create/update UI elements in Effect House
    // GDD: slide+fade transition (300ms ease-out)
  }

  handleQuestionTap(x, y) {
    // Check which answer was tapped
    // Each answer has defined bounds in Effect House coordinate space
    // GDD: answer selection = scale pulse animation (1.0→1.1→1.0, 200ms)

    const answerIndex = this.getAnswerIndexFromTap(x, y);
    if (answerIndex !== -1) {
      const answer = QUESTIONS[this.currentQuestionIndex].answers[answerIndex];
      print(`[Answer] ${answer.label}) ${answer.text}`);
      this.selectAnswer(answer.value);
    }
  }

  getAnswerIndexFromTap(x, y) {
    // Effect House screen is 1080x1920, tap coords scaled accordingly
    // Answer button positions (y):
    // A: y=500, B: y=720, C: y=940, D: y=1160
    // Each button height: 200
    const buttonY = [500, 720, 940, 1160];
    for (let i = 0; i < buttonY.length; i++) {
      if (y >= buttonY[i] && y <= buttonY[i] + 200 && x >= 90 && x <= 990) {
        return i;
      }
    }
    return -1;
  }

  selectAnswer(value) {
    this.totalScore += value;
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= QUESTIONS.length) {
      this.showLoading();
    } else {
      // Next question with transition
      this.showQuestion();
    }
  }

  // --- Screen: Loading ---
  showLoading() {
    this.state = STATE.LOADING;
    print('[Loading] "Calculating your type..."');
    // GDD: 1s suspense build

    // Auto-transition to result
    setTimeout(() => {
      this.showResult();
    }, 1500);
  }

  // --- Screen: Result ---
  showResult() {
    this.state = STATE.RESULT;
    const result = this.calculateResult(this.totalScore);

    print(`[RESULT] ${result.name} (Score: ${this.totalScore}, Range: ${result.scoreRange})`);
    print(`  "${result.description}"`);
    print(`  Theme: ${result.visualTheme.bgColor} + ${result.visualTheme.emoji}`);

    // GDD: 1.5s cinematic reveal
    // - Particle burst
    // - Zoom + glow
    // - Result title + description
    // - "Tap to retake" + "Share" buttons
  }

  handleResultTap(x, y) {
    // Retake button bounds: x=290, y=1550, w=220, h=80
    // Share button bounds: x=570, y=1550, w=220, h=80
    if (x >= 290 && x <= 510 && y >= 1550 && y <= 1630) {
      print('[Action] Retake quiz');
      this.startQuiz();
    } else if (x >= 570 && x <= 790 && y >= 1550 && y <= 1630) {
      print('[Action] Share result');
      // Effect House share API
      // effect.shareResult();
    }
  }

  calculateResult(score) {
    for (const type of RESULT_TYPES) {
      if (score >= type.range[0] && score <= type.range[1]) {
        return type;
      }
    }
    return RESULT_TYPES[1]; // TYPE_2 default
  }
}

// ============================================================
// EFFECT HOUSE EXPORTS
// The Effect House runtime will look for these exports
// ============================================================

// Create singleton instance
const quizEffect = new QuizEffect();

// Export lifecycle hooks that Effect House SDK calls
export function onStart() {
  quizEffect.onStart();
}

export function onTap(x, y) {
  quizEffect.onTap(x, y);
}

// Optional: export for debugging
export function getState() {
  return {
    state: ['START', 'QUESTION', 'LOADING', 'RESULT'][quizEffect.state],
    question: quizEffect.currentQuestionIndex,
    score: quizEffect.totalScore
  };
}
