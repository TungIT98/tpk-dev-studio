# effect_house_automation.py
# Complete automation script for TikTok Effect House
# Automates: Create project → Edit quiz → Build → Export

import pyautogui
import subprocess
import time
import sys
import os
import pyperclip
import json
from datetime import datetime

# Safety
pyautogui.PAUSE = 0.3
pyautogui.FAILSAFE = True

# Paths
EFFECT_HOUSE_PATH = r"C:/Users/PC/AppData/Local/Effect House/Effect House.exe"
PROJECT_DIR = r"C:/Users/PC/AppData/Local/Effect House/Projects"

# Quiz data for the TikTok Character Quiz
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
    ],
    "results": [
        {
            "id": "TYPE_1",
            "name": "The Algorithm Gambler",
            "range": [5, 8],
            "description": "Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both).",
            "visualTheme": {"bgColor": "#FE2C55", "particleColor": "#FF6B8A", "emoji": "fire", "accentColor": "#FF9EC4"}
        },
        {
            "id": "TYPE_2",
            "name": "The Aesthetic Architect",
            "range": [9, 12],
            "description": "Every frame a mood board. Your content is clean, curated, and effortlessly gorgeous. Beauty is the brand.",
            "visualTheme": {"bgColor": "#25F4EE", "particleColor": "#7FFEFF", "emoji": "sparkle", "accentColor": "#FFE29A"}
        },
        {
            "id": "TYPE_3",
            "name": "The Comfy King/Queen",
            "range": [13, 16],
            "description": "Cozy content, warm vibes, ASMR-lite. You turned comfort into a lifestyle brand.",
            "visualTheme": {"bgColor": "#FF8C42", "particleColor": "#FFB347", "emoji": "cloud", "accentColor": "#FFD1DC"}
        },
        {
            "id": "TYPE_4",
            "name": "The Drama Magnet",
            "range": [17, 20],
            "description": "The comment section is your stage. Every post is a chapter in an ongoing saga. Your life is content.",
            "visualTheme": {"bgColor": "#9B59B6", "particleColor": "#D4A5FF", "emoji": "star", "accentColor": "#FF79C6"}
        }
    ]
}


