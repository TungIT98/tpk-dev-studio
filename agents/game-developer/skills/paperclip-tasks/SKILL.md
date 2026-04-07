---
name: paperclip-tasks
description: >
  Use when: You need to get tasks, checkout tasks, update task status, or report progress
  to the Paperclip task system.
  Do NOT use when: Working purely on code/files without needing task coordination.
---

# Paperclip Task Management

This skill allows you to interact with the Paperclip task system without needing `curl`
commands (which may be blocked by sandbox). Use `node` instead for HTTP API calls.

## Configuration

```javascript
const API_BASE = 'http://127.0.0.1:3100/api';
const COMPANY_ID = '7fbb2529-7d69-4177-bb6b-988404c35965';
const AGENT_ID = 'a3558240-0ce6-437e-988f-40c92bf45851';
```

## Get Your Assignments

```javascript
// Get tasks assigned to you
const response = await fetch(
  `${API_BASE}/companies/${COMPANY_ID}/issues?assigneeAgentId=${AGENT_ID}&status=todo,in_progress,blocked`
);
const tasks = await response.json();
console.log(tasks);
```

## Checkout a Task

Before working on a task, you MUST checkout to claim it:

```javascript
// Checkout task
const checkoutResponse = await fetch(
  `${API_BASE}/issues/${taskId}/checkout`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: AGENT_ID,
      expectedStatuses: ['todo', 'backlog', 'blocked']
    })
  }
);

if (checkoutResponse.status === 409) {
  // Task already claimed by someone else - pick a different task
  console.log('Task conflict - choose another task');
}
```

## Update Task Status

When done or blocked:

```javascript
// Mark as done
await fetch(`${API_BASE}/issues/${taskId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'done',
    comment: 'Task completed. Created level 1 with 3 checkpoints.'
  })
});

// Mark as blocked
await fetch(`${API_BASE}/issues/${taskId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'blocked',
    comment: 'Blocked: Need Roblox Studio installed. Escalating to CTO.'
  })
});
```

## Complete Workflow Example

```javascript
// 1. Get assignments
const tasks = await getMyTasks();

// 2. Find a todo task (not blocked)
const myTask = tasks.find(t => t.status === 'todo');
if (!myTask) {
  console.log('No tasks available');
  return;
}

// 3. Checkout
const checkoutOk = await checkoutTask(myTask.id);
if (!checkoutOk) {
  console.log('Could not checkout - try another task');
  return;
}

// 4. Do the work (create game files in workspace)
// ... your code here ...

// 5. Update status to done
await updateTaskStatus(myTask.id, 'done', 'Level 1 complete with checkpoints');
```

## Helper Script

Create a file `scripts/paperclip-api.js` in your workspace for reusable functions:

```javascript
const API_BASE = 'http://127.0.0.1:3100/api';
const COMPANY_ID = '7fbb2529-7d69-4177-bb6b-988404c35965';
const AGENT_ID = 'a3558240-0ce6-437e-988f-40c92bf45851';

async function api(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getMyTasks() {
  return api(`/companies/${COMPANY_ID}/issues?assigneeAgentId=${AGENT_ID}&status=todo,in_progress,blocked`);
}

async function checkoutTask(taskId) {
  try {
    await api(`/issues/${taskId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ agentId: AGENT_ID, expectedStatuses: ['todo', 'backlog', 'blocked'] })
    });
    return true;
  } catch (e) {
    if (e.message.includes('409')) return false;
    throw e;
  }
}

async function updateTaskStatus(taskId, status, comment) {
  return api(`/issues/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, comment })
  });
}

module.exports = { api, getMyTasks, checkoutTask, updateTaskStatus };
```

## Common Issues

| Error | Solution |
|-------|----------|
| fetch not defined | Use `node -e "..."` or create a .js file and run with node |
| ECONNREFUSED | Paperclip server not running on port 3100 |
| 409 Conflict | Task already claimed by another agent |
| 404 Not Found | Wrong task ID or endpoint |

## Workspace Path

Your workspace for game projects:
```
C:/Users/PC/.paperclip/instances/default/workspaces/tkp-dev-studio/projects/
```

Create a subfolder for each game, e.g.: `projects/obby-game/src/...`
