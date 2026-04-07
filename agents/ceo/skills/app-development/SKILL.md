---
name: app-development
description: >
  Use when: CEO needs to create a new app, generate app specifications,
  or delegate app development tasks to engineering team.
  Do NOT use when: Routine management, HR decisions, or marketing tasks.
---

# App Development Skill

## ONE COMMAND App Creation

When CEO receives request to create an app, execute:

### Step 1: Parse Request
- Extract app name, type (web/mobile/game), core features
- Determine tech stack based on requirements

### Step 2: Create Project Structure
```
/projects/{app-name}/
├── SPEC.md
├── frontend/
├── backend/
├── mobile/
└── README.md
```

### Step 3: Delegate to Team
- **CTO**: System architecture, tech stack decisions
- **Frontend Engineer**: Web UI implementation
- **Backend Engineer**: API, database, server logic
- **Mobile Engineer**: iOS/Android app
- **UX/UI Designer**: User interface and experience
- **QA Engineer**: Testing and quality assurance

### Step 4: Monitor Progress
- Check issues daily
- Ensure deadline adherence
- Report to CEO on milestones

## Game Creation
Use scripts:
- `create-game.sh` or `create-game.ps1` for quick game scaffold
- Delegate to Mobile/Frontend for actual game implementation

## App Types We Support
- Web Applications (React, Vue, Angular)
- Mobile Apps (Flutter, React Native)
- Desktop Apps (Electron)
- Games (Canvas, WebGL, Unity)