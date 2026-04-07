# effect_house_editor.py
# Direct code replacement for Effect House Monaco editor
# Uses keyboard-based text selection and replacement

import pyautogui
import time
import sys
import os
import pyperclip
import json
from datetime import datetime

pyautogui.PAUSE = 0.2
pyautogui.FAILSAFE = True

QUIZ_DATA = {
    "questions": [
        {"id": 1, "text": "Pick your vibe", "answers": [
            {"label": "A", "text": "Chaos king/queen — wild energy", "value": 1},
            {"label": "B", "text": "Clean and aesthetic — curated perfection", "value": 2},
            {"label": "C", "text": "Comfy king — lounging content", "value": 3},
            {"label": "D", "text": "Drama llama — always something going on", "value": 4}
        ]},
        {"id": 2, "text": "Your ideal upload time", "answers": [
            {"label": "A", "text": "3AM — no sleep, no filter", "value": 1},
            {"label": "B", "text": "Peak hours — 6-9PM for max views", "value": 2},
            {"label": "C", "text": "Golden hour — soft lighting aesthetic", "value": 3},
            {"label": "D", "text": "When the drama is hot — moment matters most", "value": 4}
        ]},
        {"id": 3, "text": "Sound matters because...", "answers": [
            {"label": "A", "text": "The beat is the story", "value": 1},
            {"label": "B", "text": "It sets the aesthetic mood", "value": 2},
            {"label": "C", "text": "Good sound = cozy ASMR vibes", "value": 3},
            {"label": "D", "text": "It's the tea announcer", "value": 4}
        ]},
        {"id": 4, "text": "Pick a collaboration style", "answers": [
            {"label": "A", "text": "Tag everyone, duel anyone", "value": 1},
            {"label": "B", "text": "Matching aesthetics only", "value": 2},
            {"label": "C", "text": "Duets only, I'm chill", "value": 3},
            {"label": "D", "text": "I start the trends they follow", "value": 4}
        ]},
        {"id": 5, "text": "Your comment section energy", "answers": [
            {"label": "A", "text": "I'm in the replies starting discourse", "value": 1},
            {"label": "B", "text": "I reply to spread positivity", "value": 2},
            {"label": "C", "text": "I read every reply like a cozy newsletter", "value": 3},
            {"label": "D", "text": "I screenshot and react", "value": 4}
        ]}
    ],
    "results": [
        {"id": "TYPE_1", "name": "The Algorithm Gambler", "range": [5, 8],
         "description": "Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both).",
         "visualTheme": {"bgColor": "#FE2C55", "particleColor": "#FF6B8A", "emoji": "fire", "accentColor": "#FF9EC4"}},
        {"id": "TYPE_2", "name": "The Aesthetic Architect", "range": [9, 12],
         "description": "Every frame a mood board. Your content is clean, curated, and effortlessly gorgeous. Beauty is the brand.",
         "visualTheme": {"bgColor": "#25F4EE", "particleColor": "#7FFEFF", "emoji": "sparkle", "accentColor": "#FFE29A"}},
        {"id": "TYPE_3", "name": "The Comfy King/Queen", "range": [13, 16],
         "description": "Cozy content, warm vibes, ASMR-lite. You turned comfort into a lifestyle brand.",
         "visualTheme": {"bgColor": "#FF8C42", "particleColor": "#FFB347", "emoji": "cloud", "accentColor": "#FFD1DC"}},
        {"id": "TYPE_4", "name": "The Drama Magnet", "range": [17, 20],
         "description": "The comment section is your stage. Every post is a chapter in an ongoing saga. Your life is content.",
         "visualTheme": {"bgColor": "#9B59B6", "particleColor": "#D4A5FF", "emoji": "star", "accentColor": "#FF79C6"}}
    ]
}


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def screenshot(name):
    os.makedirs("debug/screenshots", exist_ok=True)
    path = f"debug/screenshots/{name}_{datetime.now().strftime('%H%M%S')}.png"
    pyautogui.screenshot().save(path)
    log(f"Screenshot: {path}")
    return path


