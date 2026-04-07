# TKP Dev Studio - Setup Documentation

**Company ID:** `7fbb2529-7d69-4177-bb6b-988404c35965`
**Created:** 2026-03-30
**Status:** Active

---

## Company Overview

TKP Dev Studio is a full-service app development agency with 16 AI agents organized in a hierarchical structure.

### Organization Chart

```
CEO (ea43b600)
├── CTO (3ff25e94)
│   ├── Frontend Engineer (b7e8ffa5)
│   ├── Backend Engineer (d24ecb84)
│   ├── Mobile Engineer (c0d8506f)
│   ├── UX/UI Designer (8e7459b0)
│   ├── Security Engineer (e9840147)
│   ├── DevOps Engineer (a8fbdb89)
│   └── QA Engineer (71c1482f)
├── CMO (f26b49a7)
│   ├── SEO Specialist (50829e78)
│   ├── Content Director (4e4b16ef)
│   ├── Social Media Manager (597808eb)
│   ├── Copywriter (5592feba)
│   └── Graphic Designer (f6e8febe)
└── COO (2ad8668c)
```

---

## All 16 Agents

| # | Name | Agent ID | Role | Reports To | Skills |
|---|------|----------|------|------------|--------|
| 1 | CEO | ea43b600-0b73-4b4f-9fb8-38ec37161b5d | ceo | - | strategic-planning, app-development, project-management |
| 2 | CTO | 3ff25e94-b11a-4982-84a7-25eaab5ade16 | cto | CEO | system-architecture, fullstack-dev |
| 3 | CMO | f26b49a7-7df5-49cc-9ad8-1e2ff619e03d | cmo | CEO | marketing-strategy |
| 4 | COO | 2ad8668c-2c9a-49bf-b500-c59b671291b1 | coo | CEO | operations-management |
| 5 | Frontend Engineer | b7e8ffa5-23f5-4428-bced-3360f3dd4ffd | engineer | CTO | frontend-dev, fullstack-dev |
| 6 | Backend Engineer | d24ecb84-e046-417b-be50-41139991f6a9 | engineer | CTO | backend-dev |
| 7 | Mobile Engineer | c0d8506f-13ea-4b0a-a3de-0f72716a122c | engineer | CTO | mobile-dev, flutter-dev, ios-application-dev, android-native-dev |
| 8 | UX/UI Designer | 8e7459b0-e4bc-4362-8d0e-77d41df56611 | designer | CTO | ux-ui-design |
| 9 | Security Engineer | e9840147-3b14-4ad4-8d67-4d86f78c2cba | engineer | CTO | security-audit |
| 10 | DevOps Engineer | a8fbdb89-3fa8-4b92-9ae7-8b836f7af9da | devops | CTO | cloud-devops |
| 11 | QA Engineer | 71c1482f-fe71-45a8-b2bb-70feb34657c3 | qa | CTO | testing-qa |
| 12 | SEO Specialist | 50829e78-419d-46c2-a46c-17eb6df6c813 | researcher | CMO | seo-optimization |
| 13 | Content Director | 4e4b16ef-e8e1-4d20-b285-54e845748190 | researcher | CMO | content-strategy |
| 14 | Social Media Manager | 597808eb-b4bc-4628-8d65-4da75d5c5d91 | general | CMO | social-media |
| 15 | Copywriter | 5592feba-de86-48b2-a079-a8c7a38b2c0e | general | CMO | copywriting |
| 16 | Graphic Designer | f6e8febe-a301-4812-8b2a-d0d918810393 | designer | CMO | graphic-design |

---

## Agent Configuration Files

Each agent has 4 configuration files in:
```
C:\Users\PC\.paperclip\instances\default\companies\7fbb2529-7d69-4177-bb6b-988404c35965\agents\{agent-id}\instructions\
```

### File Structure
- **AGENTS.md** - Identity, skills, responsibilities
- **HEARTBEAT.md** - 9-step heartbeat protocol, self-check loop
- **SOUL.md** - Core values, work ethic
- **TOOLS.md** - API endpoints, tools, team IDs

---

## Skills Structure

Skills are located in:
```
C:\Users\PC\.paperclip\instances\default\workspaces\tkp-dev-studio\agents\{agent-name}\skills\
```

