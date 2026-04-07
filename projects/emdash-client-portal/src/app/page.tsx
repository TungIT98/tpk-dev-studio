'use client';

import Link from 'next/link';
import { getMockClientData } from '@/lib/emdash';
import type { Project, Deliverable, Invoice } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'active': 'badge-success',
    'completed': 'badge-info',
    'on-hold': 'badge-warning',
    'pending': 'badge-warning',
    'in-review': 'badge-info',
    'approved': 'badge-success',
    'delivered': 'badge-success',
    'paid': 'badge-success',
    'unpaid': 'badge-warning',
    'overdue': 'badge-danger',
  };

  return (
    <span className={`badge ${styles[status] || 'badge-info'}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const { name, projects, deliverables, invoices } = getMockClientData();
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
  const totalUnpaid = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const recentDeliverables = deliverables.slice(0, 5);

  return (
    <div className="dashboard">
      <header className="header">
        <div className="container">
          <h1>Welcome, {name}</h1>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/projects/website-redesign">Projects</Link>
            <Link href="/deliverables">Deliverables</Link>
            <Link href="/invoices">Invoices</Link>
            <Link href="/messages">Messages</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ marginTop: '2rem' }}>
        {/* Unpaid Invoices Alert */}
        {unpaidInvoices.length > 0 && (
          <div className="alert alert-warning">
            <h3>Unpaid Invoices</h3>
            <p>
              You have {unpaidInvoices.length} unpaid invoice(s) totaling{' '}
              <strong>{formatCurrency(totalUnpaid)}</strong>.
            </p>
            <Link href="/invoices" className="btn btn-primary">
              View Invoices
            </Link>
          </div>
        )}

        {/* Active Projects */}
        <section style={{ marginTop: '2rem' }}>
          <div className="section-header">
            <h2>Active Projects</h2>
            <Link href="/projects/website-redesign" className="btn btn-primary">
              View All Projects
            </Link>
          </div>
          <div className="cards-grid">
            {projects.map((project: Project) => (
              <div key={project.id} className="card">
                <div className="card-header">
                  <h3>{project.title}</h3>
                  <StatusBadge status={project.status} />
                </div>
                <div className="card-body">
                  <div className="stat-row">
                    <span>Completion:</span>
                    <span>{project.completionPercent}%</span>
                  </div>
                  <ProgressBar percent={project.completionPercent} />
                  <div className="stat-row" style={{ marginTop: '1rem' }}>
                    <span>End Date:</span>
                    <span>{formatDate(project.endDate)}</span>
                  </div>
                </div>
                <div className="card-footer">
                  <Link href={`/projects/${project.slug}`} className="btn btn-primary">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Deliverables */}
        <section style={{ marginTop: '2rem' }}>
          <div className="section-header">
            <h2>Recent Deliverables</h2>
            <Link href="/deliverables" className="btn btn-primary">
              View All
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Deliverable</th>
                <th>Project</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {recentDeliverables.map((del: Deliverable) => (
                <tr key={del.id}>
                  <td>{del.title}</td>
                  <td>{del.projectTitle}</td>
                  <td><StatusBadge status={del.status} /></td>
                  <td>{formatDate(del.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      <style jsx>{`
        .dashboard { min-height: 100vh; }
        .header { background: white; border-bottom: 1px solid var(--color-border); padding: 1rem 0; }
        .header h1 { font-size: 1.5rem; font-weight: 600; }
        .nav { display: flex; gap: 1.5rem; margin-top: 1rem; }
        .nav a { color: var(--color-text); font-weight: 500; }
        .nav a:hover { color: var(--color-primary); text-decoration: none; }
        .alert { background: white; border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow-sm); margin-bottom: 1.5rem; }
        .alert-warning { border-left: 4px solid var(--color-warning); }
        .alert h3 { font-size: 1rem; margin-bottom: 0.5rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .section-header h2 { font-size: 1.25rem; font-weight: 600; }
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
        .card { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }
        .card-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--color-border); }
        .card-header h3 { font-size: 1.125rem; font-weight: 600; }
        .card-body { padding: 1.5rem; }
        .stat-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--color-text-muted); }
        .progress-bar { height: 8px; background: var(--color-border); border-radius: 4px; margin-top: 0.5rem; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--color-primary); transition: width 0.3s; }
        .card-footer { padding: 1rem 1.5rem; background: var(--color-background); }
        .table { width: 100%; background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); border-collapse: collapse; }
        .table th, .table td { padding: 1rem 1.5rem; text-align: left; border-bottom: 1px solid var(--color-border); }
        .table th { background: var(--color-background); font-weight: 600; font-size: 0.875rem; color: var(--color-text-muted); }
        .table tbody tr:hover { background: var(--color-background); }
      `}</style>
    </div>
  );
}