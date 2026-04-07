# precise_quiz_editor.py
# Precise keyboard automation for Effect House Monaco editor
# Uses only keyboard shortcuts - no clipboard needed

import pyautogui
import time
import sys
import os

pyautogui.PAUSE = 0.2

# Quiz questions to enter
QUIZ_DATA = {
    "questions": [
        {
            "id": 1,
            "text": "Pick your vibe",
            "answers": [
                {"label": "A", "text": "Chaos king/queen — wild energy", "value": 1},
                {"label": "B", "text": "Clean and aesthetic — curated perfection", "value": 2},
                {"label": "C", "text": "Comfy king — lounging content", "value": 3},
                {"label": "D", "text": "Drama llama — always something going on", "value": 4}
            ]
        },
        {
            "id": 2,
            "text": "Your ideal upload time",
            "answers": [
                {"label": "A", "text": "3AM — no sleep, no filter", "value": 1},
                {"label": "B", "text": "Peak hours — 6-9PM for max views", "value": 2},
                {"label": "C", "text": "Golden hour — soft lighting aesthetic", "value": 3},
                {"label": "D", "text": "When the drama is hot — moment matters most", "value": 4}
            ]
        },
        {
            "id": 3,
            "text": "Sound matters because...",
            "answers": [
                {"label": "A", "text": "The beat is the story", "value": 1},
                {"label": "B", "text": "It sets the aesthetic mood", "value": 2},
                {"label": "C", "text": "Good sound = cozy ASMR vibes", "value": 3},
                {"label": "D", "text": "It's the tea announcer", "value": 4}
            ]
        },
        {
            "id": 4,
            "text": "Pick a collaboration style",
            "answers": [
                {"label": "A", "text": "Tag everyone, duel anyone", "value": 1},
                {"label": "B", "text": "Matching aesthetics only", "value": 2},
                {"label": "C", "text": "Duets only, I'm chill", "value": 3},
                {"label": "D", "text": "I start the trends they follow", "value": 4}
            ]
        },
        {
            "id": 5,
            "text": "Your comment section energy",
            "answers": [
                {"label": "A", "text": "I'm in the replies starting discourse", "value": 1},
                {"label": "B", "text": "I reply to spread positivity", "value": 2},
                {"label": "C", "text": "I read every reply like a cozy newsletter", "value": 3},
                {"label": "D", "text": "I screenshot and react", "value": 4}
            ]
        }
    ]
}

RESULT_TYPES = """const RESULT_TYPES = [
    { id: "TYPE_1", name: "The Algorithm Gambler", range: [5, 8],
      description: "Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both).",
      visualTheme: { bgColor: "#FE2C55", particleColor: "#FF6B8A", emoji: "fire", accentColor: "#FF9EC4" } },
    { id: "TYPE_2", name: "The Aesthetic Architect", range: [9, 12],
      description: "Every frame a mood board. Your content is clean, curated, and effortlessly gorgeous. Beauty is the brand.",
      visualTheme: { bgColor: "#25F4EE", particleColor: "#7FFEFF", emoji: "sparkle", accentColor: "#FFE29A" } },
    { id: "TYPE_3", name: "The Comfy King/Queen", range: [13, 16],
      description: "Cozy content, warm vibes, ASMR-lite. You turned comfort into a lifestyle brand.",
      visualTheme: { bgColor: "#FF8C42", particleColor: "#FFB347", emoji: "cloud", accentColor: "#FFD1DC" } },
    { id: "TYPE_4", name: "The Drama Magnet", range: [17, 20],
      description: "The comment section is your stage. Every post is a chapter in an ongoing saga. Your life is content.",
      visualTheme: { bgColor: "#9B59B6", particleColor: "#D4A5FF", emoji: "star", accentColor: "#FF79C6" } }
];"""

