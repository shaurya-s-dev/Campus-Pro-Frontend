import { useState, useEffect, useCallback } from 'react';

/* ══════════════════════════════════════════════════
   ACADEMIC CALENDAR  (YYYY-MM-DD → day order 1-5 | null=holiday)
   ══════════════════════════════════════════════════ */
const ACADEMIC_CALENDAR = {
  // January 2026
  '2026-01-02': 1, '2026-01-03': 2, '2026-01-05': 3, '2026-01-06': 4, '2026-01-07': 5,
  '2026-01-08': 1, '2026-01-09': 2, '2026-01-10': 3, '2026-01-12': 4, '2026-01-13': 5,
  '2026-01-14': null, // Pongal
  '2026-01-15': null, // Thiruvalluvar Day
  '2026-01-16': null, // Uzhavar Thirunal
  '2026-01-17': 1, '2026-01-19': 2, '2026-01-20': 3, '2026-01-21': 4, '2026-01-22': 5,
  '2026-01-23': 1, '2026-01-24': 2,
  '2026-01-26': null, // Republic Day
  '2026-01-27': 3, '2026-01-28': 4, '2026-01-29': 5, '2026-01-30': 1, '2026-01-31': 2,

  // February 2026
  '2026-02-02': 3, '2026-02-03': 4, '2026-02-04': 5, '2026-02-05': 1, '2026-02-06': 2,
  '2026-02-07': 3, '2026-02-09': 4, '2026-02-10': 5, '2026-02-11': 1, '2026-02-12': 2,
  '2026-02-13': 3, '2026-02-14': 4, '2026-02-16': 5, '2026-02-17': 1, '2026-02-18': 2,
  '2026-02-19': 3, '2026-02-20': 4, '2026-02-21': 5, '2026-02-23': 1, '2026-02-24': 2,
  '2026-02-25': 3, '2026-02-26': 4, '2026-02-27': 5, '2026-02-28': 1,

  // March 2026
  '2026-03-02': 2, '2026-03-03': 3, '2026-03-04': 4, '2026-03-05': 5, '2026-03-06': 1,
  '2026-03-07': 2, '2026-03-09': 3, '2026-03-10': 4, '2026-03-11': 5, '2026-03-12': 1,
  '2026-03-13': 2, '2026-03-16': 3, '2026-03-17': 4,
  '2026-03-18': null, // Holi
  '2026-03-19': null, // Telugu New Year
  '2026-03-20': 2, // TODAY — Day Order 2 ← CORRECT
  '2026-03-21': 3, '2026-03-23': 4, '2026-03-24': 5,
  '2026-03-25': 1, // CAT-2 Ends
  '2026-03-26': 2, '2026-03-27': 3, '2026-03-28': 4, '2026-03-30': 5, '2026-03-31': 1,

  // April 2026
  '2026-04-01': null, // Tamil New Year / Ugadi
  '2026-04-02': 2,
  '2026-04-03': null, // Good Friday
  '2026-04-04': 3, '2026-04-06': 4, '2026-04-07': 5, '2026-04-08': 1, '2026-04-09': 2,
  '2026-04-10': 3, '2026-04-13': 4,
  '2026-04-14': null, // Ambedkar Jayanti
  '2026-04-15': 5, '2026-04-16': 1, '2026-04-17': 2, '2026-04-20': 3,
  '2026-04-21': 4, // Model Exams Begin
  '2026-04-22': 5, '2026-04-23': 1, '2026-04-24': 2, '2026-04-27': 3, '2026-04-28': 4,
  '2026-04-29': 5, '2026-04-30': 1, // Last Day of Instruction
};

const HOLIDAY_NAMES = {
  '2026-01-14': 'Pongal',
  '2026-01-15': 'Thiruvalluvar Day',
  '2026-01-16': 'Uzhavar Thirunal',
  '2026-01-26': 'Republic Day',
  '2026-03-18': 'Holi',
  '2026-03-19': "Telugu New Year's Day",
  '2026-04-01': 'Tamil New Year / Ugadi',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Ambedkar Jayanti',
};

/* ══════════════════════════════════════════════════
   SLOT TIMES
   ══════════════════════════════════════════════════ */
