import Link from 'next/link';
import { getMockClientData } from '@/lib/emdash';
import type { Project, Milestone } from '@/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'completed': 'badge-success',
    'in-progress': 'badge-info',
    'pending': 'badge-warning',
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

function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const daysRemaining = 30; // Would calculate from endDate

  return (
    <div className="timeline">
      <div className="timeline-header">
        <h3>Milestone Progress</h3>
        <span>{completedCount} of {milestones.length} completed</span>
      </div>
      <div className="timeline-steps">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className={`timeline-step ${milestone.status}`}>
            <div className="step-marker">
              {milestone.status === 'completed' ? '✓' : index + 1}
            </div>
            <div className="step-content">
              <div className="step-title">{milestone.title}</div>
              <div className="step-date">Due: {formatDate(milestone.dueDate)}</div>
              <StatusBadge status={milestone.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { projects } = getMockClientData();
  const project = projects.find(p => p.slug === slug) as Project | undefined;

  if (!project) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h1>Project Not Found</h1>
        <p>The project you're looking for doesn't exist.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
  const remainingDays = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="project-page">
      <header className="header">
        <div className="container">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
          <div className="project-title">
            <h1>{project.title}</h1>
            <span className={`badge ${project.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
              {project.status}
            </span>
          </div>
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
        {/* Project Overview */}
        <section className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2>Project Overview</h2>
          </div>
          <div className="card-body">
            <div className="overview-grid">
              <div className="overview-item">
                <span className="label">Client</span>
                <span className="value">{project.clientName}</span>
              </div>
              <div className="overview-item">
                <span className="label">Start Date</span>
                <span className="value">{formatDate(project.startDate)}</span>
              </div>
              <div className="overview-item">
                <span className="label">End Date</span>
                <span className="value">{formatDate(project.endDate)}</span>
              </div>
              <div className="overview-item">
                <span className="label">Days Remaining</span>
                <span className="value">{remainingDays > 0 ? remainingDays : 0}</span>
              </div>
            </div>
            <div className="completion-section">
              <div className="completion-header">
                <span>Overall Completion</span>
                <span>{project.completionPercent}%</span>
              </div>
              <ProgressBar percent={project.completionPercent} />
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-value">{completedMilestones}</div>
            <div className="stat-label">Milestones Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalMilestones - completedMilestones}</div>
            <div className="stat-label">Milestones Remaining</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{project.completionPercent}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>

        {/* Milestone Timeline */}
        <section className="card">
          <div className="card-body">
            <MilestoneTimeline milestones={project.milestones} />
          </div>
        </section>

        {/* Deliverables List */}
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Deliverables</h2>
          <div className="deliverables-list">
            {project.milestones.map(milestone => (
              <div key={milestone.id} className="milestone-section">
                <h3>{milestone.title}</h3>
                <ul className="deliverable-items">
                  {milestone.deliverables.map((d, i) => (
                    <li key={i} className={`deliverable-item ${milestone.status === 'completed' ? 'completed' : ''}`}>
                      {milestone.status === 'completed' ? '✓ ' : '○ '}
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
        .project-page { min-height: 100vh; }
        .header { background: white; border-bottom: 1px solid var(--color-border); padding: 1rem 0; }
        .back-link { color: var(--color-text-muted); font-size: 0.875rem; }
        .project-title { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; }
        .project-title h1 { font-size: 1.5rem; }
        .nav { display: flex; gap: 1.5rem; margin-top: 1rem; }
        .nav a { color: var(--color-text); font-weight: 500; }
        .nav a:hover { color: var(--color-primary); text-decoration: none; }
        .card { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }
        .card-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--color-border); }
        .card-header h2 { font-size: 1.125rem; }
        .card-body { padding: 1.5rem; }
        .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .overview-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .label { font-size: 0.75rem; text-transform: uppercase; color: var(--color-text-muted); }
        .value { font-size: 1rem; font-weight: 600; }
        .completion-section { margin-top: 1rem; }
        .completion-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem; }
        .progress-bar { height: 12px; background: var(--color-border); border-radius: 6px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--color-primary); }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .stat-card { background: white; border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow-sm); text-align: center; }
        .stat-value { font-size: 2rem; font-weight: 700; color: var(--color-primary); }
        .stat-label { font-size: 0.875rem; color: var(--color-text-muted); margin-top: 0.25rem; }
        .timeline { }
        .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .timeline-header h3 { font-size: 1rem; }
        .timeline-steps { display: flex; flex-direction: column; gap: 1rem; }
        .timeline-step { display: flex; gap: 1rem; align-items: flex-start; }
        .step-marker { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; }
        .timeline-step.completed .step-marker { background: var(--color-success); color: white; }
        .timeline-step.in-progress .step-marker { background: var(--color-primary); color: white; }
        .timeline-step.pending .step-marker { background: var(--color-border); color: var(--color-text-muted); }
        .step-content { flex: 1; }
        .step-title { font-weight: 600; }
        .step-date { font-size: 0.875rem; color: var(--color-text-muted); margin-top: 0.25rem; }
        .deliverables-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .milestone-section { background: white; border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow-sm); }
        .milestone-section h3 { font-size: 1rem; margin-bottom: 1rem; }
        .deliverable-items { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
        .deliverable-item { padding: 0.5rem; border-radius: 4px; background: var(--color-background); }
        .deliverable-item.completed { color: var(--color-success); }
      `}</style>
    </div>
  );
}