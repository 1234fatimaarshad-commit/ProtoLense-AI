import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

export default function AuditReportPage() {
  const { id } = useParams()
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    api.get(`/audits/${id}`)
      .then(res => setAudit(res.data.audit))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Generating report...</p></div>
  if (!audit || !audit.report) return <div className="error-page">Audit report not found</div>

  const { report } = audit
  const { severity_summary, agent_scores, agent_details, prioritized_findings, recommendations } = report

  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#fbbf24'
    if (score >= 40) return '#fb923c'
    return '#f43f5e'
  }

  const getSeverityColor = (severity) => {
    const colors = { Critical: '#f43f5e', High: '#fb923c', Medium: '#fbbf24', Low: '#38bdf8' }
    return colors[severity] || '#64748b'
  }

  const getAgentIcon = (name) => {
    if (name.includes('Code')) return '{ }'
    if (name.includes('Arch')) return '[ ]'
    if (name.includes('Security')) return '!'
    if (name.includes('Performance')) return '>'
    return '*'
  }

  const getGradeColor = (grade) => {
    const colors = { A: '#00ff88', B: '#38bdf8', C: '#fbbf24', D: '#fb923c', F: '#f43f5e' }
    return colors[grade] || '#64748b'
  }

  return (
    <div className="audit-report-page">
      <div className="page-header">
        <div>
          <Link to="/app/dashboard" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </Link>
          <h1>Software Health Report</h1>
          <p className="text-muted">{report.project_name} &mdash; {new Date(report.generated_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Score Overview */}
      <div className="report-hero">
        <div className="hero-score">
          <div className="big-score" style={{ color: getScoreColor(report.overall_score) }}>
            {report.overall_score}
          </div>
          <div className="score-grade" style={{ background: getGradeColor(report.health_grade) }}>
            Grade: {report.health_grade}
          </div>
          <p className="text-muted">{report.total_findings} findings identified</p>
        </div>
        <div className="hero-severity">
          <div className="severity-bar">
            <div className="severity-item critical">
              <span className="severity-count">{severity_summary.Critical}</span>
              <span className="severity-label">Critical</span>
            </div>
            <div className="severity-item high">
              <span className="severity-count">{severity_summary.High}</span>
              <span className="severity-label">High</span>
            </div>
            <div className="severity-item medium">
              <span className="severity-count">{severity_summary.Medium}</span>
              <span className="severity-label">Medium</span>
            </div>
            <div className="severity-item low">
              <span className="severity-count">{severity_summary.Low}</span>
              <span className="severity-label">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Scores */}
      <div className="agent-scores-grid">
        {agent_scores.map((agent, i) => (
          <div key={i} className="agent-score-card">
            <div className="agent-icon">{getAgentIcon(agent.agent)}</div>
            <div className="agent-info">
              <h4>{agent.agent.replace(' Agent', '')}</h4>
              <div className="agent-bar">
                <div className="agent-bar-fill" style={{ width: `${agent.score}%`, background: getScoreColor(agent.score) }}></div>
              </div>
            </div>
            <div className="agent-score-value" style={{ color: getScoreColor(agent.score) }}>{agent.score}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>All Findings</button>
        <button className={activeTab === 'recommendations' ? 'tab active' : 'tab'} onClick={() => setActiveTab('recommendations')}>Recommendations</button>
        {agent_details.map((agent, i) => (
          <button key={i} className={activeTab === `agent-${i}` ? 'tab active' : 'tab'} onClick={() => setActiveTab(`agent-${i}`)}>
            {agent.agent.replace(' Agent', '')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="report-tab-content">
        {activeTab === 'overview' && (
          <div className="findings-list">
            {prioritized_findings.map((finding, i) => (
              <div key={i} className="finding-card">
                <div className="finding-header">
                  <span className="finding-severity" style={{ background: getSeverityColor(finding.severity) }}>{finding.severity}</span>
                  <span className="finding-category">{finding.category}</span>
                  <span className="finding-agent">{finding.source_agent}</span>
                </div>
                <p className="finding-explanation">{finding.explanation}</p>
                <div className="finding-details">
                  <div className="finding-detail"><strong>File:</strong> {finding.affected_file}</div>
                  <div className="finding-detail"><strong>Impact:</strong> {finding.potential_impact}</div>
                  <div className="finding-detail"><strong>Solution:</strong> {finding.recommended_solution}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-list">
            {recommendations.map((rec, i) => (
              <div key={i} className="recommendation-card">
                <div className="rec-header">
                  <span className={`rec-priority priority-${rec.priority.toLowerCase().replace(' ', '-')}`}>{rec.priority}</span>
                  <span className="rec-category">{rec.category}</span>
                </div>
                <p>{rec.action}</p>
                <span className="rec-source">via {rec.source}</span>
              </div>
            ))}
          </div>
        )}

        {agent_details.map((agent, i) => (
          activeTab === `agent-${i}` && (
            <div key={i} className="agent-detail-section">
              <div className="agent-detail-header">
                <h3>{agent.agent}</h3>
                <p>{agent.description}</p>
                <div className="agent-detail-score" style={{ color: getScoreColor(agent.score) }}>Score: {agent.score}/100</div>
              </div>
              <div className="findings-list">
                {agent.findings.map((finding, j) => (
                  <div key={j} className="finding-card">
                    <div className="finding-header">
                      <span className="finding-severity" style={{ background: getSeverityColor(finding.severity) }}>{finding.severity}</span>
                      <span className="finding-category">{finding.category}</span>
                    </div>
                    <p className="finding-explanation">{finding.explanation}</p>
                    <div className="finding-details">
                      <div className="finding-detail"><strong>Evidence:</strong> {finding.evidence}</div>
                      <div className="finding-detail"><strong>File:</strong> {finding.affected_file}</div>
                      <div className="finding-detail"><strong>Impact:</strong> {finding.potential_impact}</div>
                      <div className="finding-detail"><strong>Solution:</strong> {finding.recommended_solution}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