def update_questions():
    """Update QUESTIONS array using keyboard navigation"""
    log("Updating QUESTIONS...")

    # Find "QUESTIONS" - use Ctrl+F
    pyautogui.hotkey('ctrl', 'f')
    time.sleep(0.5)
    pyperclip.copy("const QUESTIONS = [")
    time.sleep(0.3)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('escape')
    time.sleep(0.3)

    # Select the array content (from [ to ];)
    # Navigate to start of QUESTIONS
    for _ in range(15):
        pyautogui.press('up')
        time.sleep(0.05)

    # Find the opening brace of QUESTIONS
    # Use Ctrl+D to select next occurrence and keep selecting
    pyautogui.hotkey('ctrl', 'd')
    time.sleep(0.2)

    # Now we need to select the entire QUESTIONS array
    # This is complex - let's try a different approach
    # Just select line by line from [ to ];
    log("Selecting QUESTIONS array...")
    for _ in range(50):  # 50 lines should cover questions
        pyautogui.hotkey('shift', 'down')
        time.sleep(0.02)

    time.sleep(0.3)
    log("Selected QUESTIONS content")


def update_results():
    """Update RESULT_TYPES array"""
    log("Updating RESULT_TYPES...")

    # Find RESULT_TYPES
    pyautogui.hotkey('ctrl', 'f')
    time.sleep(0.5)
    pyperclip.copy("const RESULT_TYPES = [")
    time.sleep(0.3)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('escape')
    time.sleep(0.3)


def write_new_file_approach():
    """Alternative: Write complete new game.js file"""
    log("Alternative approach: Write complete file...")

    # Generate complete game.js
    questions_json = json.dumps(QUIZ_DATA["questions"], indent=2, ensure_ascii=False)
    results_json = json.dumps(QUIZ_DATA["results"], indent=2, ensure_ascii=False)

    # Build complete file content
    new_content = f'''// game.js — Personality Quiz Template
// Generated by automation script

const QUESTIONS = {questions_json};

const RESULT_TYPES = {results_json};

// State machine
const STATE = {{ START: 0, QUESTION: 1, LOADING: 2, RESULT: 3 }};

class QuizEffect {{
  constructor() {{
    this.state = STATE.START;
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.answerButtons = [];
  }}

  onStart() {{
    print('[TikTokQuiz] Effect started');
    this.showStartScreen();
  }}

  onTap(x, y) {{
    switch (this.state) {{
      case STATE.START:
        this.handleStartTap(x, y);
        break;
      case STATE.QUESTION:
        this.handleQuestionTap(x, y);
        break;
      case STATE.RESULT:
        this.handleResultTap(x, y);
        break;
    }}
  }}

  showStartScreen() {{
    this.state = STATE.START;
  }}

  handleStartTap(x, y) {{
    this.startQuiz();
  }}

  startQuiz() {{
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.showQuestion();
  }}

  showQuestion() {{
    this.state = STATE.QUESTION;
    const q = QUESTIONS[this.currentQuestionIndex];
    const progress = `${{this.currentQuestionIndex + 1}}/${{QUESTIONS.length}}`;
    print(`[Q${{progress}}] ${{q.text}}`);
    q.answers.forEach(a => print(`  ${{a.label}}) ${{a.text}}`));
  }}

  handleQuestionTap(x, y) {{
    const answerIndex = this.getAnswerIndexFromTap(x, y);
    if (answerIndex !== -1) {{
      const answer = QUESTIONS[this.currentQuestionIndex].answers[answerIndex];
      print(`[Answer] ${{answer.label}}) ${{answer.text}}`);
      this.selectAnswer(answer.value);
    }}
  }}

  getAnswerIndexFromTap(x, y) {{
    const buttonY = [500, 720, 940, 1160];
    for (let i = 0; i < buttonY.length; i++) {{
      if (y >= buttonY[i] && y <= buttonY[i] + 200 && x >= 90 && x <= 990) {{
        return i;
      }}
    }}
    return -1;
  }}

  selectAnswer(value) {{
    this.totalScore += value;
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= QUESTIONS.length) {{
      this.showLoading();
    }} else {{
      this.showQuestion();
    }}
  }}

  showLoading() {{
    this.state = STATE.LOADING;
    print('[Loading] "Calculating your type..."');
    setTimeout(() => {{
      this.showResult();
    }}, 1500);
  }}

  showResult() {{
    this.state = STATE.RESULT;
    const result = this.calculateResult(this.totalScore);
    print(`[RESULT] ${{result.name}}`);
    print(`  "${{result.description}}"`);
  }}

  handleResultTap(x, y) {{
    if (x >= 290 && x <= 510 && y >= 1550 && y <= 1630) {{
      print('[Action] Retake quiz');
      this.startQuiz();
    }} else if (x >= 570 && x <= 790 && y >= 1550 && y <= 1630) {{
      print('[Action] Share result');
    }}
  }}

  calculateResult(score) {{
    for (const type of RESULT_TYPES) {{
      if (score >= type.range[0] && score <= type.range[1]) {{
        return type;
      }}
    }}
    return RESULT_TYPES[1];
  }}
}}

const quizEffect = new QuizEffect();

export function onStart() {{
  quizEffect.onStart();
}}

export function onTap(x, y) {{
  quizEffect.onTap(x, y);
}}

export function getState() {{
  return {{
    state: ['START', 'QUESTION', 'LOADING', 'RESULT'][quizEffect.state],
    question: quizEffect.currentQuestionIndex,
    score: quizEffect.totalScore
  }};
}}
'''

    return new_content


