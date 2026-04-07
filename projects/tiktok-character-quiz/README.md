# Which TikTok Character Are You?
## TikTok Effect House — Personality Quiz Filter

**GDD:** `docs/tiktok-effect-gdd.md`
**Platform:** TikTok Effect House (JavaScript/TypeScript SDK)
**Timeline:** Ship by 2026-04-15

---

## Project Structure

```
tiktok-character-quiz/
├── index.html          # ⭐ PLAYABLE PROTOTYPE — open in browser to test
├── project.json         # Effect House project config
├── src/
│   ├── main.js          # Effect House SDK entry point (with local test harness)
│   ├── effectHouse.js   # Production Effect House module (pure SDK API)
│   ├── QuizManager.js   # State machine
│   ├── quizData.js      # Questions, answers, result types
│   └── visualEffects.js # Particle systems and animations
├── docs/
│   └── tiktok-effect-gdd.md  # Game Design Document
└── README.md
```

---

## How to Run the Prototype

**Open `index.html` in any browser** — no server needed. Fully functional quiz experience.

---

## How to Deploy to TikTok Effect House

### Step 1: Download Effect House
1. Go to https://effecthouse.tiktok.com
2. Download Effect House for macOS or Windows
3. Install and sign in with your TikTok account

### Step 2: Create New Project
1. Open Effect House → **Create New Project**
2. Select **Quiz** template
3. Name it: `Which TikTok Character Are You`

### Step 3: Import Scripts
1. Copy the contents of `src/effectHouse.js` into the Effect House script editor
2. The file uses standard Effect House SDK API — no modifications needed

### Step 4: Set Up UI Screens
In Effect House's visual editor, create the following screens:

#### Screen 1: Start
- Full-screen dark background (#0D0D0D)
- Title: "Which TikTok Character Are You?" (bold, large)
- Subtitle: "5 questions · 4 unique results"
- "Start Quiz" button (gradient: #FE2C55 → #FF6B8A, rounded)

#### Screen 2: Question (×5)
- Progress bar at top (gradient: #FE2C55 → #25F4EE)
- Question text (large, bold, white)
- 4 answer cards (vertical stack, rounded rectangles)
- Answer transitions: slide+fade 300ms

#### Screen 3: Loading
- Dark background
- "Calculating your type..." text
- Pulsing orb animation (1.5s)
- Duration: 1 second

#### Screen 4: Result (×4 variants)
- Full-screen gradient backgrounds per result type:
  - Algorithm Gambler: radial #FE2C55 → #0D0D0D
  - Aesthetic Architect: radial #25F4EE → #0D0D0D
  - Comfy King/Queen: radial #FF8C42 → #0D0D0D
  - Drama Magnet: radial #9B59B6 → #0D0D0D
- Large emoji (centered): 🔥 ✨ ☁️ ⭐
- Result name (large, bold)
- Description (1-2 lines)
- "Retake" + "Share" buttons

### Step 5: Particle Effects
- Use Effect House particle system
- Config per result type (colors in GDD Section 4)
- Burst on result reveal (1.5s cinematic)

### Step 6: Connect Script
1. Set `onStart()` → trigger start screen
2. Set tap triggers on each answer button → call `onTap(x, y)`
3. Set button tap triggers for Start/Retake/Share
4. Map screen visibility to state machine outputs

### Step 7: Test
1. Click **Preview** in Effect House
2. Test on mobile via Effect House companion app
3. Verify all 5 questions flow correctly
4. Verify all 4 result types appear for their score ranges

### Step 8: Submit
1. Click **Submit** in Effect House
2. Fill in effect metadata:
   - Name: `Which TikTok Character Are You?`
   - Category: Quiz / Personality
   - Tags: quiz, tiktok, personality, fun
3. Review TikTok policies (content must be appropriate)
4. Submit for TikTok review (~1-3 business days)

---

## Scoring Logic

| Question Answer | Value |
|----------------|-------|
| A | 1 |
| B | 2 |
| C | 3 |
| D | 4 |

**Total Score Range:** 5–20

| Score | Result |
|-------|--------|
| 5–8 | 🔥 The Algorithm Gambler |
| 9–12 | ✨ The Aesthetic Architect |
| 13–16 | ☁️ The Comfy King/Queen |
| 17–20 | ⭐ The Drama Magnet |

---

## Success Metrics (from GDD)

- Views via Effect House analytics
- Screen recordings shared on TikTok
- Effect House featured ranking
- Follower bump from effect exposure
