# keyboard_editor.py
# Uses ONLY keyboard navigation to edit code in Effect House Monaco editor
# No clipboard required - types directly

import pyautogui
import time
import sys
import os
import json

pyautogui.PAUSE = 0.1

QUIZ_QUESTIONS = [
    {"label": "A", "text": "Chaos king/queen — wild energy", "value": "1"},
    {"label": "B", "text": "Clean and aesthetic — curated perfection", "value": "2"},
    {"label": "C", "text": "Comfy king — lounging content", "value": "3"},
    {"label": "D", "text": "Drama llama — always something going on", "value": "4"}
]

QUIZ_UPLOAD_TIME = [
    {"label": "A", "text": "3AM — no sleep, no filter", "value": "1"},
    {"label": "B", "text": "Peak hours — 6-9PM for max views", "value": "2"},
    {"label": "C", "text": "Golden hour — soft lighting aesthetic", "value": "3"},
    {"label": "D", "text": "When the drama is hot — moment matters most", "value": "4"}
]

QUIZ_SOUND = [
    {"label": "A", "text": "The beat is the story", "value": "1"},
    {"label": "B", "text": "It sets the aesthetic mood", "value": "2"},
    {"label": "C", "text": "Good sound = cozy ASMR vibes", "value": "3"},
    {"label": "D", "text": "It's the tea announcer", "value": "4"}
]

QUIZ_COLLAB = [
    {"label": "A", "text": "Tag everyone, duel anyone", "value": "1"},
    {"label": "B", "text": "Matching aesthetics only", "value": "2"},
    {"label": "C", "text": "Duets only, I'm chill", "value": "3"},
    {"label": "D", "text": "I start the trends they follow", "value": "4"}
]

QUIZ_COMMENT = [
    {"label": "A", "text": "I'm in the replies starting discourse", "value": "1"},
    {"label": "B", "text": "I reply to spread positivity", "value": "2"},
    {"label": "C", "text": "I read every reply like a cozy newsletter", "value": "3"},
    {"label": "D", "text": "I screenshot and react", "value": "4"}
]

ALL_QUESTIONS = [
    ("Pick your vibe", QUIZ_QUESTIONS),
    ("Your ideal upload time", QUIZ_UPLOAD_TIME),
    ("Sound matters because...", QUIZ_SOUND),
    ("Pick a collaboration style", QUIZ_COLLAB),
    ("Your comment section energy", QUIZ_COMMENT)
]

RESULT_TYPES = [
    ("The Algorithm Gambler", "Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both)."),
    ("The Aesthetic Architect", "Every frame a mood board. Your content is clean, curated, and effortlessly gorgeous. Beauty is the brand."),
    ("The Comfy King/Queen", "Cozy content, warm vibes, ASMR-lite. You turned comfort into a lifestyle brand."),
    ("The Drama Magnet", "The comment section is your stage. Every post is a chapter in an ongoing saga. Your life is content.")
]


def type_text(text, interval=0.03):
    """Type text character by character"""
    for char in text:
        if char == '—':
            pyautogui.typewrite('—')  # Em dash
        elif char == '—':
            pyautogui.typewrite('—')
        else:
            pyautogui.typewrite(char, interval=interval)
        time.sleep(0.01)


def find_and_replace_line(search_text, new_text):
    """Use Ctrl+F to find text, then edit that line"""
    # Open find dialog
    pyautogui.hotkey('ctrl', 'f')
    time.sleep(0.3)

    # Type search text
    pyautogui.typewrite(search_text, interval=0.02)
    time.sleep(0.5)

    # Press Escape to close find (we found it)
    pyautogui.press('escape')
    time.sleep(0.2)

    # Select entire line Ctrl+L
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.2)

    # Delete line (keep pressing delete)
    for _ in range(100):
        pyautogui.press('delete')
        time.sleep(0.01)

    # Type new text
    type_text(new_text, interval=0.02)


def navigate_to_line(line_num):
    """Navigate to specific line number"""
    # Go to start
    pyautogui.hotkey('ctrl', 'home')
    time.sleep(0.2)

    # Press down arrow line_num times
    for i in range(line_num):
        pyautogui.press('down')
        if i % 10 == 0:
            time.sleep(0.05)