### Skills Per Agent

| Agent | Skills Folder |
|-------|---------------|
| CEO | app-development, project-management, strategic-planning |
| CTO | system-architecture |
| CMO | marketing-strategy |
| COO | operations-management |
| Frontend Engineer | fullstack-dev |
| Backend Engineer | backend-dev |
| Mobile Engineer | mobile-dev |
| UX/UI Designer | ux-ui-design |
| Security Engineer | security-audit |
| DevOps Engineer | cloud-devops |
| QA Engineer | testing-qa |
| SEO Specialist | seo-optimization |
| Content Director | content-strategy |
| Social Media Manager | social-media |
| Copywriter | copywriting |
| Graphic Designer | graphic-design |

### Skill Format (SKILL.md)
```markdown
---
name: skill-name
description: >
  Use when: [when to use this skill]
  Do NOT use when: [when not to use]
---

# Skill Name

## Instructions...
```

---

## 9-Step Heartbeat Protocol

Every agent follows this protocol on each heartbeat:

### Step 1: Identity
```bash
GET /api/agents/me
```

### Step 2: Approval Follow-Up
```bash
GET /api/approvals/{PAPERCLIP_APPROVAL_ID}
GET /api/approvals/{PAPERCLIP_APPROVAL_ID}/issues
```

### Step 3: Get Assignments
```bash
GET /api/companies/{companyId}/issues?assigneeAgentId={yourId}&status=todo,in_progress,blocked
```

### Step 4: Pick Work
- Priority: in_progress → todo → blocked
- If PAPERCLIP_TASK_ID is set, prioritize that task

### Step 5: Checkout (CRITICAL)
```bash
POST /api/issues/{issueId}/checkout
{ "agentId": "{yourId}", "expectedStatuses": ["todo", "backlog", "blocked"] }
```
- **Atomic operation** - 409 = task belongs to another agent, pick different task
- **NEVER retry a 409**

### Step 6: Understand Context
- Fetch full issue and comments
- Read ancestor information

### Step 7: Do the Work
- Use agent's skills and capabilities
- Update progress with comments

### Step 8: Update Status (Include Run ID Header)
```bash
PATCH /api/issues/{issueId}
-H "X-Paperclip-Run-Id: {PAPERCLIP_RUN_ID}"
{ "status": "done", "comment": "Work complete." }
```

### Step 9: Delegate
```bash
POST /api/companies/{companyId}/issues
{
  "title": "Subtask title",
  "assigneeAgentId": "{reportId}",
  "parentId": "{parentIssueId}",
  "goalId": "{goalId}",
  "status": "todo",
  "priority": "high"
}
```
**Always set parentId and goalId**

---

## Task Workflow Patterns

### Checkout Pattern
```bash
POST /api/issues/{issueId}/checkout
{ "agentId": "{yourId}", "expectedStatuses": ["todo", "backlog", "blocked"] }
```

### Progress Update
```bash
PATCH /api/issues/{issueId}
-H "X-Paperclip-Run-Id: {PAPERCLIP_RUN_ID}"
{ "comment": "Work in progress..." }
```

### Complete Task
```bash
PATCH /api/issues/{issueId}
-H "X-Paperclip-Run-Id: {PAPERCLIP_RUN_ID}"
{ "status": "done", "comment": "Complete." }
```

### Blocked Task
```bash
PATCH /api/issues/{issueId}
-H "X-Paperclip-Run-Id: {PAPERCLIP_RUN_ID}"
{ "status": "blocked", "comment": "Blocked reason. Escalating to @manager." }
```

### Release Task
```bash
POST /api/issues/{issueId}/release
```
Leave comment explaining why.

---

## Approval Handling

### CEO Strategy Approval
```bash
POST /api/companies/{companyId}/approvals
{
  "type": "approve_ceo_strategy",
  "requestedByAgentId": "{ceoId}",
  "payload": { "plan": "Strategic breakdown..." }
}
```

### Hiring Request (Managers Only)
```bash
POST /api/companies/{companyId}/agent-hires
{
  "name": "New Role Title",
  "role": "engineer",
  "reportsTo": "{managerId}",
  "capabilities": "required skills",
  "budgetMonthlyCents": 5000
}
```

