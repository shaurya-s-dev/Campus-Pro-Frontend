import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';

/* ══════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════ */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENT_TYPES = {
  holiday: { label:'Holiday',   color:'#f43f5e', glow:'rgba(244,63,94,0.25)',  bg:'rgba(244,63,94,0.1)',  border:'rgba(244,63,94,0.25)',  icon:'🏖' },
  exam:    { label:'Exam/Test', color:'#f59e0b', glow:'rgba(245,158,11,0.25)', bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', icon:'📝' },
  special: { label:'Special',   color:'#10b981', glow:'rgba(16,185,129,0.25)', bg:'rgba(16,185,129,0.1)', border:'rgba(16,185,129,0.25)', icon:'⭐' },
};

/* SRM KTR Academic Calendar — Even Semester 2025–26 */
const CALENDAR_DATA = {
  'January 2026': {
    events: [
      { date:1,  type:'holiday', label:"New Year's Day" },
      { date:14, type:'holiday', label:'Pongal' },
      { date:15, type:'holiday', label:'Thiruvalluvar Day' },
      { date:16, type:'holiday', label:'Uzhavar Thirunal' },
      { date:26, type:'holiday', label:'Republic Day' },
    ],
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
      { date:25, type:'exam',    label:'CAT-2 Ends' },
    ],
    dayOrders: {2:'D1',3:'D2',4:'D3',5:'D4',6:'D5',7:'D1',9:'D2',10:'D3',11:'D4',12:'D5',13:'D1',16:'D2',17:'D3',19:'D4',20:'D5',23:'D1',24:'D2',26:'D3',27:'D4',28:'D5',30:'D1',31:'D2'},
  },
  'April 2026': {
    events: [
      { date:1,  type:'holiday', label:'Tamil New Year / Ugadi' },
      { date:3,  type:'holiday', label:'Good Friday' },
      { date:14, type:'holiday', label:'Dr. Ambedkar Jayanti' },
      { date:21, type:'exam',    label:'Model Exams Begin' },
      { date:30, type:'exam',    label:'Last Day of Instruction' },
    ],
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
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function firstWeekday(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1).getDay();
}

// THE FIX — resolve current month string correctly
function getCurrentMonthStr() {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

/* ══════════════════════════════════════════════════
   UPCOMING STRIP
   ══════════════════════════════════════════════════ */
function UpcomingStrip() {
  const now = new Date(); now.setHours(0,0,0,0);
  const all = [];
  MONTHS.forEach(m => {
    (CALENDAR_DATA[m]?.events || []).forEach(e => {
      const d = parseMonthStr(m);
      d.setDate(e.date);
      if (d >= now) all.push({ ...e, month:m, date_obj:d });
    });
  });
  all.sort((a,b) => a.date_obj - b.date_obj);
  const upcoming = all.slice(0, 5);

  return (
    <div className="upcoming-strip">
      {upcoming.map((e, i) => {
        const t = EVENT_TYPES[e.type] || EVENT_TYPES.special;
        const daysLeft = Math.ceil((e.date_obj - now) / 86400000);
        return (
          <div key={i} className="up-item" style={{ '--uc': t.color, '--ubg': t.bg, '--ubdr': t.border }}>
            <span className="up-icon">{t.icon}</span>
            <div className="up-info">
              <div className="up-label">{e.label}</div>
              <div className="up-date">{e.month.split(' ')[0]} {e.date}</div>
            </div>
            <div className="up-days" style={{ color: t.color }}>
              {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DAY DETAIL PANEL (shown below grid on click)
   ══════════════════════════════════════════════════ */
function DayDetailPanel({ day, monthData, monthLabel, onClose }) {
  if (!day) return null;
  const events = (monthData?.events || []).filter(e => e.date === day);
  const order  = monthData?.dayOrders?.[day];
  return (
    <div className="detail-panel animate-up">
      <div className="dp-header">
        <div className="dp-date-block">
          <div className="dp-day-num">{day}</div>
          <div className="dp-month-name">{monthLabel}</div>
        </div>
        {order && (
          <div className="dp-order-badge">{order}</div>
        )}
        <button className="dp-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      {events.length > 0 ? (
        <div className="dp-events">
          {events.map((e, i) => {
            const t = EVENT_TYPES[e.type] || EVENT_TYPES.special;
            return (
              <div key={i} className="dp-event" style={{ '--ec': t.color, '--ebg': t.bg, '--ebdr': t.border }}>
                <span className="dp-event-icon">{t.icon}</span>
                <div>
                  <div className="dp-event-label">{e.label}</div>
                  <div className="dp-event-type">{t.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dp-no-event">
          {order ? `Regular class day` : 'No events scheduled'}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════ */
export default function CalendarPage() {
  const todayObj = new Date();
  const todayMonthStr = getCurrentMonthStr();

  // THE FIX: start on current month if it exists in data, else closest
  const resolveInitial = () => {
    if (CALENDAR_DATA[todayMonthStr]) return todayMonthStr;
    // find closest future month
    return MONTHS.find(m => parseMonthStr(m) >= parseMonthStr(todayMonthStr)) || MONTHS[MONTHS.length - 1];
  };

  const [activeMonth, setActiveMonth] = useState(resolveInitial);
  const [selectedDay, setSelectedDay] = useState(
    // Auto-select today if we're on today's month
    () => CALENDAR_DATA[todayMonthStr] ? todayObj.getDate() : null
  );
  const [animDir, setAnimDir]   = useState(0); // -1 prev, 1 next
  const [animating, setAnimating] = useState(false);
  const [view, setView]         = useState('month');

  const monthDate = parseMonthStr(activeMonth);
  const totalDays = daysInMonth(monthDate);
  const startDay  = firstWeekday(monthDate);
  const monthData = CALENDAR_DATA[activeMonth] || {};
  const activeIdx = MONTHS.indexOf(activeMonth);

  // Month stats
  const workingDays = Object.keys(monthData.dayOrders || {}).length;
  const holidayCount = (monthData.events || []).filter(e => e.type === 'holiday').length;
  const examCount    = (monthData.events || []).filter(e => e.type === 'exam').length;

  // Month progress (how many days have passed)
  const isCurrentMonth = activeMonth === todayMonthStr;
  const progress = isCurrentMonth ? Math.round((todayObj.getDate() / totalDays) * 100) : 0;

  const navigate = useCallback((dir) => {
    const newIdx = activeIdx + dir;
    if (newIdx < 0 || newIdx >= MONTHS.length) return;
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setActiveMonth(MONTHS[newIdx]);
      setSelectedDay(null);
      setAnimating(false);
    }, 200);
  }, [activeIdx]);

  const goToday = () => {
    if (CALENDAR_DATA[todayMonthStr]) {
      setActiveMonth(todayMonthStr);
      setSelectedDay(todayObj.getDate());
    }
  };

  const isToday = (d) => activeMonth === todayMonthStr && d === todayObj.getDate();
  const isPast  = (d) => {
    const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
    cellDate.setHours(23,59,59);
    return cellDate < todayObj;
  };

  return (
    <>
      <Head><title>Academic Calendar — CampusPro</title></Head>


      {/* Animated ambient background */}
      <div className="dash-bg" aria-hidden="true">
        <div className="dash-bg-grid" />
        <div className="dash-blob-1" />
        <div className="dash-blob-2" />
        <div className="dash-blob-3" />
        <div className="dash-bg-vignette" />
      </div>

      <div className="page">

        {/* ── TOP BAR ──────────────────────────── */}
        <div className="top-bar">
          <Link href="/dashboard" className="back-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <div className="top-brand">
            <span className="brand-hex">⬡</span>
            <span className="brand-word">Campus<strong>Pro</strong></span>
          </div>
          <div className="top-right">
            <div className="semester-chip">Even Sem 2025–26 · SRM KTR</div>
          </div>
        </div>

        {/* ── UPCOMING STRIP ──────────────────── */}
        <UpcomingStrip />

        {/* ── CALENDAR CARD ───────────────────── */}
        <div className="cal-card glass">

          {/* Calendar header */}
          <div className="cal-header">
            <div className="cal-nav-left">
              <button className="nav-btn" onClick={() => navigate(-1)} disabled={activeIdx === 0}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="month-title-block">
                <h2 className="month-name">{activeMonth.split(' ')[0]}</h2>
                <span className="year-label">{activeMonth.split(' ')[1]}</span>
              </div>
              <button className="nav-btn" onClick={() => navigate(1)} disabled={activeIdx === MONTHS.length - 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Month stats pills */}
            <div className="month-stats">
              <div className="ms-pill ms-work">
                <div className="ms-val">{workingDays}</div>
                <div className="ms-lbl">Working</div>
              </div>
              <div className="ms-pill ms-hol">
                <div className="ms-val">{holidayCount}</div>
                <div className="ms-lbl">Holidays</div>
              </div>
              <div className="ms-pill ms-exam">
                <div className="ms-val">{examCount}</div>
                <div className="ms-lbl">Exams</div>
              </div>
            </div>

            <div className="cal-header-right">
              {/* View toggle */}
              <div className="view-toggle">
                <button className={`vt-btn ${view==='month'?'vt-active':''}`} onClick={() => setView('month')}>Month</button>
                <button className={`vt-btn ${view==='list'?'vt-active':''}`} onClick={() => setView('list')}>List</button>
              </div>
              {!isCurrentMonth && (
                <button className="today-btn" onClick={goToday}>Today</button>
              )}
            </div>
          </div>

          {/* Month progress bar (only for current month) */}
          {isCurrentMonth && (
            <div className="month-progress-wrap">
              <div className="month-progress-bar">
                <div className="month-progress-fill" style={{ width:`${progress}%` }} />
              </div>
              <span className="month-progress-label">
                Day {todayObj.getDate()} of {totalDays} · {progress}% through {activeMonth.split(' ')[0]}
              </span>
            </div>
          )}

          {view === 'month' && (
            <>
              {/* Day of week headers */}
              <div className="dow-header">
                {DAY_LABELS.map((d, i) => (
                  <div key={d} className={`dow-cell ${i===0||i===6 ? 'dow-weekend' : ''}`}>{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div className={`cal-grid ${animating ? (animDir > 0 ? 'slide-out-left' : 'slide-out-right') : 'slide-in'}`}>
                {/* Empty cells */}
                {Array(startDay).fill(null).map((_, i) => (
                  <div key={`e${i}`} className="day-empty" />
                ))}

                {/* Day cells */}
                {Array(totalDays).fill(null).map((_, i) => {
                  const d = i + 1;
                  const events = (monthData.events || []).filter(e => e.date === d);
                  const order  = monthData.dayOrders?.[d];
                  const weekDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), d).getDay();
                  const isWknd = weekDay === 0 || weekDay === 6;
                  const isHol  = events.some(e => e.type === 'holiday');
                  const isExam = events.some(e => e.type === 'exam');
                  const isSpec = events.some(e => e.type === 'special');
                  const today  = isToday(d);
                  const sel    = selectedDay === d;
                  const past   = isPast(d) && !today;

                  return (
                    <div
                      key={d}
                      className={[
                        'day-cell',
                        today  ? 'day-today'    : '',
                        sel    ? 'day-selected' : '',
                        isWknd ? 'day-weekend'  : '',
                        isHol  ? 'day-holiday'  : '',
                        isExam ? 'day-exam'     : '',
                        past   ? 'day-past'     : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setSelectedDay(sel ? null : d)}
                      style={{ animationDelay: `${i * 8}ms` }}
                    >
                      {/* Day number */}
                      <div className="dn-wrap">
                        <span className="day-num">{d}</span>
                        {today && <div className="today-ring" />}
                      </div>

                      {/* Day order badge */}
                      {order && !isHol && (
                        <div className="order-badge" style={{
                          color: isExam ? '#f59e0b' : 'var(--accent-light)',
                          background: isExam ? 'rgba(245,158,11,0.1)' : 'var(--accent-dim)',
                        }}>{order}</div>
                      )}

                      {/* Event indicators */}
                      <div className="event-dots">
                        {events.slice(0, 3).map((e, ei) => {
                          const t = EVENT_TYPES[e.type];
                          return (
                            <div key={ei} className="event-dot-pill" style={{ background: t.color }}>
                              <span className="edp-text">{e.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {view === 'list' && (
            <div className="list-view animate-up">
              {MONTHS.map(m => {
                const mData = CALENDAR_DATA[m] || {};
                const evts  = mData.events || [];
                if (!evts.length) return null;
                const isCurrent = m === todayMonthStr;
                return (
                  <div key={m} className={`list-month ${isCurrent ? 'list-month-current' : ''}`}>
                    <div className="list-month-label">
                      {m}
                      {isCurrent && <span className="lm-current-chip">Current</span>}
                    </div>
                    {evts.map((e, i) => {
                      const t = EVENT_TYPES[e.type] || EVENT_TYPES.special;
                      return (
                        <div key={i} className="list-event-row" style={{ '--lc': t.color, '--lbg': t.bg, '--lbdr': t.border }}>
                          <div className="ler-date">
                            <div className="ler-day">{e.date}</div>
                            <div className="ler-mon">{m.split(' ')[0].slice(0,3)}</div>
                          </div>
                          <div className="ler-icon">{t.icon}</div>
                          <div className="ler-info">
                            <div className="ler-label">{e.label}</div>
                            <div className="ler-type">{t.label}</div>
                          </div>
                          <div className="ler-badge">{t.label}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── DAY DETAIL PANEL ──────────────── */}
          {selectedDay && view === 'month' && (
            <DayDetailPanel
              day={selectedDay}
              monthData={monthData}
              monthLabel={`${activeMonth.split(' ')[0]} ${selectedDay}`}
              onClose={() => setSelectedDay(null)}
            />
          )}
        </div>

        {/* ── MONTH SWITCHER ──────────────────── */}
        <div className="month-switcher">
          {MONTHS.map((m, i) => {
            const isActive = m === activeMonth;
            const isCurr   = m === todayMonthStr;
            return (
              <button
                key={m}
                className={`ms-tab ${isActive ? 'ms-active' : ''} ${isCurr ? 'ms-today' : ''}`}
                onClick={() => { navigate(i - activeIdx); }}
              >
                {m.split(' ')[0].slice(0, 3)}
                {isCurr && <span className="ms-today-dot" />}
              </button>
            );
          })}
        </div>

        {/* ── LEGEND ──────────────────────────── */}
        <div className="legend-row-bottom">
          {Object.entries(EVENT_TYPES).map(([key, t]) => (
            <div key={key} className="leg-item">
              <div className="leg-dot" style={{ background: t.color }} />
              <span>{t.label}</span>
            </div>
          ))}
          <div className="leg-item">
            <div className="leg-dot leg-order" />
            <span>Day Order</span>
          </div>
          <div className="leg-item leg-today-item">
            <div className="leg-today-circle" />
            <span>Today</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { background: #05060f; overflow-x: hidden; }
        @keyframes slideInLeft  { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes cellFadeIn   { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        @keyframes floatBlob  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-28px) scale(1.06)} 66%{transform:translate(-24px,18px) scale(0.96)} }
        @keyframes floatBlob2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-35px,22px) scale(1.04)} 70%{transform:translate(28px,-15px) scale(0.98)} }
        @keyframes floatBlob3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.07)} }
        @keyframes gridDrift  { from{transform:translateY(0)} to{transform:translateY(48px)} }
        .dash-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
        .dash-bg-grid { position:absolute; inset:-100px; background-image:radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px); background-size:28px 28px; animation:gridDrift 14s linear infinite; }
        .dash-blob-1 { position:absolute; width:700px; height:700px; top:-200px; left:-180px; border-radius:50%; background:radial-gradient(circle at 40% 40%, rgba(99,102,241,0.17) 0%, rgba(99,102,241,0.06) 45%, transparent 70%); filter:blur(60px); animation:floatBlob 20s ease-in-out infinite; will-change:transform; }
        .dash-blob-2 { position:absolute; width:600px; height:600px; bottom:-150px; right:-150px; border-radius:50%; background:radial-gradient(circle at 60% 60%, rgba(34,211,238,0.13) 0%, rgba(34,211,238,0.05) 45%, transparent 70%); filter:blur(55px); animation:floatBlob2 24s ease-in-out infinite; will-change:transform; }
        .dash-blob-3 { position:absolute; width:420px; height:420px; top:38%; left:52%; border-radius:50%; background:radial-gradient(circle at 50% 50%, rgba(167,139,250,0.11) 0%, rgba(167,139,250,0.04) 50%, transparent 70%); filter:blur(50px); animation:floatBlob3 16s ease-in-out infinite 4s; will-change:transform; }
        .dash-bg-vignette { position:absolute; inset:0; background:radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(5,6,15,0.5) 100%); }

      `}</style>

      <style jsx>{`
        /* ── PAGE ───────────────────────────────── */
        .page {
          max-width: 1080px; margin: 0 auto;
          padding: 24px 20px 48px;
          position: relative;
          display: flex; flex-direction: column; gap: 16px;
        }
        /* blob background handled by .dash-bg */

        /* ── TOP BAR ────────────────────────────── */
        .top-bar {
          display: flex; align-items: center; gap: 16px;
          position: relative; z-index: 1;
        }
        .back-btn {
          display: flex; align-items: center; gap: 6px;
          color: var(--text-3); font-size: 13px; padding: 6px 12px 6px 8px;
          border-radius: var(--radius-sm); transition: all .15s; white-space: nowrap;
        }
        .back-btn:hover { background: var(--bg-hover); color: var(--text-1); }
        .top-brand {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-display); font-size: 16px; font-weight: 800;
        }
        .brand-hex { font-size: 20px; color: var(--accent); filter: drop-shadow(0 0 8px var(--accent-glow)); }
        .brand-word { color: var(--text-1); }
        .brand-word strong { color: var(--accent); }
        .top-right { margin-left: auto; }
        .semester-chip {
          font-size: 11px; color: var(--text-3);
          background: var(--bg-elevated); border: 1px solid var(--border);
          padding: 5px 12px; border-radius: 20px;
        }

        /* ── UPCOMING STRIP ─────────────────────── */
        .upcoming-strip {
          display: flex; gap: 10px; overflow-x: auto;
          padding-bottom: 4px; position: relative; z-index: 1;
        }
        .upcoming-strip::-webkit-scrollbar { height: 0; }
        .up-item {
          display: flex; align-items: center; gap: 10px;
          background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: var(--radius-md); padding: 10px 14px;
          min-width: 190px; flex-shrink: 0;
          transition: transform .2s, border-color .2s;
        }
        .up-item:hover { transform: translateY(-2px); border-color: var(--uc, var(--border-strong)); }
        .up-icon { font-size: 18px; flex-shrink: 0; }
        .up-info { flex: 1; min-width: 0; }
        .up-label { font-size: 12px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .up-date  { font-family: var(--font-mono); font-size: 10px; color: var(--text-3); margin-top: 2px; }
        .up-days  { font-family: var(--font-mono); font-size: 11px; font-weight: 700; flex-shrink: 0; }

        /* ── CALENDAR CARD ──────────────────────── */
        .cal-card {
          border-radius: var(--radius-xl); padding: 22px;
          position: relative; z-index: 1;
          box-shadow: var(--shadow-md);
        }

        /* ── HEADER ─────────────────────────────── */
        .cal-header {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .cal-nav-left { display: flex; align-items: center; gap: 12px; }
        .nav-btn {
          width: 32px; height: 32px; border-radius: 9px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text-2); cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: all .15s;
        }
        .nav-btn:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--border-strong); color: var(--text-1); transform: scale(1.05); }
        .nav-btn:disabled { opacity: .3; cursor: not-allowed; }
        .month-title-block { display: flex; align-items: baseline; gap: 8px; }
        .month-name { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-1); letter-spacing: -.6px; }
        .year-label { font-family: var(--font-mono); font-size: 14px; color: var(--text-3); }

        /* Month stats pills */
        .month-stats { display: flex; gap: 8px; flex: 1; }
        .ms-pill { display: flex; flex-direction: column; align-items: center; padding: 7px 14px; border-radius: var(--radius-md); background: var(--bg-elevated); border: 1px solid var(--border); min-width: 64px; }
        .ms-val { font-family: var(--font-mono); font-size: 18px; font-weight: 700; }
        .ms-lbl { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: .5px; margin-top: 1px; }
        .ms-work .ms-val { color: var(--accent-light); }
        .ms-hol  .ms-val { color: var(--rose); }
        .ms-exam .ms-val { color: var(--amber); }

        .cal-header-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .view-toggle { display: flex; border: 1px solid var(--border); border-radius: 9px; overflow: hidden; }
        .vt-btn { padding: 6px 14px; background: none; border: none; color: var(--text-3); font-size: 12px; cursor: pointer; transition: all .15s; font-family: var(--font-body); }
        .vt-btn:hover { color: var(--text-1); background: var(--bg-hover); }
        .vt-active { background: var(--accent-dim) !important; color: var(--accent-light) !important; font-weight: 600; }
        .today-btn {
          padding: 6px 14px; border-radius: 9px;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          color: var(--accent-light); font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all .15s; font-family: var(--font-body);
        }
        .today-btn:hover { background: rgba(99,102,241,.18); }

        /* Month progress */
        .month-progress-wrap {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px;
        }
        .month-progress-bar { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .month-progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #06b6d4); border-radius: 2px; transition: width .6s ease; }
        .month-progress-label { font-size: 11px; color: var(--text-3); white-space: nowrap; font-family: var(--font-mono); }

        /* ── DOW HEADER ─────────────────────────── */
        .dow-header { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; margin-bottom: 6px; }
        .dow-cell { text-align: center; font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: var(--text-3); padding: 6px 0; }
        .dow-weekend { color: rgba(244,63,94,.5); }

        /* ── GRID ───────────────────────────────── */
        .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
        .slide-in { animation: slideIn .25s ease both; }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .slide-out-left  { animation: soLeft  .18s ease both; }
        .slide-out-right { animation: soRight .18s ease both; }
        @keyframes soLeft  { to{opacity:0;transform:translateX(-12px)} }
        @keyframes soRight { to{opacity:0;transform:translateX(12px)} }

        .day-empty { min-height: 90px; }

        .day-cell {
          min-height: 90px; border-radius: 10px;
          padding: 8px 7px 6px;
          background: rgba(255,255,255,.018);
          border: 1px solid transparent;
          cursor: pointer; position: relative;
          display: flex; flex-direction: column; gap: 4px;
          transition: background .15s, border-color .15s, transform .18s;
          animation: cellFadeIn .35s ease both;
        }
        .day-cell:hover { background: var(--bg-elevated); border-color: var(--border); transform: scale(1.03); z-index: 2; }

        /* State variants */
        .day-past     { opacity: .45; }
        .day-weekend  { opacity: .6; }
        .day-holiday  { background: rgba(244,63,94,.06); border-color: rgba(244,63,94,.12); }
        .day-exam     { background: rgba(245,158,11,.05); }
        .day-today    {
          background: var(--accent-dim) !important;
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 1px var(--accent-border), 0 4px 16px var(--accent-glow);
        }
        .day-selected {
          background: rgba(99,102,241,.16) !important;
          border-color: var(--accent) !important;
          transform: scale(1.04); z-index: 2;
        }

        /* Day number */
        .dn-wrap { display: flex; align-items: center; justify-content: space-between; }
        .day-num {
          font-family: var(--font-mono); font-size: 13px; font-weight: 600;
          color: var(--text-2); line-height: 1;
        }
        .day-today .day-num { color: var(--accent-light); font-weight: 800; font-size: 14px; }
        .today-ring {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--accent); box-shadow: 0 0 10px var(--accent-glow);
          position: absolute; top: 6px; left: 6px; z-index: 0;
          animation: todayPulse 2.5s ease-in-out infinite;
        }
        .day-today .day-num { position: relative; z-index: 1; color: white !important; font-size: 12px; }
        @keyframes todayPulse { 0%,100%{box-shadow:0 0 10px var(--accent-glow)} 50%{box-shadow:0 0 18px var(--accent-glow)} }

        /* Order badge */
        .order-badge {
          font-family: var(--font-mono); font-size: 9px; font-weight: 700;
          padding: 1px 5px; border-radius: 4px;
          display: inline-block; align-self: flex-start;
        }

        /* Event dots/pills */
        .event-dots { display: flex; flex-direction: column; gap: 2px; margin-top: auto; }
        .event-dot-pill {
          border-radius: 3px; padding: 2px 5px;
          display: flex; align-items: center; opacity: .85;
        }
        .edp-text {
          font-size: 8.5px; font-weight: 600; color: white;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 100%;
        }

        /* ── DAY DETAIL PANEL ───────────────────── */
        .detail-panel {
          margin-top: 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--accent-border);
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          box-shadow: 0 4px 24px var(--accent-glow);
        }
        .dp-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .dp-date-block { display: flex; align-items: baseline; gap: 6px; flex: 1; }
        .dp-day-num { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--accent-light); line-height: 1; }
        .dp-month-name { font-size: 14px; color: var(--text-2); font-weight: 500; }
        .dp-order-badge {
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          color: var(--accent-light); font-family: var(--font-mono);
          font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px;
        }
        .dp-close {
          width: 28px; height: 28px; border-radius: 8px;
          background: var(--bg-hover); border: 1px solid var(--border);
          color: var(--text-3); cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: all .15s;
        }
        .dp-close:hover { color: var(--rose); border-color: rgba(244,63,94,.3); background: var(--rose-dim); }
        .dp-events { display: flex; gap: 10px; flex-wrap: wrap; }
        .dp-event {
          display: flex; align-items: center; gap: 10px;
          background: var(--ebg); border: 1px solid var(--ebdr);
          border-radius: var(--radius-md); padding: 10px 14px;
          flex: 1; min-width: 180px;
        }
        .dp-event-icon { font-size: 20px; }
        .dp-event-label { font-size: 14px; font-weight: 600; color: var(--ec); }
        .dp-event-type  { font-size: 10px; color: var(--text-3); margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }
        .dp-no-event { font-size: 13px; color: var(--text-3); font-style: italic; }

        /* ── LIST VIEW ──────────────────────────── */
        .list-view { display: flex; flex-direction: column; gap: 20px; padding-top: 8px; }
        .list-month { }
        .list-month-label {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--font-display); font-size: 15px; font-weight: 700;
          color: var(--text-1); margin-bottom: 10px;
          padding-bottom: 8px; border-bottom: 1px solid var(--border);
        }
        .list-month-current .list-month-label { color: var(--accent-light); border-color: var(--accent-border); }
        .lm-current-chip {
          font-size: 9.5px; font-weight: 700; letter-spacing: .5px;
          background: var(--accent-dim); color: var(--accent-light);
          border: 1px solid var(--accent-border); padding: 2px 8px; border-radius: 10px;
        }
        .list-event-row {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 14px;
          background: var(--lbg, var(--bg-elevated));
          border: 1px solid var(--lbdr, var(--border));
          border-radius: var(--radius-md); margin-bottom: 6px;
          transition: transform .15s;
        }
        .list-event-row:hover { transform: translateX(4px); }
        .ler-date { text-align: center; flex-shrink: 0; }
        .ler-day { font-family: var(--font-mono); font-size: 20px; font-weight: 700; color: var(--lc, var(--text-1)); line-height: 1; }
        .ler-mon { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: .5px; }
        .ler-icon { font-size: 18px; flex-shrink: 0; }
        .ler-info { flex: 1; }
        .ler-label { font-size: 13.5px; font-weight: 600; color: var(--text-1); }
        .ler-type  { font-size: 10.5px; color: var(--text-3); margin-top: 2px; }
        .ler-badge {
          font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 10px;
          background: var(--lbg); color: var(--lc); border: 1px solid var(--lbdr);
          flex-shrink: 0;
        }

        /* ── MONTH SWITCHER ─────────────────────── */
        .month-switcher {
          display: flex; gap: 6px; justify-content: center;
          position: relative; z-index: 1;
        }
        .ms-tab {
          position: relative;
          padding: 7px 16px; border-radius: 10px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text-3); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .18s; font-family: var(--font-body);
        }
        .ms-tab:hover { background: var(--bg-hover); color: var(--text-1); border-color: var(--border-strong); }
        .ms-active {
          background: var(--accent-dim) !important;
          border-color: var(--accent) !important;
          color: var(--accent-light) !important;
          box-shadow: 0 4px 12px var(--accent-glow);
        }
        .ms-today { border-color: var(--accent-border) !important; }
        .ms-today-dot {
          position: absolute; top: 4px; right: 4px;
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--accent); box-shadow: 0 0 4px var(--accent-glow);
        }

        /* ── LEGEND ROW ─────────────────────────── */
        .legend-row-bottom {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          padding: 10px 4px; border-top: 1px solid var(--border);
          position: relative; z-index: 1;
        }
        .leg-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-3); }
        .leg-dot { width: 8px; height: 8px; border-radius: 50%; }
        .leg-order { background: var(--accent-light); }
        .leg-today-circle { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent-glow); }
        .leg-today-item { color: var(--accent-light); }

        /* ── ANIMATE ────────────────────────────── */
        .animate-up { animation: fadeUp .35s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* ── RESPONSIVE ─────────────────────────── */
        @media (max-width: 700px) {
          .month-stats { display: none; }
          .cal-header-right { margin-left: 0; }
          .day-cell { min-height: 58px; padding: 5px 4px; }
          .edp-text { display: none; }
          .event-dot-pill { width: 6px; height: 6px; border-radius: 50%; padding: 0; }
          .order-badge { display: none; }
          .month-switcher { flex-wrap: wrap; }
          .upcoming-strip { gap: 7px; }
          .up-item { min-width: 150px; padding: 8px 10px; }
        }
        @media (max-width: 480px) {
          .page { padding: 14px 10px 40px; }
          .month-name { font-size: 22px; }
          .top-brand { display: none; }
          .day-cell { min-height: 46px; }
          .day-num { font-size: 11px; }
        }
      `}</style>
    </>
  );
}