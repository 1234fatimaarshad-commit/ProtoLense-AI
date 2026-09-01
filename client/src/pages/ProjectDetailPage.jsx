import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = () => {
    api.get(`/projects/${id}`)
      .then(res => {
        setProject(res.data.project)
        setAudits(res.data.audits)
      })
      .catch(err => {
        if (err.response?.status === 404) navigate('/app/dashboard')
      })
      .finally(() => setLoading(false))
  }

  const runAudit = async () => {
    setRunning(true)
    try {
      const res = await api.post(`/audits/start/${id}`)
      navigate(`/app/audits/${res.data.audit.id}`)
    } catch (err) {
      console.error(err)
      setRunning(false)
    }
  }

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its audits?')) return
    try {
      await api.delete(`/projects/${id}`)
      navigate('/app/dashboard')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!project) return null

  return (
    <div className="project-detail-page">
      <div className="page-header">
        <div>
          <Link to="/app/dashboard" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </Link>
          <h1>{project.name}</h1>
          <p className="text-muted">{project.description || 'No description'}</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={runAudit} disabled={running}>
            {running ? <><span className="spinner-small"></span> Running Audit...</> : 'Run New Audit'}
          </button>
          <button className="btn-danger" onClick={deleteProject}>Delete</button>
        </div>
      </div>

      <div className="project-info-cards">
        <div className="info-card">
          <h4>Tech Stack</h4>
          <p>{project.tech_stack || 'Not specified'}</p>
        </div>
        <div className="info-card">
          <h4>Repository</h4>
          <p>{project.repository_url ? <a href={project.repository_url} target="_blank" rel="noopener noreferrer">{project.repository_url}</a> : 'Not specified'}</p>
        </div>
        <div className="info-card">
          <h4>Status</h4>
          <p><span className={`status-badge status-${project.status}`}>{project.status}</span></p>
        </div>
        <div className="info-card">
          <h4>Total Audits</h4>
          <p>{audits.length}</p>
        </div>
      </div>

      <div className="section">
        <h2>Audit History</h2>
        {audits.length === 0 ? (
          <div className="empty-state small">
            <p>No audits have been run yet. Click "Run New Audit" to analyze this project.</p>
          </div>
        ) : (
          <div className="audit-list">
            {audits.map(audit => (
              <Link to={`/app/audits/${audit.id}`} key={audit.id} className="audit-list-item">
                <div className="audit-info">
                  <span className={`status-badge status-${audit.status}`}>{audit.status}</span>
                  <span className="text-muted">{new Date(audit.created_at).toLocaleString()}</span>
                </div>
                <div className="audit-score">
                  {audit.overall_score != null && (
                    <span className="score-pill">{audit.overall_score}/100</span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