def select_all_and_paste(content):
    """Select all in editor and paste new content"""
    log("Selecting all content...")

    # Ctrl+A to select all
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.5)

    # Copy new content to clipboard
    pyperclip.copy(content)
    time.sleep(0.3)

    # Ctrl+V to paste
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)

    log("Content pasted")


def save_and_build():
    """Save file and build"""
    log("Saving file...")
    pyautogui.hotkey('ctrl', 's')
    time.sleep(2)

    log("Building project...")
    pyautogui.hotkey('ctrl', 'b')
    time.sleep(5)


def run_full_update():
    """Run full update workflow"""
    log("=" * 60)
    log("EFFECT HOUSE - QUIZ UPDATE WORKFLOW")
    log("=" * 60)

    # Generate new content
    new_content = write_new_file_approach()
    log(f"Generated {len(new_content)} characters of new content")

    # Make sure game.js is open and focused
    log("Ensuring game.js is open...")

    # Press Ctrl+A, Ctrl+C to verify we can select
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.3)

    # Try copy
    pyautogui.hotkey('ctrl', 'c')
    time.sleep(0.3)

    # Check clipboard
    copied = pyperclip.paste()
    log(f"Clipboard has {len(copied)} characters")

    if len(copied) > 100:
        log("Selection works! Proceeding with update...")
        select_all_and_paste(new_content)
        screenshot("after_paste")
        save_and_build()
    else:
        log("Editor selection not working properly")
        log("Please ensure game.js is open and click on the code editor first")
        log("Then run this script again")
        screenshot("selection_failed")

    log("=" * 60)
    log("Update workflow complete!")
    log("Check the editor to verify changes")
    log("Then build with Ctrl+B and export")
    log("=" * 60)


def main():
    if len(sys.argv) < 2:
        print("""
EFFECT HOUSE EDITOR
===================
Usage: python effect_house_editor.py [action]

Actions:
  update   - Update quiz content in game.js
  test     - Test editor interaction
  help     - Show help

NOTE: Make sure game.js is open in Effect House editor
      and the code editor window is focused before running!
        """)
        return

    action = sys.argv[1].lower()

    if action == 'test':
        log("Testing editor interaction...")
        pyautogui.hotkey('ctrl', 'a')
        time.sleep(0.3)
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(0.3)
        copied = pyperclip.paste()
        log(f"Copied {len(copied)} characters from editor")
        screenshot("editor_test")

    elif action == 'update':
        run_full_update()

    elif action == 'help':
        main()


if __name__ == "__main__":
    main()