QUESTIONS_ARRAY = """const QUESTIONS = [
    { id: 1, text: "Pick your vibe", answers: [
        { label: "A", text: "Chaos king/queen — wild energy", value: 1 },
        { label: "B", text: "Clean and aesthetic — curated perfection", value: 2 },
        { label: "C", text: "Comfy king — lounging content", value: 3 },
        { label: "D", text: "Drama llama — always something going on", value: 4 }
    ]},
    { id: 2, text: "Your ideal upload time", answers: [
        { label: "A", text: "3AM — no sleep, no filter", value: 1 },
        { label: "B", text: "Peak hours — 6-9PM for max views", value: 2 },
        { label: "C", text: "Golden hour — soft lighting aesthetic", value: 3 },
        { label: "D", text: "When the drama is hot — moment matters most", value: 4 }
    ]},
    { id: 3, text: "Sound matters because...", answers: [
        { label: "A", text: "The beat is the story", value: 1 },
        { label: "B", text: "It sets the aesthetic mood", value: 2 },
        { label: "C", text: "Good sound = cozy ASMR vibes", value: 3 },
        { label: "D", text: "It's the tea announcer", value: 4 }
    ]},
    { id: 4, text: "Pick a collaboration style", answers: [
        { label: "A", text: "Tag everyone, duel anyone", value: 1 },
        { label: "B", text: "Matching aesthetics only", value: 2 },
        { label: "C", text: "Duets only, I'm chill", value: 3 },
        { label: "D", text: "I start the trends they follow", value: 4 }
    ]},
    { id: 5, text: "Your comment section energy", answers: [
        { label: "A", text: "I'm in the replies starting discourse", value: 1 },
        { label: "B", text: "I reply to spread positivity", value: 2 },
        { label: "C", text: "I read every reply like a cozy newsletter", value: 3 },
        { label: "D", text: "I screenshot and react", value: 4 }
    ]}
];"""


def type_text(text, interval=0.02):
    """Type text character by character"""
    for char in text:
        if char == '—':
            pyautogui.typewrite('—', interval=interval)
        else:
            pyautogui.typewrite(char, interval=interval)
        time.sleep(0.01)


def find_text(text):
    """Use Ctrl+F to find text"""
    pyautogui.hotkey('ctrl', 'f')
    time.sleep(0.3)
    pyautogui.typewrite(text, interval=0.02)
    time.sleep(0.5)
    pyautogui.press('escape')
    time.sleep(0.2)


def select_line():
    """Ctrl+L to select entire line"""
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.2)


def delete_line():
    """Delete current line content"""
    select_line()
    pyautogui.press('delete')
    time.sleep(0.2)


def go_to_start():
    """Go to start of file"""
    pyautogui.hotkey('ctrl', 'home')
    time.sleep(0.3)


def go_to_line(down_count):
    """Navigate down by lines"""
    for i in range(down_count):
        pyautogui.press('down')
        if i % 10 == 0:
            time.sleep(0.05)


def wait_for_user(prompt):
    """Wait for user to press Enter"""
    input(f"\n{prompt}\nPress Enter to continue...")


def step1_open_editor():
    """Step 1: Open game.js in editor"""
    print("\n" + "="*60)
    print("STEP 1: Open game.js in Effect House editor")
    print("="*60)
    print("""
Instructions:
1. Open Effect House
2. Create new project from 'Personality Quiz' template
3. Wait for project to load
4. Click on 'Scripts' in left panel
5. Double-click on 'game.js' to open it
6. Click inside the code editor to focus it
""")
    wait_for_user("When game.js is open in editor, press Enter...")


def step2_find_questions():
    """Step 2: Find and replace QUESTIONS"""
    print("\n" + "="*60)
    print("STEP 2: Replace QUESTIONS array")
    print("="*60)

    # Find the QUESTIONS line
    print("Finding 'const QUESTIONS'...")
    find_text("const QUESTIONS = [")

    # Select the entire QUESTIONS block
    # This is tricky - we need to select from [ to ];
    print("Selecting QUESTIONS content...")

    # Go down a few lines to get into the array
    go_to_line(2)

    # Select multiple lines (the entire questions array)
    # Hold shift and press down many times
    for _ in range(100):
        pyautogui.hotkey('shift', 'down')
        time.sleep(0.02)

    time.sleep(0.5)

    # Now type the new questions
    print("Typing new QUESTIONS...")
    type_text(QUESTIONS_ARRAY, interval=0.01)

    print("QUESTIONS updated!")


