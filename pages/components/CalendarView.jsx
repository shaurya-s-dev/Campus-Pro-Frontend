import { useState, useCallback, useMemo } from 'react';

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

const ACADEMIC_CALENDAR_MAP = {
  '2026-01-14': null, '2026-01-15': null, '2026-01-16': null, '2026-01-26': null,
  '2026-03-18': null, '2026-03-19': null,
  '2026-04-01': null, '2026-04-03': null, '2026-04-14': null,
  '2026-05-01': null,
};

const isWorkingDay = (date) => {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  if (ACADEMIC_CALENDAR_MAP[ds] === null) return false;
  return true;
};

const getDynamicDayOrder = (date) => {
  if (!isWorkingDay(date)) return null;
  const semStart = new Date('2026-01-13');
  let count = 0;
  const d = new Date(semStart);
  while (d < date) {
    if (isWorkingDay(d)) count++;
    d.setDate(d.getDate() + 1);
  }
  return (count % 5) + 1;
};

const CALENDAR_DATA = {
  'January 2026': {
    events: [
      { date: 1,  type: 'holiday', label: "New Year's Day"    },
      { date: 14, type: 'holiday', label: 'Pongal'            },
      { date: 15, type: 'holiday', label: 'Thiruvalluvar Day'  },
      { date: 16, type: 'holiday', label: 'Uzhavar Thirunal'  },
      { date: 26, type: 'holiday', label: 'Republic Day'       },
    ]
  },
  'February 2026': {
    events: [
      { date: 2,  type: 'exam',    label: 'CAT-1 Begins'             },
      { date: 14, type: 'special', label: "Valentine's / Techno Day" },
      { date: 19, type: 'special', label: "SRM Founders' Day"        },
      { date: 26, type: 'exam',    label: 'CAT-2 Prep Week'          },
    ]
  },
  'March 2026': {
    events: [
      { date: 2,  type: 'exam',    label: 'CAT-2 Begins' },
      { date: 18, type: 'holiday', label: 'Holi' },
      { date: 19, type: 'holiday', label: "Telugu New Year's Day" },
      { date: 25, type: 'exam',    label: 'CAT-2 Ends' },
    ]
  },
  'April 2026': {
    events: [
      { date: 1,  type: 'holiday', label: 'Tamil New Year / Ugadi' },
      { date: 3,  type: 'holiday', label: 'Good Friday'             },
      { date: 14, type: 'holiday', label: 'Dr. Ambedkar Jayanti'   },
      { date: 21, type: 'exam',    label: 'Model Exams Begin'       },
      { date: 30, type: 'exam',    label: 'Last Day of Instruction' },
    ]
  },
  'May 2026': {
    events: [
      { date: 1,  type: 'holiday', label: 'Labour Day'               },
      { date: 4,  type: 'exam',    label: 'End Semester Exams Begin'  },
      { date: 25, type: 'exam',    label: 'End Semester Exams End'    },
    ]
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

export default function CalendarView() {
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
  const [anim, setAnim] = useState(null);

  const activeDate  = useMemo(() => parseMonthKey(activeMonth), [activeMonth]);
  const year        = activeDate.getFullYear();
  const month       = activeDate.getMonth();
  const totalDays   = useMemo(() => daysInMonth(year, month), [year, month]);
  const startDay    = useMemo(() => firstWeekday(year, month), [year, month]);
  const monthData   = CALENDAR_DATA[activeMonth] || {};
  const activeIdx   = MONTHS.indexOf(activeMonth);
  const isThisMonth = activeMonth === TODAY_KEY;

  const stats = useMemo(() => {
    let workingCount = 0;
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      if (isWorkingDay(date)) workingCount++;
    }
    return {
      working:  workingCount,
      holidays: (monthData.events || []).filter(e => e.type === 'holiday').length,
      exams:    (monthData.events || []).filter(e => e.type === 'exam').length,
    };
  }, [totalDays, year, month, monthData]);

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

  const detailData = useMemo(() => {
    if (!selectedDay) return null;
    const data   = CALENDAR_DATA[activeMonth] || {};
    const date   = new Date(year, month, selectedDay);
    const events = (data.events || []).filter(e => e.date === selectedDay);
    const order  = getDynamicDayOrder(date);
    return { events, order };
  }, [selectedDay, activeMonth, year, month]);

  const goToMonth = (idx) => {
    if (idx < 0 || idx >= MONTHS.length) return;
    setAnim(idx > activeIdx ? 'left' : 'right');
    const t = setTimeout(() => {
      setActiveMonth(MONTHS[idx]);
      setSelectedDay(null);
      setAnim(null);
    }, 180);
  };

  const isToday = (d) => isThisMonth && d === TODAY_DATE;
  const isPast  = (d) => {
    if (!isThisMonth) return parseMonthKey(activeMonth) < parseMonthKey(TODAY_KEY);
    return d < TODAY_DATE;
  };

  return (
    <div className="cal-view-container">
      <div className="body-cols">
        {/* SIDEBAR PANEL */}
        <div className="sidebar-panel">
          <div className="sp-hd">
            <span className="sp-hd-title">Upcoming Events</span>
            <div className="sp-hd-count">{upcomingItems.length}</div>
          </div>
          <div className="sp-list">
            {upcomingItems.map((ev, i) => (
              <div key={i} className="sp-item glass-raised animate-up" style={{ animationDelay:`${i*40}ms` }} onClick={() => { setActiveMonth(ev.monthKey); setSelectedDay(ev.date); }}>
                <div className="sp-item-head">
                  <div className="sp-item-type" style={{ color: ev.t.color }}>
                    <span className="ev-dot" style={{ background:ev.t.color }} />
                    {ev.t.label}
                  </div>
                  <div className="sp-item-date">{ev.diffLabel}</div>
                </div>
                <div className="sp-item-title">{ev.label}</div>
                <div className="sp-item-meta">{ev.date} {ev.monthKey.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CALENDAR MAIN */}
        <div className="cal-main glass">
          <div className="cal-hd">
            <div className="cal-hd-meta">
              <h1 className="cal-month">{activeMonth}</h1>
              <div className="cal-stats">
                <div className="cs-item">{stats.working} <small>Days</small></div>
                <div className="cs-item" style={{color:'var(--rose)'}}>{stats.holidays} <small>Holidays</small></div>
                <div className="cs-item" style={{color:'var(--amber)'}}>{stats.exams} <small>Exams</small></div>
              </div>
            </div>
            <div className="cal-nav">
              <button className="nav-btn" onClick={() => goToMonth(activeIdx - 1)} disabled={activeIdx === 0}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="nav-btn today" onClick={() => { setActiveMonth(TODAY_KEY); setSelectedDay(TODAY_DATE); }}>Today</button>
              <button className="nav-btn" onClick={() => goToMonth(activeIdx + 1)} disabled={activeIdx === MONTHS.length-1}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          <div className={`cal-grid ${anim ? `animating-${anim}` : ''}`}>
            {DAY_LABELS.map(lbl => <div key={lbl} className="grid-label">{lbl}</div>)}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="grid-day empty" />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const d = i + 1;
              const date = new Date(year, month, d);
              const dayOfWeek = date.getDay();
              const hasEvents = (monthData.events || []).filter(e => e.date === d);
              const isHoliday = hasEvents.some(e => e.type === 'holiday');
              const order = getDynamicDayOrder(date);
              
              const selected = selectedDay === d;
              return (
                <div key={d} className={`grid-day glass-raised ${isToday(d) ? 'is-today' : ''} ${isPast(d) ? 'is-past' : ''} ${selected ? 'is-selected' : ''} ${!order ? 'non-working' : ''}`} onClick={() => setSelectedDay(d)}>
                  <span className="day-num">{d}</span>
                  {order && <span className="day-order">D{order}</span>}
                  <div className="day-indicators">
                    {hasEvents.map((e, ei) => (
                      <div key={ei} className="ev-pip" style={{ background: EVENT_TYPES[e.type]?.color }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {detailData && (
            <div className="cal-detail glass-raised animate-up">
              <div className="cd-hd">
                <div className="cd-title">{selectedDay} {activeMonth}</div>
                {detailData.order && <div className="cd-order">Day Order: <strong>D{detailData.order}</strong></div>}
              </div>
              <div className="cd-events">
                {detailData.events.length === 0 ? (
                  <div className="cd-empty">No special events for this day.</div>
                ) : (
                  detailData.events.map((e, ei) => (
                    <div key={ei} className="cd-ev" style={{ background: EVENT_TYPES[e.type]?.bg, border: `1px solid ${EVENT_TYPES[e.type]?.border}` }}>
                      <span className="cd-ev-icon">{EVENT_TYPES[e.type]?.icon}</span>
                      <div className="cd-ev-info">
                        <strong>{e.label}</strong>
                        <span>{EVENT_TYPES[e.type]?.label}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .cal-view-container { width: 100%; position: relative; z-index: 1; }
        .body-cols { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }

        /* Sidebar */
        .sidebar-panel { display: flex; flex-direction: column; gap: 16px; }
        .sp-hd { display: flex; align-items: center; justify-content: space-between; }
        .sp-hd-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text-2); }
        .sp-hd-count { background: var(--bg-elevated); border: 1px solid var(--border); padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; color: var(--text-3); }
        .sp-list { display: flex; flex-direction: column; gap: 10px; }
        .sp-item { padding: 12px; border-radius: 12px; cursor: pointer; border: 1px solid var(--border); transition: all 0.2s; }
        .sp-item:hover { border-color: var(--accent-border); transform: translateX(4px); }
        .sp-item-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .sp-item-type { font-size: 9px; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
        .ev-dot { width: 5px; height: 5px; border-radius: 50%; }
        .sp-item-date { font-size: 10px; color: var(--text-3); font-family: var(--font-mono); }
        .sp-item-title { font-size: 12.5px; font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
        .sp-item-meta { font-size: 10px; color: var(--text-4); }

        /* Main Cal */
        .cal-main { border-radius: 20px; padding: 24px; position: relative; }
        .cal-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .cal-month { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-1); letter-spacing: -1px; }
        .cal-stats { display: flex; gap: 16px; margin-top: 4px; }
        .cs-item { font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--text-3); }
        .cs-item small { font-family: var(--font-body); font-size: 9px; font-weight: 500; text-transform: uppercase; margin-left: 2px; }

        .cal-nav { display: flex; gap: 8px; }
        .nav-btn { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-3); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .nav-btn:hover { background: var(--bg-hover); color: var(--text-1); }
        .nav-btn.today { width: auto; padding: 0 12px; font-size: 12px; font-weight: 600; }

        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .grid-label { text-align: center; font-size: 11px; font-weight: 700; color: var(--text-4); text-transform: uppercase; margin-bottom: 8px; }
        .grid-day { min-height: 80px; padding: 10px; border-radius: 12px; border: 1px solid var(--border); position: relative; cursor: pointer; transition: all 0.15s; }
        .grid-day:hover { background: var(--bg-hover); border-color: var(--border-strong); }
        .grid-day.empty { background: transparent; border: none; cursor: default; }
        .grid-day.is-today { border-color: var(--accent); background: var(--accent-dim); }
        .grid-day.is-selected { border-width: 2px; border-color: var(--accent-light); }
        .grid-day.is-past { opacity: 0.5; }

        .day-num { font-family: var(--font-mono); font-size: 15px; font-weight: 600; color: var(--text-2); }
        .is-today .day-num { color: var(--accent-light); font-weight: 800; }
        .day-order { position: absolute; bottom: 8px; right: 8px; font-size: 10px; font-weight: 800; color: var(--text-4); }
        .day-indicators { position: absolute; bottom: 8px; left: 8px; display: flex; gap: 3px; }
        .ev-pip { width: 4px; height: 4px; border-radius: 50%; }

        /* Detail */
        .cal-detail { margin-top: 24px; padding: 16px; border-radius: 16px; }
        .cd-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .cd-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text-1); }
        .cd-order { font-size: 12px; color: var(--text-3); }
        .cd-events { display: flex; flex-direction: column; gap: 8px; }
        .cd-ev { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; }
        .cd-ev-icon { font-size: 18px; }
        .cd-ev-info { display: flex; flex-direction: column; }
        .cd-ev-info strong { font-size: 13px; color: var(--text-1); }
        .cd-ev-info span { font-size: 10px; color: var(--text-3); text-transform: uppercase; font-weight: 600; }

        @media (max-width: 900px) {
          .body-cols { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
