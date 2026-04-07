# TikTok Effect Game — Game Design Document
**Project:** Which TikTok Character Are You?
**Version:** 1.0
**Date:** 2026-04-06
**Status:** Draft (CTO Planning)
**Parent Task:** [TKPA-5984](/7fbb2529/issues/TKPA-5984)

---

## 1. Concept & Vision

**"Which TikTok Character Are You?"** — A personality quiz filter that reveals which iconic TikTok creator archetype the user most resembles. Results are dramatic, colorful, and designed to be screen-recorded and shared.

The effect opens with a cinematic title card, walks through 5 quick questions with bold animated answers, then delivers a theatrical result reveal with particle effects and text overlays. Users immediately see their character type and want to share the screen recording.

**Why this concept:**
- Platform-native: plays directly into TikTok's creator culture
- High shareability: results are opinionated conversation-starters
- Simple 2-second onboarding: user sees the title card and taps "Start"
- 5 questions, ~15 seconds total experience

---

## 2. Visual Style

**Aesthetic:** Bold, neon-accented, high-contrast — reminiscent of TikTok's dark UI with vibrant accent colors. Not clean/minimal — punchy and energetic.

**Color Palette:**
- Background: `#0D0D0D` (TikTok dark)
- Primary accent: `#FE2C55` (TikTok red/pink)
- Secondary accent: `#25F4EE` (TikTok cyan)
- Tertiary: `#000000` (pure black for contrast panels)
- Text: `#FFFFFF`

**Typography:** Large, bold, sans-serif. TikTok Effect House supports text rendering with custom font styling.

**Animations:**
- Question transitions: slide + fade (300ms ease-out)
- Answer selection: scale pulse (1.0 → 1.1 → 1.0, 200ms)
- Wrong answers: shake (3-frame horizontal offset)
- Result reveal: 1.5s cinematic — particle burst, zoom, glow

---

## 3. Quiz Questions & Answer Logic

Each answer maps to one of 4 result archetypes. No branching — all questions funnel to the same result types regardless of path.

### Question 1: "Pick your vibe"
- A) Chaos king/queen — wild energy
- B) Clean and aesthetic — curated perfection
- C) Comfy king — lounging content
- D) Drama llama — always something going on

### Question 2: "Your ideal upload time"
- A) 3AM — no sleep, no filter
- B) Peak hours — 6-9PM for max views
- C) Golden hour — soft lighting aesthetic
- D) When the drama is hot — moment matters most

### Question 3: "Sound matters because..."
- A) The beat is the story
- B) It sets the aesthetic mood
- C) Good sound = cozy ASMR vibes
- D) It's the tea announcer

### Question 4: "Pick a collaboration style"
- A) Tag everyone, duel anyone
- B) Matching aesthetics only
- C) Duets only, I'm chill
- D) I start the trends they follow

### Question 5: "Your comment section energy"
- A) I'm in the replies starting discourse
- B) I reply to spread positivity
- C) I read every reply like a cozy newsletter
- D) I screenshot and react

### Scoring:
Each answer maps: A=1, B=2, C=3, D=4.
Sum of 5 answers → lowest=Type1, highest=Type4, middle two ranges=Type2/Type3.

---

## 4. Result Types

| Result | Score Range | Description | Visual Theme |
|--------|-------------|-------------|--------------|
| **Type 1: The Algorithm Gambler** | 5–8 | Posts at 3AM, thrives on chaos, rides every trend before it peaks. You're either genius or unhinged (maybe both). | Neon red bg, fire emoji, lightning particles |
| **Type 2: The Aesthetic Architect** | 9–12 | Every frame a mood board. Your content is clean, curated, and effortlessly gorgeous. Beauty is the brand. | Soft gradient bg, sparkle particles, rose gold accents |
| **Type 3: The Comfy King/Queen** | 13–16 | Cozy content, warm vibes, ASMR-lite. You turned comfort into a lifestyle brand. | Warm orange bg, cloud shapes, heart particles |
| **Type 4: The Drama Magnet** | 17–20 | The comment section is your stage. Every post is a chapter in an ongoing saga. Your life is content. | Dark purple bg, star burst, lightning + sparkle combo |

---

## 5. Interaction Flow

```
[START] → Tap "Start Quiz" button
    ↓
[Q1] → Display question + 4 animated answer cards
       ↓ (tap)
[Q2] → Same UI, next question
       ↓
[Q3] → Same UI
       ↓
[Q4] → Same UI
       ↓
[Q5] → Same UI
       ↓
[LOADING] → 1s suspense build ("Calculating your type...")
       ↓
[RESULT] → Full-screen cinematic reveal
           - Result title (large, bold)
           - 1-line description
           - Animated particles
           - "Tap to retake" + "Share" buttons
```

---

## 6. Technical Requirements

**Platform:** TikTok Effect House
**Language:** JavaScript/TypeScript (Effect House SDK)
**Assets needed:**
- 1 background video/particle loop
- 5 question slides (text overlays)
- 4 result reveal screens (with unique particle configs)
- Tap interaction zones for each answer
- "Start" and "Retake" buttons

**Effect House SDK features used:**
- Scene management (quiz state machine)
- Tap trigger detection
- Text rendering with custom fonts
- Particle systems
- Scene transitions

**Constraints:**
- Effect must be <10MB for TikTok submission
- Max 30 second experience
- Works on front-facing camera (selfie mode)

---

## 7. Timeline & Milestones

| Milestone | Target | Owner |
|-----------|--------|-------|
| GDD Finalized | 2026-04-06 | CTO (this doc) |
| Effect House Setup | 2026-04-07 | Game Dev |
| Core Quiz Logic | 2026-04-09 | Game Dev |
| Visual Polish + Animations | 2026-04-11 | Game Dev |
| Mobile Testing | 2026-04-13 | Game Dev |
| QA Sign-off | 2026-04-14 | QA |
| TikTok Submission | 2026-04-15 | Game Dev |

**Target: Live on TikTok by 2026-04-15 (9 days)**

---

## 8. Success Metrics

- Views via Effect House analytics
- Screen recordings shared on TikTok
- Effect House featured ranking
- Follower bump from effect exposure

---

## 9. Subtasks Reference

| ID | Task | Assignee | Status |
|----|------|----------|--------|
| TKPA-5986 | Planning / GDD | CTO | in_progress |
| TKPA-5987 | Build Effect | Game Dev | blocked on 5986 |
| TKPA-5988 | QA Testing | QA | blocked on 5987 |
