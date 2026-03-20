import { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TimetableView from '../components/TimetableView';
import { DataStore, requireAuth, sanitizeObject } from '@/lib/security';
import MarksSection from '../components/MarksSection';

const AuroraBackground = dynamic(() => import('@/components/AuroraBackground'), { ssr: false });
const AttendancePlannerContent = dynamic(() => import('./components/SkipProEstimator'), { ssr: false });
const GpaCalculator = dynamic(() => import('./components/GpaCalculator'), { ssr: false });
const HelpCenterContent = dynamic(() => import('./components/HelpCenterContent'), { ssr: false });
const ReportIssueContent = dynamic(() => import('./components/ReportIssueContent'), { ssr: false });
const CalendarView = dynamic(() => import('./components/CalendarView'), { ssr: false });

// Show only on mobile — 5 key tabs
const MOBILE_NAV = [
  { id: 'overview',    label: 'Home',       icon: 'grid' },
  { id: 'attendance',  label: 'Attendance', icon: 'chart' },
  { id: 'marks',       label: 'Marks',      icon: 'award' },
  { id: 'timetable',   label: 'Timetable',  icon: 'clock' },
  { id: 'courses',     label: 'Courses',    icon: 'book' },
  { id: 'skippro',     label: 'Planner',    icon: 'target' },
];

const SUPPORT_NAV = [
  { id: 'gpa',         label: 'GPA Calculator', icon: 'percent' },
  { id: 'calendar',    label: 'Academic Calendar', icon: 'calendar' },
  { id: 'profile',     label: 'My Profile', icon: 'user' },
  { id: 'help',        label: 'Help Center', icon: 'help' },
  { id: 'reportissue', label: 'Report Issue', icon: 'flag' },
];

/* ── SVG Icon ─────────────────────────────────────── */
const Ico = ({ d, size = 15, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/* ── Color helpers ────────────────────────────────── */
const attColor  = p => p >= 85 ? 'var(--emerald)' : p >= 75 ? 'var(--amber)' : 'var(--rose)';
const scoreColor= p => p >= 80 ? 'var(--emerald)' : p >= 60 ? 'var(--amber)' : 'var(--rose)';

/* ── Greeting ─────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/* ══════════════════════════════════════════════════
   CircleProgress
   ══════════════════════════════════════════════════ */
/* ── Skeleton ─────────────────────────────────────── */
function Skeleton({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count });
  return (
    <div className="skeleton-grid">
      {items.map((_, i) => (
        <div key={i} className={`skeleton-item sk-${type}`}>
          <div className="sk-shimmer" />
        </div>
      ))}
    </div>
  );
}

function CircleProgress({ pct, color = 'var(--accent)', size = 56 }) {
  const r    = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <div className="cp-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} className="no-transition">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ 
            transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)', 
            filter: `drop-shadow(0 0 8px ${color}88)` 
          }}
        />
      </svg>
      <div className="cp-glow" style={{ background: color }} />
    </div>
  );
}

