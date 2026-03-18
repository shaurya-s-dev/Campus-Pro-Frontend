import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '@/context/ThemeContext';
import { logout } from '@/lib/security';

/* ── Inline SVG Icons ────────────────────────────── */
const icons = {
  grid:      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  chart:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  award:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  clock:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  book:      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  calculator:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/></svg>,
  calendar:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  user:      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevronLeft: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
  sun:       <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  hexagon:   <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>,
};

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',    icon: 'grid',       path: '/dashboard' },
  { id: 'attendance',  label: 'Attendance',  icon: 'chart',      path: '/dashboard?tab=attendance' },
  { id: 'marks',       label: 'Marks',       icon: 'award',      path: '/dashboard?tab=marks' },
  { id: 'timetable',   label: 'Timetable',   icon: 'clock',      path: '/dashboard?tab=timetable' },
  { id: 'courses',     label: 'Courses',     icon: 'book',       path: '/dashboard?tab=courses' },
];

const EXTRA_ITEMS = [
  { id: 'calculator', label: 'GPA Calc',  icon: 'calculator', path: '/calculator' },
  { id: 'calendar',   label: 'Calendar',  icon: 'calendar',   path: '/calendar' },
  { id: 'profile',    label: 'Profile',   icon: 'user',       path: '/profile' },
];

