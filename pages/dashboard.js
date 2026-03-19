import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/Sidebar';
import TimetableView from '../components/TimetableView';
import { DataStore, requireAuth, logout, sanitizeObject } from '@/lib/security';
import MarksSection from '../components/MarksSection';

const Ico = ({ d, size = 16, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function scoreColor(pct) {
  return pct >= 80 ? 'var(--emerald)' : pct >= 60 ? 'var(--amber)' : 'var(--rose)';
}
function attColor(pct) {
  return pct >= 85 ? 'var(--emerald)' : pct >= 75 ? 'var(--amber)' : 'var(--rose)';
}

function CircleProgress({ pct, color = 'var(--accent)', size = 60 }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }} className="no-transition">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 1.1s cubic-bezier(.4,0,.2,1)', filter:`drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

function KPICard({ label, value, sub, color, icon, delay }) {
  return (
    <div className="kpi-card glass animate-up" style={{ animationDelay:`${delay}ms` }}>
      <div className="kpi-top">
        <div className="kpi-icon" style={{ color, background:`${color}12`, border:`1px solid ${color}1a` }}>
          <Ico d={icon} size={14} />
        </div>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-val" style={{ color }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      <div className="kpi-glow" style={{ background:`radial-gradient(circle at bottom right, ${color}08, transparent 65%)` }} />
      <style jsx>{`
        .kpi-card { border-radius:var(--radius-lg); padding:18px; position:relative; overflow:hidden; transition:transform .2s,box-shadow .2s; }
        .kpi-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
        .kpi-glow { position:absolute; inset:0; pointer-events:none; }
        .kpi-top { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .kpi-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
        .kpi-label { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:.5px; font-weight:600; }
        .kpi-val { font-family:var(--font-mono); font-size:26px; font-weight:700; }
        .kpi-sub { font-size:11px; color:var(--text-3); margin-top:5px; }
      `}</style>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [tab, setTab]   = useState('overview');

  useEffect(() => {
    if (!requireAuth(router)) return;
    const raw = DataStore.get();
    if (!raw) { router.replace('/login'); return; }
    setData(sanitizeObject(raw));
  }, []);

  useEffect(() => {
    if (router.query.tab) setTab(router.query.tab);
  }, [router.query.tab]);

  if (!data) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div className="spinner" style={{ width:32, height:32 }} />
      <p style={{ color:'var(--text-3)', fontSize:13 }}>Loading your workspace…</p>
    </div>
  );

  const user       = data?.user || {};
  const attendance = data?.attendance?.attendance || [];
  const marks      = data?.marks?.marks           || [];
  const timetable  = data?.timetable              || null;
  const courses    = data?.courses?.courses       || [];

  const avgAtt   = attendance.length
    ? (attendance.reduce((s, a) => s + parseFloat(a.attendancePercentage || 0), 0) / attendance.length).toFixed(1)
    : 0;
  const below75  = attendance.filter(a => parseFloat(a.attendancePercentage) < 75).length;
  const safeAtt  = attendance.filter(a => parseFloat(a.attendancePercentage) >= 75).length;
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
      <div className="app-shell">
        <Sidebar activeTab={tab} onTabChange={setTab} user={user} below75={below75} />

        <main className="main-content">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="tab-panel animate-in">
              <div className="page-header">
                <div>
                  <h1 className="page-title">{greeting()}, <span className="grad-text">{user.name?.split(' ')[0] || 'Student'}</span> 👋</h1>
                  <p className="page-sub">{user.department?.replace(/\(.*\)/,'').trim()} · {user.section} Section · Year {user.year}</p>
                </div>
              </div>
              <div className="kpi-grid">
                <KPICard label="Attendance"  value={`${avgAtt}%`} color="var(--accent-light)" icon="M22 12l-4 4m0 0l-4-4m4 4V8M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" sub={`${safeAtt} safe, ${below75} danger`} delay={0} />
                <KPICard label="Avg Score"   value={`${avgScore}%`} color={scoreColor(parseFloat(avgScore))} icon="M18 20V10m-6 10V4M6 20v-6" sub={`${marks.length} subjects tracked`} delay={70} />
                <KPICard label="Subjects"    value={courses.length} color="var(--cyan)" icon="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" sub={`${courses.filter(c=>c.slotType==='Theory').length} theory · ${courses.filter(c=>c.slotType==='Practical').length} lab`} delay={140} />
                <KPICard label="Semester"    value={user.semester}  color="var(--amber)"  icon="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" sub={user.program?.slice(0,22)} delay={210} />
              </div>
              {below75 > 0 && (
                <div className="alert-banner animate-up">
                  <Ico d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-7v-2m0-4h.01" />
                  <strong>{below75} subject{below75 > 1 ? 's' : ''}</strong> below 75% attendance — immediate action needed.
                  <button className="alert-action" onClick={() => setTab('attendance')}>View →</button>
                </div>
              )}
              <div className="section-row">
                <h2 className="section-label">Attendance Overview</h2>
                <button className="see-all" onClick={() => setTab('attendance')}>View all →</button>
              </div>
              <div className="att-mini-grid">
                {attendance.slice(0, 6).map((a, i) => {
                  const pct = parseFloat(a.attendancePercentage);
                  const clr = attColor(pct);
                  const conducted = parseFloat(a.hoursConducted) || 0;
                  const absent    = parseFloat(a.hoursAbsent) || 0;
                  const attended  = conducted - absent;
                  const canMiss   = Math.floor(attended - 0.75 * conducted);
                  return (
                    <div key={i} className="att-mini-card glass animate-up" style={{ animationDelay:`${i * 55}ms` }}>
                      <div className="att-mini-row">
                        <CircleProgress pct={pct} color={clr} size={50} />
                        <div className="att-mini-info">
                          <div className="att-mini-name">{a.courseTitle}</div>
                          <div className="att-mini-code">{a.courseCode}</div>
                          <div className="att-mini-pct" style={{ color:clr }}>{a.attendancePercentage}%</div>
                        </div>
                      </div>
                      <div className="att-mini-hrs">{attended}/{conducted} hrs</div>
                      <div className="att-mini-tag" style={{
                        color:canMiss>=0?'var(--emerald)':'var(--rose)',
                        background:canMiss>=0?'var(--emerald-dim)':'var(--rose-dim)',
                        border:`1px solid ${canMiss>=0?'var(--emerald-border)':'rgba(244,63,94,.18)'}`,
                      }}>
                        {canMiss >= 0 ? `✓ Miss ${canMiss} more` : `⚠ Need ${Math.abs(canMiss)} classes`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {tab === 'attendance' && (
            <div className="tab-panel animate-in">
              <div className="page-header">
                <h1 className="page-title">Attendance</h1>
              </div>
              <div className="sum-row">
                {[
                  { v:`${avgAtt}%`, l:'Average',      c:'var(--accent-light)' },
                  { v:safeAtt,      l:'Safe ≥ 75%',   c:'var(--emerald)' },
                  { v:below75,      l:'Danger < 75%', c:'var(--rose)' },
                  { v:attendance.length, l:'Total',   c:'var(--amber)' },
                ].map((s, i) => (
                  <div key={i} className="sum-card glass">
                    <div className="sum-val" style={{ color:s.c }}>{s.v}</div>
                    <div className="sum-lbl">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="att-list">
                {attendance.map((a, i) => {
                  const pct = parseFloat(a.attendancePercentage);
                  const clr = attColor(pct);
                  const conducted = parseFloat(a.hoursConducted) || 0;
                  const absent    = parseFloat(a.hoursAbsent) || 0;
                  const attended  = conducted - absent;
                  const canMiss   = Math.floor(attended - 0.75 * conducted);
                  return (
                    <div key={i} className="att-row glass animate-up" style={{ animationDelay:`${i * 40}ms` }}>
                      <CircleProgress pct={pct} color={clr} size={56} />
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
                          color:canMiss>=0?'var(--emerald)':'var(--rose)',
                          background:canMiss>=0?'var(--emerald-dim)':'var(--rose-dim)',
                          border:`1px solid ${canMiss>=0?'var(--emerald-border)':'rgba(244,63,94,.18)'}`,
                        }}>
                          {canMiss >= 0 ? `Can skip ${canMiss} more` : `Need ${Math.abs(canMiss)} more`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── MARKS ── */}
          {tab === 'marks' && (
            <div className="tab-panel animate-in">
              <div className="page-header" style={{ marginBottom:20 }}>
                <h1 className="page-title">Marks</h1>
                <span className="tag tag-accent">{marks.length} subjects</span>
              </div>
              <MarksSection marks={marks} />
            </div>
          )}

          {/* ── TIMETABLE ── */}
          {tab === 'timetable' && (
            <div className="tab-panel animate-in">
              <TimetableView timetableData={timetable} />
            </div>
          )}

          {/* ── COURSES ── */}
          {tab === 'courses' && (
            <div className="tab-panel animate-in">
              <div className="page-header">
                <h1 className="page-title">Courses</h1>
                <span className="tag tag-accent">{courses.length} enrolled</span>
              </div>

              {/* Summary strip */}
              <div className="courses-strip">
                {[
                  { label:'Theory',       val:courses.filter(c=>c.slotType==='Theory').length,    color:'var(--accent-light)' },
                  { label:'Practical',    val:courses.filter(c=>c.slotType==='Practical').length, color:'var(--emerald)' },
                  { label:'Total Credits',val:courses.reduce((s,c)=>s+(parseFloat(c.credit)||0),0), color:'var(--amber)' },
                ].map((s,i)=>(
                  <div key={i} className="cs-pill glass">
                    <span className="cs-val" style={{color:s.color}}>{s.val}</span>
                    <span className="cs-lbl">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="courses-grid">
                {courses.map((c, i) => {
                  const isTheory   = c.slotType === 'Theory';
                  const faculty    = c.faculty?.split('(')[0]?.trim() || '—';
                  const barColor   = isTheory ? '#6366f1' : '#10b981';
                  const accentCss  = isTheory ? 'var(--accent-light)' : 'var(--emerald)';
                  return (
                    <div key={i} className="cc-card glass animate-up" style={{ animationDelay:`${i * 45}ms` }}>
                      <div className="cc-bar" style={{ background: barColor }} />
                      <div className="cc-inner">
                        <div className="cc-top">
                          <span className="cc-code">{c.code}</span>
                          <span className={`tag ${isTheory ? 'tag-accent' : 'tag-emerald'}`} style={{ fontSize:9.5 }}>
                            {c.slotType || '—'}
                          </span>
                        </div>
                        <div className="cc-title">{c.title}</div>

                        <div className="cc-faculty">
                          <div className="cc-fav" style={{ color:accentCss, borderColor:barColor+'44', background:barColor+'18' }}>
                            {faculty[0] || '?'}
                          </div>
                          <span className="cc-fname">{faculty}</span>
                        </div>

                        <div className="cc-info-grid">
                          <div className="ci-box">
                            <span className="ci-icon">🏫</span>
                            <span className="ci-val">{c.room || '—'}</span>
                            <span className="ci-lbl">Room</span>
                          </div>
                          <div className="ci-box">
                            <span className="ci-icon">🕐</span>
                            <span className="ci-val">{c.slot || '—'}</span>
                            <span className="ci-lbl">Slot</span>
                          </div>
                          <div className="ci-box">
                            <span className="ci-icon">⭐</span>
                            <span className="ci-val">{c.credit || '0'}</span>
                            <span className="ci-lbl">Credits</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>

      <style jsx global>{`
        body { background: var(--bg-void); overflow-x: hidden; }
      `}</style>

      <style jsx>{`
        .app-shell { display:flex; min-height:100vh; }
        .main-content { flex:1; padding:32px 36px; min-width:0; overflow-y:auto; }

        .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
        .page-title { font-family:var(--font-display); font-size:26px; font-weight:800; color:var(--text-1); letter-spacing:-.5px; }
        .page-sub { font-size:13px; color:var(--text-3); margin-top:3px; }

        .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }

        .alert-banner { display:flex; align-items:center; gap:10px; background:var(--rose-dim); border:1px solid rgba(244,63,94,.22); border-radius:var(--radius-md); padding:12px 16px; font-size:13px; color:var(--rose); margin-bottom:20px; }
        .alert-banner strong { color:var(--rose); font-weight:700; }
        .alert-action { margin-left:auto; background:none; border:1px solid rgba(244,63,94,.3); color:var(--rose); border-radius:6px; padding:4px 10px; font-size:12px; cursor:pointer; transition:all .15s; }
        .alert-action:hover { background:rgba(244,63,94,.12); }

        .section-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .section-label { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-1); }
        .see-all { background:none; border:none; color:var(--accent-light); font-size:12px; cursor:pointer; }
        .see-all:hover { text-decoration:underline; }

        .att-mini-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:10px; }
        .att-mini-card { border-radius:var(--radius-md); padding:14px; transition:transform .2s; }
        .att-mini-card:hover { transform:translateY(-2px); }
        .att-mini-row { display:flex; gap:12px; align-items:flex-start; margin-bottom:8px; }
        .att-mini-info { flex:1; min-width:0; }
        .att-mini-name { font-size:12px; font-weight:500; color:var(--text-1); line-height:1.3; }
        .att-mini-code { font-family:var(--font-mono); font-size:10px; color:var(--text-3); margin-top:2px; }
        .att-mini-pct { font-family:var(--font-mono); font-size:18px; font-weight:700; margin-top:5px; }
        .att-mini-hrs { font-size:11px; color:var(--text-3); margin-bottom:7px; }
        .att-mini-tag { font-size:10px; font-weight:600; padding:3px 9px; border-radius:5px; display:inline-block; }

        .sum-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
        .sum-card { border-radius:var(--radius-md); padding:16px; text-align:center; }
        .sum-val { font-family:var(--font-mono); font-size:24px; font-weight:700; }
        .sum-lbl { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:.5px; margin-top:4px; }

        .att-list { display:flex; flex-direction:column; gap:8px; }
        .att-row { display:flex; align-items:center; gap:16px; border-radius:var(--radius-md); padding:14px 16px; transition:transform .18s; }
        .att-row:hover { transform:translateX(4px); }
        .att-row-info { flex:1; min-width:0; }
        .att-row-name { font-size:13.5px; font-weight:500; color:var(--text-1); }
        .att-row-meta { font-size:11px; color:var(--text-3); margin-top:2px; }
        .att-row-right { text-align:right; flex-shrink:0; }
        .att-pct-big { font-family:var(--font-mono); font-size:22px; font-weight:700; }
        .att-hrs-label { font-size:11px; color:var(--text-3); margin:2px 0 7px; }
        .att-tag { font-size:10px; font-weight:600; padding:3px 9px; border-radius:5px; display:inline-block; }
        .progress-track { height:4px; background:rgba(255,255,255,.07); border-radius:2px; overflow:hidden; }
        .progress-fill { height:100%; border-radius:2px; transition:width 1.2s ease; }

        /* ── COURSES ── */
        .courses-strip { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .cs-pill { display:flex; align-items:center; gap:10px; border-radius:var(--radius-md); padding:12px 18px; }
        .cs-val { font-family:var(--font-mono); font-size:22px; font-weight:700; }
        .cs-lbl { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:.5px; }

        .courses-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
        .cc-card { border-radius:var(--radius-lg); overflow:hidden; display:flex; flex-direction:column; transition:transform .22s,box-shadow .22s; padding:0; }
        .cc-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-md); }
        .cc-bar { height:3px; width:100%; flex-shrink:0; }
        .cc-inner { padding:16px; display:flex; flex-direction:column; gap:10px; }
        .cc-top { display:flex; justify-content:space-between; align-items:center; }
        .cc-code { font-family:var(--font-mono); font-size:10.5px; color:var(--accent-light); }
        .cc-title { font-size:13.5px; font-weight:600; color:var(--text-1); line-height:1.4; }
        .cc-faculty { display:flex; align-items:center; gap:9px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,.06); }
        .cc-fav { width:26px; height:26px; border-radius:7px; border:1px solid; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
        .cc-fname { font-size:12px; color:var(--text-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cc-info-grid { display:grid; grid-template-columns:repeat(3,1fr); }
        .ci-box { display:flex; flex-direction:column; align-items:center; padding:10px 6px; border-right:1px solid rgba(255,255,255,.05); gap:2px; }
        .ci-box:last-child { border-right:none; }
        .ci-icon { font-size:13px; }
        .ci-val { font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--text-1); text-align:center; margin-top:2px; }
        .ci-lbl { font-size:9px; color:var(--text-3); text-transform:uppercase; letter-spacing:.4px; }

        .tab-panel { display:flex; flex-direction:column; gap:20px; }
        .animate-in { animation: fadeIn .35s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width: 1100px) { .kpi-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width: 860px) {
          .main-content { padding:58px 16px 24px; }
          .kpi-grid { grid-template-columns:repeat(2,1fr); }
          .sum-row { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width: 520px) {
          .kpi-grid { grid-template-columns:1fr 1fr; }
          .att-mini-grid { grid-template-columns:1fr; }
          .courses-grid { grid-template-columns:1fr; }
        }
      `}</style>
    </>
  );
}