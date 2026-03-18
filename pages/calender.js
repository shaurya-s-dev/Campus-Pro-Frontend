import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

/* ── Types & Mock Data ───────────────────────────── */
const EVENT_TYPES = {
  holiday:  { label:'Holiday',     color:'#f43f5e', bg:'rgba(244,63,94,0.1)',  border:'rgba(244,63,94,0.2)' },
  exam:     { label:'Exam/Test',   color:'#f59e0b', bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.2)' },
  dayorder: { label:'Day Order',   color:'#5b5ef4', bg:'rgba(91,94,244,0.1)', border:'rgba(91,94,244,0.2)' },
  special:  { label:'Special',     color:'#10b981', bg:'rgba(16,185,129,0.1)', border:'rgba(16,185,129,0.2)' },
};

// SRM KTR Academic Calendar — Even Semester 2025–26 (mock)
const CALENDAR_DATA = {
  'January 2026': {
    events: [
      { date: 1,  type:'holiday',  label:'New Year\'s Day' },
      { date: 14, type:'holiday',  label:'Pongal' },
      { date: 15, type:'holiday',  label:'Thiruvalluvar Day' },
      { date: 16, type:'holiday',  label:'Uzhavar Thirunal' },
      { date: 26, type:'holiday',  label:'Republic Day' },
    ],
    dayOrders: { 2:'D1', 3:'D2', 5:'D3', 6:'D4', 7:'D5', 8:'D1', 9:'D2', 10:'D3', 12:'D4', 13:'D5', 17:'D1', 18:'D2', 19:'D3', 20:'D4', 21:'D5', 22:'D1', 23:'D2', 24:'D3', 27:'D4', 28:'D5', 29:'D1', 30:'D2', 31:'D3' },
  },
  'February 2026': {
    events: [
      { date: 2,  type:'exam',     label:'CAT-1 Begins' },
      { date: 14, type:'special',  label:'Valentine\'s Day / Techno Day' },
      { date: 19, type:'special',  label:'SRM Founders\' Day' },
      { date: 26, type:'exam',     label:'CAT-2 Prep Week' },
    ],
    dayOrders: { 2:'D4', 3:'D5', 4:'D1', 5:'D2', 6:'D3', 7:'D4', 9:'D5', 10:'D1', 11:'D2', 12:'D3', 13:'D4', 16:'D5', 17:'D1', 18:'D2', 20:'D3', 21:'D4', 23:'D5', 24:'D1', 25:'D2', 26:'D3', 27:'D4', 28:'D5' },
  },
  'March 2026': {
    events: [
      { date: 18, type:'holiday',  label:'Holi' },
      { date: 2,  type:'exam',     label:'CAT-2 Begins' },
      { date: 25, type:'exam',     label:'CAT-2 Ends' },
    ],
    dayOrders: { 2:'D1', 3:'D2', 4:'D3', 5:'D4', 6:'D5', 7:'D1', 9:'D2', 10:'D3', 11:'D4', 12:'D5', 13:'D1', 16:'D2', 17:'D3', 19:'D4', 20:'D5', 23:'D1', 24:'D2', 26:'D3', 27:'D4', 28:'D5', 30:'D1', 31:'D2' },
  },
  'April 2026': {
    events: [
      { date: 1,  type:'holiday',  label:'Tamil New Year / Ugadi' },
      { date: 3,  type:'holiday',  label:'Good Friday' },
      { date: 14, type:'holiday',  label:'Dr. Ambedkar Jayanti' },
      { date: 21, type:'exam',     label:'Model Exams Begin' },
      { date: 30, type:'exam',     label:'Last Day of Instruction' },
    ],
    dayOrders: { 2:'D3', 4:'D4', 6:'D5', 7:'D1', 8:'D2', 9:'D3', 10:'D4', 13:'D5', 15:'D1', 16:'D2', 17:'D3', 20:'D4', 22:'D5', 23:'D1', 24:'D2', 27:'D3', 28:'D4', 29:'D5', 30:'D1' },
  },
  'May 2026': {
    events: [
      { date: 1,  type:'holiday',  label:'Labour Day' },
      { date: 4,  type:'exam',     label:'End Semester Exams Begin' },
      { date: 25, type:'exam',     label:'End Semester Exams End' },
    ],
    dayOrders: {},
  },
};

