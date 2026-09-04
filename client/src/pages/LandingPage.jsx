import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

/* ── Data ── */
const agents = [
  { name: 'Code Analysis', icon: '{ }', color: '#00d4ff', desc: 'Syntax quality, complexity metrics, code smells & maintainability scoring.' },
  { name: 'Architecture', icon: '◇', color: '#a855f7', desc: 'Modularity analysis, coupling detection, SOLID compliance & structural integrity.' },
  { name: 'Security', icon: '⬡', color: '#f43f5e', desc: 'Vulnerability scanning, injection risks, auth exposure & secret leak detection.' },
  { name: 'Performance', icon: '▸', color: '#fbbf24', desc: 'Bottleneck identification, memory leaks, I/O & algorithmic efficiency analysis.' },
  { name: 'Product/UX', icon: '◎', color: '#00ff88', desc: 'Usability audit, accessibility compliance, error handling & user flow review.' }
]

/* SVG network layout: 5 agents on a circle around a central orchestrator */
const CX = 350, CY = 280, R = 190
const agentNodes = agents.map((a, i) => {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
  return {
    ...a,
    x: CX + R * Math.cos(angle),
    y: CY + R * Math.sin(angle)
  }
})

/* ── Hooks ── */

/** Scroll progress for an element (0 = entering viewport, 1 = fully visible) */
function useScrollProgress() {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const raw = (vh - rect.top) / (vh + rect.height)
      setProgress(Math.max(0, Math.min(1, raw)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return [ref, progress]
}

/** IntersectionObserver that adds phase classes at ratio thresholds */
function usePhasedObserver(thresholds = [0.1, 0.25, 0.45, 0.65]) {
  const ref = useRef(null)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const r = entry.intersectionRatio
            if (r >= thresholds[3]) setPhase(4)
            else if (r >= thresholds[2]) setPhase(3)
            else if (r >= thresholds[1]) setPhase(2)
            else if (r >= thresholds[0]) setPhase(1)
          }
        })
      },
      { threshold: thresholds }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, phase]
}

