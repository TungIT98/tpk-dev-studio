# CEO TOOLS.md - TKP DEV STUDIO

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/{id}/goals` | List all goals |
| POST | `/api/companies/{id}/goals` | Create goal |
| GET | `/api/companies/{id}/issues` | List issues |
| POST | `/api/companies/{id}/issues` | Create issue |
| PATCH | `/api/issues/{id}` | Update issue |
| POST | `/api/agents/{id}/heartbeat/invoke` | Trigger agent |

## Company ID

```
7fbb2529-7d69-4177-bb6b-988404c35965
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `C:\Users\PC\.paperclip\instances\default\workspaces\tkp-dev-studio` | Company root |
| `projects/` | All client projects |
| `agents/` | Agent configurations |
| `scripts/` | Automation scripts |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/create-game.sh` | Create new game project |
| `scripts/create-app.sh` | Create new web/mobile app |

## Agent Management

### Create Issue
```bash
POST /api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/issues
{
  "title": "[Project] Name",
  "description": "Details",
  "assigneeAgentId": "agent-id",
  "priority": "high"
}
```

### Assign to Agent
```bash
PATCH /api/issues/{issueId}
{
  "assigneeAgentId": "agent-id"
}
```

### Trigger Agent Heartbeat
```bash
POST /api/agents/{agentId}/heartbeat/invoke
```

---

*Version: 1.0*