const MONTHS = Object.keys(CALENDAR_DATA);
const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function parseMonth(monthStr) {
  const [m, y] = monthStr.split(' ');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return new Date(parseInt(y), months.indexOf(m), 1);
}

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfWeek(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

/* ── Event Pill ──────────────────────────────────── */
function EventPill({ event, compact }) {
  const t = EVENT_TYPES[event.type] || EVENT_TYPES.special;
  return (
    <div className="event-pill" style={{ color:t.color, background:t.bg, border:`1px solid ${t.border}` }}>
      {!compact && <span className="event-dot" style={{ background:t.color }} />}
      <span className="event-text">{event.label}</span>
    </div>
  );
}

/* ── Day Cell ────────────────────────────────────── */
function DayCell({ day, monthData, isToday, isSelected, onClick, currentDay }) {
  if (!day) return <div className="day-cell day-empty" />;

  const events = (monthData?.events || []).filter(e => e.date === day);
  const dayOrder = monthData?.dayOrders?.[day];
  const isWeekend = [0, 6].includes(new Date(currentDay.getFullYear(), currentDay.getMonth(), day).getDay());
  const isHoliday = events.some(e => e.type === 'holiday');
  const hasExam   = events.some(e => e.type === 'exam');

  return (
    <div
      className={`day-cell ${isToday ? 'day-today' : ''} ${isSelected ? 'day-selected' : ''} ${isWeekend ? 'day-weekend' : ''} ${isHoliday ? 'day-holiday' : ''}`}
      onClick={() => onClick(day)}
    >
      <div className="day-num-row">
        <span className="day-num">{day}</span>
        {dayOrder && !isHoliday && (
          <span className="day-order" style={{ color: hasExam ? '#f59e0b' : 'rgba(91,94,244,0.8)' }}>{dayOrder}</span>
        )}
        {isHoliday && <span className="day-holiday-icon">🔴</span>}
        {hasExam && !isHoliday && <span className="day-exam-dot" />}
      </div>
      {events.slice(0, 2).map((e, i) => <EventPill key={i} event={e} compact />)}
    </div>
  );
}

/* ── Upcoming Events List ────────────────────────── */
function UpcomingEvents({ selectedMonth, selectedDay }) {
  const allEvents = [];
  MONTHS.forEach(m => {
    (CALENDAR_DATA[m]?.events || []).forEach(e => {
      allEvents.push({ ...e, month:m });
    });
  });

  const now = new Date();
  const upcoming = allEvents.filter(e => {
    const d = parseMonth(e.month);
    d.setDate(e.date);
    return d >= now;
  }).sort((a, b) => {
    const da = parseMonth(a.month); da.setDate(a.date);
    const db = parseMonth(b.month); db.setDate(b.date);
    return da - db;
  }).slice(0, 8);

  return (
    <div className="upcoming">
      <div className="upcoming-title">Upcoming Events</div>
      <div className="upcoming-list">
        {upcoming.map((e, i) => {
          const t = EVENT_TYPES[e.type] || EVENT_TYPES.special;
          return (
            <div key={i} className="upcoming-item">
              <div className="upcoming-icon" style={{ color:t.color, background:t.bg }}>
                {e.type==='holiday'?'🏖':'📅'}
              </div>
              <div className="upcoming-info">
                <div className="upcoming-label">{e.label}</div>
                <div className="upcoming-date">{e.month.split(' ')[0]} {e.date}</div>
              </div>
              <span className="tag" style={{ fontSize:9.5, background:t.bg, color:t.color, border:`1px solid ${t.border}`, flexShrink:0 }}>
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Calendar ───────────────────────────────── */
export default function CalendarPage() {
  const today = new Date();
  const currentMonthStr = `${today.toLocaleString('default',{month:'long'})} ${today.getFullYear()}`;
  const initialMonth = MONTHS.find(m => m.includes(String(today.getFullYear()))) || MONTHS[0];

  const [activeMonth, setActiveMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay]   = useState(today.getDate());
  const [view, setView] = useState('month'); // 'month' | 'list'

  const monthDate   = parseMonth(activeMonth);
  const daysInMonth = getDaysInMonth(monthDate);
  const firstDay    = getFirstDayOfWeek(monthDate);
  const monthData   = CALENDAR_DATA[activeMonth] || {};

  const prevMonth = () => {
    const idx = MONTHS.indexOf(activeMonth);
    if (idx > 0) { setActiveMonth(MONTHS[idx-1]); setSelectedDay(null); }
  };
  const nextMonth = () => {
    const idx = MONTHS.indexOf(activeMonth);
    if (idx < MONTHS.length-1) { setActiveMonth(MONTHS[idx+1]); setSelectedDay(null); }
  };

  const selectedEvents = selectedDay ? (monthData.events||[]).filter(e=>e.date===selectedDay) : [];
  const selectedOrder  = selectedDay ? monthData.dayOrders?.[selectedDay] : null;

  const isToday = (day) => {
    return activeMonth === currentMonthStr && day === today.getDate();
  };

  // Day stats
  const totalDays = Object.keys(monthData.dayOrders||{}).length;
  const holidays  = (monthData.events||[]).filter(e=>e.type==='holiday').length;
  const exams     = (monthData.events||[]).filter(e=>e.type==='exam').length;

  return (
    <>
      <Head><title>Academic Calendar — CampusPro</title></Head>

      <div className="cal-app">
        {/* ── SIDEBAR ────────────────────────────────── */}
        <aside className="cal-sidebar glass">
          <Link href="/" className="brand">
            <span style={{ fontSize:20, color:'var(--accent)', filter:'drop-shadow(0 0 8px var(--accent-glow))' }}>⬡</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:15, color:'var(--text-1)', fontWeight:700 }}>
              Campus<strong style={{ color:'var(--accent)' }}>Pro</strong>
            </span>
          </Link>

          {/* Legend */}
          <div className="legend">
            <div className="legend-title">Legend</div>
            {Object.entries(EVENT_TYPES).map(([key, t]) => (
              <div key={key} className="legend-row">
                <div className="legend-dot" style={{ background:t.color }} />
                <span className="legend-label">{t.label}</span>
              </div>
            ))}
          </div>

          {/* Month stats */}
          <div className="month-stats">
            <div className="ms-title">{activeMonth}</div>
            <div className="ms-grid">
              <div className="ms-card">
                <div className="ms-val" style={{ color:'#5b5ef4' }}>{totalDays}</div>
                <div className="ms-label">Working Days</div>
              </div>
              <div className="ms-card">
                <div className="ms-val" style={{ color:'#f43f5e' }}>{holidays}</div>
                <div className="ms-label">Holidays</div>
              </div>
              <div className="ms-card">
                <div className="ms-val" style={{ color:'#f59e0b' }}>{exams}</div>
                <div className="ms-label">Exam Events</div>
              </div>
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <div className="day-detail animate-fade-up">
              <div className="dd-title">
                {activeMonth.split(' ')[0]} {selectedDay}
                {selectedOrder && <span className="dd-order">{selectedOrder}</span>}
              </div>
              {selectedEvents.length > 0 ? (
                <div className="dd-events">
                  {selectedEvents.map((e, i) => {
                    const t = EVENT_TYPES[e.type] || EVENT_TYPES.special;
                    return (
                      <div key={i} className="dd-event" style={{ borderLeft:`3px solid ${t.color}`, background:t.bg }}>
                        <div className="dd-event-label" style={{ color:t.color }}>{e.label}</div>
                        <div className="dd-event-type">{t.label}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="dd-empty">
                  {selectedOrder ? `Day Order: ${selectedOrder}` : 'No events today'}
                </div>
              )}
            </div>
          )}

          <UpcomingEvents />
        </aside>

        {/* ── MAIN CALENDAR ──────────────────────────── */}
        <main className="cal-main">
          {/* Header */}
          <div className="cal-header animate-fade-up">
            <div className="cal-nav">
              <button className="nav-arrow" onClick={prevMonth} disabled={MONTHS.indexOf(activeMonth)===0}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div>
                <h1 className="cal-month-title">{activeMonth}</h1>
                <div className="cal-month-sub">SRM KTR · Even Semester 2025–26</div>
              </div>
              <button className="nav-arrow" onClick={nextMonth} disabled={MONTHS.indexOf(activeMonth)===MONTHS.length-1}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button className={`view-btn ${view==='month'?'view-active':''}`} onClick={() => setView('month')}>Month</button>
              <button className={`view-btn ${view==='list'?'view-active':''}`} onClick={() => setView('list')}>List</button>
              <button className="btn btn-ghost" style={{ fontSize:12, padding:'7px 14px' }}
                onClick={() => { setActiveMonth(initialMonth); setSelectedDay(today.getDate()); }}>
                Today
              </button>
            </div>
          </div>

          {view === 'month' && (
            <>
              {/* Day headers */}
              <div className="days-header">
                {DAYS_OF_WEEK.map(d => (
                  <div key={d} className={`days-header-cell ${d==='Sun'||d==='Sat'?'weekend-header':''}`}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="cal-grid animate-fade-in">
                {/* Empty cells */}
                {Array(firstDay).fill(null).map((_, i) => (
                  <div key={`e${i}`} className="day-cell day-empty" />
                ))}
                {/* Day cells */}
                {Array(daysInMonth).fill(null).map((_, i) => (
                  <DayCell
                    key={i+1}
                    day={i+1}
                    monthData={monthData}
                    isToday={isToday(i+1)}
                    isSelected={selectedDay === i+1}
                    onClick={setSelectedDay}
                    currentDay={monthDate}
                  />
                ))}
              </div>
            </>
          )}

          {view === 'list' && (
            <div className="list-view animate-fade-up">
              {MONTHS.map(m => {
                const mData = CALENDAR_DATA[m] || {};
                const events = mData.events || [];
                if (!events.length) return null;
                return (
                  <div key={m} className="list-month">
                    <div className="list-month-label">{m}</div>
                    {events.map((e, i) => {
                      const t = EVENT_TYPES[e.type] || EVENT_TYPES.special;
                      return (
                        <div key={i} className="list-event" style={{ borderLeft:`3px solid ${t.color}` }}>
                          <div className="list-event-date">{m.split(' ')[0]} {e.date}</div>
                          <div className="list-event-label">{e.label}</div>
                          <span className="tag" style={{ fontSize:9.5, background:t.bg, color:t.color, border:`1px solid ${t.border}`, marginLeft:'auto' }}>
                            {t.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Month navigation dots */}
          <div className="month-dots">
            {MONTHS.map((m, i) => (
              <button
                key={i}
                className={`month-dot ${m===activeMonth?'month-dot-active':''}`}
                onClick={() => { setActiveMonth(m); setSelectedDay(null); }}
                title={m}
              />
            ))}
          </div>
        </main>
      </div>

      <style jsx global>{`
        body { background: var(--bg-void); overflow-x: hidden; }
      `}</style>

      <style jsx>{`
        .cal-app { display:flex; min-height:100vh; }

        /* SIDEBAR */
        .cal-sidebar {
          width:280px; flex-shrink:0; min-height:100vh;
          padding:20px 16px; display:flex; flex-direction:column; gap:18px;
          position:sticky; top:0; height:100vh; overflow-y:auto;
          border-right:1px solid var(--border);
        }
        .brand { display:flex; align-items:center; gap:8px; }

        .legend { padding:12px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); }
        .legend-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--text-3); margin-bottom:10px; }
        .legend-row { display:flex; align-items:center; gap:9px; margin-bottom:7px; }
        .legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .legend-label { font-size:12px; color:var(--text-2); }

        .month-stats { padding:14px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); }
        .ms-title { font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--text-1); margin-bottom:12px; }
        .ms-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .ms-card { text-align:center; }
        .ms-val { font-family:var(--font-mono); font-size:22px; font-weight:700; }
        .ms-label { font-size:9px; color:var(--text-4); text-transform:uppercase; letter-spacing:0.4px; margin-top:2px; }

        .day-detail { padding:14px; background:var(--accent-dim); border:1px solid var(--accent-border); border-radius:var(--radius-md); }
        .dd-title { font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--text-1); margin-bottom:10px; display:flex; align-items:center; gap:8px; }
        .dd-order { font-family:var(--font-mono); font-size:11px; color:var(--accent); background:rgba(91,94,244,0.15); border:1px solid var(--accent-border); padding:2px 8px; border-radius:5px; }
        .dd-events { display:flex; flex-direction:column; gap:8px; }
        .dd-event { padding:10px 12px; border-radius:var(--radius-sm); }
        .dd-event-label { font-size:13px; font-weight:600; }
        .dd-event-type { font-size:10px; color:var(--text-3); margin-top:2px; text-transform:uppercase; letter-spacing:0.4px; }
        .dd-empty { font-size:12px; color:var(--text-3); font-style:italic; }

        /* UPCOMING */
        .upcoming { flex:1; }
        .upcoming-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--text-3); margin-bottom:12px; }
        .upcoming-list { display:flex; flex-direction:column; gap:8px; }
        .upcoming-item { display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-sm); }
        .upcoming-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
        .upcoming-info { flex:1; min-width:0; }
        .upcoming-label { font-size:12px; font-weight:500; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .upcoming-date { font-family:var(--font-mono); font-size:10px; color:var(--text-3); margin-top:2px; }

        /* MAIN */
        .cal-main { flex:1; padding:28px 32px; display:flex; flex-direction:column; gap:20px; min-width:0; }
        .cal-header { display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .cal-nav { display:flex; align-items:center; gap:18px; }
        .nav-arrow {
          width:34px; height:34px; display:flex; align-items:center; justify-content:center;
          background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-sm);
          color:var(--text-2); cursor:pointer; transition:all 0.15s;
        }
        .nav-arrow:hover:not(:disabled) { border-color:var(--border-strong); color:var(--text-1); }
        .nav-arrow:disabled { opacity:0.3; cursor:not-allowed; }
        .cal-month-title { font-family:var(--font-display); font-size:26px; font-weight:800; color:var(--text-1); letter-spacing:-0.5px; }
        .cal-month-sub { font-size:11px; color:var(--text-3); margin-top:2px; }
        .view-btn {
          padding:7px 14px; border-radius:var(--radius-sm);
          background:none; border:1px solid var(--border);
          color:var(--text-3); font-size:12px; cursor:pointer;
          transition:all 0.15s; font-family:var(--font-body);
        }
        .view-btn:hover { background:var(--bg-elevated); color:var(--text-1); }
        .view-active { background:var(--accent-dim); border-color:var(--accent-border); color:#a5b4fc; }

        /* CALENDAR GRID */
        .days-header { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
        .days-header-cell { text-align:center; font-size:10px; color:var(--text-3); padding:8px 4px; text-transform:uppercase; letter-spacing:0.7px; font-weight:600; }
        .weekend-header { color:rgba(244,63,94,0.5); }

        .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
        .day-cell {
          min-height:88px; border-radius:var(--radius-sm);
          padding:7px; cursor:pointer; transition:all 0.15s;
          background:rgba(255,255,255,0.015);
          border:1px solid transparent;
          display:flex; flex-direction:column; gap:4px;
        }
        .day-cell:not(.day-empty):hover { background:var(--bg-elevated); border-color:var(--border); }
        .day-empty { cursor:default; opacity:0; }
        .day-today { background:rgba(91,94,244,0.08); border-color:var(--accent-border); }
        .day-selected { background:var(--accent-dim); border-color:rgba(91,94,244,0.3); box-shadow:0 0 0 2px rgba(91,94,244,0.15); }
        .day-weekend { opacity:0.55; }
        .day-holiday { background:rgba(244,63,94,0.06); }

        .day-num-row { display:flex; align-items:center; justify-content:space-between; }
        .day-num { font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--text-2); }
        .day-today .day-num { color:var(--accent); }
        .day-order { font-size:9px; color:rgba(91,94,244,0.6); font-family:var(--font-mono); font-weight:600; }
        .day-holiday-icon { font-size:10px; }
        .day-exam-dot { width:5px; height:5px; border-radius:50%; background:#f59e0b; box-shadow:0 0 4px #f59e0b; }

        /* EVENT PILL */
        .event-pill { display:flex; align-items:center; gap:4px; border-radius:4px; padding:2px 5px; }
        .event-dot { width:4px; height:4px; border-radius:50%; flex-shrink:0; }
        .event-text { font-size:9px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* LIST VIEW */
        .list-view { display:flex; flex-direction:column; gap:20px; }
        .list-month { }
        .list-month-label { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-1); margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid var(--border); }
        .list-event { display:flex; align-items:center; gap:14px; padding:12px 14px; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:6px; }
        .list-event-date { font-family:var(--font-mono); font-size:11px; color:var(--text-3); min-width:52px; flex-shrink:0; }
        .list-event-label { font-size:13px; font-weight:500; color:var(--text-1); flex:1; }

        /* MONTH DOTS */
        .month-dots { display:flex; gap:8px; justify-content:center; padding:8px 0; }
        .month-dot { width:7px; height:7px; border-radius:50%; background:var(--border); border:none; cursor:pointer; transition:all 0.15s; }
        .month-dot:hover { background:rgba(91,94,244,0.4); }
        .month-dot-active { background:var(--accent); box-shadow:0 0 6px var(--accent-glow); width:20px; border-radius:4px; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .cal-app { flex-direction:column; }
          .cal-sidebar { width:100%; height:auto; min-height:auto; position:static; flex-direction:row; flex-wrap:wrap; }
          .cal-main { padding:16px; }
          .day-cell { min-height:64px; }
        }
        @media (max-width: 600px) {
          .cal-main { padding:12px; }
          .day-num { font-size:11px; }
          .event-pill { display:none; }
          .day-cell { min-height:48px; padding:4px; }
        }
      `}</style>
    </>
  );
}
