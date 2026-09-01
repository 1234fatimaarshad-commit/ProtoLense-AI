import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function DashboardPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/projects')
      .then(res => setProjects(res.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#fbbf24'
    if (score >= 40) return '#fb923c'
    return '#f43f5e'
  }

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  const getStatusBadge = (status) => {
    const colors = { created: '#64748b', analyzing: '#38bdf8', audited: '#00ff88' }
    return <span className="status-badge" style={{ background: colors[status] || '#64748b' }}>{status}</span>
  }

  // Telemetry aggregations
  const telemetry = useMemo(() => {
    const audited = projects.filter(p => p.latest_score != null)
    const avgHealth = audited.length
      ? Math.round(audited.reduce((s, p) => s + p.latest_score, 0) / audited.length)
      : null
    const totalAudits = projects.reduce((s, p) => s + (p.audit_count || 0), 0)
    return { totalAudits, avgHealth, projectCount: projects.length }
  }, [projects])

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.tech_stack || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
  }, [projects, search])

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p style={{ color: 'var(--text-muted)' }}>Initializing command center...</p></div>

  return (
    <div className="dashboard-page fade-in">
      <div className="page-header">
        <div>
          <h1>Command Center</h1>
          <p className="text-muted">Monitor your project software health in real-time</p>
        </div>
        <Link to="/app/projects/new" className="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          New Audit
        </Link>
      </div>

      {/* Telemetry Cards */}
      <div className="telemetry-grid">
        <div className="telemetry-card tc-audits">
          <div className="telemetry-label">Total Audits</div>
          <div className="telemetry-value">{telemetry.totalAudits}</div>
          <div className="telemetry-sub">{telemetry.projectCount} project{telemetry.projectCount !== 1 ? 's' : ''} tracked</div>
        </div>
        <div className="telemetry-card tc-health">
          <div className="telemetry-label">Avg. Health Score</div>
          <div className="telemetry-value">{telemetry.avgHealth != null ? telemetry.avgHealth : '—'}</div>
          <div className="telemetry-sub">{telemetry.avgHealth != null ? `Grade ${getScoreGrade(telemetry.avgHealth)}` : 'No audits yet'}</div>
        </div>
        <div className="telemetry-card tc-agents">
          <div className="telemetry-label">Active Agents</div>
          <div className="telemetry-value">5</div>
          <div className="telemetry-sub">All specialists online</div>
        </div>
        <div className="telemetry-card tc-critical">
          <div className="telemetry-label">Audited Projects</div>
          <div className="telemetry-value">{projects.filter(p => p.latest_score != null).length}</div>
          <div className="telemetry-sub">of {telemetry.projectCount} total projects</div>
        </div>
      </div>

      {/* Command Bar */}
      <div className="command-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Search projects by name, tech stack, or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <h3>{search ? 'No matching projects' : 'No projects yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Submit your first project for a comprehensive multi-agent audit.'}</p>
          {!search && <Link to="/app/projects/new" className="btn-primary">Create Your First Project</Link>}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((project, i) => (
            <Link to={`/app/projects/${project.id}`} key={project.id} className="project-card fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="project-card-header">
                <h3>{project.name}</h3>
                {getStatusBadge(project.status)}
              </div>
              <p className="project-desc">{project.description || 'No description'}</p>
              <div className="project-card-footer">
                <div className="project-meta">
                  {project.tech_stack && <span className="tech-tag">{project.tech_stack.split(',')[0].trim()}</span>}
                  <span className="text-muted" style={{ fontSize: 12 }}>{project.audit_count || 0} audit{project.audit_count !== 1 ? 's' : ''}</span>
                </div>
                {project.latest_score != null && (
                  <div className="score-circle" style={{ borderColor: getScoreColor(project.latest_score) }}>
                    <span style={{ color: getScoreColor(project.latest_score) }}>{getScoreGrade(project.latest_score)}</span>
                    <small>{project.latest_score}</small>
                  </div>
                )}
              </div>
              {project.latest_score != null && (
                <div className="health-bar">
                  <div className="health-bar-fill" style={{ width: `${project.latest_score}%`, background: `linear-gradient(90deg, ${getScoreColor(project.latest_score)}, ${getScoreColor(Math.min(project.latest_score + 15, 100))})` }} />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
