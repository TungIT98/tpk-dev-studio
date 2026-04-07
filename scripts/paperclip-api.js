const API_BASE = 'http://127.0.0.1:3100/api';
const COMPANY_ID = '7fbb2529-7d69-4177-bb6b-988404c35965';
const AGENT_ID = 'a3558240-0ce6-437e-988f-40c92bf45851';

async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
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
    return false;
  }
}

async function updateTaskStatus(taskId, status, comment) {
  return api(`/issues/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, comment })
  });
}

module.exports = { api, getMyTasks, checkoutTask, updateTaskStatus };