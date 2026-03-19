import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '@/context/ThemeContext';
import { logout } from '@/lib/security';

/* ── SVG Icon system ─────────────────────────────────── */
const I = ({ d, size = 17, sw = 1.75, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  grid:      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
  chart:     <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  award:     <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  clock:     <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  book:      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  calculator:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10" strokeWidth="2.5"/><line x1="12" y1="10" x2="12" y2="10" strokeWidth="2.5"/><line x1="16" y1="10" x2="16" y2="10" strokeWidth="2.5"/><line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5"/><line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5"/><line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18" strokeWidth="2.5"/></svg>,
  calendar:  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  user:      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevL:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
  sun:       <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  menu:      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',    icon: 'grid',       path: '/dashboard',                  group: 'main' },
  { id: 'attendance', label: 'Attendance',  icon: 'chart',      path: '/dashboard?tab=attendance',   group: 'main' },
  { id: 'marks',      label: 'Marks',       icon: 'award',      path: '/dashboard?tab=marks',        group: 'main' },
  { id: 'timetable',  label: 'Timetable',   icon: 'clock',      path: '/dashboard?tab=timetable',    group: 'main' },
  { id: 'courses',    label: 'Courses',     icon: 'book',       path: '/dashboard?tab=courses',      group: 'main' },
  { id: 'calculator', label: 'GPA Calc',    icon: 'calculator', path: '/calculator',   isLink: true, group: 'tools' },
  { id: 'calendar',   label: 'Calendar',    icon: 'calendar',   path: '/calendar',     isLink: true, group: 'tools' },
];

export default function Sidebar({ activeTab, onTabChange, user, below75 }) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '[' && !e.target.matches('input,textarea')) setCollapsed(p => !p);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (id) => activeTab === id || (id === 'overview' && !activeTab);
  const isPathActive = (path) => router.pathname === path.split('?')[0];
  const initial = (user?.name || 'S')[0].toUpperCase();

  const SidebarContent = () => (
    <aside className={`sidebar${collapsed ? ' c' : ''}`}>

      {/* ── Brand ──────────────────────────────── */}
      <div className="brand">
        <div className="brand-logo">
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="8" r="3.5" fill="white" opacity="0.9"/>
            <circle cx="8" cy="28" r="3.5" fill="white" opacity="0.9"/>
            <circle cx="32" cy="28" r="3.5" fill="white" opacity="0.9"/>
            <circle cx="20" cy="20" r="4.5" fill="white"/>
            <line x1="20" y1="8" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.6"/>
            <line x1="8" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.6"/>
            <line x1="32" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.6"/>
          </svg>
        </div>
        {!collapsed && (
          <span className="brand-wordmark">
            Campus<strong>Pro</strong>
          </span>
        )}
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(p => !p)}
          title={collapsed ? 'Expand [' : 'Collapse ['}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? icons.chevR : icons.chevL}
        </button>
      </div>

      {/* ── User card ──────────────────────────── */}
      {!collapsed ? (
        <Link href="/profile" className="user-card">
          <div className="avatar">{initial}</div>
          <div className="user-text">
            <div className="user-name">{user?.name || 'Student'}</div>
            <div className="user-reg">{user?.regNumber || '—'}</div>
          </div>
          {below75 > 0 && (
            <span className="alert-dot" title={`${below75} below 75%`}>{below75}</span>
          )}
        </Link>
      ) : (
        <Link href="/profile" className="avatar-mini" title={user?.name}>
          {initial}
        </Link>
      )}

      {/* ── Stats ──────────────────────────────── */}
      {!collapsed && user && (
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-v">{user.semester || '—'}</span>
            <span className="stat-l">Sem</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-item">
            <span className="stat-v" style={{ color: below75 > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
              {below75}
            </span>
            <span className="stat-l">Danger</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-item">
            <span className="stat-v">{user.year || '—'}</span>
            <span className="stat-l">Year</span>
          </div>
        </div>
      )}

      {/* ── Nav groups ─────────────────────────── */}
      <nav className="nav-wrap">
        {!collapsed && <div className="nav-label">MAIN</div>}

        {NAV_ITEMS.filter(i => i.group === 'main').map(item => {
          const active = isActive(item.id);
          return item.isLink ? (
            <Link
              key={item.id}
              href={item.path}
              className={`nav-item${active ? ' nav-active' : ''}`}
              title={collapsed ? item.label : undefined}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {active && <span className="active-bar" />}
              <span className="nav-icon">{icons[item.icon]}</span>
              {!collapsed && <span className="nav-text">{item.label}</span>}
            </Link>
          ) : (
            <button
              key={item.id}
              className={`nav-item${active ? ' nav-active' : ''}`}
              onClick={() => onTabChange?.(item.id)}
              title={collapsed ? item.label : undefined}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {active && <span className="active-bar" />}
              <span className="nav-icon">{icons[item.icon]}</span>
              {!collapsed && <span className="nav-text">{item.label}</span>}
              {item.id === 'attendance' && below75 > 0 && !collapsed && (
                <span className="nav-badge">{below75}</span>
              )}
              {item.id === 'attendance' && below75 > 0 && collapsed && (
                <span className="badge-dot" />
              )}
            </button>
          );
        })}

        {!collapsed && <div className="nav-label" style={{ marginTop: 10 }}>TOOLS</div>}
        {collapsed && <div className="nav-divider" />}

        {NAV_ITEMS.filter(i => i.group === 'tools').map(item => {
          const active = isPathActive(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`nav-item${active ? ' nav-active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {active && <span className="active-bar" />}
              <span className="nav-icon">{icons[item.icon]}</span>
              {!collapsed && <span className="nav-text">{item.label}</span>}
              {!collapsed && (
                <span className="nav-external">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ─────────────────────────────── */}
      <div className="bottom">
        {/* Theme toggle */}
        <button
          className={`theme-btn${collapsed ? ' theme-mini' : ''}`}
          onClick={toggle}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <span className="nav-icon">{theme === 'dark' ? icons.sun : icons.moon}</span>
          {!collapsed && (
            <>
              <span className="theme-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              <div className={`toggle-track${theme === 'light' ? ' on' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </>
          )}
        </button>

        {/* Profile link */}
        <Link
          href="/profile"
          className={`nav-item${isPathActive('/profile') ? ' nav-active' : ''}${collapsed ? ' item-center' : ''}`}
          title={collapsed ? 'Profile' : undefined}
        >
          {isPathActive('/profile') && <span className="active-bar" />}
          <span className="nav-icon">{icons.user}</span>
          {!collapsed && <span className="nav-text">Profile</span>}
        </Link>

        {/* Logout */}
        <button
          className={`logout-btn${collapsed ? ' item-center' : ''}`}
          onClick={() => logout(router)}
          title={collapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
        >
          <span className="nav-icon">{icons.logout}</span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      <style jsx>{`
        /* ── Shell ──────────────────────────────── */
        .sidebar {
          width: 224px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 14px 10px;
          gap: 3px;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          overflow-y: auto;
          overflow-x: hidden;
          flex-shrink: 0;
          transition: width 0.26s cubic-bezier(.4,0,.2,1);
          z-index: 30;
        }
        .sidebar::-webkit-scrollbar { width: 0; }
        .sidebar.c { width: 60px; }

        /* ── Brand ──────────────────────────────── */
        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 6px 13px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 6px;
        }
        .brand-logo {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .brand-wordmark {
          font-family: var(--font-display);
          font-size: 15.5px;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.4px;
          flex: 1;
          white-space: nowrap;
        }
        .brand-wordmark strong {
          background: linear-gradient(135deg, var(--accent-light), var(--cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 5px;
          background: none;
          border: 1px solid var(--border);
          color: var(--text-4);
          cursor: pointer;
          transition: all 0.14s;
          flex-shrink: 0;
          padding: 0;
          margin-left: auto;
        }
        .collapse-btn:hover { background: var(--bg-hover); color: var(--text-2); border-color: var(--border-strong); }

        /* ── User card ──────────────────────────── */
        .user-card {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 9px;
          border-radius: 11px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          transition: all 0.18s;
          cursor: pointer;
          text-decoration: none;
          overflow: hidden;
          position: relative;
          margin-bottom: 4px;
        }
        .user-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.08), transparent);
          opacity: 0;
          transition: opacity 0.18s;
        }
        .user-card:hover { border-color: var(--accent-border); box-shadow: var(--shadow-sm); }
        .user-card:hover::before { opacity: 1; }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(135deg, var(--accent), #4338ca);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 13px;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        }
        .avatar-mini {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), #4338ca);
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 14px;
          color: white;
          margin: 0 auto 6px;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          transition: transform 0.14s, box-shadow 0.14s;
        }
        .avatar-mini:hover { transform: scale(1.04); box-shadow: 0 2px 8px rgba(0,0,0,0.4); }

        .user-text { flex: 1; min-width: 0; }
        .user-name { font-size: 12px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-reg  { font-family: var(--font-mono); font-size: 9.5px; color: var(--text-3); margin-top: 1px; }
        .alert-dot {
          flex-shrink: 0;
          min-width: 17px;
          height: 17px;
          border-radius: 9px;
          background: var(--rose);
          color: white;
          font-size: 9px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-shadow: none;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.88)} }

        /* ── Stats ──────────────────────────────── */
        .stats-row {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 4px;
          margin-bottom: 4px;
        }
        .stat-item { flex: 1; text-align: center; }
        .stat-v { display: block; font-family: var(--font-mono); font-size: 13.5px; font-weight: 700; color: var(--text-1); }
        .stat-l { display: block; font-size: 9px; color: var(--text-4); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }
        .stat-sep { width: 1px; height: 28px; background: var(--border); flex-shrink: 0; }

        /* ── Nav ────────────────────────────────── */
        .nav-wrap { display: flex; flex-direction: column; gap: 1px; flex: 1; margin-top: 4px; }
        .nav-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.4px;
          color: var(--text-5);
          padding: 5px 10px 3px;
        }
        .nav-divider { height: 1px; background: var(--border); margin: 6px 4px; }

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 8.5px 10px;
          border-radius: 9px;
          background: none;
          border: none;
          color: var(--nav-text-default);
          font-size: 13px;
          font-family: var(--font-body);
          font-weight: 440;
          line-height: 1.4;
          text-align: left;
          cursor: pointer;
          transition: background 0.14s, color 0.14s;
          text-decoration: none !important;
          overflow: hidden;
        }
        .nav-item:hover { background: var(--nav-item-hover); color: var(--text-2); }
        .nav-item:hover .nav-icon { transform: scale(1.08); }
        .nav-active {
          background: var(--nav-item-active) !important;
          color: var(--nav-text-active) !important;
          font-weight: 600;
        }
        .nav-active .nav-icon { opacity: 1; }
        .item-center { justify-content: center; padding: 8.5px 0; }

        .active-bar {
          position: absolute;
          left: 0; top: 22%; bottom: 22%;
          width: 2.5px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(to bottom, var(--accent-light), var(--accent));
          box-shadow: none;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: transform 0.14s;
        }
        .nav-text { flex: 1; white-space: nowrap; }
        .nav-external { color: var(--text-4); display: flex; align-items: center; margin-left: auto; }

        .nav-badge {
          min-width: 17px;
          height: 17px;
          border-radius: 9px;
          background: var(--rose-dim);
          color: var(--rose);
          border: 1px solid var(--rose-border);
          font-size: 9.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          flex-shrink: 0;
        }
        .badge-dot {
          position: absolute;
          top: 5px; right: 5px;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--rose);
          box-shadow: none;
          animation: pulse 2s ease-in-out infinite;
        }

        /* ── Bottom ─────────────────────────────── */
        .bottom {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .theme-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 8.5px 10px;
          border-radius: 9px;
          background: none;
          border: none;
          color: var(--text-3);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: background 0.14s, color 0.14s;
          text-align: left;
        }
        .theme-btn:hover { background: var(--nav-item-hover); color: var(--text-1); }
        .theme-mini { justify-content: center; padding: 8.5px 0; }
        .theme-label { flex: 1; font-size: 13px; }

        .toggle-track {
          width: 26px;
          height: 14px;
          border-radius: 7px;
          background: var(--border-strong);
          position: relative;
          flex-shrink: 0;
          transition: background 0.22s;
        }
        .toggle-track.on { background: var(--accent); }
        .toggle-thumb {
          position: absolute;
          top: 2px; left: 2px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: white;
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 1px 3px rgba(0,0,0,.3);
        }
        .toggle-track.on .toggle-thumb { transform: translateX(12px); }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 8.5px 10px;
          border-radius: 9px;
          background: none;
          border: none;
          color: var(--text-4);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.14s;
          text-align: left;
        }
        .logout-btn:hover { background: var(--rose-dim); color: var(--rose); }
      `}</style>
    </aside>
  );

  return (
    <>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 40,
          }}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{
          display: 'none',
          position: 'fixed', top: 14, left: 14, zIndex: 50,
          width: 38, height: 38, borderRadius: 10,
          background: 'var(--sidebar-bg)',
          border: '1px solid var(--sidebar-border)',
          color: 'var(--text-1)',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
        className="mob-trigger"
      >
        {icons.menu}
      </button>

      <div className="sb-desk"><SidebarContent /></div>
      <div className={`sb-mob${mobileOpen ? ' open' : ''}`}><SidebarContent /></div>

      <style jsx>{`
        .sb-desk { display: flex; }
        .sb-mob {
          display: none;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.26s cubic-bezier(.4,0,.2,1);
        }
        .sb-mob.open { transform: translateX(0); }
        @media (max-width: 860px) {
          .sb-desk { display: none; }
          .sb-mob { display: flex; }
          .mob-trigger { display: flex !important; }
        }
      `}</style>
    </>
  );
}