function useCountUp(endValStr) {
  const [val, setVal] = useState(0);
  const num = parseFloat(endValStr);
  const isNum = !isNaN(num);
  const suffix = isNum ? String(endValStr).replace(/[0-9.]/g, '') : '';
  
  useEffect(() => {
    if (!isNum) return;
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    
    const animate = (currTime) => {
      const elapsed = currTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = num * progress;
      setVal(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [num, isNum]);
  
  if (!isNum) return endValStr;
  return Number.isInteger(num) ? Math.floor(val) + suffix : val.toFixed(1) + suffix;
}

/* ══════════════════════════════════════════════════
   KPI Card
   ══════════════════════════════════════════════════ */
function KPICard({ label, value, sub, color, icon, delay = 0 }) {
  const animatedValue = useCountUp(value);
  return (
    <div className="kpi glass glass-hover animate-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-accent" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="kpi-header">
        <div className="kpi-icon-wrap" style={{ color, background: `${color}14`, border: `1px solid ${color}22` }}>
          <Ico d={icon} size={15} />
        </div>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value" style={{ color }}>{animatedValue}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      
      {/* Mini sparkline visualization hint */}
      <div className="kpi-mini-viz" style={{ color }}>
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 15 L10 12 L18 16 L26 8 L34 10 L38 2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }} />
        </svg>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [tab, setTab]   = useState('overview');
  const [showAttendanceWarning, setShowAttendanceWarning] = useState(false);

  const { theme } = useTheme();

  /* ── Derived data ───────────────────────────── */
  const user       = data?.user || {};
  const attendance = data?.attendance?.attendance || [];
  const marks      = data?.marks?.marks           || [];
  const timetable  = data?.timetable              || null;
  const courses    = data?.courses?.courses       || [];

  // Deduplicate attendance by course code for snapshot grid
  const uniqueAttendance = useMemo(() => {
    if (!attendance || !Array.isArray(attendance)) return [];
    return attendance.filter((item, index, self) =>
      index === self.findIndex(a => a.courseCode === item.courseCode)
    );
  }, [attendance]);

  /* ── Memoised stats to avoid repeated filter/reduce in render ── */
  const courseStats = useMemo(() => ({
    theory:    courses.filter(c => c.slotType === 'Theory').length,
    practical: courses.filter(c => c.slotType === 'Practical').length,
    credits:   courses.reduce((s, c) => s + (parseFloat(c.credit) || 0), 0),
  }), [courses]);

  const avgAtt = useMemo(() => {
    if (!uniqueAttendance.length) return 0;
    const sum = uniqueAttendance.reduce((acc, curr) => {
      const conducted = parseFloat(curr.hoursConducted) || 0;
      const absent = parseFloat(curr.hoursAbsent) || 0;
      const attended = conducted - absent;
      return acc + (conducted > 0 ? (attended / conducted) * 100 : 0);
    }, 0);
    return parseFloat((sum / uniqueAttendance.length).toFixed(2));
  }, [uniqueAttendance]);

  const safeAtt = uniqueAttendance.filter(a => {
    const conducted = parseFloat(a.hoursConducted) || 0;
    const absent = parseFloat(a.hoursAbsent) || 0;
    const attended = conducted - absent;
    const pct = conducted > 0 ? (attended / conducted) * 100 : 0;
    return pct >= 75;
  }).length;
  
  const below75 = uniqueAttendance.length - safeAtt;

  const avgScore = marks.length
    ? (marks.reduce((s, m) => {
        const sc  = parseFloat(m.overall?.scored) || 0;
        const tot = parseFloat(m.overall?.total)  || 1;
        const res = tot > 0 ? (sc / tot) * 100 : 0;
        return s + (isFinite(res) ? res : 0);
      }, 0) / marks.length).toFixed(1)
    : 0;

  // Auto-import courses when GPA tab opens
  useEffect(() => {
    if (tab === 'gpa' && courses.length > 0) {
      // Logic for gpa tab handled in GpaCalculator via prop
    }
  }, [tab, courses.length]);

  useEffect(() => {
    if (!requireAuth(router)) return;
    const raw = DataStore.get();
    if (!raw) { router.replace('/'); return; }
    if (raw.tokenInvalid) { import('@/lib/security').then(s => s.logout(router)); return; }
    setData(sanitizeObject(raw));
  }, [router]);

  // Read tab from URL on mount & update tab
  useEffect(() => {
    if (!router.isReady) return;
    const urlTab = router.query.tab;
    const validTabs = ['overview','attendance','marks','timetable','courses','gpa','skippro','calendar','helpcenter','reportissue'];
    if (urlTab && validTabs.includes(urlTab)) {
      setTab(urlTab);
    }
  }, [router.isReady, router.query.tab]);

  // Update URL when tab changes
  const handleTabChange = (newTab) => {
    if (newTab === 'skippro') {
      const acknowledged = sessionStorage.getItem('ap_warning_ok') === 'true';
      if (!acknowledged) {
        setShowAttendanceWarning(true);
      }
    }
    setTab(newTab);
    router.push(`/dashboard?tab=${newTab}`, undefined, { shallow: true });
  };


  return (
    <>
      <Head><title>CampusPro — {user.name || 'Dashboard'}</title></Head>

      <AuroraBackground />

      <div className="app-shell" style={{ position: 'relative', zIndex: 1 }}>
        <div className="sb-desk">
          <Sidebar activeTab={tab} onTabChange={handleTabChange} user={user} below75={below75} />
        </div>

        <main className="main-content">

          {!data ? (
            <div className="tab-panel animate-in" style={{ padding: '0 4px' }}>
              <div className="page-hd">
                <div className="skeleton-item sk-text" style={{ width: '240px', height: '32px' }} />
              </div>
              <div className="kpi-grid">
                <Skeleton type="stat" count={4} />
              </div>
              <div className="section-hd" style={{ marginTop: 24 }}>
                <div className="skeleton-item sk-text" style={{ width: '150px' }} />
              </div>
              <div className="att-mini-grid">
                <Skeleton type="card" count={3} />
              </div>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════
                  OVERVIEW TAB
              ═══════════════════════════════ */}
              {tab === 'overview' && (
                <div className="tab-panel animate-in">

                  {/* Page header */}
                  <div className="page-hd">
                    <div>
                      <h1 className="dash-greeting">
                        {greeting()},{' '}
                        <span className="greeting-name-gradient">{user?.name?.split(' ')[0] || 'Student'}</span>
                        <span className="greeting-wave"> 👋</span>
                      </h1>
                      <p className="page-sub">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {user?.department ? ' · ' + user.department.replace(/\(.*\)/, '').trim() : ''}
                        {user?.section ? ' · ' + user.section + ' Section' : ''}
                      </p>
                    </div>
                    <div className="hd-meta">
                      <Link href="/profile">
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '5px 12px 5px 5px',
                          borderRadius: '999px',
                          background: 'var(--accent-dim)',
                          border: '1px solid var(--accent-border)',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          flexShrink: 0,
                        }}>
                          <div style={{
                            width: 28, height: 28,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), #4338ca)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 12, color: 'white',
                            flexShrink: 0,
                          }}>
                            {(user?.name || 'S')[0].toUpperCase()}
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontSize: 12, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.2}}>
                              {user?.name?.split(' ')[0] || 'Student'}
                            </span>
                            <span style={{fontSize: 10, color: 'var(--text-3)', lineHeight: 1.2}}>
                              Sem {user?.semester}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* KPI grid */}
                  <div className="kpi-grid">
                    <KPICard
                      label="Attendance" value={`${avgAtt}%`}
                      color="var(--accent-light)"
                      icon="M22 12l-4 4m0 0l-4-4m4 4V8M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
                      sub={`${safeAtt} safe · ${below75} at risk`} delay={0}
                    />
                    <KPICard
                      label="Avg Score" value={`${avgScore}%`}
                      color={scoreColor(parseFloat(avgScore))}
                      icon="M18 20V10m-6 10V4M6 20v-6"
                      sub={`${marks.length} subjects tracked`} delay={60}
                    />
                    <KPICard
                      label="Subjects" value={courses.length}
                      color="var(--cyan)"
                      icon="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                      sub={`${courseStats.theory} theory · ${courseStats.practical} lab`}
                      delay={120}
                    />
                    <KPICard
                      label="Semester" value={user?.semester || '—'}
                      color="var(--amber)"
                      icon="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                      sub={user?.program?.slice(0, 24) || '—'} delay={180}
                    />
                  </div>

                  {/* Alert banner */}
                  {below75 > 0 && (
                    <div className="alert-strip animate-down">
                      <div className="alert-icon">
                        <Ico d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-7v-2m0-4h.01" size={14} />
                      </div>
                      <span>
                        <strong>{below75} subject{below75 > 1 ? 's' : ''}</strong> below 75% — immediate action needed.
                      </span>
                      <button className="alert-cta" onClick={() => setTab('attendance')}>
                        View Attendance →
                      </button>
                    </div>
                  )}

                  {/* Attendance mini grid */}
                  <div className="section-hd">
                    <h2 className="section-title">Attendance Snapshot</h2>
                    <button className="link-btn" onClick={() => setTab('attendance')}>View all →</button>
                  </div>
                  <div className="att-mini-grid">
                    {uniqueAttendance.length === 0 ? (
                      <div className="empty-state">No attendance records found.</div>
                    ) : uniqueAttendance.map((a, i) => {
                      const conducted = parseFloat(a.hoursConducted) || 0;
                      const absent    = parseFloat(a.hoursAbsent) || 0;
                      const attended  = conducted - absent;
                      const pctMatch  = conducted > 0 ? (attended / conducted) * 100 : parseFloat(a.attendancePercentage) || 0;
                      const pct       = parseFloat(pctMatch.toFixed(2));
                      const clr       = attColor(pct);
                      
                      let marginText = "";
                      let marginColor = "";
                      let marginBg = "";
                      let marginBorder = "";

                      if (conducted === 0) {
                        marginText = "No classes yet";
                        marginColor = "var(--text-3)";
                        marginBg = "var(--card-inset-bg)";
                        marginBorder = "var(--card-inset-border)";
                      } else {
                        const canSkip = Math.floor((attended - 0.75 * conducted) / 0.75);
                        const classesNeeded = Math.ceil((0.75 * conducted - attended) / 0.25);
                        
                        if (canSkip < 0) {
                          marginText = `Deficit: -${classesNeeded} classes`;
                          marginColor = "var(--rose)";
                          marginBg = "var(--rose-dim)";
                          marginBorder = "var(--rose-border)";
                        } else if (canSkip === 0) {
                          marginText = "Margin: 0 classes";
                          marginColor = "var(--amber)";
                          marginBg = "var(--amber-dim)";
                          marginBorder = "var(--amber-border)";
                        } else {
                          marginText = `Margin: +${canSkip} classes`;
                          marginColor = canSkip > 3 ? "var(--emerald)" : "var(--amber)";
                          marginBg = canSkip > 3 ? "var(--emerald-dim)" : "var(--amber-dim)";
                          marginBorder = canSkip > 3 ? "var(--emerald-border)" : "var(--amber-border)";
                        }
                      }

                      return (
                        <div key={a.courseCode ? `mini-${a.courseCode}` : i} className="att-mini glass-raised glass-hover animate-up" style={{ animationDelay: `${i * 50}ms`, position:'relative' }}>
                          <div className="card-shimmer"></div>
                          <div className="am-top">
                            <CircleProgress pct={pct} color={clr} size={46} />
                            <div className="am-info">
                              <div className="am-name">{a.courseTitle}</div>
                              <div className="am-code">{a.courseCode}</div>
                              <div className="am-pct" style={{ color: clr }}>{pct}%</div>
                            </div>
                          </div>
                          <div className="progress-track" style={{ marginTop: 8 }}>
                            <div className="progress-fill" style={{ width: `${Math.min(pct,100)}%`, background: clr, animation: 'progressBar 1.2s cubic-bezier(0.4, 0, 0.2, 1) both' }} />
                          </div>
                          <div className="am-footer">
                            <span className="am-hrs">{attended}/{conducted} hrs</span>
                            <span className="am-tag" title={`Need 75% minimum · Currently at ${pct}%`} style={{
                              color:       marginColor,
                              background:  marginBg,
                              border:      `1px solid ${marginBorder}`,
                            }}>
                              {marginText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════
                  ATTENDANCE TAB
              ═══════════════════════════════ */}
              {tab === 'attendance' && (
                <div className="tab-panel animate-in">
                  <div className="page-hd">
                    <div className="sc-titles-group">
                      <div className="page-title-bar">
                        <h1 className="page-title">Attendance</h1>
                      </div>
                      <p className="section-helper">
                        View detailed breakdown of your attendance per subject. 
                        Minimum 75% required to be safe. 85% recommended for buffer.
                      </p>
                    </div>
                    <span className="tag tag-accent">{uniqueAttendance.length} subjects</span>
                  </div>

                  {/* ── Summary strip ─────────────────── */}
                  <div className="sum-strip">
                    {[
                      { v: `${avgAtt}%`, l: 'Average',    c: 'var(--accent-light)', icon: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z' },
                      { v: safeAtt,      l: 'Safe ≥ 75%', c: 'var(--emerald)',       icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3' },
                      { v: below75,      l: 'At Risk',    c: 'var(--rose)',           icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-7v-2m0-4h.01' },
                      { v: uniqueAttendance.length, l: 'Subjects', c: 'var(--amber)',      icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
                    ].map((s, i) => (
                      <div key={i} className="sum-pill glass-raised animate-up" style={{ animationDelay: `${i * 45}ms` }}>
                        <div className="sp-icon" style={{ color: s.c, background: `${s.c}12`, border: `1px solid ${s.c}20` }}>
                          <Ico d={s.icon} size={13} />
                        </div>
                        <div className="sum-val" style={{ color: s.c }}>{s.v}</div>
                        <div className="sum-lbl">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Attendance cards ──────────────── */}
                  <div className="att-cards">
                    {uniqueAttendance.length === 0 ? (
                      <div className="empty-state">No attendance records found.</div>
                    ) : uniqueAttendance.map((a, i) => { 
                      const conducted  = parseFloat(a.hoursConducted) || 0;
                      const absent     = parseFloat(a.hoursAbsent) || 0;
                      const attended   = conducted - absent;
                      const percentage = conducted > 0 ? (attended / conducted) * 100 : 0;
                      const pct        = parseFloat(percentage.toFixed(2));
                      const clr        = attColor(pct);

                      // Margin (classes can skip while staying ABOVE 75%):
                      const canSkip = conducted > 0 
                        ? Math.floor((attended - 0.75 * conducted) / 0.75) 
                        : 0;

                      // Deficit (classes needed to REACH 75%):
                      const classesNeeded = pct < 75 && conducted > 0
                        ? Math.ceil((0.75 * conducted - attended) / 0.25)
                        : 0;

                      const dataStatus = pct >= 85 ? 'safe' : pct >= 75 ? 'caution' : 'atrisk';
                      const statusLabel = pct >= 85 ? 'Excellent' : pct >= 75 ? 'Safe' : 'At Risk';
                      const statusClr = pct >= 85 ? 'var(--emerald)' : pct >= 75 ? 'var(--amber)' : 'var(--rose)';

                      const facultyName = a.facultyName?.split('(')[0]?.trim() || '—';

                      return (
                        <div key={a.courseCode || i} className="att-card glass animate-up" data-status={dataStatus} style={{ animationDelay: `${i * 40}ms` }}>

                          <div className="ac-body">
                            {/* ── Row 1: Circle + Course info + % ── */}
                            <div className="ac-top">
                              <CircleProgress pct={pct} color={clr} size={58} />

                              <div className="ac-course">
                                <div className="ac-title">{a.courseTitle}</div>
                                <div className="ac-meta-row">
                                  <span className="ac-code">{a.courseCode}</span>
                                  <span className="ac-dot">·</span>
                                  <span className={`tag ${a.category === 'Theory' ? 'tag-accent' : 'tag-emerald'}`} style={{ fontSize: 9, padding: '2px 7px' }}>
                                    {a.category || 'Theory'}
                                  </span>
                                  <span className="ac-dot">·</span>
                                  <span className="ac-faculty">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline', marginRight:3, verticalAlign:'middle' }}>
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    {facultyName}
                                  </span>
                                </div>
                              </div>

                              <div className="ac-pct-block">
                                <div className="ac-pct" style={{ color: clr }}>{pct}%</div>
                                <span className="ac-status-tag" style={{ color: statusClr, background: `${statusClr}12`, border: `1px solid ${statusClr}22` }}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>

                            {/* ── Segmented progress bar ── */}
                            <div className="ac-bar-wrap">
                              <div className="ac-bar-bg">
                                <div className="ac-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${clr}99, ${clr})` }} />
                                {/* 75% danger threshold marker */}
                                <div className="ac-marker" style={{ left: '75%' }} title="Minimum 75% required">
                                  <div className="ac-marker-line" style={{ background: 'var(--rose)' }} />
                                  <span className="ac-marker-lbl" style={{ color: 'var(--rose)' }}>75%</span>
                                </div>
                                {/* 85% safe threshold marker */}
                                <div className="ac-marker" style={{ left: '85%' }} title="85% for comfortable buffer">
                                  <div className="ac-marker-line" style={{ background: 'var(--emerald)' }} />
                                  <span className="ac-marker-lbl" style={{ color: 'var(--emerald)' }}>85%</span>
                                </div>

                              </div>
                            </div>

                            {/* ── Stats grid ─── */}
                            <div className="ac-stats">
                              <div className="ac-stat">
                                <span className="ac-stat-v" style={{ color: 'var(--emerald)' }}>{attended}</span>
                                <span className="ac-stat-l">Attended</span>
                              </div>
                              <div className="ac-stat-sep" />
                              <div className="ac-stat">
                                <span className="ac-stat-v" style={{ color: absent > 0 ? 'var(--rose)' : 'var(--text-3)' }}>{absent}</span>
                                <span className="ac-stat-l">Absent</span>
                              </div>
                              <div className="ac-stat-sep" />
                              <div className="ac-stat">
                                <span className="ac-stat-v">{conducted}</span>
                                <span className="ac-stat-l">Total hrs</span>
                              </div>
                              <div className="ac-stat-sep" />

                              {/* Smart advice cell */}
                              {conducted === 0 ? (
                                <div className="ac-advice" style={{ background: 'var(--card-inset-bg)', borderLeft: '2px solid var(--card-inset-border)' }}>
                                  <span className="adv-ico">ℹ</span>
                                  <div>
                                    <div className="adv-main">No classes conducted yet</div>
                                    <div className="adv-sub">Need 75% minimum · Currently at {pct}%</div>
                                  </div>
                                </div>
                              ) : canSkip <= 0 ? (
                                <div className="ac-advice danger">
                                  <span className="adv-ico">🚨</span>
                                  <div>
                                    <div className="adv-main">Deficit: <strong style={{ color: 'var(--rose)' }}>{classesNeeded} classes</strong></div>
                                    <div className="adv-sub">Need 75% minimum · Currently at {pct}%</div>
                                  </div>
                                </div>
                              ) : (
                                <div className={`ac-advice ${canSkip > 3 ? 'safe' : 'warn'}`}>
                                  <span className="adv-ico">{canSkip > 3 ? '✓' : '⚠'}</span>
                                  <div>
                                    <div className="adv-main">Margin: <strong style={{ color: canSkip > 3 ? 'var(--emerald)' : 'var(--amber)' }}>{canSkip} classes</strong></div>
                                    <div className="adv-sub">Need 75% minimum · Currently at {pct}%</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════
                  MARKS TAB
              ═══════════════════════════════ */}
              {tab === 'marks' && (
                <div className="tab-panel animate-in">
                  <div className="page-hd">
                    <div className="sc-titles-group">
                      <h1 className="page-title">Marks</h1>
                      <p className="section-helper">
                        Internal marks, test performance, and grade estimation. 
                        Zero-credit courses and subjects with no data are excluded from averages.
                      </p>
                    </div>
                    <span className="tag tag-accent">{marks.length} subjects</span>
                  </div>
                  <MarksSection marks={marks} courses={courses} />
                </div>
              )}

              {/* ═══════════════════════════════
                  COURSES TAB
              ═══════════════════════════════ */}
              {tab === 'courses' && (
                <div className="tab-panel animate-in">
                  <div className="page-hd">
                    <div className="sc-titles-group">
                      <div className="page-title-bar">
                        <h1 className="page-title">Courses</h1>
                      </div>
                      <p className="section-helper">
                        All subjects you are currently enrolled in for this semester, 
                        including faculty details, room locations, and credits.
                      </p>
                    </div>
                    <span className="tag tag-accent">{courses.length} enrolled</span>
                  </div>

                  {/* Summary strip */}
                  <div className="courses-strip">
                    {[
                      { label:'Theory',        val: courseStats.theory,    color:'var(--accent-light)' },
                      { label:'Practical',     val: courseStats.practical, color:'var(--emerald)' },
                      { label:'Total Credits', val: courseStats.credits,   color:'var(--amber)' },
                    ].map((s,i) => (
                      <div key={i} className="cs-chip glass">
                        <span className="cs-num" style={{color:s.color}}>{s.val}</span>
                        <span className="cs-lbl">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Card grid */}
                  <div className="courses-grid">
                    {courses.length === 0 ? (
                      <div className="empty-state">No enrolled courses found.</div>
                    ) : courses.map((c, i) => {
                      const isTheory = c.slotType === 'Theory';
                      const barColor = isTheory ? '#6366f1' : '#10b981';
                      const faculty  = c.faculty?.split('(')[0]?.trim() || '—';
                      return (
                        <div key={i} className="cc-card glass animate-up" style={{ animationDelay:`${i*45}ms` }}>
                          <div className="cc-bar" style={{ background: barColor }} />
                          <div className="cc-body">
                            <div className="cc-top-row">
                              <span className="cc-code">{c.code}</span>
                              <span className={`tag ${isTheory ? 'tag-accent' : 'tag-emerald'}`}>{c.slotType}</span>
                            </div>
                            <div className="cc-title">{c.title}</div>
                            <div className="cc-faculty">
                              <div className="cc-fav" style={{ background: barColor+'22', color: barColor, border:`1px solid ${barColor}44` }}>
                                {faculty[0]}
                              </div>
                              <span className="cc-fname">{faculty}</span>
                            </div>
                            <div className="cc-info-grid">
                              <div className="ci"><span>🏫</span><strong>{c.room||'—'}</strong><small>Room</small></div>
                              <div className="ci"><span>🕐</span><strong>{c.slot||'—'}</strong><small>Slot</small></div>
                              <div className="ci"><span>⭐</span><strong>{c.credit||'0'}</strong><small>Credits</small></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════
                  TIMETABLE TAB
              ═══════════════════════════════ */}
              {tab === 'timetable' && (
                <div className="tab-panel animate-in">
                  <div className="page-hd" style={{ marginBottom: -10 }}>
                    <div className="sc-titles-group">
                      <h1 className="page-title">Timetable</h1>
                      <p className="section-helper">
                        Your weekly schedule and class timings. Day orders follow the 
                        official SRM Even Semester 2025-26 academic calendar.
                      </p>
                    </div>
                  </div>
                  <TimetableView timetableData={timetable} />
                </div>
              )}

              {/* ═══════════════════════════════
                  GPA CALCULATOR TAB
              ═══════════════════════════════ */}
              {tab === 'gpa' && (
                <div className="tab-panel animate-in">
                  <GpaCalculator courses={courses} marks={marks} />
                </div>
              )}

              {/* ═══════════════════════════════
                  ATTENDANCE PLANNER TAB
              ═══════════════════════════════ */}
              {tab === 'skippro' && (
                <div className="tab-panel animate-in">
                  {/* Warning popup */}
                  {showAttendanceWarning && (
                    <div className="ap-overlay">
                      <div className="ap-warning-modal glass">
                        <div style={{fontSize: 36, textAlign: 'center'}}>⚠️</div>
                        <h3 style={{color: 'var(--amber)', textAlign: 'center', fontFamily: 'var(--font-display)', marginBottom: 12}}>
                          Before You Use Attendance Planner
                        </h3>
                        <p style={{fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16}}>
                          This tool gives estimates based on current attendance and academic calendar.
                          It does <strong>NOT</strong> account for cancelled classes, extra classes, or schedule changes.
                          Use as a rough guide only.
                        </p>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                          <button className="btn btn-primary" onClick={() => {
                            sessionStorage.setItem('ap_warning_ok', 'true');
                            setShowAttendanceWarning(false);
                          }}>
                            I Understand, Show Me →
                          </button>
                          <button className="btn btn-ghost" onClick={() => handleTabChange('overview')}>
                            Go Back
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Actual planner content — only show if warning acknowledged */}
                  {!showAttendanceWarning && (
                    <AttendancePlannerContent 
                      attendance={attendance} 
                      courses={courses} 
                    />
                  )}
                </div>
              )}

              {/* ═══════════════════════════════
                  CALENDAR TAB
              ═══════════════════════════════ */}
              {tab === 'calendar' && (
                <div className="tab-panel animate-in">
                  <CalendarView />
                </div>
              )}
              {/* ═══════════════════════════════
                  HELP CENTER TAB
              ═══════════════════════════════ */}
              {tab === 'helpcenter' && (
                <div className="tab-panel animate-in">
                  <HelpCenterContent />
                </div>
              )}

              {/* ═══════════════════════════════
                  REPORT ISSUE TAB
              ═══════════════════════════════ */}
              {tab === 'reportissue' && (
                <div className="tab-panel animate-in">
                  <ReportIssueContent user={user} />
                </div>
              )}
            </>
          )}
        </main>

        <nav className="mobile-bottom-nav">
          {MOBILE_NAV.map(item => {
            const iconsMap = {
              grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
              chart: "M22 12l-4 4m0 0l-4-4m4 4V8M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
              award: "M12 15l-2 5l2-1l2 1l-2-5z M12 2a7 7 0 1 0 0 14a7 7 0 0 0 0 -14z",
              clock: "M12 6v6l4 2 M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0 -20z",
              book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
              target: "M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
            };
            const iconD = iconsMap[item.icon];

            return (
              <button
                key={item.id}
                className={`mbn-item ${tab === item.id ? 'mbn-active' : ''}`}
                onClick={() => handleTabChange(item.id)}
              >
                <span className="mbn-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={iconD} />
                  </svg>
                </span>
                <span className="mbn-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <style jsx global>{`
        body { background: #04050d; overflow-x: hidden; }
        @keyframes floatBlob { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-28px) scale(1.06); } 66% { transform: translate(-24px,18px) scale(0.96); } }
        @keyframes floatBlob2 { 0%,100% { transform: translate(0,0) scale(1); } 40% { transform: translate(-35px,22px) scale(1.04); } 70% { transform: translate(28px,-15px) scale(0.98); } }
        @keyframes floatBlob3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,30px) scale(1.07); } }
        @keyframes floatBlob4 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-40px) scale(1.08); } }
        @keyframes gridDrift { from { transform: translateY(0); } to { transform: translateY(48px); } }
        @keyframes gridFade { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes slowSpin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        
        .dash-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .dash-bg::before { content: ''; position: absolute; width: 900px; height: 900px; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 50%; background: conic-gradient(from 0deg, transparent, rgba(99,102,241,0.03) 25%, transparent 50%, rgba(34,211,238,0.03) 75%, transparent 100%); animation: slowSpin 40s linear infinite; }
        .dash-bg-grid { position: absolute; inset: -100px; background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 28px 28px; animation: gridDrift 14s linear infinite, gridFade 8s ease-in-out infinite; }
        .dash-blob-1 { position: absolute; width: 700px; height: 700px; top: -200px; left: -180px; border-radius: 50%; background: radial-gradient(circle at 40% 40%, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.04) 45%, transparent 70%); filter: blur(60px); animation: floatBlob 20s ease-in-out infinite; }
        .dash-blob-2 { position: absolute; width: 600px; height: 600px; bottom: -150px; right: -150px; border-radius: 50%; background: radial-gradient(circle at 60% 60%, rgba(34,211,238,0.07) 0%, rgba(34,211,238,0.03) 45%, transparent 70%); filter: blur(55px); animation: floatBlob2 24s ease-in-out infinite; }
        .dash-blob-3 { position: absolute; width: 420px; height: 420px; top: 38%; left: 52%; border-radius: 50%; background: radial-gradient(circle at 50% 50%, rgba(167,139,250,0.07) 0%, rgba(167,139,250,0.03) 50%, transparent 70%); filter: blur(50px); animation: floatBlob3 16s ease-in-out infinite 4s; }
        .dash-blob-4 { position: absolute; width: 300px; height: 300px; top: 60%; left: 20%; border-radius: 50%; background: radial-gradient(circle at 50% 50%, rgba(244,63,94,0.05) 0%, transparent 70%); filter: blur(50px); animation: floatBlob4 22s ease-in-out infinite 8s; }
        .dash-bg-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(5,6,15,0.55) 100%); }

        @media (max-width: 860px) { .dash-bg { opacity: 0.2; } }
        @media (prefers-reduced-motion: reduce) { 
          *, ::before, ::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } 
          .dash-bg { display: none; }
        }
      `}</style>

      <style jsx>{`
        .app-shell { display: flex; min-height: 100vh; position: relative; z-index: 1; background: transparent; }
        .main-content { flex: 1; padding: 36px 40px; min-width: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .tab-panel { display: flex; flex-direction: column; gap: 20px; animation: tabPanelIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
        @keyframes tabPanelIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressBar { from { width: 0; } }
        button:active, a:active { transform: scale(0.97); transition: transform 0.1s; }
        input:focus { box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.15); border-color: rgba(0, 245, 255, 0.4); }

        :global(.skeleton-grid) { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        :global(.skeleton-item) { position: relative; overflow: hidden; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        :global(.sk-card) { height: 110px; }
        :global(.sk-stat) { height: 80px; }
        :global(.sk-text) { height: 20px; width: 60%; margin-bottom: 8px; }
        :global(.sk-shimmer) { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent); animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        :global(.cp-wrap) { position: relative; display: flex; align-items: center; justify-content: center; }
        :global(.cp-glow) { position: absolute; inset: 4px; border-radius: 50%; opacity: 0.08; filter: blur(12px); pointer-events: none; }
        
        :global(.kpi) { border-radius: var(--radius-lg); padding: 16px 18px; position: relative; overflow: hidden; cursor: default; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        :global(.kpi-accent) { position: absolute; top: 0; left: 0; right: 0; height: 2px; opacity: 0.4; }
        :global(.kpi:hover) { transform: translateY(-5px); }
        :global(.kpi-header) { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        :global(.kpi-icon-wrap) { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        :global(.kpi-label) { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-3); font-weight: 600; margin-top: 6px; }
        :global(.kpi-value) { font-family: var(--font-mono); font-size: 36px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
        :global(.kpi-sub)   { font-size: 11.5px; color: var(--text-3); margin-top: 6px; }
        :global(.kpi-mini-viz) { position: absolute; bottom: 12px; right: 12px; opacity: 0.5; }

        .page-hd { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .dash-greeting { font-family: var(--font-display); font-size: clamp(24px, 4vw, 36px); font-weight: 800; color: #f0f2ff; letter-spacing: -0.03em; line-height: 1.2; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
        .greeting-name-gradient { background: linear-gradient(135deg, var(--accent-light) 0%, var(--cyan) 35%, #c084fc 65%, var(--accent-light) 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 4s linear infinite; display: inline; }
        .greeting-wave { display: inline; animation: wave 2.5s infinite; transform-origin: 70% 70%; }
        @keyframes wave { 0% { transform: rotate(0deg); } 10% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 30% { transform: rotate(14deg); } 40% { transform: rotate(-4deg); } 50% { transform: rotate(10deg); } 60% { transform: rotate(0.0deg); } 100% { transform: rotate(0.0deg); } }
        .profile-corner-btn { display: flex; align-items: center; gap: 10px; padding: 6px 14px 6px 6px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 100px; text-decoration: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .profile-corner-btn:hover { background: var(--bg-hover); border-color: var(--accent-border); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .profile-avatar-small { width: 32px; height: 32px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 14px; font-weight: 700; }
        .profile-corner-name { font-size: 13px; font-weight: 700; color: var(--text-1); line-height: 1.2; }
        .profile-corner-sem { font-size: 10px; color: var(--accent-light); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .section-hd { display: flex; align-items: center; justify-content: space-between; position: relative; padding-left: 12px; margin: 32px 0 16px; }
        .section-hd::before { content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px; border-radius: 2px; background: var(--accent); }
        .section-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: #dde2f8; letter-spacing: 0.8px; }
        .section-helper { font-size: 12.5px; color: var(--text-3); margin-top: 4px; margin-bottom: 16px; line-height: 1.6; max-width: 600px; }
        
        .att-mini-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
        .sum-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .sum-pill { border-radius: var(--radius-md); padding: 16px; text-align: center; }
        .sum-val  { font-family: var(--font-mono); font-size: 26px; font-weight: 700; }
        .sum-lbl  { font-size: 10.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

        /* Attendance Cards */
        .att-cards { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
        .att-card { display: flex; border-radius: 16px; overflow: hidden; position: relative; }
        .ac-stripe { width: 6px; flex-shrink: 0; }
        .ac-body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .ac-top { display: flex; align-items: center; gap: 20px; }
        .ac-course { flex: 1; min-width: 0; }
        .ac-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: #f0f2ff; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ac-meta-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-3); font-weight: 500; }
        .ac-pct-block { text-align: right; flex-shrink: 0; }
        .ac-pct { font-family: var(--font-mono); font-size: 26px; font-weight: 800; line-height: 1; }
        .ac-status-tag { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .ac-bar-wrap { margin-top: 4px; }
        .ac-bar-bg { height: 10px; background: rgba(255,255,255,0.04); border-radius: 5px; position: relative; }
        .ac-bar-fill { height: 100%; border-radius: 5px; transition: width 1s ease-out; }
        .ac-marker { position: absolute; top: -14px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
        .ac-marker-line { width: 2px; height: 34px; opacity: 0.3; }
        .ac-marker-lbl { font-size: 10px; font-weight: 800; margin-top: 2px; }
        .ac-stats { display: flex; align-items: center; gap: 20px; background: rgba(255,255,255,0.02); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .ac-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .ac-stat-v { font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--text-1); }
        .ac-stat-l { font-size: 10px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
        .ac-stat-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.08); }
        .ac-advice { flex: 1; display: flex; align-items: center; gap: 12px; padding-left: 12px; border-left: 2px solid rgba(255,255,255,0.1); }
        .adv-ico { font-size: 20px; }
        .adv-main { font-size: 13px; font-weight: 700; color: var(--text-1); }
        .adv-sub { font-size: 11px; color: var(--text-3); margin-top: 2px; }
        .glass {
          box-shadow: 
            0 1px 0 rgba(255,255,255,0.05) inset,
            0 0 0 1px rgba(255,255,255,0.04) inset;
        }

        .ac-advice.danger { border-left-color: var(--rose); }
        .ac-advice.warn { border-left-color: var(--amber); }
        .ac-advice.safe { border-left-color: var(--emerald); }

        .att-card[data-status="safe"]    { border-left: 3px solid var(--emerald); }
        .att-card[data-status="caution"] { border-left: 3px solid var(--amber); }
        .att-card[data-status="atrisk"]  { border-left: 3px solid var(--rose); }

        .page-title-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .page-title-bar::before {
          content: '';
          width: 4px;
          height: 32px;
          background: linear-gradient(180deg, var(--accent), transparent);
          border-radius: 2px;
          flex-shrink: 0;
        }

        /* Courses UI */
        .courses-summary-strip { display: flex; gap: 12px; margin-bottom: 24px; }
        .css-chip { display: flex; align-items: center; gap: 8px; padding: 6px 14px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 100px; }
        .css-chip-accent { border-color: var(--accent-border); background: var(--accent-dim); }
        .css-num { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--text-1); }
        .css-label { font-size: 11px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }

        .course-card { padding: 20px; border-radius: 16px; display: flex; flex-direction: column; gap: 14px; }
        .cc-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .cc-left { display: flex; flex-direction: column; gap: 4px; }
        .cc-code { font-family: var(--font-mono); font-size: 11px; color: var(--text-4); font-weight: 600; }
        .cc-type-badge { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; width: fit-content; }
        .badge-theory { background: var(--accent-dim); color: var(--accent-light); }
        .badge-lab { background: var(--emerald-dim); color: var(--emerald); }
        .courses-strip { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .cs-chip { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 14px; background: var(--card-bg); border: 1px solid var(--accent-border); }
        .cs-num { font-size: 18px; font-weight: 800; font-family: var(--font-display); }
        .cs-lbl { font-size: 11px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }

        .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .cc-card { position: relative; border-radius: 20px; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid var(--accent-border); height: 100%; }
        .cc-card:hover { transform: translateY(-5px); border-color: var(--accent-light); box-shadow: 0 12px 30px rgba(0,0,0,0.3); }
        .cc-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        .cc-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .cc-top-row { display: flex; justify-content: space-between; align-items: center; }
        .cc-code { font-size: 11px; font-weight: 700; color: var(--text-3); letter-spacing: 0.5px; }
        .cc-title { font-size: 17px; font-weight: 700; color: var(--text-1); line-height: 1.3; }
        .cc-faculty { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .cc-fav { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
        .cc-fname { font-size: 13px; font-weight: 600; color: var(--text-2); }
        .cc-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding-top: 14px; border-top: 1px solid var(--sidebar-border); }
        .ci { display: flex; flex-direction: column; gap: 2px; }
        .ci span { font-size: 14px; margin-bottom: 2px; }
        .ci strong { font-size: 13px; color: var(--text-1); font-weight: 700; }
        .ci small { font-size: 10px; color: var(--text-4); font-weight: 600; text-transform: uppercase; }

        /* Attendance Planner Warning */
        .ap-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .ap-warning-modal { max-width: 460px; width: 100%; border-radius: var(--radius-xl); padding: 32px; border: 1px solid var(--amber-border); }

        .install-banner { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: calc(100% - 32px); max-width: 420px; background: var(--card-bg); border: 1px solid var(--accent-border); border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.5); backdrop-filter: blur(20px); }
        .mobile-bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; height: 64px; background: var(--sidebar-bg); border-top: 1px solid var(--sidebar-border); backdrop-filter: blur(20px); z-index: 100; grid-template-columns: repeat(5, 1fr); align-items: center; padding-bottom: env(safe-area-inset-bottom); }
        .mbn-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; background: none; border: none; color: var(--text-4); cursor: pointer; padding: 8px 4px; border-radius: 10px; transition: all 0.15s; }
        .mbn-active { color: var(--accent-light) !important; background: var(--accent-dim); }
        .mbn-label { font-size: 10px; font-weight: 600; }

        @media (max-width: 860px) {
          .app-shell { flex-direction: column; }
          .main-content { padding: 16px 14px 80px; }
          .hd-meta { display: none; }
          .mobile-bottom-nav { display: grid; }
          .sb-desk { display: none !important; }
        }
        @media (max-width: 640px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
          .sum-strip { grid-template-columns: 1fr 1fr; }
          .page-title { font-size: 22px; }
        }
      `}</style>
    </>
  );
}