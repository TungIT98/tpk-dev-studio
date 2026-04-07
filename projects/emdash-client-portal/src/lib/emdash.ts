const MCP_ENDPOINT = process.env.NEXT_PUBLIC_EMDASH_MCP_ENDPOINT || 'https://emdash-cms.thanhtungtran364.workers.dev/mcp';
const CONTENT_TOKEN = process.env.EMDASH_CONTENT_TOKEN;

interface MCPRequest {
  tool: string;
  args: Record<string, unknown>;
}

interface MCPResponse {
  result?: unknown;
  error?: string;
}

export async function mcpRequest<T = unknown>(tool: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(CONTENT_TOKEN && { 'Authorization': `Bearer ${CONTENT_TOKEN}` }),
    },
    body: JSON.stringify({
      tool,
      args,
    } as MCPRequest),
  });

  if (!response.ok) {
    throw new Error(`MCP request failed: ${response.statusText}`);
  }

  const data: MCPResponse = await response.json();

  if (data.error) {
    throw new Error(`MCP error: ${data.error}`);
  }

  return data.result as T;
}

export async function getCollections() {
  return mcpRequest<{ collection: string }[]>('get_collections', {});
}

export async function getEntry(collection: string, id: string) {
  return mcpRequest<Record<string, unknown>>('get_entry', { collection, id });
}

export async function searchEntries(collection: string, query: string, limit = 10) {
  return mcpRequest<{ id: string; [key: string]: unknown }[]>('search_entries', { collection, query, limit });
}

// Mock data for development when MCP is not available
export function getMockClientData() {
  return {
    name: 'Acme Corp',
    email: 'contact@acmecorp.com',
    projects: [
      {
        id: '1',
        slug: 'website-redesign',
        title: 'Website Redesign',
        status: 'active' as const,
        clientName: 'Acme Corp',
        startDate: '2026-01-15',
        endDate: '2026-04-30',
        completionPercent: 65,
        milestones: [
          { id: 'm1', title: 'Discovery & Planning', dueDate: '2026-01-30', status: 'completed' as const, deliverables: ['Content audit', 'Wireframes'] },
          { id: 'm2', title: 'Design Phase', dueDate: '2026-02-28', status: 'completed' as const, deliverables: ['Homepage mockups', 'Inner page templates'] },
          { id: 'm3', title: 'Development', dueDate: '2026-03-31', status: 'in-progress' as const, deliverables: ['Frontend build', 'CMS integration'] },
          { id: 'm4', title: 'QA & Launch', dueDate: '2026-04-30', status: 'pending' as const, deliverables: ['Testing', 'Deployment'] },
        ],
      },
      {
        id: '2',
        slug: 'mobile-app',
        title: 'Mobile App MVP',
        status: 'active' as const,
        clientName: 'Acme Corp',
        startDate: '2026-02-01',
        endDate: '2026-06-30',
        completionPercent: 25,
        milestones: [
          { id: 'm1', title: 'Requirements', dueDate: '2026-02-15', status: 'completed' as const, deliverables: ['PRD document'] },
          { id: 'm2', title: 'UX Design', dueDate: '2026-03-15', status: 'in-progress' as const, deliverables: ['User flows', 'UI mockups'] },
          { id: 'm3', title: 'Development', dueDate: '2026-05-15', status: 'pending' as const, deliverables: ['iOS app', 'Android app'] },
          { id: 'm4', title: 'Testing & Launch', dueDate: '2026-06-30', status: 'pending' as const, deliverables: ['QA', 'App store submission'] },
        ],
      },
    ],
    deliverables: [
      { id: 'd1', title: 'Homepage Design', projectSlug: 'website-redesign', projectTitle: 'Website Redesign', status: 'approved' as const, dueDate: '2026-02-15' },
      { id: 'd2', title: 'Wireframes Document', projectSlug: 'website-redesign', projectTitle: 'Website Redesign', status: 'delivered' as const, dueDate: '2026-01-30' },
      { id: 'd3', title: 'User Flow Diagrams', projectSlug: 'mobile-app', projectTitle: 'Mobile App MVP', status: 'in-review' as const, dueDate: '2026-03-10' },
      { id: 'd4', title: 'Content Migration Plan', projectSlug: 'website-redesign', projectTitle: 'Website Redesign', status: 'pending' as const, dueDate: '2026-03-20' },
    ],
    invoices: [
      { id: 'inv1', number: 'INV-2026-001', projectTitle: 'Website Redesign', amount: 15000, status: 'paid' as const, issueDate: '2026-01-15', dueDate: '2026-02-15' },
      { id: 'inv2', number: 'INV-2026-002', projectTitle: 'Website Redesign', amount: 25000, status: 'unpaid' as const, issueDate: '2026-02-15', dueDate: '2026-03-15' },
      { id: 'inv3', number: 'INV-2026-003', projectTitle: 'Mobile App MVP', amount: 20000, status: 'unpaid' as const, issueDate: '2026-03-01', dueDate: '2026-04-01' },
      { id: 'inv4', number: 'INV-2025-015', projectTitle: 'SEO Campaign', amount: 5000, status: 'overdue' as const, issueDate: '2025-12-01', dueDate: '2026-01-01' },
    ],
  };
}