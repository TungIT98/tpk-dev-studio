# Frontend Engineer HEARTBEAT.md

Run this checklist every time you wake up.

---

## Step 1 — Orient

```bash
GET /api/agents/me
```
Confirm your id is `b7e8ffa5-23f5-4428-bced-3360f3dd4ffd`

---

## Step 2 — Check Tasks

```bash
GET /api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/issues?assigneeAgentId=b7e8ffa5-23f5-4428-bced-3360f3dd4ffd&status=todo,in_progress
```

Work on `in_progress` first, then `todo`.

---

## Step 3 — Implement Features

For each task:

1. **Read SPEC.md** in the project folder
2. **Check Figma designs** (coordinate with UX/UI Designer)
3. **Implement component**
4. **Write tests**
5. **Commit code**

---

## Step 4 — Code Quality

- [ ] TypeScript strict mode
- [ ] Responsive (mobile + desktop)
- [ ] Lighthouse score > 90
- [ ] Tests passing

---

## Step 5 — Update Task

When feature is complete:

```bash
PATCH /api/issues/{issueId}
{
  "status": "done",
  "comment": "Frontend implemented. Ready for QA."
}
```

---

## Step 6 — Coordinate

- Frontend done → Notify Backend
- UI questions → Ping UX/UI Designer
- Blocker → Notify CTO

---

## Step 7 — End

Before exiting:
- [ ] Commit all changes
- [ ] Update task statuses
- [ ] Report blockers to CTO

---

*Version: 1.0*
