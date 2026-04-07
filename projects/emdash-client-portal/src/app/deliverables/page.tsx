'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getMockClientData } from '@/lib/emdash';
import type { Deliverable } from '@/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'pending': 'badge-warning',
    'in-review': 'badge-info',
    'approved': 'badge-success',
    'delivered': 'badge-success',
  };

  return (
    <span className={`badge ${styles[status] || 'badge-info'}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

export default function DeliverablesPage() {
  const { deliverables } = getMockClientData();
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');

  const filteredDeliverables = deliverables
    .filter(d => filter === 'all' || d.status === filter)
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.status.localeCompare(b.status);
    });

  const statusCounts = {
    all: deliverables.length,
    pending: deliverables.filter(d => d.status === 'pending').length,
    'in-review': deliverables.filter(d => d.status === 'in-review').length,
    approved: deliverables.filter(d => d.status === 'approved').length,
    delivered: deliverables.filter(d => d.status === 'delivered').length,
  };

  return (
    <div className="deliverables-page">
      <header className="header">
        <div className="container">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
          <h1 style={{ marginTop: '0.5rem' }}>Deliverables</h1>
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
        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <div className="filter-buttons">
              {(['all', 'pending', 'in-review', 'approved', 'delivered'] as const).map(status => (
                <button
                  key={status}
                  className={`filter-btn ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'All' : status.replace('-', ' ')}
                  <span className="count">({statusCounts[status]})</span>
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-select">
              <option value="dueDate">Due Date</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
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
              {filteredDeliverables.map((del: Deliverable) => (
                <tr key={del.id}>
                  <td className="deliverable-title">{del.title}</td>
                  <td>
                    <Link href={`/projects/${del.projectSlug}`} className="project-link">
                      {del.projectTitle}
                    </Link>
                  </td>
                  <td><StatusBadge status={del.status} /></td>
                  <td>{formatDate(del.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDeliverables.length === 0 && (
            <div className="empty-state">
              No deliverables found with the selected filter.
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .deliverables-page { min-height: 100vh; }
        .header { background: white; border-bottom: 1px solid var(--color-border); padding: 1rem 0; }
        .header h1 { font-size: 1.5rem; font-weight: 600; }
        .back-link { color: var(--color-text-muted); font-size: 0.875rem; }
        .nav { display: flex; gap: 1.5rem; margin-top: 1rem; }
        .nav a { color: var(--color-text); font-weight: 500; }
        .nav a:hover { color: var(--color-primary); text-decoration: none; }
        .filters { display: flex; justify-content: space-between; align-items: center; background: white; padding: 1rem 1.5rem; border-radius: var(--radius); box-shadow: var(--shadow-sm); margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .filter-group { display: flex; align-items: center; gap: 0.75rem; }
        .filter-group label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-muted); }
        .filter-buttons { display: flex; gap: 0.5rem; }
        .filter-btn { padding: 0.5rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: white; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; }
        .filter-btn:hover { border-color: var(--color-primary); }
        .filter-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .filter-btn .count { margin-left: 0.25rem; opacity: 0.7; }
        .sort-select { padding: 0.5rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 0.875rem; cursor: pointer; }
        .table-container { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 1rem 1.5rem; text-align: left; border-bottom: 1px solid var(--color-border); }
        .table th { background: var(--color-background); font-weight: 600; font-size: 0.875rem; color: var(--color-text-muted); }
        .table tbody tr:hover { background: var(--color-background); }
        .deliverable-title { font-weight: 500; }
        .project-link { color: var(--color-primary); }
        .empty-state { padding: 3rem; text-align: center; color: var(--color-text-muted); }
      `}</style>
    </div>
  );
}