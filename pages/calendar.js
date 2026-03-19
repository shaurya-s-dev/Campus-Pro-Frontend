import { useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';

/* ══════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════ */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_SHORT   = ['S','M','T','W','T','F','S'];

const ET = {
  holiday: { label:'Holiday',    color:'#f43f5e', bg:'rgba(244,63,94,0.12)',  border:'rgba(244,63,94,0.3)',  icon:'🎉' },
  exam:    { label:'Exam / Test',color:'#f59e0b', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.3)', icon:'📝' },
  special: { label:'Special',    color:'#10b981', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)', icon:'⭐' },
};

/* ══════════════════════════════════════════════════
   ACADEMIC CALENDAR DATA — SRM KTR Even Sem 2025-26
   Holidays removed from dayOrders, Telugu NY fixed
   ══════════════════════════════════════════════════ */
const CALENDAR_DATA = {
  'January 2026': {
    events: [
      { date:1,  type:'holiday', label:"New Year's Day" },
      { date:14, type:'holiday', label:'Pongal' },
      { date:15, type:'holiday', label:'Thiruvalluvar Day' },
      { date:16, type:'holiday', label:'Uzhavar Thirunal' },
      { date:26, type:'holiday', label:'Republic Day' },
    ],
    // No day orders on holidays: 1,14,15,16,26 excluded
    dayOrders: {2:'D1',3:'D2',5:'D3',6:'D4',7:'D5',8:'D1',9:'D2',10:'D3',12:'D4',13:'D5',17:'D1',18:'D2',19:'D3',20:'D4',21:'D5',22:'D1',23:'D2',24:'D3',27:'D4',28:'D5',29:'D1',30:'D2',31:'D3'},
  },
  'February 2026': {
    events: [
      { date:2,  type:'exam',    label:'CAT-1 Begins' },
      { date:14, type:'special', label:"Valentine's / Techno Day" },
      { date:19, type:'special', label:"SRM Founders' Day" },
      { date:26, type:'exam',    label:'CAT-2 Prep Week' },
    ],
    dayOrders: {2:'D4',3:'D5',4:'D1',5:'D2',6:'D3',7:'D4',9:'D5',10:'D1',11:'D2',12:'D3',13:'D4',16:'D5',17:'D1',18:'D2',20:'D3',21:'D4',23:'D5',24:'D1',25:'D2',26:'D3',27:'D4',28:'D5'},
  },
  'March 2026': {
    events: [
      { date:2,  type:'exam',    label:'CAT-2 Begins' },
      { date:18, type:'holiday', label:'Holi' },
      { date:19, type:'holiday', label:"Telugu New Year's Day" }, // ← FIXED
      { date:25, type:'exam',    label:'CAT-2 Ends' },
    ],
    // 18 & 19 are holidays — removed from dayOrders
    dayOrders: {2:'D1',3:'D2',4:'D3',5:'D4',6:'D5',7:'D1',9:'D2',10:'D3',11:'D4',12:'D5',13:'D1',16:'D2',17:'D3',20:'D5',23:'D1',24:'D2',26:'D3',27:'D4',28:'D5',30:'D1',31:'D2'},
  },
  'April 2026': {
    events: [
      { date:1,  type:'holiday', label:'Tamil New Year / Ugadi' },
      { date:3,  type:'holiday', label:'Good Friday' },
      { date:14, type:'holiday', label:'Dr. Ambedkar Jayanti' },
      { date:21, type:'exam',    label:'Model Exams Begin' },
      { date:30, type:'exam',    label:'Last Day of Instruction' },
    ],
    // 1,3,14 are holidays — removed from dayOrders
    dayOrders: {2:'D3',4:'D4',6:'D5',7:'D1',8:'D2',9:'D3',10:'D4',13:'D5',15:'D1',16:'D2',17:'D3',20:'D4',22:'D5',23:'D1',24:'D2',27:'D3',28:'D4',29:'D5',30:'D1'},
  },
  'May 2026': {
    events: [
      { date:1,  type:'holiday', label:'Labour Day' },
      { date:4,  type:'exam',    label:'End Semester Exams Begin' },
      { date:25, type:'exam',    label:'End Semester Exams End' },
    ],
    dayOrders: {},
  },
};

const MONTHS = Object.keys(CALENDAR_DATA);

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */
function parseMonthStr(str) {
  const [m, y] = str.split(' ');
  return new Date(parseInt(y), MONTH_NAMES.indexOf(m), 1);
}
function daysInMonth(d)   { return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }
function firstWeekday(d)  { return new Date(d.getFullYear(), d.getMonth(), 1).getDay(); }
function getCurrentMonthStr() {
  const n = new Date();
  return `${MONTH_NAMES[n.getMonth()]} ${n.getFullYear()}`;
}

/* ══════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════ */
export default function CalendarPage() {
  const today        = new Date();
  const todayStr     = getCurrentMonthStr();
  const resolveInit  = () => CALENDAR_DATA[todayStr] ? todayStr : MONTHS.find(m => parseMonthStr(m) >= parseMonthStr(todayStr)) || MONTHS[MONTHS.length-1];

  const [activeMonth, setActiveMonth] = useState(resolveInit);
  const [selectedDay, setSelectedDay] = useState(() => CALENDAR_DATA[todayStr] ? today.getDate() : null);
  const [view,        setView]        = useState('month');
  const [animDir,     setAnimDir]     = useState(0);
  const [animating,   setAnimating]   = useState(false);

  const monthDate  = parseMonthStr(activeMonth);
  const totalDays  = daysInMonth(monthDate);
  const startDay   = firstWeekday(monthDate);
  const monthData  = CALENDAR_DATA[activeMonth] || {};
  const activeIdx  = MONTHS.indexOf(activeMonth);
  const isCurrent  = activeMonth === todayStr;
  const progress   = isCurrent ? Math.round((today.getDate() / totalDays) * 100) : 0;

  const workDays   = Object.keys(monthData.dayOrders || {}).length;
  const holDays    = (monthData.events||[]).filter(e=>e.type==='holiday').length;
  const examDays   = (monthData.events||[]).filter(e=>e.type==='exam').length;

  const navigate = useCallback((dir) => {
    const ni = activeIdx + dir;
    if (ni < 0 || ni >= MONTHS.length) return;
    setAnimDir(dir); setAnimating(true);
    setTimeout(() => { setActiveMonth(MONTHS[ni]); setSelectedDay(null); setAnimating(false); }, 180);
  }, [activeIdx]);

  const isToday = (d) => isCurrent && d === today.getDate();
  const isPast  = (d) => {
    const c = new Date(monthDate.getFullYear(), monthDate.getMonth(), d); c.setHours(23,59,59);
    return c < today;
  };

  // Selected day info
  const selEvents = selectedDay ? (monthData.events||[]).filter(e=>e.date===selectedDay) : [];
  const selOrder  = selectedDay ? monthData.dayOrders?.[selectedDay] : null;
  const selIsHol  = selEvents.some(e=>e.type==='holiday');

  // Upcoming events
  const now = new Date(); now.setHours(0,0,0,0);
  const allUpcoming = [];
  MONTHS.forEach(m => {
    (CALENDAR_DATA[m]?.events||[]).forEach(e => {
      const d = parseMonthStr(m); d.setDate(e.date);
      if (d >= now) allUpcoming.push({...e, month:m, dateObj:d});
    });
  });
  allUpcoming.sort((a,b)=>a.dateObj-b.dateObj);
  const upcoming = allUpcoming.slice(0,6);

  return (
    <>
      <Head><title>Academic Calendar — CampusPro</title></Head>
      <div className="root">
        <div className="orb orb1"/><div className="orb orb2"/>

        {/* ── TOP BAR ─────────────────────────── */}
        <div className="topbar">
          <Link href="/dashboard" className="back-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <div className="brand">
            <span className="brand-hex">⬡</span>
            <span className="brand-name">Campus<strong>Pro</strong></span>
          </div>
          <div className="sem-chip">Even Sem 2025–26 · SRM KTR</div>
        </div>

        <div className="layout">
          {/* ══ LEFT SIDEBAR ══════════════════════ */}
          <aside className="sidebar glass">

            {/* Legend */}
            <div className="side-section">
              <div className="side-label">Legend</div>
              {Object.entries(ET).map(([k,t]) => (
                <div key={k} className="leg-row">
                  <div className="leg-dot" style={{background:t.color}}/>
                  <span className="leg-text">{t.label}</span>
                </div>
              ))}
              <div className="leg-row">
                <div className="leg-dot" style={{background:'#818cf8'}}/>
                <span className="leg-text">Day Order</span>
              </div>
              <div className="leg-row">
                <div className="leg-today-dot"/>
                <span className="leg-text" style={{color:'#818cf8'}}>Today</span>
              </div>
            </div>

            {/* Month stats */}
            <div className="side-section">
              <div className="side-label">{activeMonth}</div>
              <div className="ms-grid">
                <div className="ms-item">
                  <div className="ms-val" style={{color:'#818cf8'}}>{workDays}</div>
                  <div className="ms-lbl">Working</div>
                </div>
                <div className="ms-item">
                  <div className="ms-val" style={{color:'#f43f5e'}}>{holDays}</div>
                  <div className="ms-lbl">Holidays</div>
                </div>
                <div className="ms-item">
                  <div className="ms-val" style={{color:'#f59e0b'}}>{examDays}</div>
                  <div className="ms-lbl">Events</div>
                </div>
              </div>
              {isCurrent && (
                <div className="progress-wrap">
                  <div className="progress-track">
                    <div className="progress-fill" style={{width:`${progress}%`}}/>
                  </div>
                  <div className="progress-lbl">{progress}% through {activeMonth.split(' ')[0]}</div>
                </div>
              )}
            </div>

            {/* Selected day detail */}
            {selectedDay && (
              <div className="side-section day-detail">
                <div className="dd-top">
                  <div className="dd-num">{selectedDay}</div>
                  <div className="dd-month">{activeMonth.split(' ')[0]}</div>
                  {selOrder && <div className="dd-order">{selOrder}</div>}
                  <button className="dd-close" onClick={()=>setSelectedDay(null)}>✕</button>
                </div>
                {selIsHol ? (
                  <div className="dd-holiday-msg">🎉 Holiday — No Classes</div>
                ) : selOrder ? (
                  <div className="dd-class-msg">📚 Class Day · {selOrder}</div>
                ) : (
                  <div className="dd-noclass">Weekend / No Data</div>
                )}
                {selEvents.map((e,i) => {
                  const t = ET[e.type]||ET.special;
                  return (
                    <div key={i} className="dd-event" style={{background:t.bg,border:`1px solid ${t.border}`}}>
                      <span>{t.icon}</span>
                      <div>
                        <div className="dd-ev-label" style={{color:t.color}}>{e.label}</div>
                        <div className="dd-ev-type">{t.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upcoming events */}
            <div className="side-section" style={{flex:1}}>
              <div className="side-label">Upcoming</div>
              <div className="upcoming-list">
                {upcoming.map((e,i) => {
                  const t = ET[e.type]||ET.special;
                  const dl = Math.ceil((e.dateObj - now) / 86400000);
                  return (
                    <div key={i} className="up-item" style={{borderLeft:`3px solid ${t.color}`}}>
                      <div className="up-left">
                        <div className="up-icon">{t.icon}</div>
                        <div>
                          <div className="up-label">{e.label}</div>
                          <div className="up-date">{e.month.split(' ')[0]} {e.date}</div>
                        </div>
                      </div>
                      <div className="up-days" style={{color:t.color}}>
                        {dl===0?'Today':dl===1?'Tmrw':`${dl}d`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ══ MAIN CALENDAR ══════════════════════ */}
          <main className="cal-main">
            {/* Header */}
            <div className="cal-header">
              <div className="cal-nav">
                <button className="nav-btn" onClick={()=>navigate(-1)} disabled={activeIdx===0}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="month-block">
                  <h1 className="month-title">{activeMonth.split(' ')[0]}</h1>
                  <span className="year-badge">{activeMonth.split(' ')[1]}</span>
                </div>
                <button className="nav-btn" onClick={()=>navigate(1)} disabled={activeIdx===MONTHS.length-1}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>

              <div className="cal-header-right">
                <div className="view-toggle">
                  <button className={`vt ${view==='month'?'vt-on':''}`} onClick={()=>setView('month')}>Month</button>
                  <button className={`vt ${view==='list'?'vt-on':''}`} onClick={()=>setView('list')}>List</button>
                </div>
                {!isCurrent && (
                  <button className="today-btn" onClick={()=>{setActiveMonth(todayStr);setSelectedDay(today.getDate());}}>Today</button>
                )}
              </div>
            </div>

            {/* Month tabs */}
            <div className="month-tabs">
              {MONTHS.map((m,i) => {
                const isAct = m===activeMonth;
                const isCur = m===todayStr;
                return (
                  <button key={m} className={`mt ${isAct?'mt-on':''} ${isCur?'mt-today':''}`}
                    onClick={()=>navigate(i-activeIdx)}>
                    {m.split(' ')[0].slice(0,3)}
                    {isCur && <span className="mt-dot"/>}
                  </button>
                );
              })}
            </div>

            {/* Month view */}
            {view==='month' && (
              <div className={`cal-body ${animating?(animDir>0?'sl':'sr'):''}`}>
                {/* DOW headers */}
                <div className="dow-row">
                  {DAY_LABELS.map((d,i) => (
                    <div key={d} className={`dow-cell ${i===0||i===6?'dow-wknd':''}`}>{d}</div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="day-grid">
                  {Array(startDay).fill(null).map((_,i)=>(
                    <div key={`e${i}`} className="day-empty"/>
                  ))}
                  {Array(totalDays).fill(null).map((_,i)=>{
                    const d       = i+1;
                    const events  = (monthData.events||[]).filter(e=>e.date===d);
                    const order   = monthData.dayOrders?.[d];
                    const wday    = new Date(monthDate.getFullYear(),monthDate.getMonth(),d).getDay();
                    const isWknd  = wday===0||wday===6;
                    const isHol   = events.some(e=>e.type==='holiday');
                    const isExam  = events.some(e=>e.type==='exam');
                    const isSpec  = events.some(e=>e.type==='special');
                    const todayD  = isToday(d);
                    const sel     = selectedDay===d;
                    const past    = isPast(d) && !todayD;

                    return (
                      <div key={d}
                        className={['day-cell',
                          todayD?'dc-today':'',
                          sel?'dc-sel':'',
                          isWknd?'dc-wknd':'',
                          isHol?'dc-hol':'',
                          isExam?'dc-exam':'',
                          past?'dc-past':'',
                        ].filter(Boolean).join(' ')}
                        style={{animationDelay:`${i*6}ms`}}
                        onClick={()=>setSelectedDay(sel?null:d)}
                      >
                        {/* Day number */}
                        <div className="dn-row">
                          {todayD ? (
                            <div className="today-circle">{d}</div>
                          ) : (
                            <span className={`dn ${isHol?'dn-hol':''} ${isWknd?'dn-wknd':''}`}>{d}</span>
                          )}
                          {order && !isHol && (
                            <span className="do-badge" style={{color:isExam?'#f59e0b':'#818cf8',background:isExam?'rgba(245,158,11,0.1)':'rgba(129,140,248,0.1)'}}>{order}</span>
                          )}
                        </div>

                        {/* Event pills */}
                        <div className="ev-stack">
                          {isHol && (
                            <div className="ev-pill ev-hol">
                              <span className="ev-dot" style={{background:'#f43f5e'}}/>
                              <span className="ev-txt">{events.find(e=>e.type==='holiday')?.label}</span>
                            </div>
                          )}
                          {isExam && !isHol && (
                            <div className="ev-pill ev-exam">
                              <span className="ev-dot" style={{background:'#f59e0b'}}/>
                              <span className="ev-txt">{events.find(e=>e.type==='exam')?.label}</span>
                            </div>
                          )}
                          {isSpec && !isHol && (
                            <div className="ev-pill ev-spec">
                              <span className="ev-dot" style={{background:'#10b981'}}/>
                              <span className="ev-txt">{events.find(e=>e.type==='special')?.label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List view */}
            {view==='list' && (
              <div className="list-view">
                {MONTHS.map(m => {
                  const md = CALENDAR_DATA[m]||{};
                  const evts = md.events||[];
                  if (!evts.length) return null;
                  const isCur = m===todayStr;
                  return (
                    <div key={m} className="lv-month">
                      <div className="lv-month-label">
                        {m}
                        {isCur && <span className="lv-cur-chip">Current</span>}
                      </div>
                      {evts.map((e,i) => {
                        const t = ET[e.type]||ET.special;
                        const wday = new Date(parseMonthStr(m).getFullYear(), parseMonthStr(m).getMonth(), e.date).getDay();
                        const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wday];
                        return (
                          <div key={i} className="lv-row" style={{'--lc':t.color,'--lbg':t.bg,'--lbd':t.border}}>
                            <div className="lv-date-block">
                              <div className="lv-day-num" style={{color:t.color}}>{e.date}</div>
                              <div className="lv-day-name">{dayName}</div>
                            </div>
                            <div className="lv-icon">{t.icon}</div>
                            <div className="lv-info">
                              <div className="lv-label">{e.label}</div>
                              <div className="lv-type">{t.label} · {m.split(' ')[0]}</div>
                            </div>
                            <div className="lv-chip" style={{color:t.color,background:t.bg,border:`1px solid ${t.border}`}}>{t.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <style jsx global>{`
        body { background: var(--bg-void); overflow-x: hidden; }
        @keyframes sl { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
        @keyframes sr { from{opacity:0;transform:translateX(14px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes dcIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes drift { from{transform:translate(0,0)} to{transform:translate(20px,14px)} }
      `}</style>

      <style jsx>{`
        .root { min-height:100vh; position:relative; }
        .orb { position:fixed; border-radius:50%; filter:blur(110px); pointer-events:none; z-index:0; }
        .orb1 { width:500px; height:500px; background:radial-gradient(circle,rgba(99,102,241,0.07),transparent 70%); top:-150px; left:-100px; animation:drift 14s ease-in-out infinite alternate; }
        .orb2 { width:380px; height:380px; background:radial-gradient(circle,rgba(6,182,212,0.05),transparent 70%); bottom:-80px; right:-60px; animation:drift 18s ease-in-out infinite alternate-reverse; }

        /* TOP BAR */
        .topbar { display:flex; align-items:center; gap:14px; padding:18px 24px 0; position:relative; z-index:2; }
        .back-btn { display:flex; align-items:center; gap:6px; color:var(--text-3); font-size:13px; padding:6px 12px 6px 8px; border-radius:8px; transition:all .15s; text-decoration:none; }
        .back-btn:hover { background:var(--bg-hover); color:var(--text-1); }
        .brand { display:flex; align-items:center; gap:7px; font-family:var(--font-display); font-size:16px; font-weight:800; }
        .brand-hex { font-size:20px; color:var(--accent); filter:drop-shadow(0 0 8px var(--accent-glow)); }
        .brand-name { color:var(--text-1); } .brand-name strong { color:var(--accent); }
        .sem-chip { margin-left:auto; font-size:11px; color:var(--text-3); background:var(--bg-elevated); border:1px solid var(--border); padding:5px 12px; border-radius:20px; }

        /* LAYOUT */
        .layout { display:grid; grid-template-columns:260px 1fr; gap:0; padding:18px 24px 40px; position:relative; z-index:1; }

        /* SIDEBAR */
        .sidebar { border-radius:var(--radius-xl); padding:18px; display:flex; flex-direction:column; gap:0; margin-right:16px; position:sticky; top:20px; height:calc(100vh - 100px); overflow-y:auto; }
        .sidebar::-webkit-scrollbar { width:0; }
        .side-section { padding:14px 0; border-bottom:1px solid var(--border); }
        .side-section:last-child { border-bottom:none; }
        .side-label { font-size:9px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-4); margin-bottom:10px; }

        /* Legend */
        .leg-row { display:flex; align-items:center; gap:9px; margin-bottom:7px; }
        .leg-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .leg-today-dot { width:16px; height:16px; border-radius:50%; background:var(--accent); box-shadow:0 0 6px var(--accent-glow); flex-shrink:0; }
        .leg-text { font-size:12px; color:var(--text-2); }

        /* Month stats */
        .ms-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
        .ms-item { text-align:center; background:var(--bg-elevated); border:1px solid var(--border); border-radius:10px; padding:8px 4px; }
        .ms-val { font-family:var(--font-mono); font-size:20px; font-weight:700; }
        .ms-lbl { font-size:8.5px; color:var(--text-4); text-transform:uppercase; letter-spacing:.4px; margin-top:2px; }
        .progress-wrap { }
        .progress-track { height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
        .progress-fill { height:100%; background:linear-gradient(90deg,var(--accent),#06b6d4); border-radius:2px; transition:width .6s ease; }
        .progress-lbl { font-size:10px; color:var(--text-4); margin-top:5px; font-family:var(--font-mono); }

        /* Day detail */
        .day-detail { background:var(--accent-dim); border-radius:12px; padding:12px; margin:0 -4px; }
        .dd-top { display:flex; align-items:baseline; gap:6px; margin-bottom:8px; }
        .dd-num { font-family:var(--font-display); font-size:28px; font-weight:800; color:var(--accent-light); line-height:1; }
        .dd-month { font-size:13px; color:var(--text-2); flex:1; }
        .dd-order { font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--accent-light); background:rgba(99,102,241,.15); padding:2px 8px; border-radius:6px; }
        .dd-close { background:none; border:none; color:var(--text-4); cursor:pointer; font-size:12px; padding:2px 4px; }
        .dd-holiday-msg { font-size:12px; color:#f43f5e; background:rgba(244,63,94,.1); border:1px solid rgba(244,63,94,.2); border-radius:8px; padding:7px 10px; margin-bottom:8px; }
        .dd-class-msg   { font-size:12px; color:var(--emerald); background:var(--emerald-dim); border:1px solid var(--emerald-border); border-radius:8px; padding:7px 10px; margin-bottom:8px; }
        .dd-noclass { font-size:12px; color:var(--text-3); font-style:italic; }
        .dd-event { display:flex; align-items:center; gap:8px; border-radius:8px; padding:8px 10px; margin-top:6px; }
        .dd-ev-label { font-size:12px; font-weight:600; }
        .dd-ev-type  { font-size:10px; color:var(--text-3); margin-top:1px; text-transform:uppercase; letter-spacing:.4px; }

        /* Upcoming */
        .upcoming-list { display:flex; flex-direction:column; gap:6px; }
        .up-item { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:10px; }
        .up-left { display:flex; align-items:center; gap:8px; }
        .up-icon { font-size:14px; }
        .up-label { font-size:11.5px; font-weight:500; color:var(--text-1); }
        .up-date  { font-size:10px; color:var(--text-3); font-family:var(--font-mono); margin-top:1px; }
        .up-days  { font-family:var(--font-mono); font-size:11px; font-weight:700; flex-shrink:0; }

        /* CALENDAR MAIN */
        .cal-main { display:flex; flex-direction:column; gap:14px; }

        /* Header */
        .cal-header { display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .cal-nav { display:flex; align-items:center; gap:14px; }
        .nav-btn { width:34px; height:34px; border-radius:10px; background:var(--bg-elevated); border:1px solid var(--border); color:var(--text-2); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
        .nav-btn:hover:not(:disabled) { background:var(--bg-hover); border-color:var(--border-strong); color:var(--text-1); transform:scale(1.05); }
        .nav-btn:disabled { opacity:.3; cursor:not-allowed; }
        .month-block { display:flex; align-items:baseline; gap:10px; }
        .month-title { font-family:var(--font-display); font-size:30px; font-weight:800; color:var(--text-1); letter-spacing:-.6px; }
        .year-badge  { font-family:var(--font-mono); font-size:14px; color:var(--text-3); }
        .cal-header-right { display:flex; align-items:center; gap:8px; }
        .view-toggle { display:flex; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .vt { padding:6px 14px; background:none; border:none; color:var(--text-3); font-size:12px; cursor:pointer; transition:all .15s; font-family:var(--font-body); }
        .vt:hover { background:var(--bg-hover); color:var(--text-1); }
        .vt-on { background:var(--accent-dim)!important; color:var(--accent-light)!important; font-weight:600; }
        .today-btn { padding:6px 14px; border-radius:10px; background:var(--accent-dim); border:1px solid var(--accent-border); color:var(--accent-light); font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; font-family:var(--font-body); }
        .today-btn:hover { background:rgba(99,102,241,.18); }

        /* Month tabs */
        .month-tabs { display:flex; gap:6px; }
        .mt { position:relative; padding:6px 14px; border-radius:9px; background:var(--bg-elevated); border:1px solid var(--border); color:var(--text-3); font-size:12px; font-weight:600; cursor:pointer; transition:all .18s; font-family:var(--font-body); }
        .mt:hover { background:var(--bg-hover); color:var(--text-1); }
        .mt-on { background:var(--accent-dim)!important; border-color:var(--accent)!important; color:var(--accent-light)!important; box-shadow:0 4px 12px var(--accent-glow); }
        .mt-today { border-color:var(--accent-border)!important; }
        .mt-dot { position:absolute; top:3px; right:3px; width:5px; height:5px; border-radius:50%; background:var(--accent); box-shadow:0 0 4px var(--accent-glow); }

        /* DOW row */
        .dow-row { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; margin-bottom:4px; }
        .dow-cell { text-align:center; font-size:10px; font-weight:700; letter-spacing:.7px; text-transform:uppercase; color:var(--text-3); padding:6px 0; }
        .dow-wknd { color:rgba(244,63,94,.5); }

        /* Day grid */
        .cal-body { }
        .sl { animation:sl .22s ease both; }
        .sr { animation:sr .22s ease both; }

        .day-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
        .day-empty { min-height:86px; }
        .day-cell {
          min-height:86px; border-radius:10px; padding:7px 6px 5px; cursor:pointer;
          background:rgba(255,255,255,.016); border:1px solid transparent;
          display:flex; flex-direction:column; gap:3px;
          transition:background .14s, border-color .14s, transform .16s;
          animation:dcIn .35s ease both;
        }
        .day-cell:hover { background:var(--bg-elevated); border-color:var(--border); transform:scale(1.03); z-index:2; }
        .dc-past   { opacity:.38; }
        .dc-wknd   { opacity:.55; }
        .dc-hol    { background:rgba(244,63,94,.06)!important; border-color:rgba(244,63,94,.15)!important; }
        .dc-exam   { background:rgba(245,158,11,.05); }
        .dc-today  { background:rgba(99,102,241,.1)!important; border-color:var(--accent)!important; box-shadow:0 0 0 1px var(--accent-border),0 4px 14px var(--accent-glow); }
        .dc-sel    { background:rgba(99,102,241,.16)!important; border-color:var(--accent)!important; transform:scale(1.04); z-index:2; }

        /* Day number */
        .dn-row { display:flex; align-items:center; justify-content:space-between; }
        .dn { font-family:var(--font-mono); font-size:12.5px; font-weight:600; color:var(--text-2); }
        .dn-hol  { color:#f43f5e; }
        .dn-wknd { color:rgba(244,63,94,.6); }
        .today-circle { width:24px; height:24px; border-radius:50%; background:var(--accent); color:#fff; font-family:var(--font-mono); font-size:11.5px; font-weight:700; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px var(--accent-glow); animation:pulse 2.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 10px var(--accent-glow)} 50%{box-shadow:0 0 18px var(--accent-glow)} }
        .do-badge { font-family:var(--font-mono); font-size:8.5px; font-weight:700; padding:1px 5px; border-radius:4px; }

        /* Event pills */
        .ev-stack { display:flex; flex-direction:column; gap:2px; margin-top:auto; }
        .ev-pill { display:flex; align-items:center; gap:3px; border-radius:4px; padding:2px 4px; }
        .ev-hol  { background:rgba(244,63,94,.12); }
        .ev-exam { background:rgba(245,158,11,.1); }
        .ev-spec { background:rgba(16,185,129,.1); }
        .ev-dot  { width:4px; height:4px; border-radius:50%; flex-shrink:0; }
        .ev-txt  { font-size:8px; font-weight:600; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* LIST VIEW */
        .list-view { display:flex; flex-direction:column; gap:22px; }
        .lv-month { }
        .lv-month-label { display:flex; align-items:center; gap:10px; font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-1); padding-bottom:10px; border-bottom:1px solid var(--border); margin-bottom:10px; }
        .lv-cur-chip { font-size:9.5px; font-weight:700; background:var(--accent-dim); color:var(--accent-light); border:1px solid var(--accent-border); padding:2px 8px; border-radius:10px; }
        .lv-row { display:flex; align-items:center; gap:14px; padding:12px 14px; background:var(--lbg,var(--bg-elevated)); border:1px solid var(--lbd,var(--border)); border-radius:12px; margin-bottom:7px; transition:transform .15s; }
        .lv-row:hover { transform:translateX(4px); }
        .lv-date-block { text-align:center; flex-shrink:0; min-width:36px; }
        .lv-day-num  { font-family:var(--font-mono); font-size:22px; font-weight:700; line-height:1; }
        .lv-day-name { font-size:9px; color:var(--text-3); text-transform:uppercase; letter-spacing:.5px; margin-top:1px; }
        .lv-icon  { font-size:18px; flex-shrink:0; }
        .lv-info  { flex:1; }
        .lv-label { font-size:13.5px; font-weight:600; color:var(--text-1); }
        .lv-type  { font-size:10.5px; color:var(--text-3); margin-top:2px; }
        .lv-chip  { font-size:10px; font-weight:600; padding:3px 9px; border-radius:10px; flex-shrink:0; }

        /* RESPONSIVE */
        @media (max-width:900px) {
          .layout { grid-template-columns:1fr; }
          .sidebar { position:static; height:auto; margin-right:0; margin-bottom:16px; flex-direction:row; flex-wrap:wrap; }
          .side-section { flex:1; min-width:180px; }
        }
        @media (max-width:600px) {
          .layout { padding:12px; }
          .day-cell { min-height:52px; padding:4px 3px; }
          .ev-txt { display:none; }
          .month-title { font-size:22px; }
          .month-tabs { flex-wrap:wrap; }
        }
      `}</style>
    </>
  );
}