def delete_current_line():
    """Delete current line content"""
    # Select entire line
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.1)

    # Delete all
    pyautogui.press('delete')
    time.sleep(0.1)


def test_keyboard():
    """Test keyboard input works"""
    print("Testing keyboard typing...")
    # This will type in whatever window is focused
    pyautogui.typewrite("TEST KEYBOARD INPUT 123", interval=0.05)
    print("Keyboard test complete")


def full_manual_guide():
    """Generate step-by-step manual instructions"""
    print("""
================================================================================
EFFECT HOUSE QUIZ UPDATE - MANUAL STEP BY STEP
================================================================================

Since Effect House uses a custom Monaco editor with non-standard clipboard,
complete automation is not possible. Below is the fastest manual approach.

TIME: ~10-15 minutes manual work

--------------------------------------------------------------------------------
STEP 1: Open Effect House and Create Project
--------------------------------------------------------------------------------
1. Open Effect House
2. Click "Skip" on welcome dialog
3. Click "Templates" in the main screen
4. Find and click "Personality Quiz" template
5. Click "Create" button
6. Wait for project to load

--------------------------------------------------------------------------------
STEP 2: Open game.js
--------------------------------------------------------------------------------
1. In left panel, click "Scripts" to expand
2. Double-click "game.js" to open in editor

--------------------------------------------------------------------------------
STEP 3: Find and Replace Questions
--------------------------------------------------------------------------------
Press Ctrl+F and search for: "Pick your vibe"
Replace the entire first question block with:

{ id: 1, text: "Pick your vibe", answers: [
    { label: "A", text: "Chaos king/queen — wild energy", value: 1 },
    { label: "B", text: "Clean and aesthetic — curated perfection", value: 2 },
    { label: "C", text: "Comfy king — lounging content", value: 3 },
    { label: "D", text: "Drama llama — always something going on", value: 4 }
]}

REPEAT for each question:
- "Your ideal upload time"
- "Sound matters because..."
- "Pick a collaboration style"
- "Your comment section energy"

--------------------------------------------------------------------------------
STEP 4: Find and Replace Result Types
--------------------------------------------------------------------------------
Press Ctrl+F and search for: "The Algorithm Gambler"
Replace with:
{ id: "TYPE_1", name: "The Algorithm Gambler", range: [5, 8],
  description: "Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both).",
  visualTheme: { bgColor: "#FE2C55", particleColor: "#FF6B8A", emoji: "fire", accentColor: "#FF9EC4" }}

REPEAT for:
- "The Aesthetic Architect"
- "The Comfy King/Queen"
- "The Drama Magnet"

--------------------------------------------------------------------------------
STEP 5: Save and Build
--------------------------------------------------------------------------------
1. Press Ctrl+S to save
2. Press Ctrl+B to build
3. Click Export when ready

================================================================================
""")
    return """
    NOTE: The questions and answers ARE in the index.html file.
    You can preview the working quiz by opening:
    tiktok-character-quiz/index.html

    The Effect House version requires manual editing due to:
    1. Custom Monaco editor clipboard
    2. No external API access
    3. Proprietary project file format
    """


def main():
    if len(sys.argv) < 2:
        print("""
KEYBOARD-BASED EDITOR FOR EFFECT HOUSE
======================================

Usage: python keyboard_editor.py [action]

Actions:
  test     - Test keyboard input
  guide    - Show manual step-by-step guide
  demo     - Demo typing in current focused window

NOTE: Before using 'demo', open game.js in Effect House
      and click on the code editor to focus it.
        """)
        return

    action = sys.argv[1].lower()

    if action == 'test':
        test_keyboard()
    elif action == 'guide':
        guide = full_manual_guide()
        print(guide)
    elif action == 'demo':
        print("Typewriter demo - will type in focused window")
        time.sleep(2)
        pyautogui.typewrite("HELLO FROM PYAUTOGUI!", interval=0.1)


if __name__ == "__main__":
    main()
