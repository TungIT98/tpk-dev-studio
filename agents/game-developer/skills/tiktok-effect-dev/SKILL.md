---
name: tiktok-effect-dev
description: >
  Use when: Building TikTok Effect Games, AR filters, interactive effects
  for TikTok platform.
  Do NOT use when: Web development, mobile apps (Flutter/React Native),
  or non-TikTok game platforms (Unity, Roblox).
---

# TikTok Effect Game Development

## Overview

Build engaging games and AR effects for TikTok using Effect House SDK.

## Getting Started

### 1. Effect House Setup
- Sign up at: https://effecthouse.tiktok.com/
- Download Effect House app (for preview on mobile)
- Download Effect House Editor (for development)
- Learn the interface

### 2. Effect House Editor
- Similar to game engines (Unity-lite)
- Node-based logic or JavaScript scripting
- Built-in templates to start from

### 3. Game Types on TikTok Effect House

#### Interactive Games
- Tap/click games
- Swipe games
- Physics-based puzzles
- Reaction games
- Memory games

#### AR Filters
- Face filters
- World effects
- Hand tracking effects

### 4. Tech Stack
- **Language:** JavaScript (primary), TypeScript
- **Graphics:** WebGL, Canvas, or built-in Effect House components
- **Physics:** Built-in physics engine or custom

## Publishing Flow

```
1. Create effect in Editor
2. Test locally or on mobile via Effect House app
3. Submit for TikTok review
4. TikTok reviews (usually 1-3 days)
5. Published to TikTok Effect House
6. Users find your effect via TikTok camera
```

## Viral Success Tips

1. **Quick to understand** - Users get it in 2-3 seconds
2. **One-button mechanic** - Keep controls simple
3. **Satisfying feedback** - Haptic, sound, visual effects
4. **Shareable score** - Show high scores for bragging rights
5. **Trending themes** - Align with current TikTok trends

## Example: Simple Tap Game

```javascript
// Tap the target as many times as possible in 10 seconds
const GAME_DURATION = 10; // seconds
let score = 0;
let timeLeft = GAME_DURATION;
let gameActive = false;

function startGame() {
  score = 0;
  timeLeft = GAME_DURATION;
  gameActive = true;
  spawnTarget();
  startTimer();
}

function spawnTarget() {
  // Random position within play area
  const x = Math.random() * 0.8 + 0.1; // 10% to 90%
  const y = Math.random() * 0.8 + 0.1;
  // Move target to random position
  target.setPosition(x, y);
}

function onTargetTap() {
  if (!gameActive) return;
  score++;
  spawnTarget(); // New target
  // Visual feedback
  playSound('tap');
  triggerHaptic();
}

function startTimer() {
  setInterval(() => {
    timeLeft--;
    updateUI(`${timeLeft}s | Score: ${score}`);
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false;
  showResults(score);
}
```

## Example: Swipe Game

```javascript
// Swipe to cut objects, similar to Fruit Ninja
let blades = [];

function onTouchMove(touch) {
  // Create blade trail at touch position
  const blade = createBladeTrail(touch.x, touch.y);
  blades.push(blade);

  // Check collision with objects
  objects.forEach(obj => {
    if (blade.intersects(obj)) {
      obj.destroy();
      addScore(10);
      createParticles(obj.x, obj.y);
    }
  });
}

function onTouchEnd() {
  // Fade out all active blades
  blades.forEach(blade => blade.fade());
  blades = [];
}
```

## Performance Tips

1. **Keep draw calls low** - Batch similar objects
2. **Use object pooling** - Reuse objects instead of creating new
3. **Optimize for mobile** - Test on lower-end devices
4. **Limit particle effects** - They can be heavy
5. **Use compressed assets** - Keep effect file size small (<10MB)

## Monetization

- TikTok Effect House has **Effect Creator Rewards** program
- Based on usage and engagement metrics
- Must meet minimum requirements to qualify

## Resources

- Effect House: https://effecthouse.tiktok.com
- Documentation: https://effecthouse.tiktok.com/help
- Creator Community: Join Effect House Discord
- Tutorials: Search "Effect House tutorial" on YouTube

## Project Structure

```
projects/
  tiktok-effect-game/
    src/
      game.js          # Main game logic
      ui.js            # UI elements
      assets/          # Images, sounds
    project.json       # Effect House project file
    README.md          # Instructions
```
