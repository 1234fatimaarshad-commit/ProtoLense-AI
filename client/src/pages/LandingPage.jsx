import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

/**
 * Smooth scroll-reveal hook.
 * Attaches an IntersectionObserver to the container ref and adds
 * `revealed` class to child `.reveal` elements as they enter the viewport.
 */
function useReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const els = node.querySelectorAll('.reveal')
    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return ref
}

const agents = [
  { name: 'Code Analysis', icon: '{ }', color: '#00d4ff', desc: 'Syntax quality, complexity metrics, code smells & long-term maintainability scoring.' },
  { name: 'Architecture', icon: '[ ]', color: '#a855f7', desc: 'Modularity analysis, coupling detection, SOLID compliance & structural integrity.' },
  { name: 'Security', icon: '!', color: '#f43f5e', desc: 'Vulnerability scanning, injection risk detection, auth exposure & secret leaks.' },
  { name: 'Performance', icon: '>', color: '#fbbf24', desc: 'Bottleneck identification, memory leak detection, I/O & algorithmic efficiency.' },
  { name: 'Product/UX', icon: '*', color: '#00ff88', desc: 'Usability audit, accessibility compliance, error handling & user flow analysis.' }
]

const pipelineSteps = [
  { label: 'Ingestion', icon: '↗', desc: 'Upload & parse codebase', color: '#00d4ff' },
  { label: 'Specialist Agents', icon: '⬡', desc: '5 parallel AI analyses', color: '#a855f7' },
  { label: 'Orchestrator', icon: '◈', desc: 'Consolidate & score', color: '#fbbf24' },
  { label: 'Health Report', icon: '✓', desc: 'Unified actionable report', color: '#00ff88' }
]

export default function LandingPage() {
  const agentsRef = useReveal()
  const pipelineRef = useReveal()

  return (
    <div className="landing-page">
      {/* ── Ambient background ── */}
      <div className="landing-grid-bg" />
      <div className="hero-ambient-glow" />

      {/* ── Top Nav (Intel-style 3-column) ── */}
      <header className="top-nav landing-top-nav">
        <div className="top-nav-inner">
          {/* Left: Logo */}
          <Link to="/" className="top-nav-logo">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#00d4ff" strokeWidth="2.5"/>
              <circle cx="16" cy="16" r="6" fill="#00d4ff"/>
              <line x1="16" y1="2" x2="16" y2="10" stroke="#00d4ff" strokeWidth="2"/>
              <line x1="16" y1="22" x2="16" y2="30" stroke="#00d4ff" strokeWidth="2"/>
              <line x1="2" y1="16" x2="10" y2="16" stroke="#00d4ff" strokeWidth="2"/>
              <line x1="22" y1="16" x2="30" y2="16" stroke="#00d4ff" strokeWidth="2"/>
            </svg>
            <span>ProtoLens AI</span>
          </Link>

          {/* Center: Links */}
          <nav className="top-nav-links">
            <a href="#platform" className="top-nav-link">Platform</a>
            <a href="#agents" className="top-nav-link">Agents</a>
            <a href="#pipeline" className="top-nav-link">Architecture</a>
            <a href="#docs" className="top-nav-link">Docs</a>
          </nav>

          {/* Right: Utilities + Sign In */}
          <div className="top-nav-right">
            <button className="top-nav-icon-btn" title="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <Link to="/login" className="btn-nav-signin">Sign In</Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="hero-section fade-in-up" id="platform">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Multi-Agent AI Analysis Engine — v1.0
        </div>
        <h1 className="hero-title">
          Powering the future of<br />
          <span className="gradient-text">software auditing</span>
        </h1>
        <p className="hero-subtitle">
          Transform your codebase with multi-agent intelligence. Five specialist AI agents
          audit your code in parallel — delivering a unified health score in under 30 seconds.
        </p>
        <div className="hero-ctas">
          <Link to="/login" className="btn-glow btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Audit
          </Link>
          <a href="#agents" className="btn-outline btn-lg">
            Explore Agents
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </a>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <div className="hero-metric-value">5</div>
            <div className="hero-metric-label">Specialist Agents</div>
          </div>
          <div className="hero-metric-divider" />
          <div className="hero-metric">
            <div className="hero-metric-value">100+</div>
            <div className="hero-metric-label">Analysis Checks</div>
          </div>
          <div className="hero-metric-divider" />
          <div className="hero-metric">
            <div className="hero-metric-value">&lt;30s</div>
            <div className="hero-metric-label">Avg. Audit Time</div>
          </div>
          <div className="hero-metric-divider" />
          <div className="hero-metric">
            <div className="hero-metric-value">A–F</div>
            <div className="hero-metric-label">Health Grades</div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid (5 Agent Cards) ── */}
      <section className="landing-section" id="agents" ref={agentsRef}>
        <div className="section-eyebrow">Core Pillars</div>
        <h2 className="landing-section-title">Five Specialist Agents</h2>
        <p className="landing-section-sub">
          Each agent independently analyzes your codebase through a specialized lens, then delivers findings in a standardized, actionable schema.
        </p>
        <div className="feature-grid">
          {agents.map((agent, i) => (
            <div key={i} className="feature-card reveal" style={{ transitionDelay: `${i * 80}ms`, '--card-accent': agent.color }}>
              <div className="feature-card-icon" style={{ color: agent.color }}>
                <span>{agent.icon}</span>
              </div>
              <h4 className="feature-card-title">{agent.name}</h4>
              <p className="feature-card-desc">{agent.desc}</p>
              <div className="feature-card-line" style={{ background: agent.color }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline Section ── */}
      <section className="landing-section" id="pipeline" ref={pipelineRef}>
        <div className="section-eyebrow">How It Works</div>
        <h2 className="landing-section-title">The Analysis Pipeline</h2>
        <p className="landing-section-sub">
          From upload to actionable report — a streamlined, autonomous workflow powered by AI.
        </p>
        <div className="pipeline-flow">
          {pipelineSteps.map((step, i) => (
            <div key={i} className="pipeline-step-wrapper">
              <div className="pipeline-step reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="pipeline-step-icon" style={{ color: step.color }}>
                  <span>{step.icon}</span>
                </div>
                <h4>{step.label}</h4>
                <p>{step.desc}</p>
              </div>
              {i < pipelineSteps.length - 1 && (
                <div className="pipeline-connector">
                  <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                    <line x1="0" y1="6" x2="24" y2="6" stroke="rgba(0,212,255,0.25)" strokeWidth="2" strokeDasharray="4 3"/>
                    <polyline points="22,2 28,6 22,10" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="2"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Docs Section (placeholder) ── */}
      <section className="landing-section landing-section-compact" id="docs">
        <div className="section-eyebrow">Documentation</div>
        <h2 className="landing-section-title">Get Started in Minutes</h2>
        <p className="landing-section-sub">
          Upload your project folder or .zip archive, select your tech stack, and let the agents do the rest. No configuration required.
        </p>
        <div className="hero-ctas" style={{ marginTop: '24px' }}>
          <Link to="/login" className="btn-glow btn-lg">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#00d4ff" strokeWidth="2"/>
              <circle cx="16" cy="16" r="5" fill="#00d4ff" opacity="0.6"/>
            </svg>
            ProtoLens AI
          </div>
          <span className="landing-footer-copy">&copy; {new Date().getFullYear()} ProtoLens AI — Multi-Agent Software Health Platform</span>
        </div>
      </footer>
    </div>
  )
}
