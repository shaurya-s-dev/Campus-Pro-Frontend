import { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';

/* ════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════ */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ── Single source of truth for event types ── */
const EVENT_TYPES = {
  holiday: { label:'Holiday',    color:'#f43f5e', bg:'rgba(244,63,94,0.12)',  border:'rgba(244,63,94,0.28)',  icon:'🏖',  tagClass:'tag-rose'    },
  exam:    { label:'Exam / Test',color:'#f59e0b', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.28)', icon:'📝',  tagClass:'tag-amber'   },
  special: { label:'Special Day',color:'#10b981', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.28)', icon:'⭐', tagClass:'tag-emerald' },
};

/* ── Academic calendar — single source of truth ──
   Keys: "Month YYYY"  |  date is 1-indexed day-of-month
   dayOrders: keys are Numbers (coerced to strings in JS — consistent)
   ══════════════════════════════════════════════════ */
const CALENDAR_DATA = {
  'January 2026': {
    events: [
      { date: 1,  type: 'holiday', label: "New Year's Day"    },
      { date: 14, type: 'holiday', label: 'Pongal'            },
      { date: 15, type: 'holiday', label: 'Thiruvalluvar Day'  },
      { date: 16, type: 'holiday', label: 'Uzhavar Thirunal'  },
      { date: 26, type: 'holiday', label: 'Republic Day'       },
    ],
    dayOrders: {
      2:'D1', 3:'D2', 5:'D3', 6:'D4', 7:'D5',
      8:'D1', 9:'D2',10:'D3',12:'D4',13:'D5',
      17:'D1',18:'D2',19:'D3',20:'D4',21:'D5',
      22:'D1',23:'D2',24:'D3',27:'D4',28:'D5',
      29:'D1',30:'D2',31:'D3',
    },
  },
  'February 2026': {
    events: [
      { date: 2,  type: 'exam',    label: 'CAT-1 Begins'              },
      { date: 14, type: 'special', label: "Valentine's / Techno Day"  },
      { date: 19, type: 'special', label: "SRM Founders' Day"         },
      { date: 26, type: 'exam',    label: 'CAT-2 Prep Week'           },
    ],
    dayOrders: {
      2:'D4', 3:'D5', 4:'D1', 5:'D2', 6:'D3', 7:'D4',
      9:'D5',10:'D1',11:'D2',12:'D3',13:'D4',
      16:'D5',17:'D1',18:'D2',20:'D3',21:'D4',
      23:'D5',24:'D1',25:'D2',26:'D3',27:'D4',28:'D5',
    },
  },
  'March 2026': {
    events: [
      { date: 2,  type: 'exam',    label: 'CAT-2 Begins' },
      { date: 18, type: 'holiday', label: 'Holi'          },
      { date: 25, type: 'exam',    label: 'CAT-2 Ends'   },
    ],
    dayOrders: {
      2:'D1', 3:'D2', 4:'D3', 5:'D4', 6:'D5', 7:'D1',
      9:'D2',10:'D3',11:'D4',12:'D5',13:'D1',
      16:'D2',17:'D3',19:'D4',20:'D5',
      23:'D1',24:'D2',26:'D3',27:'D4',28:'D5',
      30:'D1',31:'D2',
    },
  },
  'April 2026': {
    events: [
      { date: 1,  type: 'holiday', label: 'Tamil New Year / Ugadi' },
      { date: 3,  type: 'holiday', label: 'Good Friday'             },
      { date: 14, type: 'holiday', label: 'Dr. Ambedkar Jayanti'   },
      { date: 21, type: 'exam',    label: 'Model Exams Begin'       },
      { date: 30, type: 'exam',    label: 'Last Day of Instruction' },
    ],
    dayOrders: {
      2:'D3', 4:'D4', 6:'D5', 7:'D1', 8:'D2', 9:'D3',10:'D4',
      13:'D5',15:'D1',16:'D2',17:'D3',20:'D4',
      22:'D5',23:'D1',24:'D2',27:'D3',28:'D4',29:'D5',30:'D1',
    },
  },
  'May 2026': {
    events: [
      { date: 1,  type: 'holiday', label: 'Labour Day'               },
      { date: 4,  type: 'exam',    label: 'End Semester Exams Begin'  },
      { date: 25, type: 'exam',    label: 'End Semester Exams End'    },
    ],
    dayOrders: {},
  },
};

const MONTHS = Object.keys(CALENDAR_DATA);

/* ════════════════════════════════════════════════════
   PURE HELPERS — no side effects, no timezone tricks
   ════════════════════════════════════════════════════ */

/** Parse "Month YYYY" → local-midnight Date */
function parseMonthKey(str) {
  const [m, y] = str.split(' ');
  return new Date(parseInt(y, 10), MONTH_NAMES.indexOf(m), 1);
}

function daysInMonth(year, month) {           // month is 0-indexed
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekday(year, month) {          // 0=Sun…6=Sat
  return new Date(year, month, 1).getDay();
}

/** "Month YYYY" for today — no timezone offset risk */
function todayMonthKey() {
  const n = new Date();
  return `${MONTH_NAMES[n.getMonth()]} ${n.getFullYear()}`;
}

/** Get today's date-of-month as a number */
function todayDate() { return new Date().getDate(); }

/* ════════════════════════════════════════════════════
   UPCOMING EVENTS — computed from single data source
   ════════════════════════════════════════════════════ */
function buildUpcoming(count = 6) {
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const all = [];
  MONTHS.forEach(key => {
    const d = parseMonthKey(key);
    (CALENDAR_DATA[key]?.events || []).forEach(ev => {
      const evDate = new Date(d.getFullYear(), d.getMonth(), ev.date);
      evDate.setHours(0, 0, 0, 0);
      if (evDate >= todayMidnight) {
        all.push({ ...ev, monthKey: key, evDate });
      }
    });
  });
  all.sort((a, b) => a.evDate - b.evDate);
  return all.slice(0, count);
}

/* ════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════ */

/* Upcoming horizontal strip */
function UpcomingStrip() {
  const todayMidnight = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);
  const items = useMemo(() => buildUpcoming(6), []);

  return (
    <div className="upcoming-strip">
      <div className="upcoming-heading">Upcoming</div>
      <div className="upcoming-list">
        {items.map((ev, i) => {
          const t = EVENT_TYPES[ev.type] || EVENT_TYPES.special;
          const diff = Math.round((ev.evDate - todayMidnight) / 86_400_000);
          const diffLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`;
          return (
            <div key={i} className="up-card" style={{ '--uc': t.color, '--ubg': t.bg, '--ubdr': t.border }}>
              <div className="up-left">
                <div className="up-dot" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                <div>
                  <div className="up-label">{ev.label}</div>
                  <div className="up-meta">{ev.monthKey.split(' ')[0]} {ev.date} · {t.label}</div>
                </div>
              </div>
              <div className="up-days" style={{ color: t.color }}>{diffLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Day detail panel shown below grid */
function DayDetail({ day, monthKey, onClose }) {
  if (!day || !monthKey) return null;
  const data   = CALENDAR_DATA[monthKey] || {};
  const events = (data.events || []).filter(e => e.date === day);
  const order  = data.dayOrders?.[day];          // numeric key → string

  return (
    <div className="detail-panel">
      <div className="dp-top">
        <div className="dp-date-block">
          <span className="dp-day">{day}</span>
          <span className="dp-month">{monthKey.split(' ')[0]}</span>
        </div>
        {order && <div className="dp-order">{order}</div>}
        <button className="dp-close" onClick={onClose} aria-label="Close">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {events.length > 0 ? (
        <div className="dp-events">
          {events.map((ev, i) => {
            const t = EVENT_TYPES[ev.type] || EVENT_TYPES.special;
            return (
              <div key={i} className="dp-ev-row" style={{ '--ec': t.color, '--ebg': t.bg, '--ebdr': t.border }}>
                <span className="dp-ev-icon">{t.icon}</span>
                <div className="dp-ev-info">
                  <div className="dp-ev-name">{ev.label}</div>
                  <div className="dp-ev-type">{t.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dp-empty">
          {order ? '📚 Regular class day' : 'No events scheduled'}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════ */
export default function CalendarPage() {
  /* ── Stable today values (computed once) ── */
  const TODAY_KEY  = useMemo(todayMonthKey, []);
  const TODAY_DATE = useMemo(todayDate, []);

  /* ── Resolve initial month ── */
  const initialMonth = useMemo(() => {
    if (CALENDAR_DATA[TODAY_KEY]) return TODAY_KEY;
    return MONTHS.find(m => parseMonthKey(m) >= parseMonthKey(TODAY_KEY)) ?? MONTHS.at(-1);
  }, [TODAY_KEY]);

  const [activeMonth, setActiveMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState(() =>
    CALENDAR_DATA[TODAY_KEY] ? TODAY_DATE : null
  );
  const [view,  setView]  = useState('month');  // 'month' | 'list'
  const [anim,  setAnim]  = useState(null);     // 'left' | 'right' | null

  /* ── Derived from activeMonth ── */
  const activeDate   = useMemo(() => parseMonthKey(activeMonth), [activeMonth]);
  const year         = activeDate.getFullYear();
  const month        = activeDate.getMonth();          // 0-indexed
  const totalDays    = useMemo(() => daysInMonth(year, month), [year, month]);
  const startDay     = useMemo(() => firstWeekday(year, month), [year, month]);
  const monthData    = CALENDAR_DATA[activeMonth] || {};
  const activeIdx    = MONTHS.indexOf(activeMonth);
  const isThisMonth  = activeMonth === TODAY_KEY;

  /* ── Stats (memoised) ── */
  const stats = useMemo(() => ({
    working:  Object.keys(monthData.dayOrders || {}).length,
    holidays: (monthData.events || []).filter(e => e.type === 'holiday').length,
    exams:    (monthData.events || []).filter(e => e.type === 'exam').length,
  }), [monthData]);

  const progress = isThisMonth ? Math.round((TODAY_DATE / totalDays) * 100) : 0;

  /* ── FIX: direct navigation — no incremental stepping ── */
  const goToMonth = useCallback((idx) => {
    if (idx < 0 || idx >= MONTHS.length) return;
    const dir = idx > activeIdx ? 'left' : 'right';
    setAnim(dir);
    setTimeout(() => {
      setActiveMonth(MONTHS[idx]);
      setSelectedDay(null);
      setAnim(null);
    }, 180);
  }, [activeIdx]);

  const navigate = useCallback((delta) => goToMonth(activeIdx + delta), [activeIdx, goToMonth]);

  const goToday = useCallback(() => {
    if (CALENDAR_DATA[TODAY_KEY]) {
      goToMonth(MONTHS.indexOf(TODAY_KEY));
      setTimeout(() => setSelectedDay(TODAY_DATE), 200);
    }
  }, [TODAY_KEY, TODAY_DATE, goToMonth]);

  /* ── Cell state helpers ── */
  const isToday   = (d) => isThisMonth && d === TODAY_DATE;
  const isPast    = (d) => {
    if (!isThisMonth) {
      return parseMonthKey(activeMonth) < parseMonthKey(TODAY_KEY);
    }
    return d < TODAY_DATE;
  };

  return (
    <>
      <Head><title>Academic Calendar — CampusPro</title></Head>

      {/* ── Animated blob background (matches dashboard) ── */}
      <div className="dash-bg" aria-hidden="true">
        <div className="dash-bg-grid" />
        <div className="dash-blob-1" />
        <div className="dash-blob-2" />
        <div className="dash-blob-3" />
        <div className="dash-bg-vignette" />
      </div>

      <div className="page">

        {/* ── TOP BAR ─────────────────────────── */}
        <div className="top-bar">
          <Link href="/dashboard" className="back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Dashboard
          </Link>
          <div className="top-brand">
            <div className="brand-logo">
              <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="8" r="3" fill="white" opacity="0.9"/>
                <circle cx="8" cy="28" r="3" fill="white" opacity="0.9"/>
                <circle cx="32" cy="28" r="3" fill="white" opacity="0.9"/>
                <circle cx="20" cy="20" r="4" fill="white"/>
                <line x1="20" y1="8" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                <line x1="8" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                <line x1="32" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.6"/>
              </svg>
            </div>
            Campus<strong>Pro</strong>
          </div>
          <div className="semester-chip">Even Sem 2025–26 · SRM KTR</div>
        </div>

        {/* ── UPCOMING STRIP ──────────────────── */}
        <UpcomingStrip />

        {/* ── MAIN CALENDAR CARD ──────────────── */}
        <div className="cal-card">

          {/* Header */}
          <div className="cal-header">
            <div className="cal-nav">
              <button className="nav-btn" onClick={() => navigate(-1)} disabled={activeIdx === 0} aria-label="Previous month">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="month-title">
                <h2 className="month-name">{activeMonth.split(' ')[0]}</h2>
                <span className="year-label">{activeMonth.split(' ')[1]}</span>
              </div>
              <button className="nav-btn" onClick={() => navigate(1)} disabled={activeIdx === MONTHS.length - 1} aria-label="Next month">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Stats pills */}
            <div className="month-stats">
              <div className="ms-pill ms-work">
                <div className="ms-val">{stats.working}</div>
                <div className="ms-lbl">Working</div>
              </div>
              <div className="ms-pill ms-hol">
                <div className="ms-val">{stats.holidays}</div>
                <div className="ms-lbl">Holidays</div>
              </div>
              <div className="ms-pill ms-exam">
                <div className="ms-val">{stats.exams}</div>
                <div className="ms-lbl">Exams</div>
              </div>
            </div>

            {/* Right controls */}
            <div className="hdr-right">
              <div className="view-toggle">
                <button className={`vt-btn${view==='month'?' vt-on':''}`} onClick={() => setView('month')}>Month</button>
                <button className={`vt-btn${view==='list'?' vt-on':''}`} onClick={() => setView('list')}>List</button>
              </div>
              {!isThisMonth && (
                <button className="today-btn" onClick={goToday}>Today</button>
              )}
            </div>
          </div>

          {/* Month progress bar */}
          {isThisMonth && (
            <div className="progress-strip">
              <div className="prog-track">
                <div className="prog-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="prog-label">
                Day {TODAY_DATE} of {totalDays} · {progress}% through {activeMonth.split(' ')[0]}
              </span>
            </div>
          )}

          {/* ── MONTH VIEW ── */}
          {view === 'month' && (
            <>
              {/* Day-of-week header */}
              <div className="dow-row">
                {DAY_LABELS.map((d, i) => (
                  <div key={d} className={`dow-cell${i===0||i===6?' dow-wknd':''}`}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className={`cal-grid${anim==='left'?' anim-left':anim==='right'?' anim-right':''}`}>
                {/* Leading empty cells */}
                {Array.from({ length: startDay }, (_, i) => (
                  <div key={`e${i}`} className="day-empty" />
                ))}

                {/* Day cells */}
                {Array.from({ length: totalDays }, (_, i) => {
                  const d        = i + 1;
                  const events   = (monthData.events || []).filter(e => e.date === d);
                  const order    = monthData.dayOrders?.[d];
                  const weekDay  = new Date(year, month, d).getDay();
                  const isWknd   = weekDay === 0 || weekDay === 6;
                  const isHol    = events.some(e => e.type === 'holiday');
                  const isExam   = events.some(e => e.type === 'exam');
                  const isSpec   = events.some(e => e.type === 'special');
                  const today    = isToday(d);
                  const selected = selectedDay === d;
                  const past     = isPast(d) && !today;

                  /* Build class list cleanly */
                  const cls = [
                    'day-cell',
                    today    && 'is-today',
                    selected && 'is-selected',
                    isWknd   && 'is-weekend',
                    isHol    && 'is-holiday',
                    isExam   && 'is-exam',
                    isSpec   && 'is-special',
                    past     && 'is-past',
                  ].filter(Boolean).join(' ');

                  /* Pick first event's color for cell accent */
                  const firstType = events[0]?.type;
                  const cellAccent = firstType ? EVENT_TYPES[firstType].color : null;

                  return (
                    <div
                      key={d}
                      className={cls}
                      onClick={() => setSelectedDay(selected ? null : d)}
                      style={cellAccent && !today ? { '--cell-accent': cellAccent } : undefined}
                    >
                      {/* Day number — FIX: today highlight uses a circle BEHIND the number, not overlapping */}
                      <div className="day-num-row">
                        {today ? (
                          <div className="today-badge">{d}</div>
                        ) : (
                          <span className="day-num">{d}</span>
                        )}
                        {order && !isHol && (
                          <span className="order-pill" style={{
                            color:      isExam ? '#f59e0b' : 'var(--accent-light)',
                            background: isExam ? 'rgba(245,158,11,0.12)' : 'var(--accent-dim)',
                          }}>
                            {order}
                          </span>
                        )}
                      </div>

                      {/* Event pills — max 2 shown, rest collapsed */}
                      {events.length > 0 && (
                        <div className="event-pills">
                          {events.slice(0, 2).map((ev, ei) => {
                            const t = EVENT_TYPES[ev.type];
                            return (
                              <div
                                key={ei}
                                className="ev-pill"
                                style={{ background: t.color + '22', color: t.color, borderColor: t.color + '44' }}
                              >
                                <span className="ev-pill-dot" style={{ background: t.color }} />
                                <span className="ev-pill-text">{ev.label}</span>
                              </div>
                            );
                          })}
                          {events.length > 2 && (
                            <div className="ev-overflow">+{events.length - 2}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Day detail panel */}
              {selectedDay && (
                <DayDetail
                  day={selectedDay}
                  monthKey={activeMonth}
                  onClose={() => setSelectedDay(null)}
                />
              )}
            </>
          )}

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <div className="list-view">
              {MONTHS.map(m => {
                const evts = CALENDAR_DATA[m]?.events || [];
                if (!evts.length) return null;
                const isCurrent = m === TODAY_KEY;
                return (
                  <div key={m} className={`list-month${isCurrent?' list-current':''}`}>
                    <div className="list-month-hd">
                      <span>{m}</span>
                      {isCurrent && <span className="curr-chip">Current</span>}
                    </div>
                    {evts.map((ev, i) => {
                      const t = EVENT_TYPES[ev.type] || EVENT_TYPES.special;
                      return (
                        <div key={i} className="list-row" style={{ '--lc': t.color, '--lbg': t.bg, '--lbdr': t.border }}>
                          <div className="lr-date">
                            <div className="lr-day">{ev.date}</div>
                            <div className="lr-mon">{m.split(' ')[0].slice(0,3)}</div>
                          </div>
                          <div className="lr-icon">{t.icon}</div>
                          <div className="lr-info">
                            <div className="lr-name">{ev.label}</div>
                            <div className="lr-type">{t.label}</div>
                          </div>
                          <div className="lr-badge">{t.label}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MONTH SWITCHER ──────────────────── */}
        <div className="month-switcher">
          {MONTHS.map((m, i) => {
            const isCurr = m === TODAY_KEY;
            const isAct  = m === activeMonth;
            return (
              <button
                key={m}
                className={`ms-btn${isAct?' ms-active':''}${isCurr?' ms-curr':''}`}
                onClick={() => goToMonth(i)}   /* FIX: direct index navigation */
              >
                {m.split(' ')[0].slice(0, 3)}
                {isCurr && <span className="ms-dot" />}
              </button>
            );
          })}
        </div>

        {/* ── LEGEND ──────────────────────────── */}
        <div className="legend-row">
          {Object.entries(EVENT_TYPES).map(([key, t]) => (
            <div key={key} className="leg-item">
              <div className="leg-swatch" style={{ background: t.color }} />
              <span>{t.label}</span>
            </div>
          ))}
          <div className="leg-item">
            <div className="leg-swatch" style={{ background: 'var(--accent-light)', borderRadius: 3 }} />
            <span>Day Order</span>
          </div>
          <div className="leg-item">
            <div className="leg-today-swatch" />
            <span style={{ color: 'var(--accent-light)' }}>Today</span>
          </div>
        </div>
      </div>

      {/* ── GLOBAL STYLES (keyframes) ── */}
      <style jsx global>{`
        body { background: #05060f; overflow-x: hidden; }
        @keyframes floatBlob1  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-28px) scale(1.06)} 66%{transform:translate(-24px,18px) scale(0.96)} }
        @keyframes floatBlob2  { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-35px,22px) scale(1.04)} 70%{transform:translate(28px,-15px) scale(0.98)} }
        @keyframes floatBlob3  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.07)} }
        @keyframes gridDrift   { from{transform:translateY(0)} to{transform:translateY(48px)} }
        .dash-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
        .dash-bg-grid { position:absolute; inset:-100px; background-image:radial-gradient(circle, rgba(255,255,255,0.075) 1px, transparent 1px); background-size:28px 28px; animation:gridDrift 14s linear infinite; }
        .dash-blob-1 { position:absolute; width:700px; height:700px; top:-200px; left:-180px; border-radius:50%; background:radial-gradient(circle at 40% 40%, rgba(99,102,241,0.17) 0%, rgba(99,102,241,0.06) 45%, transparent 70%); filter:blur(60px); animation:floatBlob1 20s ease-in-out infinite; will-change:transform; }
        .dash-blob-2 { position:absolute; width:600px; height:600px; bottom:-150px; right:-150px; border-radius:50%; background:radial-gradient(circle at 60% 60%, rgba(34,211,238,0.13) 0%, rgba(34,211,238,0.05) 45%, transparent 70%); filter:blur(55px); animation:floatBlob2 24s ease-in-out infinite; will-change:transform; }
        .dash-blob-3 { position:absolute; width:420px; height:420px; top:38%; left:52%; border-radius:50%; background:radial-gradient(circle at 50% 50%, rgba(167,139,250,0.11) 0%, rgba(167,139,250,0.04) 50%, transparent 70%); filter:blur(50px); animation:floatBlob3 16s ease-in-out infinite 4s; will-change:transform; }
        .dash-bg-vignette { position:absolute; inset:0; background:radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(5,6,15,0.5) 100%); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <style jsx>{`
        /* ── PAGE SHELL ──────────────────────────── */
        .page {
          position: relative; z-index: 1;
          max-width: 1060px; margin: 0 auto;
          padding: 22px 20px 52px;
          display: flex; flex-direction: column; gap: 14px;
        }

        /* ── TOP BAR ─────────────────────────────── */
        .top-bar {
          display: flex; align-items: center; gap: 14px;
        }
        .back-btn {
          display: flex; align-items: center; gap: 5px;
          color: var(--text-3); font-size: 12.5px;
          padding: 6px 12px 6px 8px; border-radius: var(--radius-sm);
          transition: all .15s; white-space: nowrap;
        }
        .back-btn:hover { background: var(--bg-hover); color: var(--text-1); }

        .top-brand {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-display); font-size: 15px; font-weight: 800;
          color: var(--text-1);
        }
        .brand-logo {
          width: 26px; height: 26px; border-radius: 7px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 12px rgba(99,102,241,0.3);
        }
        .top-brand strong { color: var(--accent-light); }

        .semester-chip {
          margin-left: auto;
          font-size: 10.5px; color: var(--text-3);
          background: var(--bg-elevated); border: 1px solid var(--border);
          padding: 5px 12px; border-radius: 20px;
        }

        /* ── UPCOMING STRIP ──────────────────────── */
        .upcoming-strip { }
        .upcoming-heading {
          font-family: var(--font-display); font-size: 11px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: var(--text-4); margin-bottom: 8px;
        }
        .upcoming-list {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px;
        }
        .upcoming-list::-webkit-scrollbar { height: 0; }
        .up-card {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; min-width: 200px; flex-shrink: 0;
          background: var(--card-bg);
          border: 1px solid var(--ubdr, var(--card-border));
          border-radius: var(--radius-md); padding: 10px 14px;
          backdrop-filter: blur(16px);
          transition: transform .18s, box-shadow .18s;
        }
        .up-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
        .up-left { display: flex; align-items: center; gap: 9px; min-width: 0; }
        .up-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .up-label { font-size: 12px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
        .up-meta  { font-size: 10px; color: var(--text-3); margin-top: 1px; }
        .up-days  { font-family: var(--font-mono); font-size: 11px; font-weight: 700; flex-shrink: 0; white-space: nowrap; }

        /* ── CALENDAR CARD ───────────────────────── */
        .cal-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-xl);
          padding: 20px 20px 16px;
          backdrop-filter: blur(20px);
          box-shadow: var(--shadow-md);
        }

        /* ── HEADER ──────────────────────────────── */
        .cal-header {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 14px; flex-wrap: wrap;
        }
        .cal-nav { display: flex; align-items: center; gap: 10px; }
        .nav-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text-2); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .14s;
        }
        .nav-btn:hover:not(:disabled) {
          background: var(--bg-overlay); border-color: var(--border-strong);
          color: var(--text-1); transform: scale(1.06);
        }
        .nav-btn:disabled { opacity: .28; cursor: not-allowed; }

        .month-title { display: flex; align-items: baseline; gap: 7px; }
        .month-name {
          font-family: var(--font-display); font-size: 26px; font-weight: 800;
          color: var(--text-1); letter-spacing: -.5px;
        }
        .year-label {
          font-family: var(--font-mono); font-size: 13.5px; color: var(--text-3);
        }

        /* Stats */
        .month-stats { display: flex; gap: 7px; }
        .ms-pill {
          display: flex; flex-direction: column; align-items: center;
          padding: 7px 14px; border-radius: var(--radius-md);
          background: var(--bg-elevated); border: 1px solid var(--border);
          min-width: 60px;
        }
        .ms-val { font-family: var(--font-mono); font-size: 17px; font-weight: 700; }
        .ms-lbl { font-size: 8.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: .6px; margin-top: 1px; }
        .ms-work .ms-val { color: var(--accent-light); }
        .ms-hol  .ms-val { color: var(--rose); }
        .ms-exam .ms-val { color: var(--amber); }

        .hdr-right { display: flex; align-items: center; gap: 7px; margin-left: auto; }
        .view-toggle {
          display: flex; border: 1px solid var(--border);
          border-radius: 9px; overflow: hidden;
        }
        .vt-btn {
          padding: 5px 13px; background: none; border: none;
          color: var(--text-3); font-size: 12px;
          cursor: pointer; transition: all .14s; font-family: var(--font-body);
        }
        .vt-btn:hover { color: var(--text-1); background: var(--bg-hover); }
        .vt-on {
          background: var(--accent-dim) !important;
          color: var(--accent-light) !important;
          font-weight: 600;
        }
        .today-btn {
          padding: 5px 13px; border-radius: 9px;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          color: var(--accent-light); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .14s; font-family: var(--font-body);
        }
        .today-btn:hover { background: rgba(99,102,241,.2); }

        /* Progress bar */
        .progress-strip {
          display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
        }
        .prog-track {
          flex: 1; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden;
        }
        .prog-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), #22d3ee);
          border-radius: 2px; transition: width .6s ease;
        }
        .prog-label { font-size: 10.5px; color: var(--text-3); white-space: nowrap; font-family: var(--font-mono); }

        /* ── DOW HEADER ──────────────────────────── */
        .dow-row {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 3px; margin-bottom: 4px;
        }
        .dow-cell {
          text-align: center; font-size: 9.5px; font-weight: 700;
          letter-spacing: .8px; text-transform: uppercase;
          color: var(--text-3); padding: 6px 0;
        }
        .dow-wknd { color: rgba(244,63,94,0.55); }

        /* ── CALENDAR GRID ───────────────────────── */
        .cal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }
        /* Grid slide animation on month change */
        .anim-left  { animation: slideLeft  .18s ease both; }
        .anim-right { animation: slideRight .18s ease both; }
        @keyframes slideLeft  { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }

        .day-empty { min-height: 88px; }

        /* ── DAY CELL ── */
        .day-cell {
          min-height: 88px;
          border-radius: 9px;
          padding: 7px 7px 5px;
          background: rgba(255,255,255,0.020);
          border: 1px solid transparent;
          cursor: pointer;
          display: flex; flex-direction: column; gap: 3px;
          transition: background .14s, border-color .14s, transform .16s, box-shadow .16s;
          position: relative;
          overflow: hidden;
        }
        /* Subtle left accent stripe for event days */
        .day-cell.is-holiday,
        .day-cell.is-exam,
        .day-cell.is-special {
          border-left-color: var(--cell-accent, transparent);
          border-left-width: 2px;
        }

        .day-cell:hover {
          background: var(--bg-elevated);
          border-color: var(--border-strong);
          transform: scale(1.035);
          z-index: 2;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        }

        /* State modifiers */
        .day-cell.is-past    { opacity: .38; }
        .day-cell.is-weekend { opacity: .65; }
        .day-cell.is-holiday { background: rgba(244,63,94,0.065); }
        .day-cell.is-exam    { background: rgba(245,158,11,0.055); }
        .day-cell.is-special { background: rgba(16,185,129,0.050); }
        .day-cell.is-today {
          background: rgba(99,102,241,0.14) !important;
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 1px var(--accent-border), 0 4px 16px var(--accent-glow);
        }
        .day-cell.is-today:hover { transform: scale(1.04); }
        .day-cell.is-selected {
          background: rgba(99,102,241,0.18) !important;
          border-color: var(--accent-light) !important;
          transform: scale(1.04);
          z-index: 2;
          box-shadow: 0 4px 20px var(--accent-glow);
        }

        /* ── Day number row ── */
        .day-num-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 4px;
        }
        .day-num {
          font-family: var(--font-mono); font-size: 13px; font-weight: 600;
          color: var(--text-2); line-height: 1;
        }
        /* FIX: today circle is behind the number using flex, no absolute overlap */
        .today-badge {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent-glow);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 11.5px; font-weight: 800;
          color: #fff; line-height: 1; flex-shrink: 0;
          animation: todayGlow 2.5s ease-in-out infinite;
        }
        @keyframes todayGlow {
          0%,100% { box-shadow: 0 0 10px var(--accent-glow); }
          50%     { box-shadow: 0 0 18px var(--accent-glow); }
        }

        /* Day order pill */
        .order-pill {
          font-family: var(--font-mono); font-size: 8.5px; font-weight: 700;
          padding: 1px 5px; border-radius: 4px; line-height: 1.4;
          white-space: nowrap;
        }

        /* ── Event pills ── */
        .event-pills {
          display: flex; flex-direction: column; gap: 2px; margin-top: auto;
        }
        .ev-pill {
          display: flex; align-items: center; gap: 3px;
          border-radius: 4px; padding: 2px 5px;
          border: 1px solid;
        }
        .ev-pill-dot {
          width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0;
        }
        .ev-pill-text {
          font-size: 8px; font-weight: 600;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 100%;
        }
        .ev-overflow {
          font-size: 8px; color: var(--text-4); padding-left: 4px;
        }

        /* ── DAY DETAIL PANEL ────────────────────── */
        .detail-panel {
          margin-top: 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--accent-border);
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          box-shadow: 0 4px 24px var(--accent-glow);
          animation: fadeUp .25s cubic-bezier(.16,1,.3,1) both;
        }
        .dp-top {
          display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
        }
        .dp-date-block {
          display: flex; align-items: baseline; gap: 6px; flex: 1;
        }
        .dp-day {
          font-family: var(--font-display); font-size: 30px; font-weight: 800;
          color: var(--accent-light); line-height: 1;
        }
        .dp-month { font-size: 14px; color: var(--text-2); font-weight: 500; }
        .dp-order {
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          padding: 3px 12px; border-radius: 20px;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          color: var(--accent-light);
        }
        .dp-close {
          width: 26px; height: 26px; border-radius: 7px;
          background: var(--bg-hover); border: 1px solid var(--border);
          color: var(--text-3); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .14s;
        }
        .dp-close:hover { color: var(--rose); border-color: var(--rose-border); background: var(--rose-dim); }
        .dp-events { display: flex; flex-wrap: wrap; gap: 8px; }
        .dp-ev-row {
          display: flex; align-items: center; gap: 10px;
          background: var(--ebg); border: 1px solid var(--ebdr);
          border-radius: var(--radius-md); padding: 10px 14px;
          flex: 1; min-width: 175px;
        }
        .dp-ev-icon  { font-size: 18px; flex-shrink: 0; }
        .dp-ev-name  { font-size: 13.5px; font-weight: 600; color: var(--ec); }
        .dp-ev-type  { font-size: 9.5px; color: var(--text-3); margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }
        .dp-empty    { font-size: 13px; color: var(--text-3); font-style: italic; }

        /* ── LIST VIEW ───────────────────────────── */
        .list-view { display: flex; flex-direction: column; gap: 18px; padding-top: 6px; }
        .list-month-hd {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-display); font-size: 14px; font-weight: 700;
          color: var(--text-1); margin-bottom: 8px;
          padding-bottom: 7px; border-bottom: 1px solid var(--border);
        }
        .list-current .list-month-hd { color: var(--accent-light); border-color: var(--accent-border); }
        .curr-chip {
          font-size: 9px; font-weight: 700; letter-spacing: .5px;
          background: var(--accent-dim); color: var(--accent-light);
          border: 1px solid var(--accent-border); padding: 2px 8px; border-radius: 10px;
        }
        .list-row {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px;
          background: var(--lbg, var(--bg-elevated));
          border: 1px solid var(--lbdr, var(--border));
          border-radius: var(--radius-md); margin-bottom: 5px;
          transition: transform .14s;
        }
        .list-row:hover { transform: translateX(4px); }
        .lr-date { text-align: center; flex-shrink: 0; width: 36px; }
        .lr-day  { font-family: var(--font-mono); font-size: 19px; font-weight: 700; color: var(--lc, var(--text-1)); line-height: 1; }
        .lr-mon  { font-size: 8.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: .5px; }
        .lr-icon { font-size: 17px; flex-shrink: 0; }
        .lr-info { flex: 1; }
        .lr-name { font-size: 13.5px; font-weight: 600; color: var(--text-1); }
        .lr-type { font-size: 10px; color: var(--text-3); margin-top: 2px; }
        .lr-badge {
          font-size: 9.5px; font-weight: 600; padding: 2px 9px;
          border-radius: 10px; background: var(--lbg); color: var(--lc);
          border: 1px solid var(--lbdr); flex-shrink: 0; white-space: nowrap;
        }

        /* ── MONTH SWITCHER ──────────────────────── */
        .month-switcher {
          display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;
        }
        .ms-btn {
          position: relative;
          padding: 6px 16px; border-radius: 9px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text-3); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: var(--font-body);
        }
        .ms-btn:hover { background: var(--bg-hover); color: var(--text-1); border-color: var(--border-strong); }
        .ms-active {
          background: var(--accent-dim) !important;
          border-color: var(--accent) !important;
          color: var(--accent-light) !important;
          box-shadow: 0 3px 12px var(--accent-glow);
        }
        .ms-curr { border-color: var(--accent-border) !important; }
        .ms-dot {
          position: absolute; top: 4px; right: 4px;
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--accent); box-shadow: 0 0 4px var(--accent-glow);
        }

        /* ── LEGEND ──────────────────────────────── */
        .legend-row {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          padding: 8px 2px; border-top: 1px solid var(--border);
        }
        .leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-3); }
        .leg-swatch { width: 8px; height: 8px; border-radius: 50%; }
        .leg-today-swatch {
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--accent); box-shadow: 0 0 6px var(--accent-glow);
        }

        /* ── RESPONSIVE ──────────────────────────── */
        @media (max-width: 700px) {
          .month-stats   { display: none; }
          .hdr-right     { margin-left: 0; }
          .day-cell      { min-height: 56px; padding: 4px 4px; }
          .ev-pill-text  { display: none; }
          .ev-pill       { padding: 0; width: 6px; height: 6px; border-radius: 50%; }
          .ev-pill-dot   { display: none; }
          .order-pill    { display: none; }
          .month-switcher { justify-content: flex-start; }
        }
        @media (max-width: 480px) {
          .page       { padding: 12px 10px 40px; }
          .month-name { font-size: 20px; }
          .top-brand  { display: none; }
          .day-cell   { min-height: 44px; }
          .day-num    { font-size: 10px; }
          .today-badge { width: 18px; height: 18px; font-size: 10px; }
        }
      `}</style>
    </>
  );
}