def step3_find_results():
    """Step 3: Find and replace RESULT_TYPES"""
    print("\n" + "="*60)
    print("STEP 3: Replace RESULT_TYPES array")
    print("="*60)

    print("Finding 'const RESULT_TYPES'...")
    find_text("const RESULT_TYPES = [")

    # Go down to get into the array
    go_to_line(2)

    # Select the entire results block
    for _ in range(50):
        pyautogui.hotkey('shift', 'down')
        time.sleep(0.02)

    time.sleep(0.5)

    # Type new results
    print("Typing new RESULT_TYPES...")
    type_text(RESULT_TYPES, interval=0.01)

    print("RESULT_TYPES updated!")


def step4_save():
    """Step 4: Save and build"""
    print("\n" + "="*60)
    print("STEP 4: Save and Build")
    print("="*60)

    print("Saving file (Ctrl+S)...")
    pyautogui.hotkey('ctrl', 's')
    time.sleep(2)

    print("Building project (Ctrl+B)...")
    pyautogui.hotkey('ctrl', 'b')
    time.sleep(5)

    print("\nBuild complete! Check Effect House for any errors.")


def run_guided_update():
    """Run guided update with user interaction at each step"""
    print("""
================================================================================
EFFECT HOUSE QUIZ UPDATE - GUIDED AUTOMATION
================================================================================
This script will help you update the quiz questions step by step.
You will need to interact at each step to confirm the editor is ready.

The script uses keyboard shortcuts only (Ctrl+F, Ctrl+L, Ctrl+S, Ctrl+B)
No clipboard is needed - Monaco editor shortcuts work directly.
================================================================================
    """)

    step1_open_editor()
    step2_find_questions()
    step3_find_results()
    step4_save()

    print("""
================================================================================
AUTOMATION COMPLETE!
================================================================================
If questions weren't updated correctly, you can manually edit in Effect House:
1. Use Ctrl+F to find text
2. Use Ctrl+L to select line
3. Type to replace

Check the working HTML quiz at: tiktok-character-quiz/index.html
for the correct question text and answers.
================================================================================
    """)


def test_monaco_shortcuts():
    """Test if Monaco shortcuts work in current window"""
    print("Testing Monaco editor shortcuts...")

    # Try Ctrl+F
    print("1. Testing Ctrl+F (Find)...")
    pyautogui.hotkey('ctrl', 'f')
    time.sleep(0.5)

    # Type test
    print("2. Typing 'test'...")
    pyautogui.typewrite('test', interval=0.1)
    time.sleep(0.5)

    # Escape to close
    pyautogui.press('escape')
    time.sleep(0.3)

    # Try Ctrl+L
    print("3. Testing Ctrl+L (Select line)...")
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.3)

    print("Test complete. If shortcuts worked, Monaco is responding.")


def main():
    if len(sys.argv) < 2:
        print("""
PRECISE QUIZ EDITOR FOR EFFECT HOUSE
===================================

Usage: python precise_quiz_editor.py [action]

Actions:
  guide    - Run guided step-by-step update
  test     - Test Monaco editor shortcuts
  help     - Show this help

IMPORTANT: Before running 'guide':
1. Open Effect House
2. Create project from Personality Quiz template
3. Open game.js in editor
4. Click on the code editor to focus it
        """)
        return

    action = sys.argv[1].lower()

    if action == 'guide':
        run_guided_update()
    elif action == 'test':
        test_monaco_shortcuts()
    elif action == 'help':
        main()


if __name__ == "__main__":
    main()