### Check Pending Approvals
```bash
GET /api/companies/{companyId}/approvals?status=pending
```

### Handle Approval Resolution
When PAPERCLIP_APPROVAL_ID is set:
```bash
GET /api/approvals/{approvalId}
GET /api/approvals/{approvalId}/issues
```
- If approved → close linked issues, proceed
- If rejected → comment on issues explaining next steps

---

## API Endpoints

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/{id}/agents` | List all agents |
| GET | `/api/agents/{id}` | Get agent details |
| GET | `/api/agents/me` | Get current agent |
| POST | `/api/agents/{id}/heartbeat/invoke` | Invoke heartbeat |
| POST | `/api/agents/{id}/pause` | Pause agent |
| POST | `/api/agents/{id}/resume` | Resume agent |
| POST | `/api/agents/{id}/terminate` | Terminate agent |
| PATCH | `/api/agents/{id}` | Update agent |

### Issues
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/{id}/issues` | List issues |
| POST | `/api/companies/{id}/issues` | Create issue |
| GET | `/api/issues/{id}` | Get issue |
| PATCH | `/api/issues/{id}` | Update issue |
| POST | `/api/issues/{id}/checkout` | Checkout issue |
| POST | `/api/issues/{id}/release` | Release issue |

### Approvals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/{id}/approvals` | List approvals |
| POST | `/api/companies/{id}/approvals` | Create approval |
| GET | `/api/approvals/{id}` | Get approval |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/{id}/dashboard` | Get dashboard data |

---

## Dashboard Status

```json
{
  "agents": {
    "active": 16,
    "running": 0,
    "paused": 0,
    "error": 0
  },
  "tasks": {
    "open": 3,
    "inProgress": 0,
    "blocked": 0,
    "done": 0
  },
  "costs": {
    "monthSpendCents": 0,
    "monthBudgetCents": 0,
    "monthUtilizationPercent": 0
  },
  "pendingApprovals": 0
}
```

---

## Current Issues

| ID | Title | Status | Assignee |
|----|-------|--------|----------|
| TKPA-1 | [Enhance] tictactoe - Add Features | backlog | Frontend Engineer |
| TKPA-2 | [QA] tictactoe - Testing | backlog | QA Engineer |
| TKPA-3 | [DevOps] tictactoe - Deploy | backlog | DevOps Engineer |

---

## Workspace Path

```
C:\Users\PC\.paperclip\instances\default\workspaces\tkp-dev-studio\
```

### Structure
```
tkp-dev-studio/
├── agents/
│   ├── ceo/skills/
│   ├── cto/skills/
│   ├── cmo/skills/
│   ├── coo/skills/
│   ├── frontend-engineer/skills/
│   ├── backend-engineer/skills/
│   ├── mobile-engineer/skills/
│   ├── ux-ui-designer/skills/
│   ├── security-engineer/skills/
│   ├── devops-engineer/skills/
│   ├── qa-engineer/skills/
│   ├── seo-specialist/skills/
│   ├── content-director/skills/
│   ├── social-media-manager/skills/
│   ├── copywriter/skills/
│   └── graphic-designer/skills/
├── projects/
└── scripts/
```

---

## Key Files

| File | Location |
|------|----------|
| CEO AGENTS.md | `...\agents\ea43b600-...\instructions\AGENTS.md` |
| CEO HEARTBEAT.md | `...\agents\ea43b600-...\instructions\HEARTBEAT.md` |
| CEO SOUL.md | `...\agents\ea43b600-...\instructions\SOUL.md` |
| CEO TOOLS.md | `...\agents\ea43b600-...\instructions\TOOLS.md` |
| CEO Skills | `...\workspaces\tkp-dev-studio\agents\ceo\skills\` |

---

## Setup Commands

### Invoke Heartbeat for All Agents
```bash
# CEO
curl -X POST http://127.0.0.1:3100/api/agents/ea43b600-0b73-4b4f-9fb8-38ec37161b5d/heartbeat/invoke

# CTO
curl -X POST http://127.0.0.1:3100/api/agents/3ff25e94-b11a-4982-84a7-25eaab5ade16/heartbeat/invoke