export default function Sidebar({ activeTab, onTabChange, user, below75 }) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  // Keyboard shortcut: [ to toggle collapse
  useEffect(() => {
    const handler = (e) => { if (e.key === '[' && !e.target.matches('input,textarea')) setCollapsed(p => !p); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (id) => activeTab === id || (id === 'overview' && !activeTab);
  const isPathActive = (path) => router.pathname === path.split('?')[0];

  const avatarInitial = (user?.name || 'S')[0].toUpperCase();

  const SidebarContent = () => (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Brand ─────────────────────────────────── */}
      <div className="brand">
        <div className="brand-icon">{icons.hexagon}</div>
        {!collapsed && (
          <span className="brand-text">
            Campus<strong>Pro</strong>
          </span>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(p => !p)} title={collapsed ? 'Expand sidebar [' : 'Collapse sidebar ['}>
          {collapsed ? icons.chevronRight : icons.chevronLeft}
        </button>
      </div>

      {/* ── User card ─────────────────────────────── */}
      {!collapsed && (
        <Link href="/profile" className="user-card">
          <div className="user-avatar">{avatarInitial}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Student'}</div>
            <div className="user-reg">{user?.regNumber || '—'}</div>
          </div>
          {below75 > 0 && (
            <div className="user-alert" title={`${below75} subject(s) below 75%`}>{below75}</div>
          )}
        </Link>
      )}
      {collapsed && (
        <Link href="/profile" className="user-avatar-mini" title={user?.name || 'Profile'}>
          {avatarInitial}
        </Link>
      )}

      {/* ── Stats strip ───────────────────────────── */}
      {!collapsed && user && (
        <div className="stats-strip">
          <div className="stat-pill">
            <div className="stat-val">{user.semester || '—'}</div>
            <div className="stat-lbl">Sem</div>
          </div>
          <div className="stat-pill" style={{ '--sc': below75 > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
            <div className="stat-val" style={{ color: 'var(--sc)' }}>{below75}</div>
            <div className="stat-lbl">Danger</div>
          </div>
          <div className="stat-pill">
            <div className="stat-val">{user.year || '—'}</div>
            <div className="stat-lbl">Year</div>
          </div>
        </div>
      )}

      {/* ── Nav label ─────────────────────────────── */}
      {!collapsed && <div className="nav-section-label">Navigation</div>}
      <div className={`nav-divider ${collapsed ? 'divider-mini' : ''}`} />

      {/* ── Main nav ──────────────────────────────── */}
      <nav className="main-nav">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              className={`nav-item ${active ? 'nav-active' : ''}`}
              onClick={() => onTabChange?.(item.id)}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              {active && <div className="active-bar" />}

              <span className="nav-icon" style={{ color: active ? 'var(--nav-text-active)' : '' }}>
                {icons[item.icon]}
              </span>

              {!collapsed && (
                <span className="nav-label">{item.label}</span>
              )}

              {/* Danger badge on attendance */}
              {item.id === 'attendance' && below75 > 0 && !collapsed && (
                <span className="nav-badge">{below75}</span>
              )}
              {item.id === 'attendance' && below75 > 0 && collapsed && (
                <span className="nav-badge-mini" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Tools ─────────────────────────────────── */}
      {!collapsed && <div className="nav-section-label" style={{ marginTop: 16 }}>Tools</div>}
      {collapsed && <div style={{ margin: '12px 0 4px', height: 1, background: 'var(--border)' }} />}

      <nav className="extra-nav">
        {EXTRA_ITEMS.map((item) => {
          const active = isPathActive(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`nav-item ${active ? 'nav-active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {active && <div className="active-bar" />}
              <span className="nav-icon" style={{ color: active ? 'var(--nav-text-active)' : '' }}>
                {icons[item.icon]}
              </span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom actions ────────────────────────── */}
      <div className="sidebar-bottom">
        {/* Theme toggle */}
        <button
          className={`theme-toggle ${collapsed ? 'theme-toggle-mini' : ''}`}
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
          <span className="theme-icon">
            {theme === 'dark' ? icons.sun : icons.moon}
          </span>
          {!collapsed && (
            <span className="theme-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          )}
          {!collapsed && (
            <div className={`theme-track ${theme === 'light' ? 'track-on' : ''}`}>
              <div className="theme-thumb" />
            </div>
          )}
        </button>

        {/* Logout */}
        <button
          className={`logout-btn ${collapsed ? 'logout-mini' : ''}`}
          onClick={() => logout(router)}
          title="Sign out"
        >
          <span className="nav-icon">{icons.logout}</span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      <style jsx>{`
        /* ── Sidebar shell ────────────────────────── */
        .sidebar {
          width: 228px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px 10px;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          overflow-y: auto;
          overflow-x: hidden;
          flex-shrink: 0;
          transition: width 0.28s cubic-bezier(.4,0,.2,1);
          z-index: 30;
        }
        .sidebar.collapsed { width: 64px; }
        .sidebar::-webkit-scrollbar { width: 0; }

        /* ── Brand ────────────────────────────────── */
        .brand {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 6px 6px 12px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
          position: relative;
        }
        .brand-icon {
          color: var(--accent);
          filter: drop-shadow(0 0 8px var(--accent-glow));
          flex-shrink: 0;
          display: flex;
          align-items: center;
          transition: filter 0.3s;
        }
        .brand:hover .brand-icon { filter: drop-shadow(0 0 14px var(--accent-glow)); }
        .brand-text {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.3px;
          white-space: nowrap;
          flex: 1;
        }
        .brand-text strong { color: var(--accent); }

        .collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: none;
          border: 1px solid var(--border);
          color: var(--text-3);
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
          padding: 0;
          margin-left: auto;
        }
        .collapse-btn:hover { background: var(--bg-hover); color: var(--text-1); border-color: var(--border-strong); }

        /* ── User card ────────────────────────────── */
        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: var(--radius-md);
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          transition: all 0.18s;
          cursor: pointer;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }
        .user-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--accent-dim), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .user-card:hover::before { opacity: 1; }
        .user-card:hover { border-color: var(--accent); box-shadow: 0 4px 16px var(--accent-glow); }

        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .user-avatar-mini {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), #4f46e5);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: white;
          margin: 0 auto 4px;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 4px 12px var(--accent-glow);
          transition: transform 0.15s;
        }
        .user-avatar-mini:hover { transform: scale(1.06); }

        .user-info { flex: 1; min-width: 0; }
        .user-name { font-size: 12.5px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-reg  { font-family: var(--font-mono); font-size: 10px; color: var(--text-3); margin-top: 1px; }
        .user-alert {
          flex-shrink: 0;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          background: var(--rose);
          color: white;
          font-size: 9.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.75;transform:scale(.9)} }

        /* ── Stats strip ──────────────────────────── */
        .stats-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 0 2px;
        }
        .stat-pill {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 9px;
          padding: 7px 4px;
          text-align: center;
        }
        .stat-val { font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--text-1); }
        .stat-lbl { font-size: 9px; color: var(--text-3); margin-top: 1px; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── Nav section label ────────────────────── */
        .nav-section-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--text-4);
          padding: 4px 10px 2px;
        }
        .nav-divider { height: 1px; background: var(--border); margin: 2px 0 6px; }
        .divider-mini { margin: 4px 0 8px; }

        /* ── Nav item ─────────────────────────────── */
        .main-nav, .extra-nav { display: flex; flex-direction: column; gap: 1px; }
        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          border-radius: 10px;
          background: none;
          border: none;
          color: var(--nav-text-default);
          font-size: 13.5px;
          font-family: var(--font-body);
          font-weight: 450;
          text-align: left;
          cursor: pointer;
          transition: all 0.16s cubic-bezier(.4,0,.2,1);
          text-decoration: none;
          overflow: hidden;
        }
        .nav-item:hover {
          background: var(--nav-item-hover);
          color: var(--text-2);
        }
        .nav-item:hover .nav-icon { transform: scale(1.1); }
        .nav-active {
          background: var(--nav-item-active) !important;
          color: var(--nav-text-active) !important;
          font-weight: 600;
        }
        .nav-active .nav-icon { filter: drop-shadow(0 0 6px var(--accent-glow)); }

        /* Glowing active bar on left edge */
        .active-bar {
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--accent);
          box-shadow: 2px 0 10px var(--accent-glow);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: transform 0.15s, color 0.15s;
        }
        .nav-label { flex: 1; white-space: nowrap; }

        /* Badge */
        .nav-badge {
          flex-shrink: 0;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          background: var(--rose-dim);
          color: var(--rose);
          border: 1px solid rgba(244,63,94,.22);
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
        }
        .nav-badge-mini {
          position: absolute;
          top: 6px; right: 6px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--rose);
          box-shadow: 0 0 5px var(--rose);
        }

        /* ── Bottom ───────────────────────────────── */
        .sidebar-bottom {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Theme toggle */
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          border-radius: 10px;
          background: none;
          border: none;
          color: var(--text-3);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.16s;
          text-align: left;
        }
        .theme-toggle:hover { background: var(--bg-hover); color: var(--text-1); }
        .theme-toggle-mini { justify-content: center; padding: 9px 0; }
        .theme-icon { display: flex; align-items: center; flex-shrink: 0; }
        .theme-label { flex: 1; font-size: 12.5px; }

        /* Toggle switch */
        .theme-track {
          width: 28px;
          height: 16px;
          border-radius: 8px;
          background: var(--border-strong);
          position: relative;
          flex-shrink: 0;
          transition: background 0.25s;
        }
        .track-on { background: var(--accent); }
        .theme-thumb {
          position: absolute;
          top: 2px; left: 2px;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: white;
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 1px 4px rgba(0,0,0,.3);
        }
        .track-on .theme-thumb { transform: translateX(12px); }

        /* Logout */
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          border-radius: 10px;
          background: none;
          border: none;
          color: var(--text-3);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.16s;
          text-align: left;
        }
        .logout-btn:hover { background: var(--rose-dim); color: var(--rose); }
        .logout-mini { justify-content: center; padding: 9px 0; }
      `}</style>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="mob-overlay"
          onClick={() => setMobileOpen(false)}
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',zIndex:40 }}
        />
      )}

      {/* Mobile trigger button */}
      <button
        className="mob-trigger"
        onClick={() => setMobileOpen(true)}
        style={{
          display:'none',position:'fixed',top:14,left:14,zIndex:50,
          width:38,height:38,borderRadius:10,background:'var(--sidebar-bg)',
          border:'1px solid var(--sidebar-border)',color:'var(--text-1)',
          alignItems:'center',justifyContent:'center',cursor:'pointer',
        }}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      {/* Desktop sidebar — always visible */}
      <div className="sidebar-desktop">
        <SidebarContent />
      </div>

      {/* Mobile sidebar — slide in */}
      <div className={`sidebar-mobile ${mobileOpen ? 'open' : ''}`}>
        <SidebarContent />
      </div>

      <style jsx>{`
        .sidebar-desktop { display: flex; }
        .sidebar-mobile {
          display: none;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(.4,0,.2,1);
        }
        .sidebar-mobile.open { transform: translateX(0); }

        @media (max-width: 860px) {
          .sidebar-desktop { display: none; }
          .sidebar-mobile { display: flex; }
          .mob-trigger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
