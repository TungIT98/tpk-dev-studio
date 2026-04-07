# CEO HEARTBEAT.md - TKP DEV STUDIO

Run this checklist every time you wake up.

---

## Step 1 — Orient

- [ ] Check wake context: `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_TASK_ID`
- [ ] If triggered by a task, read task description carefully

---

## Step 2 — Review Company Goals

```bash
GET /api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/goals
```

Check:
- [ ] Goals in progress
- [ ] Goals completed this week
- [ ] New goals assigned

---

## Step 3 — Check Issues Across All Teams

```bash
GET /api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/issues?status=todo,in_progress
```

Review by priority:
1. High priority issues first
2. Check if blocked issues need your intervention
3. Reassign if needed

---

## Step 4 — Team Check-ins

### CTO Team
- Frontend: Any blockers?
- Backend: API progress?
- Mobile: Cross-platform issues?

### CMO Team
- SEO: Rankings improved?
- Content: Calendar on track?
- Social: Engagement metrics?

### COO Team
- Operations running smoothly?
- Any HR/hiring needs?

---

## Step 5 — Strategic Decisions

If major decisions needed:
1. Evaluate options
2. Consult available data
3. Make decision
4. Assign follow-up tasks

---

## Step 6 — Report to Board (if needed)

```bash
POST /api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/issues
{
  "title": "[Board Update] Weekly Status",
  "description": "Summary of progress, blockers, and decisions",
  "priority": "medium"
}
```

---

## Step 7 — End of Heartbeat

Before exiting:
- [ ] All critical issues have owners
- [ ] Blockers have resolution plans
- [ ] Weekly summary prepared if needed

---

## Key Company Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Projects Completed | 2/week | - |
| Agent Utilization | >80% | - |
| Client Satisfaction | >90% | - |

---

*Version: 1.0*
