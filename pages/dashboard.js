import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/Sidebar';
import TimetableView from '../components/TimetableView';
import { DataStore, requireAuth, sanitizeObject } from '@/lib/security';
import MarksSection from '../components/MarksSection';

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
function CircleProgress({ pct, color = 'var(--accent)', size = 56 }) {
  const r    = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} className="no-transition">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={4.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4.5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${color}66)` }}
      />
    </svg>
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
      <div className="kpi-header">
        <div className="kpi-icon-wrap" style={{ color, background: `${color}14`, border: `1px solid ${color}22` }}>
          <Ico d={icon} size={15} />
        </div>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value" style={{ color }}>{animatedValue}</div>
      {sub && <div className="kpi-sub">{sub}</div>}

      <style jsx>{`
        .kpi {
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          position: relative;
          overflow: hidden;
          cursor: default;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
        }
        .kpi:hover {
          transform: translateY(-3px);
        }
        .kpi-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .kpi-icon-wrap {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .kpi-label { font-size: 11.5px; color: var(--text-2); font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; }
        .kpi-value { font-family: var(--font-mono); font-size: 32px; font-weight: 800; letter-spacing: -1.2px; line-height: 1; }
        .kpi-sub   { font-size: 11.5px; color: var(--text-2); margin-top: 6px; }

      `}</style>
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

  useEffect(() => {
    if (!requireAuth(router)) return;
    const raw = DataStore.get();
    if (!raw) { router.replace('/'); return; }
    if (raw.tokenInvalid) { import('@/lib/security').then(s => s.logout(router)); return; }
    setData(sanitizeObject(raw));
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (router.query.tab) setTab(router.query.tab);
  }, [router.query.tab]);

  /* ── Derived data ───────────────────────────── */
  const user       = data?.user || {};
  const attendance = data?.attendance?.attendance || [];
  const marks      = data?.marks?.marks           || [];
  const timetable  = data?.timetable              || null;
  const courses    = data?.courses?.courses       || [];

  /* ── Memoised stats to avoid repeated filter/reduce in render ── */
  const courseStats = useMemo(() => ({
    theory:    courses.filter(c => c.slotType === 'Theory').length,
    practical: courses.filter(c => c.slotType === 'Practical').length,
    credits:   courses.reduce((s, c) => s + (parseFloat(c.credit) || 0), 0),
  }), [courses]);

  const avgAtt   = attendance.length
    ? (attendance.reduce((s, a) => {
        const c = parseFloat(a.hoursConducted) || 0;
        const p = c > 0 ? ((c - (parseFloat(a.hoursAbsent) || 0)) / c) * 100 : parseFloat(a.attendancePercentage) || 0;
        return s + p;
      }, 0) / attendance.length).toFixed(1)
    : 0;
  const below75  = attendance.filter((a) => {
    const c = parseFloat(a.hoursConducted) || 0;
    const p = c > 0 ? ((c - (parseFloat(a.hoursAbsent) || 0)) / c) * 100 : parseFloat(a.attendancePercentage) || 0;
    return p < 75;
  }).length;
  const safeAtt  = attendance.filter((a) => {
    const c = parseFloat(a.hoursConducted) || 0;
    const p = c > 0 ? ((c - (parseFloat(a.hoursAbsent) || 0)) / c) * 100 : parseFloat(a.attendancePercentage) || 0;
    return p >= 75;
  }).length;
  const avgScore = marks.length
    ? (marks.reduce((s, m) => {
        const sc  = parseFloat(m.overall?.scored) || 0;
        const tot = parseFloat(m.overall?.total)  || 1;
        return s + (sc / tot) * 100;
      }, 0) / marks.length).toFixed(1)
    : 0;

  return (
    <>
      <Head><title>CampusPro — {user.name || 'Dashboard'}</title></Head>

      {/* ── Animated ambient background ──────── */}
      <div className="dash-bg" aria-hidden="true">
        <div className="dash-bg-grid" />
        <div className="dash-blob-1" />
        <div className="dash-blob-2" />
        <div className="dash-blob-3" />
        <div className="dash-blob-4" />
        <div className="dash-bg-vignette" />
      </div>

      <div className="app-shell">
        <Sidebar activeTab={tab} onTabChange={setTab} user={user} below75={below75} />

        <main className="main">

          {!data ? (
            <div className="loading-center">
              <div className="spinner" style={{ width: 28, height: 28 }} />
              <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 12 }}>Loading workspace…</p>
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
                      <h1 className="page-title">
                        {greeting()}, <span className="grad-text">{user.name?.split(' ')[0] || 'Student'}</span> 👋
                      </h1>
                      <p className="page-sub">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {user.department ? ' · ' + user.department.replace(/\(.*\)/, '').trim() : ''}
                        {user.section ? ' · ' + user.section + ' Section' : ''}
                      </p>
                    </div>
                    <div className="hd-meta">
                      <span className="tag tag-accent">Sem {user.semester}</span>
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
                      label="Semester" value={user.semester || '—'}
                      color="var(--amber)"
                      icon="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                      sub={user.program?.slice(0, 24)} delay={180}
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
                    {attendance.length === 0 ? (
                      <div className="empty-state">No attendance records found.</div>
                    ) : attendance.map((a, i) => {
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
                    <h1 className="page-title">Attendance</h1>
                    <span className="tag tag-accent">{attendance.length} subjects</span>
                  </div>

                  {/* ── Summary strip ─────────────────── */}
                  <div className="sum-strip">
                    {[
                      { v: `${avgAtt}%`, l: 'Average',    c: 'var(--accent-light)', icon: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z' },
                      { v: safeAtt,      l: 'Safe ≥ 75%', c: 'var(--emerald)',       icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3' },
                      { v: below75,      l: 'At Risk',    c: 'var(--rose)',           icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-7v-2m0-4h.01' },
                      { v: attendance.length, l: 'Subjects', c: 'var(--amber)',      icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
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
                    {attendance.length === 0 ? (
                      <div className="empty-state">No attendance records found.</div>
                    ) : attendance.map((a, i) => { // key uses courseCode for stability
                      const conducted  = parseFloat(a.hoursConducted) || 0;
                      const absent     = parseFloat(a.hoursAbsent) || 0;
                      const attended   = conducted - absent;
                      const pctMatch   = conducted > 0 ? (attended / conducted) * 100 : parseFloat(a.attendancePercentage) || 0;
                      const pct        = parseFloat(pctMatch.toFixed(2));
                      const clr        = attColor(pct);

                      // Classes needed to reach 75% / classes that can be skipped
                      const toReach75 = Math.ceil((0.75 * conducted - attended) / 0.25);
                      const canSkip75 = Math.floor((attended - 0.75 * conducted) / 0.75);

                      const status =
                        pct >= 85 ? { label: 'Excellent', clr: 'var(--emerald)' } :
                        pct >= 75 ? { label: 'Safe',      clr: 'var(--amber)'   } :
                                    { label: 'At Risk',   clr: 'var(--rose)'    };

                      const facultyName = a.facultyName?.split('(')[0]?.trim() || '—';

                      return (
                        <div key={a.courseCode || i} className="att-card glass animate-up" style={{ animationDelay: `${i * 40}ms` }}>

                          {/* Left accent stripe */}
                          <div className="ac-stripe" style={{ background: clr }} />

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
                                <span className="ac-status-tag" style={{ color: status.clr, background: `${status.clr}12`, border: `1px solid ${status.clr}22` }}>
                                  {status.label}
                                </span>
                              </div>
                            </div>

                            {/* ── Segmented progress bar ── */}
                            <div className="ac-bar-wrap">
                              <div className="ac-bar-bg">
                                <div className="ac-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${clr}99, ${clr})` }} />
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
                              ) : canSkip75 < 0 ? (
                                <div className="ac-advice danger">
                                  <span className="adv-ico">🚨</span>
                                  <div>
                                    <div className="adv-main">Deficit: <strong style={{ color: 'var(--rose)' }}>-{toReach75} classes</strong></div>
                                    <div className="adv-sub">Need 75% minimum · Currently at {pct}%</div>
                                  </div>
                                </div>
                              ) : canSkip75 === 0 ? (
                                <div className="ac-advice warn">
                                  <span className="adv-ico">⚠</span>
                                  <div>
                                    <div className="adv-main">Margin: <strong style={{ color: 'var(--amber)' }}>0 classes</strong></div>
                                    <div className="adv-sub">Need 75% minimum · Currently at {pct}%</div>
                                  </div>
                                </div>
                              ) : (
                                <div className={`ac-advice ${canSkip75 > 3 ? 'safe' : 'warn'}`}>
                                  <span className="adv-ico">{canSkip75 > 3 ? '✓' : '⚠'}</span>
                                  <div>
                                    <div className="adv-main">Margin: <strong style={{ color: canSkip75 > 3 ? 'var(--emerald)' : 'var(--amber)' }}>+{canSkip75} classes</strong></div>
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
                    <h1 className="page-title">Marks</h1>
                    <span className="tag tag-accent">{marks.length} subjects</span>
                  </div>
                  <MarksSection marks={marks} courses={courses} />
                </div>
              )}

              {/* ═══════════════════════════════
                  TIMETABLE TAB
              ═══════════════════════════════ */}
              {tab === 'timetable' && (
                <div className="tab-panel animate-in">
                  <TimetableView timetableData={timetable} />
                </div>
              )}

              {/* ═══════════════════════════════
                  COURSES TAB
              ═══════════════════════════════ */}
              {tab === 'courses' && (
                <div className="tab-panel animate-in">
                  <div className="page-hd">
                    <h1 className="page-title">Courses</h1>
                    <span className="tag tag-accent">{courses.length} enrolled</span>
                  </div>

                  <div className="cs-strip">
                    {[
                      { l: 'Theory',    v: courseStats.theory,    c: 'var(--accent-light)' },
                      { l: 'Practical', v: courseStats.practical, c: 'var(--emerald)' },
                      { l: 'Total Credits', v: courseStats.credits,  c: 'var(--amber)' },
                    ].map((s, i) => (
                      <div key={i} className="cs-pill glass-raised">
                        <span className="cs-val" style={{ color: s.c }}>{s.v}</span>
                        <span className="cs-lbl">{s.l}</span>
                      </div>
                    ))}
                  </div>

                  <div className="courses-grid">
                    {courses.length === 0 ? (
                      <div className="empty-state">No enrolled courses found.</div>
                    ) : courses.map((c, i) => {
                      const isTheory  = c.slotType === 'Theory';
                      const faculty   = c.faculty?.split('(')[0]?.trim() || '—';
                      const accentClr = isTheory ? 'var(--accent-light)' : 'var(--emerald)';
                      const barClr    = isTheory ? '#6366f1' : '#10b981';
                      return (
                        <div key={c.code || i} className="cc-card glass glass-hover animate-up" style={{ animationDelay: `${i * 40}ms`, position:'relative' }}>
                          <div className="card-shimmer"></div>
                          {/* Top accent stripe */}
                          <div className="cc-stripe" style={{ background: `linear-gradient(90deg, ${barClr}, transparent)` }} />
                          <div className="cc-body">
                            <div className="cc-top">
                              <span className="cc-code">{c.code}</span>
                              <span className={`tag ${isTheory ? 'tag-accent' : 'tag-emerald'}`} style={{ fontSize: 9.5 }}>
                                {c.slotType || '—'}
                              </span>
                            </div>
                            <div className="cc-title">{c.title}</div>
                            <div className="cc-faculty">
                              <div className="cc-fav" style={{ color: accentClr, background: `${barClr}18`, border: `1px solid ${barClr}33` }}>
                                {faculty[0] || '?'}
                              </div>
                              <span className="cc-fname">{faculty}</span>
                            </div>
                            <div className="cc-info">
                              <div className="ci">
                                <span className="ci-ico">🏫</span>
                                <span className="ci-v">{c.room || '—'}</span>
                                <span className="ci-l">Room</span>
                              </div>
                              <div className="ci">
                                <span className="ci-ico">🕐</span>
                                <span className="ci-v">{c.slot || '—'}</span>
                                <span className="ci-l">Slot</span>
                              </div>
                              <div className="ci">
                                <span className="ci-ico">⭐</span>
                                <span className="ci-v">{c.credit || '0'}</span>
                                <span className="ci-l">Credits</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style jsx global>{`
        body { background: #05060f; overflow-x: hidden; }

        /* ── Animated ambient blobs ─────────────────────────── */
        @keyframes floatBlob {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(40px,-28px) scale(1.06); }
          66%     { transform: translate(-24px,18px) scale(0.96); }
        }
        @keyframes floatBlob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(-35px,22px) scale(1.04); }
          70%     { transform: translate(28px,-15px) scale(0.98); }
        }
        @keyframes floatBlob3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(20px,30px) scale(1.07); }
        }
        @keyframes floatBlob4 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-30px,-40px) scale(1.08); }
        }
        @keyframes gridDrift {
          from { transform: translateY(0); }
          to   { transform: translateY(48px); }
        }
        @keyframes gridFade {
          0%,100% { opacity: 0.6; }
          50%     { opacity: 1; }
        }
        @keyframes slowSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .dash-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .dash-bg::before {
          content: '';
          position: absolute;
          width: 900px; height: 900px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            rgba(99,102,241,0.03) 25%,
            transparent 50%,
            rgba(34,211,238,0.03) 75%,
            transparent 100%
          );
          animation: slowSpin 40s linear infinite;
          pointer-events: none;
        }

        /* Dot grid */
        .dash-bg-grid {
          position: absolute;
          inset: -100px;
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          animation: gridDrift 14s linear infinite, gridFade 8s ease-in-out infinite;
        }

        /* Blob 1 — indigo, top-left */
        .dash-blob-1 {
          position: absolute;
          width: 700px; height: 700px;
          top: -200px; left: -180px;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 40%,
            rgba(99,102,241,0.10) 0%,
            rgba(99,102,241,0.04) 45%,
            transparent 70%);
          filter: blur(60px);
          animation: floatBlob 20s ease-in-out infinite;
          will-change: transform;
        }

        /* Blob 2 — cyan, bottom-right */
        .dash-blob-2 {
          position: absolute;
          width: 600px; height: 600px;
          bottom: -150px; right: -150px;
          border-radius: 50%;
          background: radial-gradient(circle at 60% 60%,
            rgba(34,211,238,0.07) 0%,
            rgba(34,211,238,0.03) 45%,
            transparent 70%);
          filter: blur(55px);
          animation: floatBlob2 24s ease-in-out infinite;
          will-change: transform;
        }

        /* Blob 3 — violet, center-right */
        .dash-blob-3 {
          position: absolute;
          width: 420px; height: 420px;
          top: 38%; left: 52%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%,
            rgba(167,139,250,0.07) 0%,
            rgba(167,139,250,0.03) 50%,
            transparent 70%);
          filter: blur(50px);
          animation: floatBlob3 16s ease-in-out infinite 4s;
          will-change: transform;
        }

        /* Blob 4 — rose, left-bottom */
        .dash-blob-4 {
          position: absolute;
          width: 300px; height: 300px;
          top: 60%; left: 20%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%,
            rgba(244,63,94,0.05) 0%,
            transparent 70%);
          filter: blur(50px);
          animation: floatBlob4 22s ease-in-out infinite 8s;
          will-change: transform;
        }

        .dash-bg-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(5,6,15,0.55) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <style jsx>{`
        /* ── Shell ────────────────────────────── */
        .app-shell { display: flex; min-height: 100vh; position: relative; z-index: 1; background: transparent; }
        .main {
          flex: 1;
          padding: 36px 40px;
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .loading-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
        }

        /* ── Tab panels ───────────────────────── */
        .tab-panel { display: flex; flex-direction: column; gap: 20px; }
        .animate-in { animation: fadeIn .4s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes progressBar { from { width: 0; } }

        /* General interaction */
        button:active, a:active { transform: scale(0.97); transition: transform 0.1s; }
        input:focus { box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.15); border-color: rgba(0, 245, 255, 0.4); }

        /* ── Page header ──────────────────────── */
        .page-hd {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 27px;
          font-weight: 800;
          color: #f0f2ff;
          letter-spacing: -0.6px;
          line-height: 1.2;
        }
        .page-sub { font-size: 12.5px; color: var(--text-3); margin-top: 4px; }
        .hd-meta { display: flex; align-items: center; gap: 8px; }

        /* ── KPI grid ─────────────────────────── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        /* ── Alert ────────────────────────────── */
        .alert-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--rose-dim);
          border: 1px solid var(--rose-border);
          border-radius: var(--radius-md);
          font-size: 13px;
          color: var(--rose);
          flex-wrap: wrap;
        }
        .alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: rgba(244,63,94,0.14);
          border: 1px solid var(--rose-border);
          flex-shrink: 0;
        }
        .alert-strip strong { font-weight: 700; }
        .alert-cta {
          margin-left: auto;
          background: none;
          border: 1px solid var(--rose-border);
          color: var(--rose);
          border-radius: var(--radius-sm);
          padding: 4px 12px;
          font-size: 12px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: background 0.14s;
          white-space: nowrap;
        }
        .alert-cta:hover { background: rgba(244,63,94,0.12); }

        /* ── Section header ───────────────────── */
        .section-hd { display: flex; align-items: center; justify-content: space-between; }
        .section-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: #dde2f8; letter-spacing: 0.8px; }
        .link-btn { background: none; border: none; color: var(--accent-light); font-size: 12px; cursor: pointer; font-family: var(--font-body); }
        .link-btn:hover { text-decoration: underline; }
        
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          font-size: 14px;
          color: var(--text-3);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          border: 1px dashed rgba(255, 255, 255, 0.1);
        }

        /* ── Attendance mini cards ────────────── */
        .att-mini-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
        }
        .att-mini {
          border-radius: var(--radius-md);
          padding: 13px 14px;
        }
        .am-top { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 2px; }
        .am-info { flex: 1; min-width: 0; }
        .am-name { font-size: 12px; font-weight: 600; color: var(--text-1); line-height: 1.3; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .am-code { font-family: var(--font-mono); font-size: 9.5px; color: var(--text-3); }
        .am-pct  { font-family: var(--font-mono); font-size: 19px; font-weight: 700; margin-top: 4px; }
        .am-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .am-hrs  { font-size: 10.5px; color: var(--text-3); }
        .am-tag  { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 5px; }

        /* ── Attendance summary strip ─────────── */
        .sum-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .sum-pill { border-radius: var(--radius-md); padding: 16px; text-align: center; }
        .sum-val  { font-family: var(--font-mono); font-size: 26px; font-weight: 700; }
        .sum-lbl  { font-size: 10.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

        /* ── Full attendance list ─────────────── */
        .att-list { display: flex; flex-direction: column; gap: 8px; }
        .att-row {
          display: flex;
          align-items: center;
          gap: 16px;
          border-radius: var(--radius-md);
          padding: 14px 18px;
          transition: transform 0.16s, border-color 0.16s;
        }
        .att-row:hover { transform: translateX(3px); }
        .ar-info { flex: 1; min-width: 0; }
        .ar-name { font-size: 13.5px; font-weight: 500; color: var(--text-1); }
        .ar-meta { font-size: 11px; color: var(--text-3); margin-top: 2px; }
        .ar-right { text-align: right; flex-shrink: 0; }
        .ar-pct   { font-family: var(--font-mono); font-size: 22px; font-weight: 700; }
        .ar-hrs   { font-size: 11px; color: var(--text-3); margin: 2px 0 6px; }
        .ar-tag   { font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 5px; display: inline-block; }

        /* ── Courses ──────────────────────────── */
        .cs-strip { display: flex; gap: 10px; flex-wrap: wrap; }
        .cs-pill { display: flex; align-items: center; gap: 10px; border-radius: var(--radius-md); padding: 12px 18px; }
        .cs-val  { font-family: var(--font-mono); font-size: 24px; font-weight: 700; }
        .cs-lbl  { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }

        .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(275px, 1fr)); gap: 13px; }
        .cc-card { border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
        .cc-stripe { height: 2.5px; width: 100%; flex-shrink: 0; }
        .cc-body { padding: 15px 16px; display: flex; flex-direction: column; gap: 9px; }
        .cc-top { display: flex; justify-content: space-between; align-items: center; }
        .cc-code { font-family: var(--font-mono); font-size: 10.5px; color: var(--accent-light); }
        .cc-title { font-size: 13.5px; font-weight: 600; color: var(--text-1); line-height: 1.4; }
        .cc-faculty { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid var(--border); }
        .cc-fav { width: 25px; height: 25px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 700; flex-shrink: 0; }
        .cc-fname { font-size: 12px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cc-info { display: grid; grid-template-columns: repeat(3,1fr); }
        .ci { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border-right: 1px solid var(--border); gap: 1px; }
        .ci:last-child { border-right: none; }
        .ci-ico { font-size: 13px; }
        .ci-v { font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; color: var(--text-1); margin-top: 2px; }
        .ci-l { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.4px; }

        /* ── Rich Attendance Cards ───────────── */
        .att-cards { display: flex; flex-direction: column; gap: 10px; }
        .att-card { display: flex; border-radius: var(--radius-lg); overflow: hidden; transition: transform 0.18s, box-shadow 0.18s; }
        .att-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .ac-stripe { width: 3px; flex-shrink: 0; }
        .ac-body { flex: 1; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .ac-top { display: flex; align-items: center; gap: 16px; }
        .ac-course { flex: 1; min-width: 0; }
        .ac-title { font-size: 14.5px; font-weight: 600; color: var(--text-1); line-height: 1.3; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ac-meta-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .ac-code { font-family: var(--font-mono); font-size: 10px; color: var(--accent-light); }
        .ac-dot  { color: var(--text-5); font-size: 10px; }
        .ac-faculty { font-size: 11px; color: var(--text-3); display: flex; align-items: center; }
        .ac-pct-block { text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .ac-pct { font-family: var(--font-mono); font-size: 26px; font-weight: 700; letter-spacing: -1px; line-height: 1; }
        .ac-status-tag { font-size: 9.5px; font-weight: 700; padding: 2px 9px; border-radius: 20px; letter-spacing: 0.3px; white-space: nowrap; }
        .ac-bar-wrap { position: relative; padding-bottom: 16px; }
        .ac-bar-bg { position: relative; height: 5px; background: var(--border); border-radius: 3px; overflow: visible; }
        .ac-bar-fill { height: 100%; border-radius: 3px; animation: progressBar 1.2s cubic-bezier(.4,0,.2,1) both; position: relative; z-index: 1; }
        .ac-marker { position: absolute; top: -2px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2; }
        .ac-marker-line { width: 1.5px; height: 9px; background: var(--amber); border-radius: 1px; }
        .ac-marker-lbl { position: absolute; top: 11px; font-size: 8.5px; font-weight: 700; color: var(--amber); white-space: nowrap; font-family: var(--font-mono); }
        
        .card-shimmer {
          position: absolute;
          top: 0; left: 0; right: 0; height: 80px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.03), transparent);
          pointer-events: none;
        }
        .ac-stats { display: flex; align-items: stretch; background: var(--card-inset-bg); border: 1px solid var(--card-inset-border); border-radius: var(--radius-md); overflow: hidden; }
        .ac-stat { display: flex; flex-direction: column; align-items: center; padding: 10px 20px; gap: 2px; flex-shrink: 0; }
        .ac-stat-v { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--text-1); line-height: 1; }
        .ac-stat-l { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
        .ac-stat-sep { width: 1px; background: var(--border); flex-shrink: 0; margin: 8px 0; }
        .ac-advice { flex: 1; display: flex; align-items: center; gap: 10px; padding: 10px 16px; }
        .ac-advice.safe   { background: rgba(16,185,129,0.11); border-left: 2px solid var(--emerald-border); }
        .ac-advice.warn   { background: rgba(245,158,11,0.10); border-left: 2px solid var(--amber-border); }
        .ac-advice.danger { background: rgba(244,63,94,0.11); border-left: 2px solid var(--rose-border); }
        .adv-ico { font-size: 14px; flex-shrink: 0; }
        .adv-main { font-size: 12px; font-weight: 500; color: var(--text-1); line-height: 1.3; }
        .adv-main strong { font-weight: 800; }
        .adv-sub { font-size: 10.5px; color: var(--text-3); margin-top: 1px; }
        .adv-sub strong { color: var(--text-2); }
        .sp-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; }
        .sum-pill { border-radius: var(--radius-md); padding: 16px 18px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .sum-val  { font-family: var(--font-mono); font-size: 26px; font-weight: 700; line-height: 1; }
        .sum-lbl  { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

        /* ── Responsive ───────────────────────── */
        @media (max-width: 1200px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 860px) {
          .main { padding: 60px 16px 24px; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .sum-strip { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
          .att-mini-grid { grid-template-columns: 1fr; }
          .courses-grid { grid-template-columns: 1fr; }
          .page-title { font-size: 22px; }
        }
      `}</style>
    </>
  );
}