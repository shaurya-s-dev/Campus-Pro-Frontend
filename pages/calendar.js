import { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const AuroraBackground = dynamic(() => import('@/components/AuroraBackground'), { ssr: false });

/* ════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════ */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENT_TYPES = {
  holiday: { label:'Holiday',    color:'#f43f5e', bg:'rgba(244,63,94,0.10)',  border:'rgba(244,63,94,0.22)',  icon:'🏖'  },
  exam:    { label:'Exam / Test',color:'#f59e0b', bg:'rgba(245,158,11,0.10)', border:'rgba(245,158,11,0.22)', icon:'📝'  },
  special: { label:'Special Day',color:'#10b981', bg:'rgba(16,185,129,0.10)', border:'rgba(16,185,129,0.22)', icon:'⭐' },
};

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
      17:'D1',19:'D2',20:'D3',21:'D4',22:'D5',
      23:'D1',24:'D2',
      27:'D3',28:'D4',29:'D5',30:'D1',31:'D2',
    },
  },
  'February 2026': {
    events: [
      { date: 2,  type: 'exam',    label: 'CAT-1 Begins'             },
      { date: 14, type: 'special', label: "Valentine's / Techno Day" },
      { date: 19, type: 'special', label: "SRM Founders' Day"        },
      { date: 26, type: 'exam',    label: 'CAT-2 Prep Week'          },
    ],
    dayOrders: {
      2:'D3', 3:'D4', 4:'D5', 5:'D1', 6:'D2',
      7:'D3', 9:'D4',10:'D5',11:'D1',12:'D2',
      13:'D3',14:'D4',16:'D5',17:'D1',18:'D2',
      19:'D3',20:'D4',21:'D5',23:'D1',24:'D2',
      25:'D3',26:'D4',27:'D5',28:'D1',
    },
  },
  'March 2026': {
    events: [
      { date: 2,  type: 'exam',    label: 'CAT-2 Begins' },
      { date: 18, type: 'holiday', label: 'Holi' },
      { date: 19, type: 'holiday', label: "Telugu New Year's Day" },
      { date: 25, type: 'exam',    label: 'CAT-2 Ends' },
    ],
    dayOrders: {
      2:'D2', 3:'D3', 4:'D4', 5:'D5', 6:'D1',
      7:'D2', 9:'D3',10:'D4',11:'D5',12:'D1',
      13:'D2',16:'D3',17:'D4',
      20:'D2',
      21:'D3',23:'D4',24:'D5',
      25:'D1',
      26:'D2',27:'D3',28:'D4',30:'D5',31:'D1',
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
      2:'D2',
      4:'D3', 6:'D4', 7:'D5', 8:'D1', 9:'D2',
      10:'D3',13:'D4',
      15:'D5',16:'D1',17:'D2',20:'D3',
      21:'D4',
      22:'D5',23:'D1',24:'D2',27:'D3',28:'D4',
      29:'D5',30:'D1',
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
   PURE HELPERS
   ════════════════════════════════════════════════════ */
function parseMonthKey(str) {
  const [m, y] = str.split(' ');
  return new Date(parseInt(y, 10), MONTH_NAMES.indexOf(m), 1);
}
function daysInMonth(year, month)  { return new Date(year, month + 1, 0).getDate(); }
function firstWeekday(year, month) { return new Date(year, month, 1).getDay(); }
function todayMonthKey() {
  const n = new Date();
  return `${MONTH_NAMES[n.getMonth()]} ${n.getFullYear()}`;
}
function todayDate() { return new Date().getDate(); }

function buildUpcoming(count = 8) {
  const now = new Date(); now.setHours(0,0,0,0);
  const all = [];
  MONTHS.forEach(key => {
    const base = parseMonthKey(key);
    (CALENDAR_DATA[key]?.events || []).forEach(ev => {
      const d = new Date(base.getFullYear(), base.getMonth(), ev.date);
      d.setHours(0,0,0,0);
      if (d >= now) all.push({ ...ev, monthKey: key, evDate: d });
    });
  });
  all.sort((a, b) => a.evDate - b.evDate);
  return all.slice(0, count);
}

/* ════════════════════════════════════════════════════
   DAY DETAIL PANEL
   NOTE: Defined outside but rendered inline inside
   CalendarPage so styled-jsx scoping applies.
   ════════════════════════════════════════════════════ */
function renderDayDetail(day, monthKey, onClose) {
  if (!day || !monthKey) return null;
  const data   = CALENDAR_DATA[monthKey] || {};
  const events = (data.events || []).filter(e => e.date === day);
  const order  = data.dayOrders?.[day];
  return { day, events, order };
}

/* ════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════ */
export default function CalendarPage() {
  const TODAY_KEY  = useMemo(todayMonthKey, []);
  const TODAY_DATE = useMemo(todayDate, []);

  const initialMonth = useMemo(() => {
    if (CALENDAR_DATA[TODAY_KEY]) return TODAY_KEY;
    return MONTHS.find(m => parseMonthKey(m) >= parseMonthKey(TODAY_KEY)) ?? MONTHS.at(-1);
  }, [TODAY_KEY]);

  const [activeMonth, setActiveMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState(() =>
    CALENDAR_DATA[TODAY_KEY] ? TODAY_DATE : null
  );
  const [view, setView] = useState('month');
  const [anim, setAnim] = useState(null);

  const activeDate  = useMemo(() => parseMonthKey(activeMonth), [activeMonth]);
  const year        = activeDate.getFullYear();
  const month       = activeDate.getMonth();
  const totalDays   = useMemo(() => daysInMonth(year, month), [year, month]);
  const startDay    = useMemo(() => firstWeekday(year, month), [year, month]);
  const monthData   = CALENDAR_DATA[activeMonth] || {};
  const activeIdx   = MONTHS.indexOf(activeMonth);
  const isThisMonth = activeMonth === TODAY_KEY;

  const stats = useMemo(() => ({
    working:  Object.keys(monthData.dayOrders || {}).length,
    holidays: (monthData.events || []).filter(e => e.type === 'holiday').length,
    exams:    (monthData.events || []).filter(e => e.type === 'exam').length,
  }), [monthData]);

  const progress = isThisMonth ? Math.round((TODAY_DATE / totalDays) * 100) : 0;

  /* Upcoming — computed once */
  const upcomingItems = useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0);
    return buildUpcoming(8).map(ev => {
      const diff = Math.round((ev.evDate - now) / 86_400_000);
      return {
        ...ev,
        diff,
        diffLabel: diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`,
        t: EVENT_TYPES[ev.type] || EVENT_TYPES.special,
      };
    });
  }, []);

  /* Day detail data */
  const detailData = useMemo(() => {
    if (!selectedDay) return null;
    const data   = CALENDAR_DATA[activeMonth] || {};
    const events = (data.events || []).filter(e => e.date === selectedDay);
    const order  = data.dayOrders?.[selectedDay];
    return { events, order };
  }, [selectedDay, activeMonth]);

  const goToMonth = useCallback((idx) => {
    if (idx < 0 || idx >= MONTHS.length) return;
    setAnim(idx > activeIdx ? 'left' : 'right');
    // Note: timeout is short (180ms) so unmount risk is negligible;
    // Next.js route changes would unmount before this fires, which is safe.
    const t = setTimeout(() => {
      setActiveMonth(MONTHS[idx]);
      setSelectedDay(null);
      setAnim(null);
    }, 180);
    return () => clearTimeout(t);
  }, [activeIdx]);

  const navigate  = useCallback((delta) => goToMonth(activeIdx + delta), [activeIdx, goToMonth]);
  const goToday   = useCallback(() => {
    if (CALENDAR_DATA[TODAY_KEY]) {
      goToMonth(MONTHS.indexOf(TODAY_KEY));
      setTimeout(() => setSelectedDay(TODAY_DATE), 220);
    }
  }, [TODAY_KEY, TODAY_DATE, goToMonth]);

  const isToday = (d) => isThisMonth && d === TODAY_DATE;
  const isPast  = (d) => {
    if (!isThisMonth) return parseMonthKey(activeMonth) < parseMonthKey(TODAY_KEY);
    return d < TODAY_DATE;
  };

  return (
    <>
      <Head><title>Academic Calendar — CampusPro</title></Head>

      <AuroraBackground />

      <div className="page" style={{ position: 'relative', zIndex: 1 }}>

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

        {/* ══════════════════════════════════════
            TWO-COLUMN LAYOUT
            Left: Upcoming sidebar
            Right: Calendar card
            ══════════════════════════════════════ */}
        <div className="body-cols">

          {/* ── LEFT: UPCOMING SIDEBAR ──────────── */}
          <div className="sidebar-panel">

            {/* Header */}
            <div className="sp-hd">
              <div className="sp-hd-left">
                <div className="sp-hd-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <span className="sp-hd-title">Upcoming</span>
              </div>
              <div className="sp-hd-count">{upcomingItems.length}</div>
            </div>

            {/* Timeline list */}
            <div className="sp-list">
              {upcomingItems.length === 0 && (
                <div className="sp-empty">
                  <div className="sp-empty-icon">✓</div>
                  <div>No upcoming events</div>
                </div>
              )}

              {upcomingItems.map((ev, i) => {
                const isFirst = i === 0;
                const isLast  = i === upcomingItems.length - 1;
                return (
                  <div key={i} className={`tl-item${isFirst ? ' tl-first' : ''}`}>
                    {/* Vertical timeline connector */}
                    <div className="tl-spine">
                      <div className="tl-dot" style={{ background: ev.t.color, borderColor: ev.t.border }} />
                      {!isLast && <div className="tl-line" />}
                    </div>

                    {/* Card */}
                    <div className="tl-card" style={{ '--ec': ev.t.color, '--ebg': ev.t.bg, '--ebdr': ev.t.border }}>
                      {/* Type strip on left */}
                      <div className="tl-type-strip" style={{ background: ev.t.color }} />

                      <div className="tl-body">
                        {/* Top row: label + countdown */}
                        <div className="tl-top">
                          <div className="tl-name">{ev.label}</div>
                          <div className="tl-count" style={{ color: ev.t.color }}>
                            {ev.diffLabel}
                          </div>
                        </div>

                        {/* Bottom row: date + type */}
                        <div className="tl-meta">
                          <div className="tl-date-pill">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            {ev.monthKey.split(' ')[0].slice(0,3)} {ev.date}
                          </div>
                          <div className="tl-type-badge" style={{ color: ev.t.color, background: ev.t.bg }}>
                            {ev.t.icon} {ev.t.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="sp-legend">
              <div className="sp-legend-title">Legend</div>
              {Object.entries(EVENT_TYPES).map(([key, t]) => (
                <div key={key} className="leg-item">
                  <div className="leg-swatch" style={{ background: t.color }} />
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: CALENDAR CARD ────────────── */}
          <div className="cal-col">
            <div className="cal-card">

              {/* Calendar header */}
              <div className="cal-header">
                <div className="cal-nav">
                  <button className="nav-btn" onClick={() => navigate(-1)} disabled={activeIdx === 0} aria-label="Previous month">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <div className="month-title">
                    <h2 className="month-name">{activeMonth.split(' ')[0]}</h2>
                    <span className="year-label">{activeMonth.split(' ')[1]}</span>
                  </div>
                  <button className="nav-btn" onClick={() => navigate(1)} disabled={activeIdx === MONTHS.length - 1} aria-label="Next month">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>

                {/* Stats */}
                <div className="month-stats">
                  <div className="ms-pill"><div className="ms-val ms-blue">{stats.working}</div><div className="ms-lbl">Working</div></div>
                  <div className="ms-pill"><div className="ms-val ms-red">{stats.holidays}</div><div className="ms-lbl">Holidays</div></div>
                  <div className="ms-pill"><div className="ms-val ms-amber">{stats.exams}</div><div className="ms-lbl">Exams</div></div>
                </div>

                {/* Controls */}
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

              {/* Month progress */}
              {isThisMonth && (
                <div className="progress-strip">
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width:`${progress}%` }} />
                  </div>
                  <span className="prog-label">Day {TODAY_DATE} of {totalDays} · {progress}% through {activeMonth.split(' ')[0]}</span>
                </div>
              )}

              {/* ── MONTH VIEW ── */}
              {view === 'month' && (
                <>
                  {/* Day headers */}
                  <div className="dow-row">
                    {DAY_LABELS.map((d, i) => (
                      <div key={d} className={`dow-cell${i===0||i===6?' dow-wknd':''}`}>{d}</div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className={`cal-grid${anim==='left'?' anim-l':anim==='right'?' anim-r':''}`}>
                    {Array.from({ length: startDay }, (_, i) => (
                      <div key={`e${i}`} className="day-empty" />
                    ))}

                    {Array.from({ length: totalDays }, (_, i) => {
                      const d        = i + 1;
                      const events   = (monthData.events || []).filter(e => e.date === d);
                      const order    = monthData.dayOrders?.[d];
                      const weekDay  = new Date(year, month, d).getDay();
                      const isWknd   = weekDay === 0 || weekDay === 6;
                      const isHol    = events.some(e => e.type === 'holiday');
                      const isExam   = events.some(e => e.type === 'exam');
                      const today    = isToday(d);
                      const selected = selectedDay === d;
                      const past     = isPast(d) && !today;
                      const firstEvt = events[0]?.type;
                      const accentClr= firstEvt ? EVENT_TYPES[firstEvt].color : null;

                      const cls = [
                        'day-cell',
                        today    && 'is-today',
                        selected && 'is-sel',
                        isWknd   && 'is-wknd',
                        isHol    && 'is-hol',
                        isExam   && 'is-exam',
                        past     && 'is-past',
                      ].filter(Boolean).join(' ');

                      return (
                        <div
                          key={d}
                          className={cls}
                          onClick={() => setSelectedDay(selected ? null : d)}
                          style={accentClr && !today ? { '--ca': accentClr } : undefined}
                        >
                          {/* Number row */}
                          <div className="dn-row">
                            {today ? (
                              <div className="today-pill">{d}</div>
                            ) : (
                              <span className="day-num">{d}</span>
                            )}
                            {order && !isHol && (
                              <span className={`order-tag ${isExam ? 'ot-exam' : 'ot-reg'}`}>
                                {order}
                              </span>
                            )}
                          </div>

                          {/* Event pills */}
                          {events.length > 0 && (
                            <div className="ev-pills">
                              {events.slice(0, 2).map((ev, ei) => {
                                const t = EVENT_TYPES[ev.type];
                                return (
                                  <div key={ei} className="ev-pill"
                                    style={{ background: t.color+'18', color: t.color, borderColor: t.color+'33' }}
                                  >
                                    <span className="ev-dot" style={{ background: t.color }} />
                                    <span className="ev-text">{ev.label}</span>
                                  </div>
                                );
                              })}
                              {events.length > 2 && <div className="ev-more">+{events.length-2}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Day detail panel */}
                  {selectedDay && detailData && (
                    <div className="detail-panel">
                      <div className="dp-top">
                        <div className="dp-date">
                          <span className="dp-daynum">{selectedDay}</span>
                          <span className="dp-month">{activeMonth.split(' ')[0]}</span>
                        </div>
                        {detailData.order && (
                          <div className="dp-order">{detailData.order}</div>
                        )}
                        <button className="dp-close" onClick={() => setSelectedDay(null)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                      {detailData.events.length > 0 ? (
                        <div className="dp-events">
                          {detailData.events.map((ev, i) => {
                            const t = EVENT_TYPES[ev.type] || EVENT_TYPES.special;
                            return (
                              <div key={i} className="dp-ev"
                                style={{ background: t.bg, borderColor: t.border }}
                              >
                                <span className="dp-icon">{t.icon}</span>
                                <div>
                                  <div className="dp-name" style={{ color: t.color }}>{ev.label}</div>
                                  <div className="dp-type">{t.label}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="dp-empty">
                          {detailData.order ? '📚 Regular class day' : 'No events scheduled'}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── LIST VIEW ── */}
              {view === 'list' && (
                <div className="list-view">
                  {MONTHS.map(m => {
                    const evts = CALENDAR_DATA[m]?.events || [];
                    if (!evts.length) return null;
                    const isCurr = m === TODAY_KEY;
                    return (
                      <div key={m} className={`list-month${isCurr?' lm-curr':''}`}>
                        <div className="lm-hd">
                          {m}
                          {isCurr && <span className="lm-chip">Current</span>}
                        </div>
                        {evts.map((ev, i) => {
                          const t = EVENT_TYPES[ev.type] || EVENT_TYPES.special;
                          return (
                            <div key={i} className="lr" style={{ background: t.bg, borderColor: t.border }}>
                              <div className="lr-date">
                                <div className="lr-day">{ev.date}</div>
                                <div className="lr-mon">{m.split(' ')[0].slice(0,3)}</div>
                              </div>
                              <span className="lr-icon">{t.icon}</span>
                              <div className="lr-info">
                                <div className="lr-name">{ev.label}</div>
                                <div className="lr-type">{t.label}</div>
                              </div>
                              <div className="lr-badge" style={{ color: t.color, background: t.bg, borderColor: t.border }}>{t.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Month switcher */}
            <div className="month-switcher">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  className={`ms-btn${m===activeMonth?' ms-on':''}${m===TODAY_KEY?' ms-curr':''}`}
                  onClick={() => goToMonth(i)}
                >
                  {m.split(' ')[0].slice(0,3)}
                  {m === TODAY_KEY && <span className="ms-dot" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { background: #05060f; overflow-x: hidden; }
        @keyframes floatBlob1  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-28px) scale(1.06)} 66%{transform:translate(-24px,18px) scale(0.96)} }
        @keyframes floatBlob2  { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-35px,22px) scale(1.04)} 70%{transform:translate(28px,-15px) scale(0.98)} }
        @keyframes floatBlob3  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.07)} }
        @keyframes floatBlob4 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px, -40px) scale(1.08); } }
        @keyframes gridDrift   { from{transform:translateY(0)} to{transform:translateY(48px)} }
        @keyframes gridFade    { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes slowSpin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        
        .dash-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
        .dash-bg::before { content:''; position:absolute; width:900px; height:900px; top:50%; left:50%; transform:translate(-50%,-50%); border-radius:50%; background:conic-gradient(from 0deg,transparent 0%,rgba(99,102,241,0.03) 25%,transparent 50%,rgba(34,211,238,0.03) 75%,transparent 100%); animation:slowSpin 40s linear infinite; pointer-events:none; }
        .dash-bg-grid { position:absolute; inset:-100px; background-image:radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px); background-size:28px 28px; animation:gridDrift 14s linear infinite, gridFade 8s ease-in-out infinite; }
        .dash-blob-1 { position:absolute; width:700px; height:700px; top:-200px; left:-180px; border-radius:50%; background:radial-gradient(circle at 40% 40%, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.04) 45%, transparent 70%); filter:blur(60px); animation:floatBlob1 20s ease-in-out infinite; will-change:transform; }
        .dash-blob-2 { position:absolute; width:600px; height:600px; bottom:-150px; right:-150px; border-radius:50%; background:radial-gradient(circle at 60% 60%, rgba(34,211,238,0.07) 0%, rgba(34,211,238,0.03) 45%, transparent 70%); filter:blur(55px); animation:floatBlob2 24s ease-in-out infinite; will-change:transform; }
        .dash-blob-3 { position:absolute; width:420px; height:420px; top:38%; left:52%; border-radius:50%; background:radial-gradient(circle at 50% 50%, rgba(167,139,250,0.07) 0%, rgba(167,139,250,0.03) 50%, transparent 70%); filter:blur(50px); animation:floatBlob3 16s ease-in-out infinite 4s; will-change:transform; }
        .dash-blob-4 { position:absolute; width:300px; height:300px; top:60%; left:20%; border-radius:50%; background:radial-gradient(circle at 50% 50%, rgba(244,63,94,0.05) 0%, transparent 70%); filter:blur(50px); animation:floatBlob4 22s ease-in-out infinite 8s; will-change:transform; }
        .dash-bg-vignette { position:absolute; inset:0; background:radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(4,5,13,0.5) 100%); }
        
        @media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }
      `}</style>

      <style jsx>{`
        /* ── PAGE SHELL ────────────────────────── */
        .page {
          position: relative; z-index: 1;
          max-width: 1300px; margin: 0 auto;
          padding: 20px 20px 48px;
          display: flex; flex-direction: column; gap: 12px;
        }

        /* ── TOP BAR ──────────────────────────── */
        .top-bar {
          display: flex; align-items: center; gap: 12px;
        }
        .back-btn {
          display: flex; align-items: center; gap: 5px;
          color: var(--text-3); font-size: 12.5px;
          padding: 6px 12px 6px 8px; border-radius: var(--radius-sm);
          transition: all .15s; white-space: nowrap; text-decoration: none;
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
        }
        .top-brand strong { color: var(--accent-light); }
        .semester-chip {
          margin-left: auto;
          font-size: 10.5px; color: var(--text-3);
          background: var(--bg-elevated); border: 1px solid var(--border);
          padding: 5px 12px; border-radius: 20px;
        }

        /* ── TWO-COLUMN BODY ─────────────────── */
        .body-cols {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 14px;
          align-items: start;
        }

        /* ── UPCOMING SIDEBAR PANEL ──────────── */
        .sidebar-panel {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-xl);
          padding: 16px 14px 14px;
          backdrop-filter: blur(20px);
          display: flex; flex-direction: column; gap: 12px;
          position: sticky; top: 20px;
          max-height: calc(100vh - 80px);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        /* Header */
        .sp-hd {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }
        .sp-hd-left { display: flex; align-items: center; gap: 8px; }
        .sp-hd-icon {
          width: 24px; height: 24px; border-radius: 7px;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-light);
        }
        .sp-hd-title {
          font-family: var(--font-display); font-size: 13px; font-weight: 700;
          color: var(--text-1); letter-spacing: -.2px;
        }
        .sp-hd-count {
          font-family: var(--font-mono); font-size: 11px; font-weight: 700;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          color: var(--accent-light); padding: 2px 8px; border-radius: 20px;
        }

        /* Scrollable timeline list */
        .sp-list {
          display: flex; flex-direction: column;
          overflow-y: auto; flex: 1;
          padding-right: 2px;
        }
        .sp-list::-webkit-scrollbar { width: 3px; }
        .sp-list::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }

        .sp-empty {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 28px 0; color: var(--text-4); font-size: 12px;
        }
        .sp-empty-icon {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--emerald-dim); border: 1px solid var(--emerald-border);
          color: var(--emerald); display: flex; align-items: center; justify-content: center;
          font-size: 13px;
        }

        /* ── Timeline item ── */
        .tl-item {
          display: flex; gap: 10px; padding: 5px 0;
        }
        .tl-first { padding-top: 0; }

        /* Vertical spine */
        .tl-spine {
          display: flex; flex-direction: column; align-items: center;
          flex-shrink: 0; width: 14px;
          padding-top: 6px;
        }
        .tl-dot {
          width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid; flex-shrink: 0;
          box-shadow: 0 0 0 2px var(--bg-void);
        }
        .tl-line {
          width: 1.5px; flex: 1; min-height: 12px;
          background: var(--border); margin-top: 3px;
        }

        /* Card */
        .tl-card {
          flex: 1; min-width: 0;
          display: flex; overflow: hidden;
          border-radius: 9px;
          background: var(--bg-elevated);
          border: 1px solid var(--card-border);
          margin-bottom: 6px;
          transition: border-color .14s, background .14s;
        }
        .tl-card:hover { background: var(--bg-overlay); border-color: var(--ebdr, var(--border-strong)); }

        .tl-type-strip { width: 3px; flex-shrink: 0; }

        .tl-body { flex: 1; min-width: 0; padding: 8px 10px; }

        .tl-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 6px; margin-bottom: 5px;
        }
        .tl-name {
          font-size: 11.5px; font-weight: 600; color: var(--text-1);
          line-height: 1.3; flex: 1; min-width: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .tl-count {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          white-space: nowrap; flex-shrink: 0;
        }

        .tl-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .tl-date-pill {
          display: flex; align-items: center; gap: 4px;
          font-family: var(--font-mono); font-size: 9px; font-weight: 600;
          color: var(--text-3); background: var(--bg-surface);
          border: 1px solid var(--border); border-radius: 4px; padding: 2px 6px;
        }
        .tl-type-badge {
          font-size: 9px; font-weight: 600;
          padding: 2px 6px; border-radius: 4px;
        }

        /* Legend */
        .sp-legend {
          border-top: 1px solid var(--border);
          padding-top: 10px;
          display: flex; flex-direction: column; gap: 5px;
          flex-shrink: 0;
        }
        .sp-legend-title {
          font-size: 9px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: var(--text-5); margin-bottom: 3px;
        }
        .leg-item  { display: flex; align-items: center; gap: 7px; font-size: 10.5px; color: var(--text-3); }
        .leg-swatch { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* ── CALENDAR COLUMN ─────────────────── */
        .cal-col { display: flex; flex-direction: column; gap: 10px; }

        /* ── CALENDAR CARD ───────────────────── */
        .cal-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-xl);
          padding: 18px 18px 14px;
          backdrop-filter: blur(20px);
          box-shadow: var(--shadow-sm);
        }

        /* ── HEADER ──────────────────────────── */
        .cal-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 12px; flex-wrap: wrap;
        }
        .cal-nav { display: flex; align-items: center; gap: 8px; }
        .nav-btn {
          width: 28px; height: 28px; border-radius: 7px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text-2); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .13s;
        }
        .nav-btn:hover:not(:disabled) { background: var(--bg-overlay); border-color: var(--border-strong); color: var(--text-1); }
        .nav-btn:disabled { opacity: .28; cursor: not-allowed; }
        .month-title { display: flex; align-items: baseline; gap: 6px; }
        .month-name { font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--text-1); letter-spacing: -.4px; }
        .year-label { font-family: var(--font-mono); font-size: 12px; color: var(--text-3); }

        /* Stats */
        .month-stats { display: flex; gap: 6px; }
        .ms-pill {
          display: flex; flex-direction: column; align-items: center;
          padding: 6px 12px; border-radius: var(--radius-md);
          background: var(--bg-elevated); border: 1px solid var(--border); min-width: 56px;
        }
        .ms-val  { font-family: var(--font-mono); font-size: 16px; font-weight: 700; }
        .ms-blue { color: var(--accent-light); }
        .ms-red  { color: var(--rose); }
        .ms-amber{ color: var(--amber); }
        .ms-lbl  { font-size: 8px; color: var(--text-3); text-transform: uppercase; letter-spacing: .6px; margin-top: 1px; }

        .hdr-right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
        .view-toggle { display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .vt-btn { padding: 5px 12px; background: none; border: none; color: var(--text-3); font-size: 12px; cursor: pointer; transition: all .13s; font-family: var(--font-body); }
        .vt-btn:hover { color: var(--text-1); background: var(--bg-hover); }
        .vt-on  { background: var(--accent-dim) !important; color: var(--accent-light) !important; font-weight: 600; }
        .today-btn {
          padding: 5px 12px; border-radius: 8px;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          color: var(--accent-light); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .13s; font-family: var(--font-body);
        }
        .today-btn:hover { background: var(--bg-active); }

        /* Progress */
        .progress-strip { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .prog-track { flex: 1; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .prog-fill  { height: 100%; background: linear-gradient(90deg, var(--accent), #22d3ee); border-radius: 2px; transition: width .6s ease; }
        .prog-label { font-size: 10px; color: var(--text-3); white-space: nowrap; font-family: var(--font-mono); }

        /* ── DOW HEADER ──────────────────────── */
        .dow-row { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 3px; }
        .dow-cell { text-align: center; font-size: 9px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: var(--text-3); padding: 5px 0; }
        .dow-wknd { color: rgba(244,63,94,.5); }

        /* ── GRID ────────────────────────────── */
        .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
        .anim-l { animation: slideL .18s ease both; }
        .anim-r { animation: slideR .18s ease both; }
        @keyframes slideL { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideR { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }

        .day-empty { min-height: 80px; }

        /* ── DAY CELL ── */
        .day-cell {
          min-height: 80px;
          border-radius: 8px;
          padding: 6px 6px 5px;
          background: rgba(255,255,255,0.018);
          border: 1px solid transparent;
          cursor: pointer;
          display: flex; flex-direction: column; gap: 3px;
          transition: background .13s, border-color .13s, transform .15s;
          overflow: hidden;
        }
        .day-cell.is-hol  { background: rgba(244,63,94,0.055); border-left: 2px solid rgba(244,63,94,0.28); }
        .day-cell.is-exam { background: rgba(245,158,11,0.045); border-left: 2px solid rgba(245,158,11,0.28); }
        .day-cell.is-wknd { opacity: .60; }
        .day-cell.is-past { opacity: .35; }
        .day-cell.is-today {
          background: rgba(99,102,241,0.12) !important;
          border-color: rgba(99,102,241,0.35) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.28);
        }
        .day-cell.is-sel {
          background: rgba(99,102,241,0.16) !important;
          border-color: var(--accent-light) !important;
          transform: scale(1.03); z-index: 2;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .day-cell:hover:not(.is-today):not(.is-sel) {
          background: var(--bg-elevated);
          border-color: var(--border-strong);
          transform: scale(1.025); z-index: 2;
        }

        /* Number row */
        .dn-row { display: flex; align-items: center; justify-content: space-between; gap: 3px; }
        .day-num {
          font-family: var(--font-mono); font-size: 12px; font-weight: 600;
          color: var(--text-2); line-height: 1;
        }
        .today-pill {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 10.5px; font-weight: 800;
          color: #fff; line-height: 1; flex-shrink: 0;
        }
        .order-tag {
          font-family: var(--font-mono); font-size: 8.5px; font-weight: 800;
          padding: 1.5px 5.5px; border-radius: 5px; line-height: 1.2; white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          border: 1px solid transparent;
        }
        .ot-reg  { background: var(--accent-dim); color: var(--accent-light); border-color: var(--accent-border); }
        .ot-exam { background: var(--amber-dim); color: var(--amber); border-color: var(--amber-border); }

        /* Event pills */
        .ev-pills { display: flex; flex-direction: column; gap: 2px; margin-top: auto; }
        .ev-pill  { display: flex; align-items: center; gap: 3px; border-radius: 3px; padding: 2px 4px; border: 1px solid; }
        .ev-dot   { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
        .ev-text  { font-size: 7.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .ev-more  { font-size: 8px; color: var(--text-4); padding-left: 3px; }

        /* ── DAY DETAIL PANEL ────────────────── */
        .detail-panel {
          margin-top: 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--accent-border);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          box-shadow: var(--shadow-md);
          animation: fadeUp .22s cubic-bezier(.16,1,.3,1) both;
        }
        .dp-top  { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .dp-date { display: flex; align-items: baseline; gap: 5px; flex: 1; }
        .dp-daynum { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--accent-light); line-height: 1; }
        .dp-month  { font-size: 13px; color: var(--text-2); font-weight: 500; }
        .dp-order  {
          font-family: var(--font-mono); font-size: 11px; font-weight: 700;
          padding: 3px 12px; border-radius: 20px;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          color: var(--accent-light);
          box-shadow: 0 0 12px var(--accent-glow);
        }
        .dp-close {
          width: 24px; height: 24px; border-radius: 6px;
          background: var(--bg-hover); border: 1px solid var(--border);
          color: var(--text-3); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all .13s;
        }
        .dp-close:hover { color: var(--rose); border-color: var(--rose-border); background: var(--rose-dim); }
        .dp-events { display: flex; flex-wrap: wrap; gap: 7px; }
        .dp-ev {
          display: flex; align-items: center; gap: 9px;
          border: 1px solid; border-radius: var(--radius-md);
          padding: 9px 12px; flex: 1; min-width: 160px;
        }
        .dp-icon  { font-size: 16px; flex-shrink: 0; }
        .dp-name  { font-size: 13px; font-weight: 600; }
        .dp-type  { font-size: 9.5px; color: var(--text-3); margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }
        .dp-empty { font-size: 12.5px; color: var(--text-3); font-style: italic; }

        /* ── LIST VIEW ───────────────────────── */
        .list-view { display: flex; flex-direction: column; gap: 16px; padding-top: 6px; }
        .lm-hd {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-display); font-size: 13.5px; font-weight: 700;
          color: var(--text-1); margin-bottom: 7px;
          padding-bottom: 6px; border-bottom: 1px solid var(--border);
        }
        .lm-curr .lm-hd { color: var(--accent-light); border-color: var(--accent-border); }
        .lm-chip {
          font-size: 9px; font-weight: 700; letter-spacing: .5px;
          background: var(--accent-dim); color: var(--accent-light);
          border: 1px solid var(--accent-border); padding: 2px 7px; border-radius: 10px;
        }
        .lr {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border: 1px solid;
          border-radius: var(--radius-md); margin-bottom: 4px; transition: transform .13s;
        }
        .lr:hover { transform: translateX(3px); }
        .lr-date { text-align: center; flex-shrink: 0; width: 34px; }
        .lr-day  { font-family: var(--font-mono); font-size: 17px; font-weight: 700; line-height: 1; }
        .lr-mon  { font-size: 8px; color: var(--text-3); text-transform: uppercase; letter-spacing: .5px; }
        .lr-icon { font-size: 15px; flex-shrink: 0; }
        .lr-info { flex: 1; }
        .lr-name { font-size: 13px; font-weight: 600; color: var(--text-1); }
        .lr-type { font-size: 10px; color: var(--text-3); margin-top: 2px; }
        .lr-badge { font-size: 9.5px; font-weight: 600; padding: 2px 9px; border-radius: 10px; border: 1px solid; flex-shrink: 0; white-space: nowrap; }

        /* ── MONTH SWITCHER ──────────────────── */
        .month-switcher { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; }
        .ms-btn {
          position: relative; padding: 5px 14px; border-radius: 8px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text-3); font-size: 11.5px; font-weight: 600;
          cursor: pointer; transition: all .14s; font-family: var(--font-body);
        }
        .ms-btn:hover { background: var(--bg-hover); color: var(--text-1); border-color: var(--border-strong); }
        .ms-on  { background: var(--accent-dim) !important; border-color: var(--accent) !important; color: var(--accent-light) !important; }
        .ms-curr { border-color: var(--accent-border) !important; }
        .ms-dot {
          position: absolute; top: 3px; right: 3px;
          width: 4px; height: 4px; border-radius: 50%; background: var(--accent);
        }

        /* ── RESPONSIVE ──────────────────────── */
        @media (max-width: 900px) {
          .body-cols { grid-template-columns: 1fr; }
          .sidebar-panel { position: static; max-height: none; overflow: visible; }
          .sp-list { max-height: 220px; overflow-y: auto; }
        }
        @media (max-width: 640px) {
          .month-stats { display: none; }
          .day-cell { min-height: 54px; padding: 4px 3px; }
          .ev-text  { display: none; }
          .ev-pill  { width: 5px; height: 5px; border-radius: 50%; padding: 0; border: none; }
          .ev-dot   { display: none; }
          .order-tag { display: none; }
          .month-name { font-size: 20px; }
        }
        @media (max-width: 420px) {
          .page      { padding: 10px 10px 36px; }
          .top-brand { display: none; }
          .day-cell  { min-height: 42px; }
        }
      `}</style>
    </>
  );
}