const SLOTS = [
  { idx:0, start:'8:00 AM',  end:'8:50 AM',  startMin:0,   endMin:50,  period:1 },
  { idx:1, start:'8:50 AM',  end:'9:45 AM',  startMin:50,  endMin:105, period:2 },
  { idx:2, start:'9:45 AM',  end:'10:40 AM', startMin:105, endMin:160, period:3 },
  { idx:3, start:'10:40 AM', end:'11:35 AM', startMin:160, endMin:215, period:4 },
  { idx:4, start:'11:35 AM', end:'12:30 PM', startMin:215, endMin:270, period:5 },
  { idx:5, start:'1:15 PM',  end:'2:10 PM',  startMin:315, endMin:370, period:6 },
  { idx:6, start:'2:10 PM',  end:'3:05 PM',  startMin:370, endMin:425, period:7 },
  { idx:7, start:'3:05 PM',  end:'4:00 PM',  startMin:425, endMin:480, period:8 },
  { idx:8, start:'4:00 PM',  end:'4:50 PM',  startMin:480, endMin:530, period:9 },
  { idx:9, start:'4:50 PM',  end:'5:40 PM',  startMin:530, endMin:590, period:10},
];
const DAY_START_MIN = 8 * 60;

/* Type config */
const TYPE = {
  Theory:    { color:'#818cf8', glow:'rgba(129,140,248,0.2)',  bg:'rgba(99,102,241,0.08)',  border:'rgba(99,102,241,0.2)',  icon:'◈', label:'Theory'    },
  Practical: { color:'#34d399', glow:'rgba(52,211,153,0.2)',   bg:'rgba(16,185,129,0.08)',  border:'rgba(16,185,129,0.2)',  icon:'⬡', label:'Lab'       },
  online:    { color:'#fbbf24', glow:'rgba(251,191,36,0.15)',  bg:'rgba(245,158,11,0.06)',  border:'rgba(245,158,11,0.25)', icon:'◎', label:'Online'    },
};

/* ══════════════════════════════════════════════════
   MOCK SCHEDULE
   ══════════════════════════════════════════════════ */