# CMO
curl -X POST http://127.0.0.1:3100/api/agents/f26b49a7-7df5-49cc-9ad8-1e2ff619e03d/heartbeat/invoke

# COO
curl -X POST http://127.0.0.1:3100/api/agents/2ad8668c-2c9a-49bf-b500-c59b671291b1/heartbeat/invoke

# All Engineering
curl -X POST http://127.0.0.1:3100/api/agents/b7e8ffa5-23f5-4428-bced-3360f3dd4ffd/heartbeat/invoke  # Frontend
curl -X POST http://127.0.0.1:3100/api/agents/d24ecb84-e046-417b-be50-41139991f6a9/heartbeat/invoke  # Backend
curl -X POST http://127.0.0.1:3100/api/agents/c0d8506f-13ea-4b0a-a3de-0f72716a122c/heartbeat/invoke  # Mobile
curl -X POST http://127.0.0.1:3100/api/agents/8e7459b0-e4bc-4362-8d0e-77d41df56611/heartbeat/invoke  # UX/UI
curl -X POST http://127.0.0.1:3100/api/agents/e9840147-3b14-4ad4-8d67-4d86f78c2cba/heartbeat/invoke  # Security
curl -X POST http://127.0.0.1:3100/api/agents/a8fbdb89-3fa8-4b92-9ae7-8b836f7af9da/heartbeat/invoke  # DevOps
curl -X POST http://127.0.0.1:3100/api/agents/71c1482f-fe71-45a8-b2bb-70feb34657c3/heartbeat/invoke  # QA

# All Marketing
curl -X POST http://127.0.0.1:3100/api/agents/50829e78-419d-46c2-a46c-17eb6df6c813/heartbeat/invoke  # SEO
curl -X POST http://127.0.0.1:3100/api/agents/4e4b16ef-e8e1-4d20-b285-54e845748190/heartbeat/invoke  # Content
curl -X POST http://127.0.0.1:3100/api/agents/597808eb-b4bc-4628-8d65-4da75d5c5d91/heartbeat/invoke  # Social
curl -X POST http://127.0.0.1:3100/api/agents/5592feba-de86-48b2-a079-a8c7a38b2c0e/heartbeat/invoke  # Copywriter
curl -X POST http://127.0.0.1:3100/api/agents/f6e8febe-a301-4812-8b2a-d0d918810393/heartbeat/invoke  # Designer
```

### Check Dashboard
```bash
curl http://127.0.0.1:3100/api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/dashboard
```

### Check All Agents
```bash
curl http://127.0.0.1:3100/api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/agents
```

### Check Issues
```bash
curl http://127.0.0.1:3100/api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/issues
```

---

## Adapter Configuration

All agents use `claude_local` adapter type:
```json
{
  "adapterType": "claude_local",
  "adapterConfig": {
    "cwd": "C:/Users/PC/.paperclip/instances/default/workspaces/tkp-dev-studio",
    "model": "claude-sonnet-4-6",
    "instructionsFilePath": "...\\AGENTS.md",
    "instructionsRootPath": "...\\instructions",
    "instructionsEntryFile": "AGENTS.md",
    "instructionsBundleMode": "managed",
    "dangerouslySkipPermissions": true
  }
}
```

---

## Agent Status Values

| Status | Meaning |
|--------|---------|
| active | Ready to accept work |
| idle | Active but no heartbeat running |
| running | Heartbeat currently executing |
| error | Last heartbeat failed |
| paused | Manually paused or budget exceeded |
| terminated | Permanently disabled (irreversible) |

---

## Paperclip API Base URL

```
http://127.0.0.1:3100
```

---

## Documentation Reference

- [Heartbeat Protocol](https://docs.paperclip.ing/guides/agent-developer/heartbeat-protocol)
- [Agent Developer Guide](https://docs.paperclip.ing/guides/agent-developer/)
- [Board Operator Guide](https://docs.paperclip.ing/guides/board-operator/)
- [Approvals](https://docs.paperclip.ing/guides/board-operator/approvals)

---

**Last Updated:** 2026-03-30
**Setup Complete:** Yes
**All 16 Agents Configured:** Yes
**All Skills Created:** Yes
**Heartbeat Protocol Implemented:** Yes