/* ── Component ── */
export default function LandingPage() {
  const [netRef, netPhase] = usePhasedObserver([0.08, 0.2, 0.38, 0.55])
  const [heroRef, heroProgress] = useScrollProgress()

  return (
    <div className="landing-page">
      {/* ── Ambient background ── */}
      <div className="landing-grid-bg" />

      {/* ── Top Nav ── */}
      <header className="top-nav landing-top-nav">
        <div className="top-nav-inner">
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
          <nav className="top-nav-links">
            <a href="#platform" className="top-nav-link">Platform</a>
            <a href="#agents" className="top-nav-link">Agents</a>
            <a href="#pipeline" className="top-nav-link">Architecture</a>
          </nav>
          <div className="top-nav-right">
            <Link to="/login" className="btn-nav-signin">Sign In</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero" id="platform" ref={heroRef}>
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-hero-dot" />
            Multi-Agent Analysis Engine
          </div>
          <h1 className="lp-hero-title">
            Analyze software like an<br />
            <span className="lp-gradient">entire engineering team.</span>
          </h1>
          <p className="lp-hero-sub">
            Five specialist AI agents audit your codebase in parallel — code quality,
            architecture, security, performance, and UX — delivering a unified health
            score in under 30 seconds.
          </p>
          <div className="lp-hero-ctas">
            <Link to="/register" className="btn-glow btn-lg">
              Start Free Audit
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <a href="#agents" className="btn-outline btn-lg">
              See How It Works
            </a>
          </div>
          <div className="lp-hero-stats">
            <div className="lp-stat"><span className="lp-stat-val">5</span><span className="lp-stat-lbl">Specialist Agents</span></div>
            <div className="lp-stat-sep" />
            <div className="lp-stat"><span className="lp-stat-val">100+</span><span className="lp-stat-lbl">Analysis Checks</span></div>
            <div className="lp-stat-sep" />
            <div className="lp-stat"><span className="lp-stat-val">&lt;30s</span><span className="lp-stat-lbl">Audit Time</span></div>
            <div className="lp-stat-sep" />
            <div className="lp-stat"><span className="lp-stat-val">A–F</span><span className="lp-stat-lbl">Health Grades</span></div>
          </div>
        </div>
      </section>

      {/* ── Agent Network Visualization ── */}
      <section className="lp-network-section" id="agents" ref={netRef} data-phase={netPhase}>
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">The Agent Network</span>
          <h2 className="lp-section-title">Five Specialists. One Orchestrator.</h2>
          <p className="lp-section-sub">
            Each agent analyzes your codebase through a different lens. The orchestrator
            consolidates findings into a single, actionable health report.
          </p>
        </div>

        <div className="lp-network-canvas">
          <svg viewBox="0 0 700 560" className="lp-network-svg" aria-label="Agent network visualization">
            <defs>
              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-sm" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Data flow gradient */}
              <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* Phase 3: Connection lines (agent → orchestrator) */}
            {agentNodes.map((a, i) => (
              <line
                key={`line-${i}`}
                x1={a.x} y1={a.y} x2={CX} y2={CY}
                stroke={a.color}
                strokeWidth="1.5"
                strokeOpacity={netPhase >= 3 ? 0.2 : 0}
                className="lp-net-line"
                style={{ transitionDelay: `${i * 120}ms` }}
              />
            ))}

            {/* Phase 4: Data flow dots along lines */}
            {netPhase >= 4 && agentNodes.map((a, i) => (
              <circle
                key={`flow-${i}`}
                r="3"
                fill={a.color}
                filter="url(#glow-sm)"
                className="lp-flow-dot"
                style={{
                  '--x1': `${a.x}`, '--y1': `${a.y}`,
                  '--x2': `${CX}`, '--y2': `${CY}`,
                  animationDelay: `${i * 300}ms`
                }}
              />
            ))}

            {/* Phase 2: Agent nodes */}
            {agentNodes.map((a, i) => (
              <g
                key={`agent-${i}`}
                className={`lp-agent-node ${netPhase >= 2 ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Outer glow ring */}
                <circle cx={a.x} cy={a.y} r="38" fill="none" stroke={a.color} strokeWidth="1" strokeOpacity="0.15" />
                {/* Main circle */}
                <circle cx={a.x} cy={a.y} r="32" fill="rgba(14,17,32,0.85)" stroke={a.color} strokeWidth="1.5" filter="url(#glow-sm)" />
                {/* Icon */}
                <text x={a.x} y={a.y + 1} textAnchor="middle" dominantBaseline="central" fill={a.color} fontSize="15" fontFamily="'Space Grotesk', sans-serif" fontWeight="700">{a.icon}</text>
                {/* Label */}
                <text x={a.x} y={a.y + 54} textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="'Inter', sans-serif" fontWeight="500">{a.name}</text>
                {/* Description (visible on larger screens) */}
                <text x={a.x} y={a.y + 70} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="'Inter', sans-serif" className="lp-agent-desc-text">
                  {a.desc.length > 40 ? a.desc.slice(0, 40) + '…' : a.desc}
                </text>
              </g>
            ))}

            {/* Phase 1: Orchestrator (center) */}
            <g className={`lp-orch-node ${netPhase >= 1 ? 'visible' : ''}`}>
              {/* Pulse rings */}
              <circle cx={CX} cy={CY} r="55" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.1" className="lp-orch-ring lp-orch-ring-1" />
              <circle cx={CX} cy={CY} r="68" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.06" className="lp-orch-ring lp-orch-ring-2" />
              {/* Main circle */}
              <circle cx={CX} cy={CY} r="44" fill="rgba(14,17,32,0.9)" stroke="#fbbf24" strokeWidth="2" filter="url(#glow)" />
              {/* Inner detail */}
              <circle cx={CX} cy={CY} r="18" fill="none" stroke="#fbbf24" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 4" />
              {/* Label */}
              <text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="central" fill="#fbbf24" fontSize="11" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" letterSpacing="1.5">ORCH</text>
              <text x={CX} y={CY + 10} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="'Inter', sans-serif" fontWeight="400">Orchestrator</text>
              {/* Bottom label */}
              <text x={CX} y={CY + 68} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="'Inter', sans-serif">Consolidates & Scores</text>
            </g>
          </svg>
        </div>

        {/* Agent detail cards below the visualization */}
        <div className="lp-agent-cards">
          {agents.map((a, i) => (
            <div key={i} className={`lp-agent-card ${netPhase >= 2 ? 'visible' : ''}`} style={{ transitionDelay: `${i * 80 + 200}ms`, '--card-color': a.color }}>
              <div className="lp-agent-card-icon" style={{ color: a.color }}>{a.icon}</div>
              <h4>{a.name}</h4>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section className="lp-pipeline-section" id="pipeline">
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">How It Works</span>
          <h2 className="lp-section-title">From Code to Clarity</h2>
          <p className="lp-section-sub">Upload your project. Get a comprehensive health report in seconds.</p>
        </div>
        <div className="lp-pipeline-steps">
          {[
            { step: '01', label: 'Upload', desc: 'Drop your folder or .zip archive', color: '#00d4ff' },
            { step: '02', label: 'Parse', desc: 'File structure & source indexed', color: '#38bdf8' },
            { step: '03', label: 'Analyze', desc: '5 agents run 100+ checks in parallel', color: '#a855f7' },
            { step: '04', label: 'Consolidate', desc: 'Orchestrator merges & prioritizes', color: '#fbbf24' },
            { step: '05', label: 'Report', desc: 'Unified A–F health grade delivered', color: '#00ff88' }
          ].map((s, i) => (
            <div key={i} className="lp-pipe-step">
              <div className="lp-pipe-num" style={{ color: s.color }}>{s.step}</div>
              <h4>{s.label}</h4>
              <p>{s.desc}</p>
              {i < 4 && <div className="lp-pipe-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="lp-cta-section">
        <h2>Ready to see your code clearly?</h2>
        <p>Upload your project and get a multi-agent health audit in under 30 seconds. No configuration required.</p>
        <div className="lp-hero-ctas" style={{ marginTop: '24px' }}>
          <Link to="/register" className="btn-glow btn-lg">
            Start Free Audit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
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