const MOCK_SCHEDULE = [
  { day:1, table:[
    { code:'21CSE101T', name:'Data Structures and Algorithms',      slot:'A',   roomNo:'TP606',       courseType:'Theory'    },
    { code:'21CSE101T', name:'Data Structures and Algorithms',      slot:'A',   roomNo:'TP606',       courseType:'Theory'    },
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems', slot:'F',  roomNo:'UB117',       courseType:'Theory'    },
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems', slot:'F',  roomNo:'UB117',       courseType:'Theory'    },
    { code:'21PHY102T', name:'Engineering Physics',                  slot:'G',  roomNo:'SMV208',      courseType:'Theory'    },
    null, null,
    { code:'21CSE151P', name:'Data Structures Lab',                  slot:'P6', roomNo:'UB-G01 Lab',  courseType:'Practical' },
    { code:'21CSE151P', name:'Data Structures Lab',                  slot:'P7', roomNo:'UB-G01 Lab',  courseType:'Practical' },
    { code:'21CSE151P', name:'Data Structures Lab',                  slot:'P8', roomNo:'UB-G01 Lab',  courseType:'Practical' },
  ]},
  { day:2, table:[
    null,null,null,null,null,
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'B', roomNo:'TP501',  courseType:'Theory' },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'B', roomNo:'TP501',  courseType:'Theory' },
    { code:'21ECE101T', name:'Digital Electronics',                    slot:'G', roomNo:'UB201',  courseType:'Theory' },
    { code:'21ECE101T', name:'Digital Electronics',                    slot:'G', roomNo:'UB201',  courseType:'Theory' },
    { code:'21CSE101T', name:'Data Structures and Algorithms',         slot:'A', roomNo:'TP606',  courseType:'Theory' },
  ]},
  { day:3, table:[
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'C',   roomNo:'TP501',      courseType:'Theory'    },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'C',   roomNo:'TP501',      courseType:'Theory'    },
    { code:'21CSE101T', name:'Data Structures and Algorithms',         slot:'A',   roomNo:'TP606',      courseType:'Theory'    },
    { code:'21CSE301T', name:'Computer Networks',                      slot:'D',   roomNo:'SMV101',     courseType:'Theory'    },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'B',   roomNo:'TP501',      courseType:'Theory'    },
    { code:'21PHY152P', name:'Engineering Physics Lab',                slot:'P26', roomNo:'PHY Lab B2', courseType:'Practical' },
    { code:'21PHY152P', name:'Engineering Physics Lab',                slot:'P27', roomNo:'PHY Lab B2', courseType:'Practical' },
    { code:'21PHY152P', name:'Engineering Physics Lab',                slot:'P28', roomNo:'PHY Lab B2', courseType:'Practical' },
    null,null,
  ]},
  { day:4, table:[
    { code:'21CSE351P', name:'Computer Networks Lab',                  slot:'P31', roomNo:'UB-G02 Lab', courseType:'Practical' },
    { code:'21CSE351P', name:'Computer Networks Lab',                  slot:'P32', roomNo:'UB-G02 Lab', courseType:'Practical' },
    { code:'21CSE351P', name:'Computer Networks Lab',                  slot:'P33', roomNo:'UB-G02 Lab', courseType:'Practical' },
    { code:'21CSE351P', name:'Computer Networks Lab',                  slot:'P34', roomNo:'UB-G02 Lab', courseType:'Practical' },
    { code:'21CSE351P', name:'Computer Networks Lab',                  slot:'P35', roomNo:'UB-G02 Lab', courseType:'Practical' },
    { code:'21CSE301T', name:'Computer Networks',                      slot:'D',   roomNo:'SMV101',     courseType:'Theory'    },
    { code:'21CSE301T', name:'Computer Networks',                      slot:'D',   roomNo:'SMV101',     courseType:'Theory'    },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'B',   roomNo:'TP501',      courseType:'Theory'    },
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems',   slot:'E',   roomNo:'UB117',      courseType:'Theory'    },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'C',   roomNo:'TP501',      courseType:'Theory'    },
  ]},
  { day:5, table:[
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems',   slot:'E',   roomNo:'UB117',      courseType:'Theory'    },
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems',   slot:'E',   roomNo:'UB117',      courseType:'Theory'    },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'C',   roomNo:'TP501',      courseType:'Theory'    },
    { code:'21PHY102T', name:'Engineering Physics',                    slot:'F',   roomNo:'SMV208',     courseType:'Theory'    },
    { code:'21CSE301T', name:'Computer Networks',                      slot:'D',   roomNo:'SMV101',     courseType:'Theory'    },
    { code:'21ECE151P', name:'Digital Electronics Lab',                slot:'P46', roomNo:'ECE Lab A1', courseType:'Practical' },
    { code:'21ECE151P', name:'Digital Electronics Lab',                slot:'P47', roomNo:'ECE Lab A1', courseType:'Practical' },
    { code:'21ECE151P', name:'Digital Electronics Lab',                slot:'P48', roomNo:'ECE Lab A1', courseType:'Practical' },
    null,null,
  ]},
];

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getNowMin() {
  const n = new Date();
  return n.getHours()*60 + n.getMinutes() - DAY_START_MIN;
}
function fmtNow() {
  return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
}
function nextClassDay(fromDate) {
  const d = new Date(fromDate);
  for (let i = 1; i <= 14; i++) {
    d.setDate(d.getDate() + 1);
    const k = dateKey(d);
    const v = ACADEMIC_CALENDAR[k];
    if (typeof v === 'number') {
      return { date: new Date(d), dayOrder: v };
    }
  }
  return null;
}
function fmtDate(d) {
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

/* Flatten table into individual period cards (NO merging) */
function buildIndividualPeriods(table) {
  if (!table || !Array.isArray(table)) return [];
  const periods = [];
  table.forEach((slot, i) => {
    if (!slot) return;
    const s = SLOTS[i];
    if (!s) return;
    periods.push({ ...slot, slotIdx: i, startTime: s.start, endTime: s.end, startMin: s.startMin, endMin: s.endMin, period: s.period, duration: s.endMin - s.startMin });
  });
  return periods;
}

/* ══════════════════════════════════════════════════
   PERIOD CARD — individual, no merging
   ══════════════════════════════════════════════════ */
function PeriodCard({ p, status, expanded, onToggle, idx }) {
  const cfg    = p.online ? TYPE.online : (TYPE[p.courseType] || TYPE.Theory);
  const isLive = status === 'live';
  const isNext = status === 'next';
  const isPast = status === 'past';

  return (
    <div
      className={`pc ${isLive?'pc-live':''} ${isNext?'pc-next':''} ${isPast?'pc-past':''} ${expanded?'pc-exp':''}`}
      style={{ '--c':cfg.color, '--glow':cfg.glow, '--bg':cfg.bg, '--bdr':cfg.border, animationDelay:`${idx*45}ms` }}
      onClick={onToggle}
      role="button" tabIndex={0}
      onKeyDown={e => e.key==='Enter' && onToggle()}
    >
      {/* Left color bar */}
      <div className="pc-bar" />

      {/* Period number badge */}
      <div className="pc-period-badge">P{p.period}</div>

      {/* Status pill */}
      {isLive && (
        <div className="pc-status pc-status-live">
          <span className="live-dot" />LIVE
        </div>
      )}
      {isNext && !isLive && (
        <div className="pc-status pc-status-next">NEXT</div>
      )}

      {/* Main row */}
      <div className="pc-main">
        {/* Time block */}
        <div className="pc-time-block">
          <div className="pc-time-start">{p.startTime.replace(' AM','').replace(' PM','')}</div>
          <div className="pc-time-divider">
            <div className="pctd-line" />
            <div className="pctd-dur">{p.duration}m</div>
            <div className="pctd-line" />
          </div>
          <div className="pc-time-end">{p.endTime.replace(' AM','').replace(' PM','')}</div>
        </div>

        {/* Content */}
        <div className="pc-content">
          <div className="pc-name">{p.name}</div>
          <div className="pc-meta-row">
            <span className="pc-type-chip" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="pc-room">🏫 {p.roomNo}</span>
            <span className="pc-slot">🔖 {p.slot}</span>
          </div>
        </div>

        {/* Right: code + expand */}
        <div className="pc-right">
          <div className="pc-code">{p.code}</div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className="pc-chevron"
            style={{ transform:expanded?'rotate(180deg)':'none', transition:'transform .22s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="pc-detail">
          <div className="pcd-item"><span>⏱ Duration</span><span>{p.duration} min</span></div>
          <div className="pcd-item"><span>🏫 Room</span><span>{p.roomNo}</span></div>
          <div className="pcd-item"><span>🔖 Slot</span><span>{p.slot}</span></div>
          <div className="pcd-item"><span>📋 Code</span><span style={{fontFamily:"'Fira Code',monospace",fontSize:'11px'}}>{p.code}</span></div>
        </div>
      )}

      <style jsx>{`
        .pc {
          position:relative; border-radius:14px; overflow:hidden; cursor:pointer;
          background:var(--bg);
          border:1px solid var(--bdr);
          transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, border-color .15s, background .15s;
          animation:pcIn .4s cubic-bezier(.4,0,.2,1) both;
          padding:0 14px 0 18px;
        }
        @keyframes pcIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pc:hover:not(.pc-past) {
          transform:translateY(-3px) translateX(3px);
          box-shadow:0 8px 32px rgba(0,0,0,0.35), 0 0 20px var(--glow);
          border-color:var(--c);
        }
        .pc-live {
          background:rgba(239,68,68,0.06) !important;
          border-color:rgba(239,68,68,0.4) !important;
          box-shadow:0 0 0 1px rgba(239,68,68,0.15), 0 4px 20px rgba(239,68,68,0.12) !important;
        }
        .pc-next { border-color:rgba(99,102,241,0.35) !important; }
        .pc-past { opacity:0.4; }
        .pc-exp  { border-color:var(--c) !important; }

        /* Left bar */
        .pc-bar {
          position:absolute; left:0; top:10%; bottom:10%;
          width:3px; border-radius:0 3px 3px 0;
          background:var(--c);
          box-shadow:1px 0 8px var(--glow);
        }
        .pc-live .pc-bar { background:#ef4444; box-shadow:1px 0 10px rgba(239,68,68,.6); }

        /* Period badge */
        .pc-period-badge {
          position:absolute; left:10px; top:10px;
          font-family:'Fira Code',monospace; font-size:8px; font-weight:700;
          color:rgba(255,255,255,0.2); letter-spacing:.5px;
        }

        /* Status pill */
        .pc-status {
          position:absolute; top:10px; right:12px;
          font-size:8.5px; font-weight:800; letter-spacing:1.2px;
          padding:2px 8px; border-radius:10px;
          display:flex; align-items:center; gap:4px;
        }
        .pc-status-live { background:rgba(239,68,68,.12); color:#fca5a5; border:1px solid rgba(239,68,68,.3); animation:livePulse 2s ease-in-out infinite; }
        @keyframes livePulse { 0%,100%{background:rgba(239,68,68,.12)} 50%{background:rgba(239,68,68,.2)} }
        .pc-status-next { background:rgba(99,102,241,.12); color:#a5b4fc; border:1px solid rgba(99,102,241,.25); }
        .live-dot { width:5px; height:5px; border-radius:50%; background:#ef4444; box-shadow:0 0 5px #ef4444; animation:ldPulse 1.2s ease-in-out infinite; flex-shrink:0; }
        @keyframes ldPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.65)} }

        /* Main layout */
        .pc-main { display:flex; align-items:center; gap:14px; padding:14px 0 12px; }

        /* Time block */
        .pc-time-block {
          display:flex; flex-direction:column; align-items:center;
          gap:3px; flex-shrink:0; min-width:56px;
        }
        .pc-time-start, .pc-time-end {
          font-family:'Fira Code',monospace; font-size:12px; font-weight:600;
          color:var(--c); letter-spacing:-.2px;
        }
        .pc-time-divider { display:flex; flex-direction:column; align-items:center; gap:1px; width:100%; }
        .pctd-line { width:80%; height:1px; background:rgba(255,255,255,0.08); }
        .pctd-dur { font-size:8px; color:rgba(255,255,255,0.2); font-family:'Fira Code',monospace; }

        /* Content */
        .pc-content { flex:1; min-width:0; }
        .pc-name { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:rgba(240,240,250,.92); line-height:1.3; margin-bottom:7px; }
        .pc-meta-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .pc-type-chip { font-size:10px; font-weight:700; padding:2px 8px; border-radius:8px; letter-spacing:.3px; }
        .pc-room, .pc-slot { font-size:11px; color:rgba(255,255,255,0.28); }

        /* Right */
        .pc-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0; }
        .pc-code  { font-family:'Fira Code',monospace; font-size:9px; color:rgba(255,255,255,0.18); letter-spacing:.3px; }
        .pc-chevron { color:rgba(255,255,255,0.2); transition:transform .22s,color .15s; }
        .pc:hover .pc-chevron { color:var(--c); }

        /* Expanded detail */
        .pc-detail {
          display:grid; grid-template-columns:1fr 1fr;
          gap:8px; padding:12px 0 14px; border-top:1px solid rgba(255,255,255,0.06);
          animation:detIn .25s ease both;
        }
        @keyframes detIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .pcd-item { display:flex; flex-direction:column; gap:2px; }
        .pcd-item span:first-child { font-size:10px; color:rgba(255,255,255,0.28); }
        .pcd-item span:last-child  { font-size:12.5px; color:rgba(240,240,250,.75); font-weight:500; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */
export default function TimetableView({ timetableData }) {
  const schedule   = timetableData?.schedule && Array.isArray(timetableData.schedule) ? timetableData.schedule : (timetableData === null ? [] : MOCK_SCHEDULE);
  const batchLabel = timetableData?.batch ? `Batch ${timetableData.batch}` : 'Batch 1';

  const today        = new Date();
  const todayKey     = dateKey(today);
  const todayOrder   = ACADEMIC_CALENDAR[todayKey];        // number|null|undefined
  const isHoliday    = todayOrder === null;
  const isWeekend    = todayOrder === undefined;
  const hasTodayClass= typeof todayOrder === 'number';
  const holidayName  = HOLIDAY_NAMES[todayKey] || 'Holiday';
  const nextDay      = (isHoliday || isWeekend) ? nextClassDay(today) : null;

  const [activeDay, setActiveDay] = useState(hasTodayClass ? todayOrder : 1);
  const [expanded,  setExpanded]  = useState(null);
  const [nowMin,    setNowMin]    = useState(getNowMin());
  const [nowLabel,  setNowLabel]  = useState(fmtNow());
  const [animating, setAnimating] = useState(false);
  const [animDir,   setAnimDir]   = useState(1);

  useEffect(() => {
    const id = setInterval(() => { setNowMin(getNowMin()); setNowLabel(fmtNow()); }, 30_000);
    return () => clearInterval(id);
  }, []);

  const switchDay = useCallback((d) => {
    if (d === activeDay) return;
    setAnimDir(d > activeDay ? 1 : -1);
    setAnimating(true);
    setTimeout(() => { setActiveDay(d); setExpanded(null); setAnimating(false); }, 180);
  }, [activeDay]);

  const isViewingToday = hasTodayClass && activeDay === todayOrder;
  const dayData  = schedule.find(s => s.day === activeDay);
  // NO merging — every slot is its own card
  const periods  = dayData ? buildIndividualPeriods(dayData.table) : [];

  // Live/Next detection
  const liveIdx = isViewingToday ? periods.findIndex(p => nowMin >= p.startMin && nowMin < p.endMin) : -1;
  const nextIdx = isViewingToday ? periods.findIndex((p, i) => i > liveIdx && nowMin < p.startMin) : -1;

  function getStatus(i) {
    if (i === liveIdx) return 'live';
    const p = periods[i];
    if (isViewingToday && p.endMin <= nowMin) return 'past';
    if (i === (liveIdx === -1 ? periods.findIndex(p => nowMin < p.startMin) : -1)) return 'next';
    return 'normal';
  }

  // Count per type
  const theoryCnt = periods.filter(p => p.courseType==='Theory').length;
  const labCnt    = periods.filter(p => p.courseType==='Practical').length;

  return (
    <div className="tt">

      {/* ── HEADER ──────────────────────────────── */}
      <div className="tt-head">
        <div className="tt-title-row">
          <div>
            <h2 className="tt-title">Timetable</h2>
            <p className="tt-sub">{batchLabel} · SRM KTR Campus</p>
          </div>
          <div className="tt-pills">
            {theoryCnt > 0 && <span className="tt-pill" style={{'--c':'#818cf8','--b':'rgba(99,102,241,.12)'}}>◈ {theoryCnt}</span>}
            {labCnt    > 0 && <span className="tt-pill" style={{'--c':'#34d399','--b':'rgba(16,185,129,.12)'}}>⬡ {labCnt}</span>}
            {periods.length > 0 && <span className="tt-pill" style={{'--c':'rgba(255,255,255,.4)','--b':'rgba(255,255,255,.05)'}}>
              {periods.length} periods
            </span>}
          </div>
        </div>

        {/* ── TODAY BANNER ─────────────────────── */}
        {isHoliday && (
          <div className="today-banner banner-holiday">
            <span className="tb-emoji">🎉</span>
            <div className="tb-text">
              <strong>{holidayName}</strong> — No Classes Today
              {nextDay && (
                <span className="tb-next">Next class day: {fmtDate(nextDay.date)} (Day {nextDay.dayOrder})</span>
              )}
            </div>
          </div>
        )}
        {isWeekend && (
          <div className="today-banner banner-weekend">
            <span className="tb-emoji">😴</span>
            <div className="tb-text">
              <strong>Weekend!</strong> — Enjoy your break
              {nextDay && (
                <span className="tb-next">Next class day: {fmtDate(nextDay.date)} (Day {nextDay.dayOrder})</span>
              )}
            </div>
          </div>
        )}
        {hasTodayClass && (
          <div className="today-banner banner-class">
            <span className="tb-dot" />
            <div className="tb-text">
              Today is <strong>Day Order {todayOrder}</strong> · {periods.length} periods scheduled
              <span className="tb-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        )}

        {/* ── DAY TABS ─────────────────────────── */}
        <div className="day-tabs">
          {[1,2,3,4,5].map(d => {
            const dps     = buildIndividualPeriods(schedule.find(s => s.day===d)?.table || []);
            const isAct   = d === activeDay;
            const isTod   = hasTodayClass && d === todayOrder;
            const hasLive = isAct && liveIdx !== -1;
            return (
              <button
                key={d}
                className={`dt ${isAct?'dt-active':''} ${isTod&&!isAct?'dt-today':''}`}
                onClick={() => switchDay(d)}
              >
                <span className="dt-num">{d}</span>
                {hasLive && <span className="dt-live-dot" />}
                {isTod && !isAct && <span className="dt-today-dot" />}
                {!isAct && dps.length > 0 && <span className="dt-count">{dps.length}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PERIODS ─────────────────────────────── */}
      <div className={`tt-body ${animating?(animDir>0?'ao-l':'ao-r'):''}`}>
        {periods.length === 0 ? (
          <div className="tt-empty">
            <div style={{fontSize:36,opacity:.3}}>📋</div>
            <div className="tte-title">No Periods</div>
            <div className="tte-sub">Day Order {activeDay} has no scheduled classes.</div>
          </div>
        ) : (
          <div className="periods-list">
            {/* Live time indicator */}
            {isViewingToday && liveIdx === -1 && (
              <div className="now-line">
                <div className="nl-pill">
                  <span className="nl-dot" />{nowLabel}
                </div>
                <div className="nl-track" />
              </div>
            )}

            {periods.map((p, i) => {
              const status = getStatus(i);
              // Insert NOW line after live card
              const showNowAfter = isViewingToday && i === liveIdx;
              return (
                <div key={`${p.code}-${i}`}>
                  <PeriodCard
                    p={p}
                    status={status}
                    expanded={expanded === i}
                    onToggle={() => setExpanded(e => e===i?null:i)}
                    idx={i}
                  />
                  {showNowAfter && (
                    <div className="now-line" style={{margin:'6px 0'}}>
                      <div className="nl-pill"><span className="nl-dot" />{nowLabel}</div>
                      <div className="nl-track" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LEGEND ──────────────────────────────── */}
      <div className="tt-legend">
        <div className="leg"><div className="leg-dot" style={{background:'#818cf8'}} />Theory</div>
        <div className="leg"><div className="leg-dot" style={{background:'#34d399'}} />Lab</div>
        <div className="leg"><div className="leg-dot" style={{background:'#fbbf24'}} />Online</div>
        {isViewingToday && liveIdx !== -1 && (
          <div className="leg" style={{color:'rgba(252,165,165,.7)'}}>
            <div className="leg-dot" style={{background:'#ef4444'}} />Live
          </div>
        )}
        <span className="leg-tip">Tap card to expand · P# = period number</span>
      </div>

      <style jsx>{`
        .tt { display:flex; flex-direction:column; gap:0; font-family:'DM Sans',sans-serif; }

        /* HEAD */
        .tt-head { margin-bottom:20px; }
        .tt-title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:12px; }
        .tt-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:rgba(240,240,250,.95); letter-spacing:-.4px; }
        .tt-sub   { font-size:12px; color:rgba(255,255,255,.3); margin-top:2px; }
        .tt-pills { display:flex; gap:6px; align-items:center; }
        .tt-pill  { padding:4px 11px; border-radius:16px; background:var(--b); color:var(--c); font-size:11px; font-weight:700; border:1px solid rgba(255,255,255,.06); white-space:nowrap; }

        /* TODAY BANNER */
        .today-banner {
          display:flex; align-items:flex-start; gap:10px;
          padding:10px 16px; border-radius:12px; margin-bottom:12px;
          font-size:13px;
        }
        .banner-holiday { background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.22); color:#fcd34d; }
        .banner-weekend { background:rgba(99,102,241,.07); border:1px solid rgba(99,102,241,.18); color:rgba(165,180,252,.8); }
        .banner-class   { background:rgba(52,211,153,.07); border:1px solid rgba(52,211,153,.2);  color:rgba(52,211,153,.9); align-items:center; padding:8px 14px; }
        .tb-emoji { font-size:20px; flex-shrink:0; margin-top:1px; }
        .tb-text  { display:flex; flex-direction:column; gap:3px; }
        .tb-text strong { font-weight:700; }
        .tb-next  { font-size:11.5px; opacity:.7; }
        .tb-dot   { width:7px; height:7px; border-radius:50%; background:#34d399; box-shadow:0 0 6px #34d399; flex-shrink:0; animation:tdPulse 2s ease-in-out infinite; }
        @keyframes tdPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

        /* DAY TABS */
        .day-tabs { display:flex; gap:7px; }
        .dt {
          position:relative; width:48px; height:48px; border-radius:13px;
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
          color:rgba(255,255,255,.35); cursor:pointer; font-family:'Fira Code',monospace;
          font-size:16px; font-weight:500; display:flex; align-items:center; justify-content:center;
          transition:all .18s cubic-bezier(.4,0,.2,1); user-select:none;
        }
        .dt:hover:not(.dt-active) { background:rgba(255,255,255,.07); color:rgba(255,255,255,.7); transform:translateY(-2px); }
        .dt-active { background:rgba(99,102,241,.15)!important; border-color:rgba(99,102,241,.4)!important; color:#a5b4fc!important; box-shadow:0 4px 16px rgba(99,102,241,.15); }
        .dt-today  { border-color:rgba(99,102,241,.25)!important; }
        .dt-num    { font-size:17px; }
        .dt-live-dot { position:absolute; top:5px; right:5px; width:6px; height:6px; border-radius:50%; background:#ef4444; box-shadow:0 0 5px #ef4444; animation:ldPulse2 1.3s ease-in-out infinite; }
        .dt-today-dot { position:absolute; top:5px; right:5px; width:6px; height:6px; border-radius:50%; background:#818cf8; box-shadow:0 0 5px rgba(129,140,248,.6); }
        .dt-count { position:absolute; bottom:4px; right:5px; font-size:8px; color:rgba(255,255,255,.25); font-family:'Fira Code',monospace; }
        @keyframes ldPulse2 { 0%,100%{opacity:1} 50%{opacity:.3} }

        /* BODY */
        .tt-body { transition:opacity .18s ease,transform .18s ease; }
        .ao-l { opacity:0; transform:translateX(-12px); pointer-events:none; }
        .ao-r { opacity:0; transform:translateX(12px);  pointer-events:none; }

        .periods-list { display:flex; flex-direction:column; gap:8px; }

        /* NOW LINE */
        .now-line { display:flex; align-items:center; gap:0; margin:4px 0; }
        .nl-pill {
          display:flex; align-items:center; gap:5px;
          background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.35);
          color:#fca5a5; font-family:'Fira Code',monospace;
          font-size:10px; font-weight:700; letter-spacing:.5px;
          padding:3px 9px; border-radius:16px; white-space:nowrap;
          box-shadow:0 0 10px rgba(239,68,68,.15); flex-shrink:0;
        }
        .nl-dot { width:5px; height:5px; border-radius:50%; background:#ef4444; box-shadow:0 0 4px #ef4444; animation:nlPulse 1.2s ease-in-out infinite; }
        @keyframes nlPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.6)} }
        .nl-track { flex:1; height:1px; background:linear-gradient(90deg,rgba(239,68,68,.45),transparent); }

        /* EMPTY */
        .tt-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:56px 24px; gap:10px; }
        .tte-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:rgba(255,255,255,.3); }
        .tte-sub   { font-size:13px; color:rgba(255,255,255,.18); }

        /* LEGEND */
        .tt-legend { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:16px; padding-top:14px; border-top:1px solid rgba(255,255,255,.06); }
        .leg { display:flex; align-items:center; gap:5px; font-size:11px; color:rgba(255,255,255,.3); }
        .leg-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .leg-tip { margin-left:auto; font-size:10.5px; color:rgba(255,255,255,.15); font-style:italic; }

        @media (max-width:580px) {
          .tt-title-row { flex-direction:column; gap:8px; }
          .dt { width:42px; height:42px; font-size:15px; border-radius:11px; }
          .leg-tip { display:none; }
        }
      `}</style>
    </div>
  );
}