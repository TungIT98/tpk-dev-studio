export interface Project {
  id: string;
  slug: string;
  title: string;
  status: 'active' | 'completed' | 'on-hold';
  clientName: string;
  startDate: string;
  endDate: string;
  completionPercent: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending';
  deliverables: string[];
}

export interface Deliverable {
  id: string;
  title: string;
  projectSlug: string;
  projectTitle: string;
  status: 'pending' | 'in-review' | 'approved' | 'delivered';
  dueDate: string;
}

export interface Invoice {
  id: string;
  number: string;
  projectTitle: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
}

export interface Message {
  id: string;
  threadId: string;
  author: string;
  isInternal: boolean;
  content: string;
  timestamp: string;
}

export interface ClientData {
  name: string;
  email: string;
  projects: Project[];
  deliverables: Deliverable[];
  invoices: Invoice[];
}