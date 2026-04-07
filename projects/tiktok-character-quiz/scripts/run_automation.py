# run_automation.py
# Automated quiz update for Effect House
# Run this AFTER opening game.js in the editor

import pyautogui
import time
import sys

pyautogui.PAUSE = 0.3

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

RESULT_TYPES = """const RESULT_TYPES = [
    { id: "TYPE_1", name: "The Algorithm Gambler", range: [5, 8],
      description: "Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both).",
      visualTheme: { bgColor: "#FE2C55", particleColor: "#FF6B8A", emoji: "fire", accentColor: "#FF9EC4" } },
    { id: "TYPE_2", name: "The Aesthetic Architect", range: [9, 12},
      description: "Every frame a mood board. Your content is clean, curated, and effortlessly gorgeous. Beauty is the brand.",
      visualTheme: { bgColor: "#25F4EE", particleColor: "#7FFEFF", emoji: "sparkle", accentColor: "#FFE29A" } },
    { id: "TYPE_3", name: "The Comfy King/Queen", range: [13, 16],
      description: "Cozy content, warm vibes, ASMR-lite. You turned comfort into a lifestyle brand.",
      visualTheme: { bgColor: "#FF8C42", particleColor: "#FFB347", emoji: "cloud", accentColor: "#FFD1DC" } },
    { id: "TYPE_4", name: "The Drama Magnet", range: [17, 20},
      description: "The comment section is your stage. Every post is a chapter in an ongoing saga. Your life is content.",
      visualTheme: { bgColor: "#9B59B6", particleColor: "#D4A5FF", emoji: "star", accentColor: "#FF79C6" } }
];"""

def type_fast(text):
    """Type text quickly"""
    for char in text:
        pyautogui.typewrite(char, interval=0.008)
        time.sleep(0.005)


def find_and_replace(search_text, new_text):
    """Find text and replace it"""
    # Ctrl+F to find
    pyautogui.hotkey('ctrl', 'f')
    time.sleep(0.3)
    type_fast(search_text)
    time.sleep(0.5)
    pyautogui.press('escape')
    time.sleep(0.3)

    # Go to line start and select
    pyautogui.press('home')
    time.sleep(0.2)

    # Select entire line
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.2)

    # Delete and type new
    pyautogui.press('delete')
    time.sleep(0.2)
    type_fast(new_text)
    time.sleep(0.5)


def main():
    print("""
EFFECT HOUSE AUTOMATION
======================
Make sure:
1. Effect House is open
2. game.js is open in editor
3. Code editor is focused (click inside it)

Automation will start in 5 seconds...
    """)

    time.sleep(5)

    print("Starting automation...")

    # Replace QUESTIONS
    print("1. Finding and replacing QUESTIONS...")
    find_and_replace("const QUESTIONS", QUESTIONS_ARRAY)

    print("2. Finding and replacing RESULT_TYPES...")
    find_and_replace("const RESULT_TYPES", RESULT_TYPES)

    print("3. Saving file...")
    pyautogui.hotkey('ctrl', 's')
    time.sleep(2)

    print("4. Building project...")
    pyautogui.hotkey('ctrl', 'b')
    time.sleep(5)

    print("""
DONE!
Check the editor to see if changes were applied.
If questions look wrong, you can undo (Ctrl+Z) and try again.

Move mouse to top-left corner to abort at any time (failsafe).
    """)


if __name__ == "__main__":
    main()
