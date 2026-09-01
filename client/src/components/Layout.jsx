import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div className="app-shell">
      {/* ── Sticky Top Nav ── */}
      <header className="top-nav">
        <div className="top-nav-inner">
          {/* Left: Logo */}
          <Link to="/app/dashboard" className="top-nav-logo">
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

          {/* Center: Navigation links */}
          <nav className="top-nav-links">
            <Link to="/app/dashboard" className={`top-nav-link ${isActive('/app/dashboard') || location.pathname === '/app' ? 'active' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              Dashboard
            </Link>
            <Link to="/app/projects/new" className={`top-nav-link ${isActive('/app/projects/new') ? 'active' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              New Audit
            </Link>
          </nav>

          {/* Right: User + CTA */}
          <div className="top-nav-right">
            <div className="top-nav-user">
              <div className="avatar-sm">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
              <span className="top-nav-username">{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="top-nav-logout" title="Sign out">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-width Content ── */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
