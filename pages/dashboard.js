import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

/* ── Icons ──────────────────────────────────────── */
const Ico = ({ d, size = 16, sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  grid:    'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  chart:   'M18 20V10M12 20V4M6 20v-6',
  clock:   'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-10V7m0 5l3 3',
  book:    'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V4h16v13',
  calc:    'M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zM8 10h8M8 14h8M8 18h4',
  cal:     'M8 2v4M16 2v4M3 10h18M3 6h18a0 0 0 00 0H3a0 0 0 00 0v14a2 2 0 002 2h14a2 2 0 002-2V6z',
  logout:  'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  alert:   'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
  trend:   'M22 7l-9.5 9.5-5-5L1 18',
  user:    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  sparkle: 'M12 3l1.5 4.5h4.5l-3.75 2.75L15.75 15 12 12.25 8.25 15l1.5-4.75L6 7.5h4.5L12 3z',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOUR_LABELS = ['8:00','8:50','9:45','10:40','11:35','12:30','1:15','2:10','3:05','4:00'];

/* ── Helpers ─────────────────────────────────────── */
function hexA(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function scoreColor(pct) {
  return pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e';
}
function attColor(pct) {
  return pct >= 85 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e';
}

/* ── Animated Glow Chart ─────────────────────────── */
function MiniSparkline({ tests, color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!tests?.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 200;
    const H = 56;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pts = tests.map((t, i) => {
      const s = parseFloat(t.marks?.scored) || 0;
      const tot = parseFloat(t.marks?.total) || 1;
      const pct = (s / tot) * 100;
      return { x: (i / Math.max(tests.length - 1, 1)) * W, y: H - (pct / 100) * H * 0.85 - 4, pct };
    });

    let prog = 0; const start = performance.now();
    function draw(now) {
      prog = Math.min((now - start) / 900, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      ctx.clearRect(0, 0, W, H);

      const count = Math.ceil(pts.length * ease);
      const visible = pts.slice(0, count);
      if (visible.length < 2) { if (prog < 1) requestAnimationFrame(draw); return; }

      // Area
      ctx.beginPath();
      ctx.moveTo(visible[0].x, H);
      ctx.lineTo(visible[0].x, visible[0].y);
      for (let i = 1; i < visible.length; i++) {
        const prev = visible[i-1], cur = visible[i];
        ctx.bezierCurveTo((prev.x+cur.x)/2, prev.y, (prev.x+cur.x)/2, cur.y, cur.x, cur.y);
      }
      ctx.lineTo(visible[visible.length-1].x, H);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, hexA(color, 0.25));
      g.addColorStop(1, hexA(color, 0.01));
      ctx.fillStyle = g; ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(visible[0].x, visible[0].y);
      for (let i = 1; i < visible.length; i++) {
        const prev = visible[i-1], cur = visible[i];
        ctx.bezierCurveTo((prev.x+cur.x)/2, prev.y, (prev.x+cur.x)/2, cur.y, cur.x, cur.y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.stroke(); ctx.shadowBlur = 0;

      if (prog < 1) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }, [tests, color]);

  return <canvas ref={canvasRef} style={{ width:'100%', height:56, display:'block' }} />;
}

/* ── Circular Progress ───────────────────────────── */
function CircleProgress({ pct, color, size = 70 }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const dash  = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 5px ${color})`, transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
}

/* ── Sidebar Nav Item ────────────────────────────── */
function NavItem({ id, icon, label, active, onClick, badge }) {
  return (
    <button className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={() => onClick(id)}>
      <span className="nav-item-icon">
        <Ico d={icons[icon]} size={16} sw={active ? 2 : 1.6} />
      </span>
      <span className="nav-item-label">{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

/* ── Main Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const router = useRouter();
  const [data, setData]       = useState(null);
  const [tab, setTab]         = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('academia_data');
    if (!stored) { router.push('/login'); return; }
    setData(JSON.parse(stored));
  }, []);

  const logout = () => { localStorage.clear(); sessionStorage.clear(); router.push('/login'); };

  if (!data) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div className="spinner" style={{ width:32, height:32 }} />
      <p style={{ color:'var(--text-3)', fontSize:13 }}>Loading your data…</p>
    </div>
  );

  const user        = data?.user || {};
  const attendance  = data?.attendance?.attendance || [];
  const marks       = data?.marks?.marks || [];
  const timetable   = data?.timetable?.schedule || [];
  const courses     = data?.courses?.courses || [];

  const avgAtt   = attendance.length
    ? (attendance.reduce((s,a) => s + parseFloat(a.attendancePercentage||0), 0) / attendance.length).toFixed(1)
    : 0;
  const below75  = attendance.filter(a => parseFloat(a.attendancePercentage) < 75).length;
  const safeAtt  = attendance.filter(a => parseFloat(a.attendancePercentage) >= 75).length;
  const avgScore = marks.length
    ? (marks.reduce((s,m) => {
        const sc = parseFloat(m.overall?.scored)||0;
        const tot = parseFloat(m.overall?.total)||1;
        return s + (sc/tot)*100;
      }, 0) / marks.length).toFixed(1)
    : 0;

  const navItems = [
    { id:'overview',   icon:'grid',  label:'Overview' },
    { id:'attendance', icon:'chart', label:'Attendance', badge: below75 > 0 ? below75 : null },
    { id:'marks',      icon:'trend', label:'Marks' },
    { id:'timetable',  icon:'clock', label:'Timetable' },
    { id:'courses',    icon:'book',  label:'Courses' },
  ];

  return (
    <>
      <Head><title>CampusPro — {user.name || 'Dashboard'}</title></Head>

      <div className="app">
        {/* ── SIDEBAR ────────────────────────────────── */}
        <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-brand">
            <div className="sb-icon">⬡</div>
            <span className="sb-wordmark">Campus<strong>Pro</strong></span>
          </div>

          <div className="sidebar-user">
            <div className="sb-avatar">{(user.name || 'S')[0]}</div>
            <div className="sb-user-info">
              <div className="sb-name">{user.name}</div>
              <div className="sb-reg">{user.regNumber}</div>
            </div>
          </div>

          <div className="sb-pills">
            <div className="sb-pill">
              <div className="sb-pill-val">{user.semester}</div>
              <div className="sb-pill-lbl">Sem</div>
            </div>
            <div className="sb-pill" style={{ color: below75 > 0 ? '#f43f5e' : '#10b981' }}>
              <div className="sb-pill-val">{below75}</div>
              <div className="sb-pill-lbl">Danger</div>
            </div>
            <div className="sb-pill">
              <div className="sb-pill-val">{avgAtt}%</div>
              <div className="sb-pill-lbl">Avg Att</div>
            </div>
          </div>

          <nav className="sb-nav">
            {navItems.map(n => (
              <NavItem key={n.id} {...n} active={tab === n.id}
                onClick={id => { setTab(id); setSidebarOpen(false); }} />
            ))}
          </nav>

          <div className="sb-bottom">
            <Link href="/calculator" className="sb-extra-link">
              <Ico d={icons.calc} size={14} /> GPA Calculator
            </Link>
            <Link href="/calendar" className="sb-extra-link">
              <Ico d={icons.cal} size={14} /> Calendar
            </Link>
            <button className="sb-logout" onClick={logout}>
              <Ico d={icons.logout} size={14} /> Sign out
            </button>
          </div>
        </aside>

        {/* ── MAIN ───────────────────────────────────── */}
        <main className="main">
          {/* Top bar (mobile) */}
          <div className="topbar">
            <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="topbar-title">{navItems.find(n=>n.id===tab)?.label}</span>
            <div className="topbar-avatar">{(user.name||'S')[0]}</div>
          </div>

          <div className="content animate-fade-up">

            {/* ── OVERVIEW ─────────────────────────────── */}
            {tab === 'overview' && (
              <div className="tab-panel">
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user.name?.split(' ')[0]} 👋</h1>
                    <p className="page-sub">{user.department} · {user.section} Section · Year {user.year}</p>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="kpi-grid">
                  {[
                    { label:'Avg Attendance', val:`${avgAtt}%`, color:'#5b5ef4', sub:`${safeAtt} safe, ${below75} danger`, icon:'chart' },
                    { label:'Avg Score', val:`${avgScore}%`, color: parseFloat(avgScore)>=75?'#10b981':'#f59e0b', sub:`${marks.length} subjects`, icon:'trend' },
                    { label:'Subjects', val:courses.length, color:'#00d4ff', sub:`${courses.filter(c=>c.slotType==='Theory').length} theory, ${courses.filter(c=>c.slotType==='Practical').length} practical`, icon:'book' },
                    { label:'Semester', val:user.semester, color:'#f59e0b', sub:user.program?.slice(0,20)||'B.Tech', icon:'sparkle' },
                  ].map((k, i) => (
                    <div key={i} className="kpi-card glass" style={{ animationDelay:`${i*0.08}s` }}>
                      <div className="kpi-top">
                        <div className="kpi-icon" style={{ color:k.color, background:`${k.color}12`, border:`1px solid ${k.color}18` }}>
                          <Ico d={icons[k.icon]} size={15} />
                        </div>
                        <span className="kpi-label">{k.label}</span>
                      </div>
                      <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
                      <div className="kpi-sub">{k.sub}</div>
                      <div className="kpi-glow" style={{ background:`radial-gradient(circle at bottom right, ${k.color}08, transparent 65%)` }} />
                    </div>
                  ))}
                </div>

                {/* Attendance quick overview */}
                {below75 > 0 && (
                  <div className="alert-banner animate-fade-up">
                    <Ico d={icons.alert} size={16} />
                    <strong>{below75} subject{below75>1?'s':''}</strong> below 75% — immediate action needed.
                    <button className="alert-btn" onClick={() => setTab('attendance')}>View →</button>
                  </div>
                )}

                {/* Top attendance */}
                <div className="section-title-row">
                  <h2 className="section-label">Attendance Overview</h2>
                  <button className="see-all" onClick={() => setTab('attendance')}>See all →</button>
                </div>
                <div className="att-overview-grid">
                  {attendance.slice(0, 6).map((a, i) => {
                    const pct = parseFloat(a.attendancePercentage);
                    const clr = attColor(pct);
                    const conducted = parseFloat(a.hoursConducted) || 0;
                    const absent = parseFloat(a.hoursAbsent) || 0;
                    const attended = conducted - absent;
                    const canMiss = Math.floor(attended - 0.75 * conducted);
                    return (
                      <div key={i} className="att-mini-card glass" style={{ animationDelay:`${i*0.06}s` }}>
                        <div className="att-mini-row">
                          <CircleProgress pct={pct} color={clr} size={52} />
                          <div className="att-mini-info">
                            <div className="att-mini-name">{a.courseTitle}</div>
                            <div className="att-mini-code">{a.courseCode}</div>
                            <div className="att-mini-pct" style={{ color:clr }}>{a.attendancePercentage}%</div>
                          </div>
                        </div>
                        <div className="att-mini-hrs">{attended}/{conducted} hrs</div>
                        <div className="att-mini-tag" style={{
                          color: canMiss>=0 ? '#34d399' : '#fb7185',
                          background: canMiss>=0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                          border: `1px solid ${canMiss>=0 ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}`,
                        }}>
                          {canMiss >= 0 ? `✓ Miss ${canMiss} more` : `⚠ Need ${Math.abs(canMiss)} classes`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── ATTENDANCE ───────────────────────────── */}
            {tab === 'attendance' && (
              <div className="tab-panel">
                <div className="page-header">
                  <h1 className="page-title">Attendance</h1>
                </div>

                <div className="sum-row">
                  {[
                    { val:`${avgAtt}%`, label:'Average', color:'#a5b4fc' },
                    { val:safeAtt, label:'Safe ≥ 75%', color:'#34d399' },
                    { val:below75, label:'Danger < 75%', color:'#fb7185' },
                    { val:attendance.length, label:'Total Subjects', color:'#fbbf24' },
                  ].map((s,i) => (
                    <div key={i} className="sum-card glass">
                      <div className="sum-val" style={{ color:s.color }}>{s.val}</div>
                      <div className="sum-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="att-list">
                  {attendance.map((a, i) => {
                    const pct = parseFloat(a.attendancePercentage);
                    const clr = attColor(pct);
                    const conducted = parseFloat(a.hoursConducted) || 0;
                    const absent = parseFloat(a.hoursAbsent) || 0;
                    const attended = conducted - absent;
                    const canMiss = Math.floor(attended - 0.75 * conducted);
                    return (
                      <div key={i} className="att-row glass" style={{ animationDelay:`${i*0.05}s` }}>
                        <CircleProgress pct={pct} color={clr} size={60} />
                        <div className="att-row-info">
                          <div className="att-row-name">{a.courseTitle}</div>
                          <div className="att-row-meta">{a.courseCode} · {a.category} · {a.facultyName?.split('(')[0]?.trim()}</div>
                          <div className="progress-track" style={{ marginTop:8 }}>
                            <div className="progress-fill" style={{ width:`${Math.min(pct,100)}%`, background:clr }} />
                          </div>
                        </div>
                        <div className="att-row-right">
                          <div className="att-pct-big" style={{ color:clr }}>{a.attendancePercentage}%</div>
                          <div className="att-hrs-label">{attended}/{conducted} hrs</div>
                          <div className="att-tag" style={{
                            color: canMiss>=0?'#34d399':'#fb7185',
                            background: canMiss>=0?'rgba(16,185,129,0.08)':'rgba(244,63,94,0.08)',
                            border: `1px solid ${canMiss>=0?'rgba(16,185,129,0.15)':'rgba(244,63,94,0.15)'}`,
                          }}>
                            {canMiss >= 0 ? `Can miss ${canMiss} more` : `Need ${Math.abs(canMiss)} more`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── MARKS ────────────────────────────────── */}
            {tab === 'marks' && (
              <div className="tab-panel">
                <div className="page-header">
                  <h1 className="page-title">Marks</h1>
                </div>
                <div className="marks-grid">
                  {marks.map((m, i) => {
                    const sc  = parseFloat(m.overall?.scored) || 0;
                    const tot = parseFloat(m.overall?.total)  || 0;
                    const pct = tot > 0 ? (sc / tot) * 100 : 0;
                    const clr = scoreColor(pct);
                    const tests = (m.testPerformance || []).slice().reverse();
                    return (
                      <div key={i} className="mk-card glass" style={{ animationDelay:`${i*0.06}s` }}>
                        <div className="mk-head">
                          <div>
                            <div className="mk-code">{m.courseCode}</div>
                            <div className="mk-name">{m.courseName}</div>
                            <span className="tag" style={{ marginTop:6, fontSize:9.5, background:`${clr}12`, color:clr, border:`1px solid ${clr}20` }}>
                              {m.courseType}
                            </span>
                          </div>
                          <div className="mk-score-block">
                            <div className="mk-score" style={{ color:clr }}>{sc.toFixed(1)}</div>
                            <div className="mk-denom">/ {tot.toFixed(1)}</div>
                            <div className="mk-pct-badge" style={{ color:clr, background:`${clr}12`, border:`1px solid ${clr}20` }}>
                              {pct.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        {tests.length > 0 ? (
                          <div className="mk-chart-wrap">
                            <MiniSparkline tests={tests} color={clr} />
                            <div className="mk-chart-labels">
                              {tests.slice(0,4).map((t,ti) => (
                                <span key={ti} className="mk-test-label">{t.test}</span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mk-empty">No test data yet</div>
                        )}
                        <div className="progress-track" style={{ marginTop:4 }}>
                          <div className="progress-fill" style={{ width:`${Math.min(pct,100)}%`, background:clr }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TIMETABLE ────────────────────────────── */}
            {tab === 'timetable' && (
              <div className="tab-panel">
                <div className="page-header">
                  <h1 className="page-title">Timetable</h1>
                  <span className="tag tag-accent">Batch {data?.timetable?.batch}</span>
                </div>
                <div className="tt-scroll-wrap">
                  <table className="tt-table">
                    <thead>
                      <tr>
                        <th className="tt-day-col" />
                        {HOUR_LABELS.map((h, i) => (
                          <th key={i} className="tt-hour-col">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.map((d, di) => (
                        <tr key={di}>
                          <td className="tt-day-cell">{DAY_NAMES[d.day - 1] || d.day}</td>
                          {(d.table || []).map((slot, si) => (
                            <td key={si} className="tt-slot-cell">
                              {slot && (
                                <div className={`tt-slot ${slot.courseType === 'Practical' ? 'tt-slot-p' : 'tt-slot-t'}`}>
                                  <div className="tt-code">{slot.code}</div>
                                  <div className="tt-room">{slot.roomNo}</div>
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── COURSES ──────────────────────────────── */}
            {tab === 'courses' && (
              <div className="tab-panel">
                <div className="page-header">
                  <h1 className="page-title">Courses</h1>
                  <span className="tag tag-accent">{courses.length} enrolled</span>
                </div>
                <div className="courses-grid">
                  {courses.map((c, i) => (
                    <div key={i} className="course-card glass" style={{ animationDelay:`${i*0.05}s` }}>
                      <div className="cc-top">
                        <span className="cc-code">{c.code}</span>
                        <span className={`tag ${c.slotType==='Theory'?'tag-accent':'tag-emerald'}`} style={{ fontSize:9.5 }}>
                          {c.slotType || '—'}
                        </span>
                      </div>
                      <div className="cc-title">{c.title}</div>
                      <div className="cc-divider" />
                      <div className="cc-meta">
                        <div className="cc-meta-row">
                          <span className="cc-meta-icon">👤</span>
                          <span>{c.faculty?.split('(')[0]?.trim() || '—'}</span>
                        </div>
                        <div className="cc-meta-row">
                          <span className="cc-meta-icon">🏫</span>
                          <span>{c.room}</span>
                          <span className="cc-sep">·</span>
                          <span>{c.slot}</span>
                          <span className="cc-sep">·</span>
                          <span>⭐ {c.credit} cr</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      <style jsx global>{`
        body { background: var(--bg-void); overflow-x: hidden; }
      `}</style>

      <style jsx>{`
        /* APP SHELL */
        .app { display:flex; min-height:100vh; }

        /* SIDEBAR */
        .sidebar-overlay {
          display:none; position:fixed; inset:0; z-index:49;
          background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
          transition:opacity 0.3s;
        }
        .sidebar {
          width:220px; min-height:100vh; flex-shrink:0;
          background:rgba(8,8,20,0.92);
          border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          padding:20px 12px; gap:16px;
          position:sticky; top:0; height:100vh; overflow-y:auto;
          backdrop-filter:blur(20px);
        }
        .sidebar-brand { display:flex; align-items:center; gap:8px; padding:4px 6px; }
        .sb-icon { font-size:20px; color:var(--accent); filter:drop-shadow(0 0 8px var(--accent-glow)); }
        .sb-wordmark { font-family:var(--font-display); font-size:15px; color:var(--text-1); }
        .sb-wordmark strong { color:var(--accent); }

        .sidebar-user {
          display:flex; gap:10px; align-items:center;
          background:var(--accent-dim); border:1px solid var(--accent-border);
          border-radius:var(--radius-md); padding:11px;
        }
        .sb-avatar {
          width:32px; height:32px; border-radius:8px;
          background:linear-gradient(135deg,#5b5ef4,#4f52e0);
          display:flex; align-items:center; justify-content:center;
          font-family:var(--font-display); font-weight:700; font-size:13px;
          flex-shrink:0;
        }
        .sb-user-info { min-width:0; }
        .sb-name { font-size:12px; font-weight:600; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-reg  { font-family:var(--font-mono); font-size:10px; color:var(--text-3); margin-top:1px; }

        .sb-pills { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .sb-pill {
          background:rgba(255,255,255,0.03); border:1px solid var(--border);
          border-radius:var(--radius-sm); padding:7px 4px; text-align:center;
        }
        .sb-pill-val { font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--text-1); }
        .sb-pill-lbl { font-size:9px; color:var(--text-3); margin-top:1px; text-transform:uppercase; letter-spacing:0.4px; }

        .sb-nav { display:flex; flex-direction:column; gap:2px; flex:1; }
        .nav-item {
          display:flex; align-items:center; gap:9px;
          width:100%; padding:9px 10px; border-radius:var(--radius-sm);
          background:none; border:none; color:var(--text-3);
          font-size:13px; font-family:var(--font-body); font-weight:450;
          text-align:left; cursor:pointer; transition:all 0.15s; position:relative;
        }
        .nav-item:hover { background:var(--bg-elevated); color:var(--text-1); }
        .nav-item-active { background:var(--accent-dim); color:#a5b4fc; border:1px solid var(--accent-border); }
        .nav-item-icon { display:flex; align-items:center; flex-shrink:0; }
        .nav-item-label { flex:1; }
        .nav-badge {
          font-size:10px; font-weight:700;
          background:var(--rose-dim); color:#fb7185;
          border:1px solid rgba(244,63,94,0.2);
          border-radius:10px; padding:1px 6px;
        }

        .sb-bottom { display:flex; flex-direction:column; gap:4px; }
        .sb-extra-link {
          display:flex; align-items:center; gap:8px;
          padding:8px 10px; border-radius:var(--radius-sm);
          color:var(--text-3); font-size:12px; transition:all 0.15s;
        }
        .sb-extra-link:hover { background:var(--bg-elevated); color:var(--text-1); }
        .sb-logout {
          display:flex; align-items:center; gap:8px;
          padding:9px 10px; border-radius:var(--radius-sm);
          background:none; border:1px solid var(--border);
          color:var(--text-3); font-size:12px; font-family:var(--font-body);
          cursor:pointer; transition:all 0.15s; width:100%; text-align:left;
        }
        .sb-logout:hover { border-color:rgba(244,63,94,0.3); color:#fb7185; }

        /* MAIN */
        .main { flex:1; min-width:0; display:flex; flex-direction:column; }
        .topbar {
          display:none; align-items:center; justify-content:space-between;
          padding:12px 16px; border-bottom:1px solid var(--border);
          background:rgba(7,7,16,0.8); backdrop-filter:blur(12px);
          position:sticky; top:0; z-index:40;
        }
        .topbar-menu {
          background:none; border:none; color:var(--text-2); cursor:pointer;
          padding:4px; display:flex; align-items:center;
        }
        .topbar-title { font-family:var(--font-display); font-size:15px; font-weight:700; }
        .topbar-avatar {
          width:28px; height:28px; border-radius:7px;
          background:linear-gradient(135deg,#5b5ef4,#4f52e0);
          display:flex; align-items:center; justify-content:center;
          font-family:var(--font-display); font-weight:700; font-size:11px;
        }

        .content { padding:32px 36px; flex:1; }
        .tab-panel { display:flex; flex-direction:column; gap:24px; }

        /* PAGE HEADER */
        .page-header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .page-title {
          font-family:var(--font-display); font-size:26px; font-weight:800;
          color:var(--text-1); letter-spacing:-0.5px;
        }
        .page-sub { font-size:13px; color:var(--text-3); margin-top:3px; }

        /* KPI GRID */
        .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .kpi-card {
          border-radius:var(--radius-lg); padding:18px;
          position:relative; overflow:hidden;
          animation:fadeUp 0.5s var(--ease-out) both;
          transition:transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .kpi-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
        .kpi-glow { position:absolute; inset:0; pointer-events:none; }
        .kpi-top { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
        .kpi-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
        .kpi-label { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.6px; }
        .kpi-val { font-family:var(--font-mono); font-size:28px; font-weight:700; line-height:1; }
        .kpi-sub { font-size:11px; color:var(--text-3); margin-top:6px; }

        /* ALERT */
        .alert-banner {
          display:flex; align-items:center; gap:10px;
          background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2);
          border-radius:var(--radius-md); padding:12px 16px;
          font-size:13px; color:#fb7185;
        }
        .alert-btn {
          margin-left:auto; background:none; border:1px solid rgba(244,63,94,0.3);
          color:#fb7185; border-radius:6px; padding:4px 10px;
          font-size:12px; cursor:pointer; transition:all 0.15s;
        }
        .alert-btn:hover { background:rgba(244,63,94,0.12); }

        /* SECTION LABEL */
        .section-title-row { display:flex; align-items:center; justify-content:space-between; }
        .section-label { font-family:var(--font-display); font-size:16px; font-weight:700; color:var(--text-1); }
        .see-all { font-size:12px; color:var(--accent); background:none; border:none; cursor:pointer; }
        .see-all:hover { text-decoration:underline; }

        /* ATT OVERVIEW */
        .att-overview-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:10px; }
        .att-mini-card {
          border-radius:var(--radius-md); padding:14px;
          transition:transform 0.2s, border-color 0.2s;
          animation:fadeUp 0.4s var(--ease-out) both;
        }
        .att-mini-card:hover { transform:translateY(-2px); border-color:var(--border-strong); }
        .att-mini-row { display:flex; gap:12px; align-items:flex-start; margin-bottom:10px; }
        .att-mini-info { flex:1; min-width:0; }
        .att-mini-name { font-size:12px; font-weight:500; color:var(--text-1); line-height:1.3; }
        .att-mini-code { font-family:var(--font-mono); font-size:10px; color:var(--text-3); margin-top:3px; }
        .att-mini-pct  { font-family:var(--font-mono); font-size:18px; font-weight:700; margin-top:6px; }
        .att-mini-hrs  { font-size:11px; color:var(--text-3); margin-bottom:7px; }
        .att-mini-tag  { font-size:10px; font-weight:600; padding:3px 9px; border-radius:5px; display:inline-block; }

        /* ATT LIST */
        .sum-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .sum-card { border-radius:var(--radius-md); padding:16px; text-align:center; }
        .sum-val { font-family:var(--font-mono); font-size:26px; font-weight:700; }
        .sum-label { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }

        .att-list { display:flex; flex-direction:column; gap:8px; }
        .att-row {
          display:flex; align-items:center; gap:16px;
          border-radius:var(--radius-md); padding:14px 16px;
          transition:transform 0.18s, border-color 0.18s;
          animation:fadeUp 0.4s var(--ease-out) both;
        }
        .att-row:hover { transform:translateX(4px); border-color:var(--border-strong); }
        .att-row-info { flex:1; min-width:0; }
        .att-row-name { font-size:13.5px; font-weight:500; color:var(--text-1); }
        .att-row-meta { font-size:11px; color:var(--text-3); margin-top:2px; }
        .att-row-right { text-align:right; flex-shrink:0; }
        .att-pct-big { font-family:var(--font-mono); font-size:22px; font-weight:700; }
        .att-hrs-label { font-size:11px; color:var(--text-3); margin:2px 0 8px; }
        .att-tag { font-size:10px; font-weight:600; padding:3px 9px; border-radius:5px; display:inline-block; }

        /* MARKS */
        .marks-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
        .mk-card {
          border-radius:var(--radius-lg); padding:18px;
          display:flex; flex-direction:column; gap:12px;
          transition:transform 0.22s, border-color 0.22s, box-shadow 0.22s;
          animation:fadeUp 0.4s var(--ease-out) both;
        }
        .mk-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-md); }
        .mk-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .mk-code { font-family:var(--font-mono); font-size:10px; color:var(--accent); margin-bottom:4px; }
        .mk-name { font-size:13px; font-weight:600; color:var(--text-1); line-height:1.35; }
        .mk-score-block { text-align:right; flex-shrink:0; }
        .mk-score { font-family:var(--font-mono); font-size:28px; font-weight:700; line-height:1; }
        .mk-denom { font-size:11px; color:var(--text-3); margin-top:1px; }
        .mk-pct-badge { font-size:11px; font-weight:600; padding:3px 8px; border-radius:5px; margin-top:6px; display:inline-block; }
        .mk-chart-wrap { background:rgba(0,0,0,0.2); border-radius:10px; padding:6px 6px 2px; }
        .mk-chart-labels { display:flex; justify-content:space-between; padding:0 4px; margin-top:3px; }
        .mk-test-label { font-family:var(--font-mono); font-size:9px; color:var(--text-4); }
        .mk-empty { font-size:12px; color:var(--text-4); text-align:center; padding:20px 0; }

        /* TIMETABLE */
        .tt-scroll-wrap { overflow-x:auto; border-radius:var(--radius-lg); }
        .tt-table { border-collapse:collapse; min-width:900px; width:100%; }
        .tt-table th { padding:8px 10px; font-size:10px; color:var(--text-3); border:1px solid var(--border); text-align:center; background:rgba(255,255,255,0.01); font-family:var(--font-mono); }
        .tt-table td { border:1px solid var(--border); padding:3px; height:56px; vertical-align:top; }
        .tt-day-col { width:48px; }
        .tt-day-cell { font-family:var(--font-display); font-size:11px; color:var(--text-3); text-align:center; padding:8px !important; font-weight:600; }
        .tt-slot { height:100%; border-radius:6px; padding:5px 7px; display:flex; flex-direction:column; justify-content:center; }
        .tt-slot-t { background:var(--accent-dim); border:1px solid var(--accent-border); }
        .tt-slot-p { background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.15); }
        .tt-code { font-family:var(--font-mono); font-size:10px; color:#a5b4fc; }
        .tt-room { font-size:9px; color:var(--text-4); margin-top:2px; }

        /* COURSES */
        .courses-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
        .course-card {
          border-radius:var(--radius-md); padding:16px;
          transition:transform 0.2s, border-color 0.2s;
          animation:fadeUp 0.4s var(--ease-out) both;
        }
        .course-card:hover { transform:translateY(-2px); border-color:var(--border-strong); }
        .cc-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .cc-code { font-family:var(--font-mono); font-size:11px; color:var(--accent); }
        .cc-title { font-size:13px; font-weight:600; color:var(--text-1); line-height:1.4; }
        .cc-divider { height:1px; background:var(--border); margin:12px 0; }
        .cc-meta { display:flex; flex-direction:column; gap:5px; }
        .cc-meta-row { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-3); flex-wrap:wrap; }
        .cc-meta-icon { font-size:12px; }
        .cc-sep { color:var(--text-4); }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .kpi-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width: 900px) {
          .sidebar { display:none; position:fixed; z-index:50; left:0; top:0; bottom:0; }
          .sidebar.sidebar-open { display:flex; }
          .sidebar-overlay.visible { display:block; }
          .topbar { display:flex; }
          .content { padding:20px 16px; }
          .kpi-grid { grid-template-columns:repeat(2,1fr); }
          .sum-row { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns:1fr; }
          .att-overview-grid { grid-template-columns:1fr; }
          .marks-grid { grid-template-columns:1fr; }
          .courses-grid { grid-template-columns:1fr; }
        }
      `}</style>
    </>
  );
}
