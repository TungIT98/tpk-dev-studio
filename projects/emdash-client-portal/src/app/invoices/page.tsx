'use client';

import Link from 'next/link';
import { getMockClientData } from '@/lib/emdash';
import type { Invoice } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'paid': 'badge-success',
    'unpaid': 'badge-warning',
    'overdue': 'badge-danger',
  };

  return (
    <span className={`badge ${styles[status] || 'badge-info'}`}>
      {status}
    </span>
  );
}

export default function InvoicesPage() {
  const { invoices } = getMockClientData();

  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="invoices-page">
      <header className="header">
        <div className="container">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
          <h1 style={{ marginTop: '0.5rem' }}>Invoices</h1>
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
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Invoices</div>
            <div className="summary-value">{invoices.length}</div>
          </div>
          <div className="summary-card warning">
            <div className="summary-label">Unpaid</div>
            <div className="summary-value">{formatCurrency(totalUnpaid)}</div>
          </div>
          <div className="summary-card danger">
            <div className="summary-label">Overdue</div>
            <div className="summary-value">{formatCurrency(totalOverdue)}</div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice: Invoice) => (
                <tr key={invoice.id}>
                  <td className="invoice-number">{invoice.number}</td>
                  <td>{invoice.projectTitle}</td>
                  <td className="amount">{formatCurrency(invoice.amount)}</td>
                  <td><StatusBadge status={invoice.status} /></td>
                  <td>{formatDate(invoice.issueDate)}</td>
                  <td>{formatDate(invoice.dueDate)}</td>
                  <td>
                    <Link href={`/invoices/${invoice.id}`} className="btn btn-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <style jsx>{`
        .invoices-page { min-height: 100vh; }
        .header { background: white; border-bottom: 1px solid var(--color-border); padding: 1rem 0; }
        .header h1 { font-size: 1.5rem; font-weight: 600; }
        .back-link { color: var(--color-text-muted); font-size: 0.875rem; }
        .nav { display: flex; gap: 1.5rem; margin-top: 1rem; }
        .nav a { color: var(--color-text); font-weight: 500; }
        .nav a:hover { color: var(--color-primary); text-decoration: none; }
        .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .summary-card { background: white; border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow-sm); }
        .summary-card.warning { border-left: 4px solid var(--color-warning); }
        .summary-card.danger { border-left: 4px solid var(--color-danger); }
        .summary-label { font-size: 0.875rem; color: var(--color-text-muted); }
        .summary-value { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }
        .table-container { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 1rem 1.5rem; text-align: left; border-bottom: 1px solid var(--color-border); }
        .table th { background: var(--color-background); font-weight: 600; font-size: 0.875rem; color: var(--color-text-muted); }
        .table tbody tr:hover { background: var(--color-background); }
        .invoice-number { font-weight: 600; }
        .amount { font-weight: 600; }
      `}</style>
    </div>
  );
}