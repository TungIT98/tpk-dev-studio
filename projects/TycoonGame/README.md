# TycoonGame

A multiplayer web tycoon game built with:
- **Phaser 3 + TypeScript** (web client) with Colyseus multiplayer
- **FastAPI + PostgreSQL + Redis** (economy backend)
- **Roblox Lua + Rojo** (optional companion game)

## Quick Start

### 1. Start infrastructure (Docker)

```bash
docker compose up -d
```

This starts PostgreSQL (`localhost:5432`) and Redis (`localhost:6379`).

### 2. Set up backend

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
python seed_test_data.py
uvicorn app.main:app --reload --port 8000
```

### 3. Set up web client

```bash
cd client
npm install
npm run dev          # dev server at http://localhost:5173
npm run build         # production build → dist/
```

### 4. Open the game

Navigate to `http://localhost:5173` in your browser.

## Project Structure

```
TycoonGame/
├── default.project.json          # Rojo project config
├── src/
│   ├── ServerScriptService/
│   │   ├── Modules/
│   │   │   ├── DataStoreService.lua    # Player data persistence
│   │   │   ├── BusinessManager.lua      # Business purchase/upgrade logic
│   │   │   ├── UpgradeService.lua      # Upgrade purchase logic
│   │   │   ├── PrestigeService.lua     # Prestige/rebirth system
│   │   │   └── IncomeService.lua       # Income rate calculations
│   │   └── Scripts/
│   │       └── TycoonServer.lua        # Main server controller
│   ├── ReplicatedStorage/
│   │   ├── Modules/
│   │   │   ├── BusinessConfig.lua      # 10 business definitions
│   │   │   ├── UpgradeConfig.lua       # Upgrade definitions
│   │   │   ├── TycoonData.lua          # Shared data utilities
│   │   │   └── TycoonClient.lua        # Client utilities
│   │   └── RemoteEvents/              # Remote event definitions
│   ├── StarterGui/
│   │   └── TycoonUI.lua               # Full game HUD (business cards, upgrades, stats)
│   └── Workspace/
│       └── WorkspaceSetup.lua         # World creation
```

## Features

- **10 Business Tiers**: Lemonade Stand → Space Program
- **Idle Income System**: Businesses generate income automatically
- **Offline Earnings**: Earn 50% income while away (up to 8 hours)
- **4 Upgrade Types**: Speed Boost, Value Increase, Auto-Collect, Manager
- **Prestige System**: Reset progress for permanent multipliers (up to Diamond Tycoon)
- **Full UI**: Business cards, upgrade shop, stats panel, currency HUD
- **Data Persistence**: Saves via Roblox DataStoreService
- **Sound Effects**: Feedback for all player actions

## Building

```bash
cd projects/TycoonGame
rojo build --output TycoonGame.rbxlx
```

## Playing

1. Open `TycoonGame.rbxlx` in Roblox Studio
2. Start a local server (Play button)
3. Each player starts with $0 and can buy their first business

## Game Mechanics

- **Income**: Each business has a base income per tick. Owning multiple of the same business multiplies income.
- **Upgrade Costs**: Scale exponentially with level/count
- **Prestige**: Available once you've earned $1M. Resets progress but grants Prestige Points that give permanent income multipliers (10% per prestige level)
- **Auto-Collect**: No need to click collect — income auto-accumulates
- **Manager**: Auto-buys the next affordable business

## Business Progression

| # | Business | Base Cost | Base Income | Tick Rate |
|---|----------|-----------|-------------|-----------|
| 1 | Lemonade Stand | $50 | $1/s | 1s |
| 2 | Newspaper Route | $500 | $5/s | 1s |
| 3 | Car Wash | $3K | $25/s | 1.5s |
| 4 | Pizza Shop | $15K | $120/s | 2s |
| 5 | Donut Shop | $75K | $500/s | 2.5s |
| 6 | Shrimp Boat | $400K | $2K/s | 3s |
| 7 | Spa Resort | $2M | $8K/s | 3.5s |
| 8 | Tech Company | $15M | $35K/s | 4s |
| 9 | Movie Studio | $100M | $150K/s | 5s |
| 10 | Space Program | $750M | $750K/s | 6s |