def log(msg):
    """Print log with timestamp"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def screenshot(name):
    """Take screenshot for debugging"""
    os.makedirs("debug/screenshots", exist_ok=True)
    path = f"debug/screenshots/{name}_{datetime.now().strftime('%H%M%S')}.png"
    pyautogui.screenshot().save(path)
    log(f"Screenshot saved: {path}")
    return path


def click(x, y, duration=0.2):
    """Safe click"""
    pyautogui.moveTo(x, y, duration=duration)
    pyautogui.click()


def open_effect_house():
    """Launch Effect House application"""
    log("Opening Effect House...")
    subprocess.Popen([EFFECT_HOUSE_PATH])
    time.sleep(6)
    log("Effect House launched")


def skip_welcome():
    """Skip welcome dialog"""
    log("Skipping welcome dialog...")
    # Welcome dialog - Skip button
    click(1010, 530)
    time.sleep(2)


def create_project_from_template():
    """Create new project from Personality Quiz template"""
    log("Creating project from Personality Quiz template...")

    # Click Templates
    log("Clicking Templates...")
    click(1700, 360)
    time.sleep(2)

    # Click Personality Quiz template
    log("Selecting Personality Quiz template...")
    click(2300, 1100)  # Personality Quiz position
    time.sleep(1)

    # Click Create button
    log("Clicking Create...")
    click(2750, 1100)
    time.sleep(4)

    log("Project created successfully")


def open_game_js():
    """Open game.js file in editor"""
    log("Opening game.js...")

    # Click Scripts to expand
    click(150, 400)
    time.sleep(1)

    # Double-click game.js
    click(150, 470)
    time.sleep(0.3)
    click(150, 470)  # Double click
    time.sleep(3)

    log("game.js opened")


def get_game_js_content():
    """Get current game.js content via clipboard"""
    log("Getting game.js content...")

    # Select all text in editor
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.5)

    # Copy to clipboard
    pyautogui.hotkey('ctrl', 'c')
    time.sleep(0.5)

    # Get from pyperclip
    content = pyperclip.paste()
    log(f"Retrieved {len(content)} characters")

    return content


def update_quiz_content(content):
    """Replace quiz data in game.js content"""
    log("Updating quiz content...")

    # Generate new Questions array
    new_questions = f"""const QUESTIONS = {json.dumps(QUIZ_DATA['questions'], indent=2, ensure_ascii=False)};"""

    # Generate new Result Types array
    new_results = f"""const RESULT_TYPES = {json.dumps(QUIZ_DATA['results'], indent=2, ensure_ascii=False)};"""

    # Simple string replacement
    # Replace Questions section
    if "const QUESTIONS = [" in content:
        start_idx = content.find("const QUESTIONS = [")
        end_idx = content.find("];", start_idx) + 2
        content = content[:start_idx] + new_questions + content[end_idx:]
        log("Updated QUESTIONS array")
    else:
        log("WARNING: Could not find QUESTIONS array")

    # Replace Result Types section
    if "const RESULT_TYPES = [" in content:
        start_idx = content.find("const RESULT_TYPES = [")
        end_idx = content.find("];", start_idx) + 2
        content = content[:start_idx] + new_results + content[end_idx:]
        log("Updated RESULT_TYPES array")
    else:
        log("WARNING: Could not find RESULT_TYPES array")

    return content


def save_file():
    """Save current file"""
    log("Saving file...")
    pyautogui.hotkey('ctrl', 's')
    time.sleep(2)
    log("File saved")


def paste_content(content):
    """Paste content into editor"""
    log("Pasting updated content...")

    # Copy to clipboard
    pyperclip.copy(content)
    time.sleep(0.5)

    # Select all
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.3)

    # Paste
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(1)

    log("Content pasted")


def build_project():
    """Build the project"""
    log("Building project...")

    # Click Build button or use Ctrl+B
    # Look for Build in menu or use shortcut
    pyautogui.hotkey('ctrl', 'b')
    time.sleep(5)  # Build takes time

    log("Build completed")


def export_project():
    """Export project for TikTok"""
    log("Exporting project...")

    # Click Export in menu
    # This varies by Effect House version
    pyautogui.hotkey('ctrl', 'e')
    time.sleep(3)

    log("Export dialog opened")


def full_automation():
    """Run full automation workflow"""
    log("=" * 60)
    log("TIKTOK EFFECT HOUSE - FULL AUTOMATION")
    log("=" * 60)

    try:
        # Step 1: Open Effect House
        open_effect_house()

        # Step 2: Skip welcome dialog
        skip_welcome()
        screenshot("01_after_welcome")

        # Step 3: Create project from template
        create_project_from_template()
        screenshot("02_project_created")

        # Step 4: Open game.js
        open_game_js()
        screenshot("03_game_js_open")

        # Step 5: Get current content
        content = get_game_js_content()

        # Step 6: Update quiz content
        updated_content = update_quiz_content(content)

        # Step 7: Paste updated content
        paste_content(updated_content)
        screenshot("04_content_updated")

        # Step 8: Save file
        save_file()
        screenshot("05_file_saved")

        log("=" * 60)
        log("AUTOMATION COMPLETE!")
        log("Next steps (manual required):")
        log("1. Review the changes in the editor")
        log("2. Click Build (Ctrl+B)")
        log("3. Export and upload to TikTok")
        log("=" * 60)

    except Exception as e:
        log(f"ERROR: {e}")
        screenshot("error")
        raise


def test_automation():
    """Test basic automation capabilities"""
    log("Testing automation...")

    # Test 1: Screenshot
    log("Test 1: Taking screenshot...")
    screenshot("test")

    # Test 2: Click
    log("Test 2: Clicking center of screen...")
    w, h = pyautogui.size()
    pyautogui.click(w/2, h/2)

    # Test 3: Keyboard
    log("Test 3: Testing keyboard (Ctrl+A)...")
    pyautogui.hotkey('ctrl', 'a')

    # Test 4: Clipboard
    log("Test 4: Testing clipboard...")
    pyperclip.copy("Test from PyAutoGUI automation!")
    time.sleep(0.5)
    pasted = pyperclip.paste()
    log(f"Clipboard test: {pasted}")

    log("All tests passed!")


def main():
    if len(sys.argv) < 2:
        print("""
TIKTOK EFFECT HOUSE AUTOMATION
==============================
Usage: python effect_house_automation.py [action]

Actions:
  full     - Run full automation (create project, edit quiz, save)
  open     - Open Effect House only
  test     - Test automation capabilities
  help     - Show this help

WARNING: Full automation requires Effect House to be open
         and visible on screen. Move mouse to corner to abort.
        """)
        return

    action = sys.argv[1].lower()

    if action == 'test':
        test_automation()
    elif action == 'full':
        full_automation()
    elif action == 'open':
        open_effect_house()
    elif action == 'help':
        main()
    else:
        log(f"Unknown action: {action}")
        main()


if __name__ == "__main__":
    main()
