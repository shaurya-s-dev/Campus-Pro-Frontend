import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '@/components/Sidebar';
import TimetableView from '@/components/TimetableView';
import { DataStore, requireAuth, logout, sanitizeObject } from '@/lib/security';
import MarksSection from '@/components/MarksSection';

/* ── Small helpers ───────────────────────────────── */
const Ico = ({ d, size = 16, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function hexA(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function scoreColor(pct) {
  return pct >= 80 ? 'var(--emerald)' : pct >= 60 ? 'var(--amber)' : 'var(--rose)';
}
function attColor(pct) {
  return pct >= 85 ? 'var(--emerald)' : pct >= 75 ? 'var(--amber)' : 'var(--rose)';
}

/* ── Circular SVG progress ───────────────────────── */
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

/* ── Animated marks sparkline ────────────────────── */
function MiniSparkline({ tests, color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!tests?.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 200; const H = 52;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
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
      const vis = pts.slice(0, count);
      if (vis.length < 2) { if (prog < 1) requestAnimationFrame(draw); return; }

      ctx.beginPath();
      ctx.moveTo(vis[0].x, H);
      ctx.lineTo(vis[0].x, vis[0].y);
      for (let i = 1; i < vis.length; i++) {
        const p = vis[i-1], c = vis[i];
        ctx.bezierCurveTo((p.x+c.x)/2, p.y, (p.x+c.x)/2, c.y, c.x, c.y);
      }
      ctx.lineTo(vis[vis.length-1].x, H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, color.replace(')', ', .22)').replace('var(--emerald)', 'rgba(16,185,129,.22)').replace('var(--amber)', 'rgba(245,158,11,.22)').replace('var(--rose)', 'rgba(244,63,94,.22)') || 'rgba(99,102,241,.22)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.fill();

      ctx.beginPath();
      ctx.moveTo(vis[0].x, vis[0].y);
      for (let i = 1; i < vis.length; i++) {
        const p = vis[i-1], c = vis[i];
        ctx.bezierCurveTo((p.x+c.x)/2, p.y, (p.x+c.x)/2, c.y, c.x, c.y);
      }
      ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2;
      ctx.shadowColor = '#6366f1'; ctx.shadowBlur = 7;
      ctx.stroke(); ctx.shadowBlur = 0;
      if (prog < 1) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }, [tests, color]);

  return <canvas ref={canvasRef} style={{ width:'100%', height:52, display:'block' }} className="no-transition" />;
}

/* ── KPI Card ────────────────────────────────────── */
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

/* ── Greeting ────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}


/* ── Academic Calendar data (for upcoming events) ───── */
const ACAD_EVENTS = [
  { date:'2026-03-19', label:"Telugu New Year's Day", type:'holiday' },
  { date:'2026-03-25', label:'CAT-2 Ends',            type:'exam'    },
  { date:'2026-04-01', label:'Tamil New Year / Ugadi', type:'holiday' },
  { date:'2026-04-03', label:'Good Friday',            type:'holiday' },
  { date:'2026-04-14', label:'Dr. Ambedkar Jayanti',   type:'holiday' },
  { date:'2026-04-21', label:'Model Exams Begin',      type:'exam'    },
  { date:'2026-04-30', label:'Last Day of Instruction',type:'exam'    },
  { date:'2026-05-01', label:'Labour Day',             type:'holiday' },
  { date:'2026-05-04', label:'End Semester Exams Begin',type:'exam'  },
  { date:'2026-05-25', label:'End Semester Exams End', type:'exam'   },
];

const ACAD_CAL = {
  '2026-03-20':5,'2026-03-23':1,'2026-03-24':2,'2026-03-26':3,'2026-03-27':4,
  '2026-03-28':5,'2026-03-30':1,'2026-03-31':2,
  '2026-04-02':3,'2026-04-04':4,'2026-04-06':5,'2026-04-07':1,'2026-04-08':2,
  '2026-04-09':3,'2026-04-10':4,'2026-04-13':5,
  '2026-04-15':1,'2026-04-16':2,'2026-04-17':3,'2026-04-20':4,'2026-04-22':5,
  '2026-04-23':1,'2026-04-24':2,'2026-04-27':3,'2026-04-28':4,'2026-04-29':5,
  '2026-04-30':1,
};
const HOL_DATES = new Set(['2026-03-18','2026-03-19','2026-04-01','2026-04-03','2026-04-14','2026-05-01']);

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ── Today's Schedule Card ──────────────────────────── */
function TodayScheduleCard({ onTabChange }) {
  const today   = new Date();
  const key     = toKey(today);
  const isHol   = HOL_DATES.has(key);
  const order   = ACAD_CAL[key];
  const wday    = today.getDay();
  const isWknd  = wday === 0 || wday === 6;

  // Mock schedule preview for day order
  const PREVIEW = {
    1: [{t:'8:00–8:50',  n:'Data Structures', type:'Theory'},{t:'9:45–10:40', n:'Transforms & BVP', type:'Theory'},{t:'3:05–5:40', n:'DSA Lab', type:'Lab'}],
    2: [{t:'1:15–2:10',  n:'Object Oriented Prog', type:'Theory'},{t:'2:10–3:05', n:'Object Oriented Prog', type:'Theory'},{t:'3:05–4:00', n:'Digital Electronics', type:'Theory'}],
    3: [{t:'8:00–9:45',  n:'Object Oriented Prog', type:'Theory'},{t:'9:45–10:40', n:'DSA', type:'Theory'},{t:'1:15–3:05', n:'Physics Lab', type:'Lab'}],
    4: [{t:'8:00–11:35', n:'Networks Lab', type:'Lab'},{t:'1:15–2:10', n:'Computer Networks', type:'Theory'},{t:'3:05–4:00', n:'Object Oriented Prog', type:'Theory'}],
    5: [{t:'8:00–9:45',  n:'Transforms & BVP', type:'Theory'},{t:'9:45–10:40', n:'Object Oriented Prog', type:'Theory'},{t:'1:15–3:05', n:'Electronics Lab', type:'Lab'}],
  };
  const periods = order ? PREVIEW[order] || [] : [];

  return (
    <div className="ob-card glass animate-up" style={{animationDelay:'320ms'}}>
      <div className="ob-header">
        <div className="ob-icon ob-icon-accent">
          <Ico d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={15}/>
        </div>
        <div>
          <div className="ob-title">Today's Schedule</div>
          <div className="ob-sub">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][today.getDay()]}, {today.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
        </div>
        {order && <div className="ob-badge ob-badge-accent">Day {order}</div>}
      </div>

      {isHol ? (
        <div className="ob-holiday-msg">🎉 Holiday today — no classes scheduled</div>
      ) : isWknd ? (
        <div className="ob-holiday-msg">😴 Weekend — enjoy your break!</div>
      ) : order ? (
        <div className="ob-periods">
          {periods.map((p,i) => (
            <div key={i} className="ob-period">
              <div className="ob-period-dot" style={{background: p.type==='Lab'?'var(--emerald)':'var(--accent-light)'}}/>
              <div className="ob-period-info">
                <div className="ob-period-name">{p.n}</div>
                <div className="ob-period-time">{p.t}</div>
              </div>
              <div className="ob-period-type" style={{color:p.type==='Lab'?'var(--emerald)':'var(--accent-light)',background:p.type==='Lab'?'var(--emerald-dim)':'var(--accent-dim)'}}>{p.type}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ob-holiday-msg">📋 No schedule data for today</div>
      )}

      <button className="ob-link" onClick={()=>onTabChange('timetable')}>
        Full timetable →
      </button>
    </div>
  );
}

/* ── Upcoming Events Card ───────────────────────────── */
function UpcomingEventsCard() {
  const now = new Date(); now.setHours(0,0,0,0);
  const upcoming = ACAD_EVENTS
    .map(e => ({ ...e, dateObj: new Date(e.date) }))
    .filter(e => e.dateObj >= now)
    .slice(0, 4);

  const TYPE_COLORS = {
    holiday: { color:'#f43f5e', bg:'rgba(244,63,94,0.1)', icon:'🎉' },
    exam:    { color:'#f59e0b', bg:'rgba(245,158,11,0.1)', icon:'📝' },
    special: { color:'#10b981', bg:'rgba(16,185,129,0.1)', icon:'⭐' },
  };

  return (
    <div className="ob-card glass animate-up" style={{animationDelay:'390ms'}}>
      <div className="ob-header">
        <div className="ob-icon ob-icon-amber">
          <Ico d="M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" size={15}/>
        </div>
        <div>
          <div className="ob-title">Upcoming Events</div>
          <div className="ob-sub">Even Semester 2025–26</div>
        </div>
      </div>

      <div className="ob-events">
        {upcoming.map((e,i) => {
          const t   = TYPE_COLORS[e.type] || TYPE_COLORS.special;
          const dl  = Math.ceil((e.dateObj - now) / 86400000);
          const lbl = dl === 0 ? 'Today' : dl === 1 ? 'Tomorrow' : `${dl} days`;
          return (
            <div key={i} className="ob-event" style={{'--ec':t.color,'--eb':t.bg}}>
              <span className="ob-event-icon">{t.icon}</span>
              <div className="ob-event-info">
                <div className="ob-event-label">{e.label}</div>
                <div className="ob-event-date">{e.dateObj.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
              </div>
              <div className="ob-event-days" style={{color:t.color}}>{lbl}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Quick Actions Card ─────────────────────────────── */
function QuickActionsCard({ onTabChange }) {
  const now    = new Date();
  const sem    = 'Even Sem 2025–26';
  const month  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()];
  const week   = Math.ceil(now.getDate() / 7);

  const actions = [
    { label:'Attendance',   icon:'M22 12l-4 4m0 0l-4-4m4 4V8M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', color:'var(--accent-light)', tab:'attendance' },
    { label:'Marks',        icon:'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12', color:'var(--emerald)', tab:'marks' },
    { label:'Timetable',    icon:'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color:'var(--amber)', tab:'timetable' },
    { label:'Courses',      icon:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z', color:'var(--cyan)', tab:'courses' },
  ];

  return (
    <div className="ob-card glass animate-up" style={{animationDelay:'460ms'}}>
      <div className="ob-header">
        <div className="ob-icon ob-icon-emerald">
          <Ico d="M13 10V3L4 14h7v7l9-11h-7z" size={15}/>
        </div>
        <div>
          <div className="ob-title">Quick Access</div>
          <div className="ob-sub">{sem} · {month}, Week {week}</div>
        </div>
      </div>

      <div className="ob-actions">
        {actions.map((a,i) => (
          <button key={i} className="ob-action-btn" onClick={()=>onTabChange(a.tab)}
            style={{'--ac':a.color}}>
            <div className="ob-action-icon">
              <Ico d={a.icon} size={16}/>
            </div>
            <span className="ob-action-label">{a.label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ob-action-arr"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>

      <div className="ob-footer-info">
        <div className="ob-fi-item">
          <div className="ob-fi-dot" style={{background:'var(--emerald)'}}/>
          <span>SRM KTR · Batch 1</span>
        </div>
        <div className="ob-fi-item">
          <div className="ob-fi-dot" style={{background:'var(--accent-light)'}}/>
          <span>CSE · S1 Section</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter();
  const [data, setData]     = useState(null);
  const [tab, setTab]       = useState('overview');

  useEffect(() => {
    if (!requireAuth(router)) return;
    const raw = DataStore.get();
    if (!raw) { router.replace('/login'); return; }
    setData(sanitizeObject(raw));
  }, []);

  // Respect ?tab= query param
  useEffect(() => {
    if (router.query.tab) setTab(router.query.tab);
  }, [router.query.tab]);

  if (!data) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div className="spinner" style={{ width:32, height:32 }} />
      <p style={{ color:'var(--text-3)', fontSize:13 }}>Loading your workspace…</p>
    </div>
  );

  const user        = data?.user        || {};
  const attendance  = data?.attendance?.attendance || [];
  const marks       = data?.marks?.marks           || [];
  const timetable   = data?.timetable              || null;
  const courses     = data?.courses?.courses       || [];

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

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <>
      <Head><title>CampusPro — {user.name || 'Dashboard'}</title></Head>

      <div className="app-shell">
        {/* New premium sidebar */}
        <Sidebar
          activeTab={tab}
          onTabChange={setTab}
          user={user}
          below75={below75}
        />

        {/* Main content */}
        <main className="main-content">

          {/* ── OVERVIEW ──────────────────────────── */}
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

              {/* ── BOTTOM ROW ───────────────────────── */}
              <div className="overview-bottom-row">

                {/* Today's Schedule card */}
                <TodayScheduleCard onTabChange={setTab} />

                {/* Upcoming Events card */}
                <UpcomingEventsCard />

                {/* Quick Actions card */}
                <QuickActionsCard onTabChange={setTab} />
              </div>

            </div>
          )}

          {/* ── ATTENDANCE ────────────────────────── */}
          {tab === 'attendance' && (
            <div className="tab-panel animate-in">
              <div className="page-header">
                <h1 className="page-title">Attendance</h1>
              </div>
              <div className="sum-row">
                {[
                  { v:`${avgAtt}%`, l:'Average', c:'var(--accent-light)' },
                  { v:safeAtt,     l:'Safe ≥ 75%', c:'var(--emerald)' },
                  { v:below75,     l:'Danger < 75%', c:'var(--rose)' },
                  { v:attendance.length, l:'Total', c:'var(--amber)' },
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
                          <div className="progress-fill" style={{ width:`${Math.min(pct,100)}%`, background:clr, animationDelay:`${i*.1}s` }} />
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

          {/* ── MARKS ─────────────────────────────── */}
          {tab === 'marks' && (
            <div className="tab-panel animate-in">
              <div className="page-header" style={{ marginBottom:20 }}>
                <h1 className="page-title">Marks</h1>
                <span className="tag tag-accent">{marks.length} subjects</span>
              </div>
              <MarksSection marks={marks} />
            </div>
          )}

          {/* ── TIMETABLE ─────────────────────────── */}
          {tab === 'timetable' && (
            <div className="tab-panel animate-in">
              <TimetableView timetableData={timetable} />
            </div>
          )}

          {/* ── COURSES ───────────────────────────── */}
          {tab === 'courses' && (
            <div className="tab-panel animate-in">
              <div className="page-header">
                <h1 className="page-title">Courses</h1>
                <span className="tag tag-accent">{courses.length} enrolled</span>
              </div>
              <div className="courses-grid">
                {courses.map((c, i) => (
                  <div key={i} className="cc-card glass animate-up" style={{ animationDelay:`${i * 45}ms` }}>
                    <div className="cc-top">
                      <span className="cc-code">{c.code}</span>
                      <span className={`tag ${c.slotType === 'Theory' ? 'tag-accent' : 'tag-emerald'}`} style={{ fontSize:9.5 }}>
                        {c.slotType || '—'}
                      </span>
                    </div>
                    <div className="cc-title">{c.title}</div>
                    <div className="divider" style={{ margin:'12px 0' }} />
                    <div className="cc-meta">
                      <div className="cc-meta-row">
                        <span>👤</span><span>{c.faculty?.split('(')[0]?.trim() || '—'}</span>
                      </div>
                      <div className="cc-meta-row">
                        <span>🏫</span><span>{c.room} · {c.slot} · ⭐ {c.credit} cr</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        body { background: var(--bg-void); overflow-x: hidden; }
      `}</style>

      <style jsx>{`
        /* Shell */
        .app-shell { display:flex; min-height:100vh; }
        .main-content { flex:1; padding:32px 36px; min-width:0; overflow-y:auto; }

        /* Page header */
        .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
        .page-title { font-family:var(--font-display); font-size:26px; font-weight:800; color:var(--text-1); letter-spacing:-.5px; }
        .page-sub { font-size:13px; color:var(--text-3); margin-top:3px; }

        /* KPI */
        .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }

        /* Alert */
        .alert-banner {
          display:flex; align-items:center; gap:10px;
          background:var(--rose-dim); border:1px solid rgba(244,63,94,.22);
          border-radius:var(--radius-md); padding:12px 16px;
          font-size:13px; color:var(--rose); margin-bottom:20px;
        }
        .alert-banner strong { color:var(--rose); font-weight:700; }
        .alert-action { margin-left:auto; background:none; border:1px solid rgba(244,63,94,.3); color:var(--rose); border-radius:6px; padding:4px 10px; font-size:12px; cursor:pointer; transition:all .15s; }
        .alert-action:hover { background:rgba(244,63,94,.12); }

        /* Section row */
        .section-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .section-label { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-1); }
        .see-all { background:none; border:none; color:var(--accent-light); font-size:12px; cursor:pointer; }
        .see-all:hover { text-decoration:underline; }

        /* Attendance mini grid */
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

        /* Attendance list */
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

        /* Marks */
        .marks-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:14px; }
        .mk-card { border-radius:var(--radius-lg); padding:18px; display:flex; flex-direction:column; gap:10px; transition:transform .22s,box-shadow .22s; }
        .mk-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-md); }
        .mk-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .mk-code { font-family:var(--font-mono); font-size:10px; color:var(--accent-light); margin-bottom:4px; }
        .mk-name { font-size:13px; font-weight:600; color:var(--text-1); line-height:1.35; }
        .mk-score-block { text-align:right; flex-shrink:0; }
        .mk-score { font-family:var(--font-mono); font-size:26px; font-weight:700; line-height:1; }
        .mk-denom { font-size:11px; color:var(--text-3); margin-top:1px; }
        .mk-pct-badge { font-size:11px; font-weight:600; padding:3px 8px; border-radius:5px; margin-top:5px; display:inline-block; }
        .mk-chart-wrap { background:rgba(0,0,0,.15); border-radius:8px; padding:6px 4px 2px; }
        .mk-empty { font-size:12px; color:var(--text-4); text-align:center; padding:18px 0; }

        /* Courses */
        .courses-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(270px,1fr)); gap:12px; }
        .cc-card { border-radius:var(--radius-md); padding:16px; transition:transform .2s; }
        .cc-card:hover { transform:translateY(-2px); }
        .cc-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .cc-code { font-family:var(--font-mono); font-size:11px; color:var(--accent-light); }
        .cc-title { font-size:13px; font-weight:600; color:var(--text-1); line-height:1.4; }
        .cc-meta { display:flex; flex-direction:column; gap:4px; }
        .cc-meta-row { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-3); }

        /* Overview bottom row */
        .overview-bottom-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }

        /* Overview cards shared */
        .ob-card { border-radius:var(--radius-lg); padding:18px; display:flex; flex-direction:column; gap:14px; transition:transform .2s,box-shadow .2s; }
        .ob-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }

        .ob-header { display:flex; align-items:center; gap:10px; }
        .ob-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ob-icon-accent  { background:var(--accent-dim); border:1px solid var(--accent-border); color:var(--accent-light); }
        .ob-icon-amber   { background:var(--amber-dim); border:1px solid rgba(245,158,11,.2); color:var(--amber); }
        .ob-icon-emerald { background:var(--emerald-dim); border:1px solid var(--emerald-border); color:var(--emerald); }
        .ob-title { font-family:var(--font-display); font-size:13.5px; font-weight:700; color:var(--text-1); }
        .ob-sub   { font-size:10.5px; color:var(--text-3); margin-top:1px; font-family:var(--font-mono); }
        .ob-badge { font-size:10px; font-weight:700; padding:3px 9px; border-radius:10px; margin-left:auto; }
        .ob-badge-accent { background:var(--accent-dim); color:var(--accent-light); border:1px solid var(--accent-border); }

        /* Today's schedule */
        .ob-holiday-msg { font-size:13px; color:var(--text-2); text-align:center; padding:16px 0; }
        .ob-periods { display:flex; flex-direction:column; gap:7px; }
        .ob-period { display:flex; align-items:center; gap:10px; padding:8px 10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:9px; }
        .ob-period-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .ob-period-info { flex:1; min-width:0; }
        .ob-period-name { font-size:12px; font-weight:500; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ob-period-time { font-family:var(--font-mono); font-size:10px; color:var(--text-3); margin-top:1px; }
        .ob-period-type { font-size:9.5px; font-weight:700; padding:2px 7px; border-radius:6px; flex-shrink:0; }
        .ob-link { background:none; border:none; color:var(--accent-light); font-size:12px; cursor:pointer; padding:0; text-align:left; transition:color .15s; font-family:var(--font-body); margin-top:auto; }
        .ob-link:hover { color:var(--text-1); }

        /* Upcoming events */
        .ob-events { display:flex; flex-direction:column; gap:7px; }
        .ob-event { display:flex; align-items:center; gap:9px; padding:8px 10px; background:var(--eb,var(--bg-elevated)); border:1px solid rgba(255,255,255,0.06); border-radius:9px; transition:transform .15s; }
        .ob-event:hover { transform:translateX(3px); }
        .ob-event-icon { font-size:14px; flex-shrink:0; }
        .ob-event-info { flex:1; min-width:0; }
        .ob-event-label { font-size:12px; font-weight:500; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ob-event-date  { font-family:var(--font-mono); font-size:10px; color:var(--text-3); margin-top:1px; }
        .ob-event-days  { font-family:var(--font-mono); font-size:11px; font-weight:700; flex-shrink:0; }

        /* Quick actions */
        .ob-actions { display:flex; flex-direction:column; gap:5px; }
        .ob-action-btn {
          display:flex; align-items:center; gap:10px;
          padding:9px 12px; border-radius:9px;
          background:var(--bg-elevated); border:1px solid var(--border);
          cursor:pointer; transition:all .16s; font-family:var(--font-body);
          color:var(--text-2); text-align:left;
        }
        .ob-action-btn:hover { background:var(--bg-hover); border-color:var(--ac); color:var(--text-1); transform:translateX(3px); }
        .ob-action-icon { color:var(--ac); display:flex; align-items:center; flex-shrink:0; }
        .ob-action-label { flex:1; font-size:13px; font-weight:500; }
        .ob-action-arr { color:rgba(255,255,255,0.15); transition:color .15s; }
        .ob-action-btn:hover .ob-action-arr { color:var(--ac); }

        .ob-footer-info { display:flex; gap:14px; padding-top:8px; border-top:1px solid var(--border); margin-top:auto; }
        .ob-fi-item { display:flex; align-items:center; gap:5px; font-size:10.5px; color:var(--text-3); }
        .ob-fi-dot  { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

        /* Tab panel */
        .tab-panel { display:flex; flex-direction:column; gap:20px; }

        /* Animations */
        .animate-in { animation: fadeIn .35s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        /* Responsive */
        @media (max-width: 1100px) { .kpi-grid { grid-template-columns:repeat(2,1fr); } .overview-bottom-row { grid-template-columns:1fr 1fr; } }
        @media (max-width: 860px) {
          .main-content { padding:58px 16px 24px; }
          .kpi-grid { grid-template-columns:repeat(2,1fr); }
          .sum-row { grid-template-columns:repeat(2,1fr); }
          .overview-bottom-row { grid-template-columns:1fr; }
        }
        @media (max-width: 520px) {
          .kpi-grid { grid-template-columns:1fr 1fr; }
          .att-mini-grid { grid-template-columns:1fr; }
          .marks-grid { grid-template-columns:1fr; }
        }
      `}</style>
    </>
  );
}