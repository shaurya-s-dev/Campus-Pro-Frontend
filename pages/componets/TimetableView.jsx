import { useState, useEffect, useCallback } from 'react';

/* ══════════════════════════════════════════════════
   ACADEMIC CALENDAR — day order map
   Key: "YYYY-MM-DD" → day order number (1–5)
   null = holiday / no class
   ══════════════════════════════════════════════════ */
const ACADEMIC_CALENDAR = {
  // January 2026
  '2026-01-02': 1, '2026-01-03': 2, '2026-01-05': 3, '2026-01-06': 4,
  '2026-01-07': 5, '2026-01-08': 1, '2026-01-09': 2, '2026-01-10': 3,
  '2026-01-12': 4, '2026-01-13': 5,
  '2026-01-14': null, // Pongal
  '2026-01-15': null, // Thiruvalluvar Day
  '2026-01-16': null, // Uzhavar Thirunal
  '2026-01-17': 1, '2026-01-18': 2, '2026-01-19': 3, '2026-01-20': 4,
  '2026-01-21': 5, '2026-01-22': 1, '2026-01-23': 2, '2026-01-24': 3,
  '2026-01-26': null, // Republic Day
  '2026-01-27': 4, '2026-01-28': 5, '2026-01-29': 1, '2026-01-30': 2,
  '2026-01-31': 3,
  // February 2026
  '2026-02-02': 4, '2026-02-03': 5, '2026-02-04': 1, '2026-02-05': 2,
  '2026-02-06': 3, '2026-02-07': 4, '2026-02-09': 5, '2026-02-10': 1,
  '2026-02-11': 2, '2026-02-12': 3, '2026-02-13': 4, '2026-02-16': 5,
  '2026-02-17': 1, '2026-02-18': 2, '2026-02-20': 3, '2026-02-21': 4,
  '2026-02-23': 5, '2026-02-24': 1, '2026-02-25': 2, '2026-02-26': 3,
  '2026-02-27': 4, '2026-02-28': 5,
  // March 2026
  '2026-03-02': 1, '2026-03-03': 2, '2026-03-04': 3, '2026-03-05': 4,
  '2026-03-06': 5, '2026-03-07': 1, '2026-03-09': 2, '2026-03-10': 3,
  '2026-03-11': 4, '2026-03-12': 5, '2026-03-13': 1, '2026-03-16': 2,
  '2026-03-17': 3,
  '2026-03-18': null, // Holi
  '2026-03-19': null, // ← TODAY — holiday/no class
  '2026-03-20': 5, '2026-03-23': 1, '2026-03-24': 2, '2026-03-26': 3,
  '2026-03-27': 4, '2026-03-28': 5, '2026-03-30': 1, '2026-03-31': 2,
  // April 2026
  '2026-04-01': null, // Tamil New Year
  '2026-04-02': 3,
  '2026-04-03': null, // Good Friday
  '2026-04-04': 4, '2026-04-06': 5, '2026-04-07': 1, '2026-04-08': 2,
  '2026-04-09': 3, '2026-04-10': 4, '2026-04-13': 5,
  '2026-04-14': null, // Dr. Ambedkar Jayanti
  '2026-04-15': 1, '2026-04-16': 2, '2026-04-17': 3, '2026-04-20': 4,
  '2026-04-22': 5, '2026-04-23': 1, '2026-04-24': 2, '2026-04-27': 3,
  '2026-04-28': 4, '2026-04-29': 5, '2026-04-30': 1,
};

const HOLIDAY_NAMES = {
  '2026-01-14': 'Pongal',
  '2026-01-15': 'Thiruvalluvar Day',
  '2026-01-16': 'Uzhavar Thirunal',
  '2026-01-26': 'Republic Day',
  '2026-03-18': 'Holi',
  '2026-03-19': 'Holi Holiday',
  '2026-04-01': 'Tamil New Year / Ugadi',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Ambedkar Jayanti',
};

/* ══════════════════════════════════════════════════
   SLOTS
   ══════════════════════════════════════════════════ */
const SLOTS = [
  { idx:0, label:'8:00',  start:'8:00 AM',  end:'8:50 AM',  startMin:0,   endMin:50  },
  { idx:1, label:'8:50',  start:'8:50 AM',  end:'9:45 AM',  startMin:50,  endMin:105 },
  { idx:2, label:'9:45',  start:'9:45 AM',  end:'10:40 AM', startMin:105, endMin:160 },
  { idx:3, label:'10:40', start:'10:40 AM', end:'11:35 AM', startMin:160, endMin:215 },
  { idx:4, label:'11:35', start:'11:35 AM', end:'12:30 PM', startMin:215, endMin:270 },
  { idx:5, label:'1:15',  start:'1:15 PM',  end:'2:10 PM',  startMin:315, endMin:370 },
  { idx:6, label:'2:10',  start:'2:10 PM',  end:'3:05 PM',  startMin:370, endMin:425 },
  { idx:7, label:'3:05',  start:'3:05 PM',  end:'4:00 PM',  startMin:425, endMin:480 },
  { idx:8, label:'4:00',  start:'4:00 PM',  end:'4:50 PM',  startMin:480, endMin:530 },
  { idx:9, label:'4:50',  start:'4:50 PM',  end:'5:40 PM',  startMin:530, endMin:590 },
];
const DAY_START_MIN = 8 * 60;

const TYPE_CONFIG = {
  Theory:    { accent:'#6366f1', glow:'rgba(99,102,241,0.18)',  bg:'rgba(99,102,241,0.07)',  border:'rgba(99,102,241,0.22)',  tag:'rgba(99,102,241,0.15)',  tagText:'#a5b4fc', icon:'◈' },
  Practical: { accent:'#10b981', glow:'rgba(16,185,129,0.18)',  bg:'rgba(16,185,129,0.07)',  border:'rgba(16,185,129,0.22)',  tag:'rgba(16,185,129,0.15)',  tagText:'#6ee7b7', icon:'⬡' },
  online:    { accent:'#f59e0b', glow:'rgba(245,158,11,0.15)',  bg:'rgba(245,158,11,0.05)',  border:'rgba(245,158,11,0.3)',   tag:'rgba(245,158,11,0.12)',  tagText:'#fcd34d', icon:'◎', dashed:true },
};

/* ══════════════════════════════════════════════════
   MOCK SCHEDULE
   ══════════════════════════════════════════════════ */
const MOCK_SCHEDULE = [
  { day:1, table:[
    { code:'21CSE101T', name:'Data Structures and Algorithms',     slot:'A',   roomNo:'TP606',       courseType:'Theory'    },
    { code:'21CSE101T', name:'Data Structures and Algorithms',     slot:'A',   roomNo:'TP606',       courseType:'Theory'    },
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems',slot:'F',  roomNo:'UB117',       courseType:'Theory'    },
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems',slot:'F',  roomNo:'UB117',       courseType:'Theory'    },
    { code:'21PHY102T', name:'Engineering Physics',                slot:'G',   roomNo:'SMV208',      courseType:'Theory'    },
    null, null,
    { code:'21CSE151P', name:'Data Structures Lab',                slot:'P6',  roomNo:'UB-G01 Lab',  courseType:'Practical' },
    { code:'21CSE151P', name:'Data Structures Lab',                slot:'P7',  roomNo:'UB-G01 Lab',  courseType:'Practical' },
    { code:'21CSE151P', name:'Data Structures Lab',                slot:'P8',  roomNo:'UB-G01 Lab',  courseType:'Practical' },
  ]},
  { day:2, table:[
    null, null, null, null, null,
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'B', roomNo:'TP501',  courseType:'Theory' },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'B', roomNo:'TP501',  courseType:'Theory' },
    { code:'21ECE101T', name:'Digital Electronics',                    slot:'G', roomNo:'UB201',  courseType:'Theory' },
    { code:'21ECE101T', name:'Digital Electronics',                    slot:'G', roomNo:'UB201',  courseType:'Theory' },
    { code:'21CSE101T', name:'Data Structures and Algorithms',         slot:'A', roomNo:'TP606',  courseType:'Theory' },
  ]},
  { day:3, table:[
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'C',   roomNo:'TP501',       courseType:'Theory'    },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'C',   roomNo:'TP501',       courseType:'Theory'    },
    { code:'21CSE101T', name:'Data Structures and Algorithms',         slot:'A',   roomNo:'TP606',       courseType:'Theory'    },
    { code:'21CSE301T', name:'Computer Networks',                      slot:'D',   roomNo:'SMV101',      courseType:'Theory'    },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'B',   roomNo:'TP501',       courseType:'Theory'    },
    { code:'21PHY152P', name:'Engineering Physics Lab',                slot:'P26', roomNo:'PHY Lab B2',  courseType:'Practical' },
    { code:'21PHY152P', name:'Engineering Physics Lab',                slot:'P27', roomNo:'PHY Lab B2',  courseType:'Practical' },
    { code:'21PHY152P', name:'Engineering Physics Lab',                slot:'P28', roomNo:'PHY Lab B2',  courseType:'Practical' },
    null, null,
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
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems',   slot:'E',   roomNo:'UB117',     courseType:'Theory'    },
    { code:'21MAT201T', name:'Transforms & Boundary Value Problems',   slot:'E',   roomNo:'UB117',     courseType:'Theory'    },
    { code:'21CSE102T', name:'Object Oriented Design and Programming', slot:'C',   roomNo:'TP501',     courseType:'Theory'    },
    { code:'21PHY102T', name:'Engineering Physics',                    slot:'F',   roomNo:'SMV208',    courseType:'Theory'    },
    { code:'21CSE301T', name:'Computer Networks',                      slot:'D',   roomNo:'SMV101',    courseType:'Theory'    },
    { code:'21ECE151P', name:'Digital Electronics Lab',                slot:'P46', roomNo:'ECE Lab A1',courseType:'Practical' },
    { code:'21ECE151P', name:'Digital Electronics Lab',                slot:'P47', roomNo:'ECE Lab A1',courseType:'Practical' },
    { code:'21ECE151P', name:'Digital Electronics Lab',                slot:'P48', roomNo:'ECE Lab A1',courseType:'Practical' },
    null, null,
  ]},
];

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */
function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getTodayDayOrder() {
  const key = toDateKey(new Date());
  return ACADEMIC_CALENDAR[key]; // number 1-5 or null (holiday) or undefined (weekend/unknown)
}

function getTodayHolidayName() {
  const key = toDateKey(new Date());
  return HOLIDAY_NAMES[key] || null;
}

function getNowMin() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes() - DAY_START_MIN;
}

function formatNow() {
  return new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
}

/* Build unique period blocks — consecutive SAME course+room = one period */
function buildPeriods(table) {
  const periods = [];
  let i = 0;
  while (i < table.length) {
    const slot = table[i];
    if (!slot) { i++; continue; }
    let j = i + 1;
    // Only merge if same course code AND same room (prevents false merges)
    while (j < table.length && table[j] && table[j].code === slot.code && table[j].roomNo === slot.roomNo) j++;
    const ss = SLOTS[i], es = SLOTS[j-1];
    if (!ss || !es) { i = j; continue; }
    periods.push({
      ...slot,
      slotIndexStart: i, slotIndexEnd: j-1, slotCount: j-i,
      startLabel: ss.label, endLabel: es.label,
      startTime: ss.start,  endTime: es.end,
      startMin:  ss.startMin, endMin: es.endMin,
      duration:  es.endMin - ss.startMin,
    });
    i = j;
  }
  return periods;
}

function computeStatus(periods, nowMin) {
  let liveIdx = -1, nextIdx = -1;
  for (let i = 0; i < periods.length; i++) {
    if (nowMin >= periods[i].startMin && nowMin < periods[i].endMin) { liveIdx = i; break; }
    if (nowMin < periods[i].startMin && nextIdx === -1) nextIdx = i;
  }
  return { liveIdx, nextIdx };
}

/* ══════════════════════════════════════════════════
   HOLIDAY BANNER
   ══════════════════════════════════════════════════ */
function HolidayBanner({ name }) {
  return (
    <div className="holiday-banner">
      <div className="hb-icon">🎉</div>
      <div className="hb-content">
        <div className="hb-title">No Classes Today</div>
        <div className="hb-reason">{name || 'Holiday'} · Enjoy your day!</div>
      </div>
      <div className="hb-confetti">🏖️</div>
      <style jsx>{`
        .holiday-banner {
          display:flex; align-items:center; gap:16px;
          background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(244,63,94,0.06));
          border:1px solid rgba(245,158,11,0.25);
          border-radius:16px; padding:22px 24px;
          animation:hbIn .4s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes hbIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        .hb-icon { font-size:36px; animation:float 3s ease-in-out infinite; flex-shrink:0; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .hb-content { flex:1; }
        .hb-title {
          font-family:'Syne',sans-serif; font-size:20px; font-weight:800;
          color:rgba(240,240,250,0.95); letter-spacing:-0.3px;
        }
        .hb-reason { font-size:13px; color:rgba(245,158,11,0.8); margin-top:4px; font-weight:500; }
        .hb-confetti { font-size:28px; flex-shrink:0; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   WEEKEND BANNER
   ══════════════════════════════════════════════════ */
function WeekendBanner() {
  return (
    <div className="weekend-banner">
      <div className="wb-icon">😴</div>
      <div>
        <div className="wb-title">It's the Weekend!</div>
        <div className="wb-sub">No classes scheduled. Select a Day Order to preview the schedule.</div>
      </div>
      <style jsx>{`
        .weekend-banner {
          display:flex; align-items:center; gap:16px;
          background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15);
          border-radius:16px; padding:22px 24px;
          animation:fadeUp .4s ease both;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .wb-icon { font-size:32px; }
        .wb-title { font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:rgba(240,240,250,0.85); }
        .wb-sub { font-size:13px; color:rgba(240,240,250,0.35); margin-top:4px; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   LIVE DOT
   ══════════════════════════════════════════════════ */
function LiveDot() {
  return (
    <span style={{ position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',width:10,height:10 }}>
      <span style={{ position:'absolute',width:14,height:14,borderRadius:'50%',border:'1.5px solid rgba(239,68,68,0.55)',animation:'liveRing 1.4s ease-out infinite' }} />
      <span style={{ width:6,height:6,borderRadius:'50%',background:'#ef4444',position:'relative',zIndex:1 }} />
      <style jsx global>{`@keyframes liveRing{0%{transform:scale(0.6);opacity:1}100%{transform:scale(1.7);opacity:0}}`}</style>
    </span>
  );
}

/* ══════════════════════════════════════════════════
   SESSION CARD
   ══════════════════════════════════════════════════ */
function SessionCard({ period, status, expanded, onToggle, delay }) {
  const cfg    = period.online ? TYPE_CONFIG.online : (TYPE_CONFIG[period.courseType] || TYPE_CONFIG.Theory);
  const isLive = status === 'live';
  const isNext = status === 'next';

  // Duration display — show total time only, NOT slot count badge
  const durLabel = `${period.duration} min`;
  // Only show "× N periods" in expanded details, not as a prominent badge
  const periodInfo = period.slotCount > 1 ? `${period.slotCount} consecutive periods` : '1 period';

  return (
    <div
      className={`card ${isLive?'card-live':''} ${isNext?'card-next':''} ${expanded?'card-exp':''}`}
      style={{ animationDelay:`${delay}ms`, '--acc':cfg.accent, '--glow':cfg.glow, '--bg':cfg.bg, '--bdr':cfg.border }}
      onClick={onToggle}
      role="button" tabIndex={0}
      onKeyDown={e => e.key==='Enter' && onToggle()}
    >
      <div className="card-rail" />

      {isLive && (
        <div className="status-badge badge-live">
          <LiveDot /> LIVE NOW
        </div>
      )}
      {isNext && !isLive && (
        <div className="status-badge badge-next">
          <span style={{ display:'inline-block',animation:'nextBounce 1.2s ease-in-out infinite' }}>↑</span> UP NEXT
        </div>
      )}

      <div className="card-body">
        {/* Type tag — clean, no ×N badge */}
        <div className="card-top">
          <span className="card-type-icon" style={{ color:cfg.accent }}>{cfg.icon}</span>
          <span className="card-type-tag" style={{ background:cfg.tag, color:cfg.tagText }}>
            {period.online ? 'Online' : period.courseType}
          </span>
          <span className="card-expand-hint">{expanded ? '↑' : '↓'}</span>
        </div>

        {/* Full subject name — no truncation on desktop */}
        <div className="card-name">{period.name}</div>

        {/* Time row */}
        <div className="card-time-row">
          <span className="card-time" style={{ color:cfg.accent }}>{period.startTime}</span>
          <span className="card-sep">→</span>
          <span className="card-time" style={{ color:cfg.accent }}>{period.endTime}</span>
          <span className="card-dur">{durLabel}</span>
        </div>

        {/* Progress bar */}
        <div className="dur-track">
          <div className="dur-fill" style={{ width:`${Math.min((period.duration/110)*100,100)}%` }} />
        </div>

        {/* Expanded details */}
        <div className={`card-details ${expanded?'det-open':''}`}>
          <div className="det-grid">
            <div className="det-item"><span className="det-ico">🏫</span><div><div className="det-lbl">Room</div><div className="det-val">{period.roomNo}</div></div></div>
            <div className="det-item"><span className="det-ico">🔖</span><div><div className="det-lbl">Slot</div><div className="det-val">{period.slot}</div></div></div>
            <div className="det-item"><span className="det-ico">📋</span><div><div className="det-lbl">Code</div><div className="det-val" style={{fontFamily:"'Fira Code',monospace",fontSize:'10.5px'}}>{period.code}</div></div></div>
            <div className="det-item"><span className="det-ico">⏱</span><div><div className="det-lbl">Schedule</div><div className="det-val">{periodInfo} · {period.duration} min</div></div></div>
          </div>
        </div>
      </div>

      {isLive && <div className="card-live-glow" />}

      <style jsx>{`
        .card {
          position:relative; background:var(--bg); border:1px solid var(--bdr);
          border-radius:16px; overflow:hidden; cursor:pointer;
          transition:transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease, border-color .2s;
          animation:cardIn .4s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .card:hover { transform:translateY(-4px) scale(1.008); box-shadow:0 16px 48px rgba(0,0,0,0.35),0 0 28px var(--glow); border-color:var(--acc); }
        .card-live { border-color:rgba(239,68,68,.4)!important; box-shadow:0 0 0 1px rgba(239,68,68,.2),0 4px 24px rgba(239,68,68,.12)!important; background:rgba(239,68,68,.04)!important; }
        .card-next { border-color:rgba(0,212,255,.25)!important; }
        .card-exp  { border-color:var(--acc)!important; }
        .card-rail { position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--acc);border-radius:16px 0 0 16px;box-shadow:2px 0 12px var(--glow); }
        .card-live .card-rail { background:#ef4444;box-shadow:2px 0 12px rgba(239,68,68,.5); }

        .status-badge {
          position:absolute;top:10px;right:10px;
          display:flex;align-items:center;gap:5px;
          font-size:9px;font-weight:800;letter-spacing:1.2px;
          padding:3px 8px;border-radius:20px;
        }
        .badge-live { background:rgba(239,68,68,.12);color:#fca5a5;border:1px solid rgba(239,68,68,.3);animation:liveBadge 2s ease-in-out infinite; }
        @keyframes liveBadge { 0%,100%{background:rgba(239,68,68,.12)} 50%{background:rgba(239,68,68,.22)} }
        .badge-next { background:rgba(0,212,255,.08);color:#22d3ee;border:1px solid rgba(0,212,255,.2); }
        @keyframes nextBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }

        .card-body { padding:14px 16px 14px 20px; }
        .card-top { display:flex;align-items:center;gap:7px;margin-bottom:9px; }
        .card-type-icon { font-size:14px; }
        .card-type-tag { font-size:10px;font-weight:700;letter-spacing:.5px;padding:2px 8px;border-radius:10px;text-transform:uppercase; }
        .card-expand-hint { margin-left:auto;font-size:12px;color:rgba(255,255,255,.2);transition:transform .2s; }
        .card-exp .card-expand-hint { transform:rotate(180deg); }

        .card-name {
          font-family:'Syne',sans-serif; font-size:15px; font-weight:700;
          color:rgba(240,240,250,.92); line-height:1.3; margin-bottom:10px;
          letter-spacing:-0.2px;
        }
        .card-time-row { display:flex;align-items:center;gap:7px;margin-bottom:10px; }
        .card-time { font-family:'Fira Code',monospace;font-size:11.5px;font-weight:500;letter-spacing:.2px; }
        .card-sep  { font-size:11px;color:rgba(255,255,255,.2); }
        .card-dur  { margin-left:auto;font-size:10px;color:rgba(255,255,255,.28);font-family:'Fira Code',monospace; }

        .dur-track { height:2px;background:rgba(255,255,255,.05);border-radius:1px;overflow:hidden; }
        .dur-fill  { height:100%;background:var(--acc);border-radius:1px;opacity:.4;transition:width .5s ease; }

        .card-details { overflow:hidden;max-height:0;opacity:0;transition:max-height .35s cubic-bezier(.4,0,.2,1),opacity .25s ease,margin-top .25s ease; }
        .det-open { max-height:140px;opacity:1;margin-top:12px; }

        .det-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
        .det-item { display:flex;align-items:flex-start;gap:8px; }
        .det-ico  { font-size:13px;margin-top:1px; }
        .det-lbl  { font-size:9px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.6px; }
        .det-val  { font-size:12px;color:rgba(240,240,250,.72);margin-top:2px;font-weight:500; }

        .card-live-glow { position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at top left,rgba(239,68,68,.07),transparent 60%);animation:liveGlow 2.5s ease-in-out infinite; }
        @keyframes liveGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   NOW INDICATOR
   ══════════════════════════════════════════════════ */
function NowLine({ label }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:0,margin:'2px 0',zIndex:5,position:'relative' }}>
      <div style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.38)',color:'#fca5a5',fontFamily:"'Fira Code',monospace",fontSize:'10px',fontWeight:700,letterSpacing:'.7px',padding:'3px 9px',borderRadius:'20px',boxShadow:'0 0 12px rgba(239,68,68,.18)',whiteSpace:'nowrap' }}>
        <span style={{ width:5,height:5,borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 5px #ef4444',display:'inline-block',animation:'nowPulse 1.2s ease-in-out infinite' }} />
        {label}
      </div>
      <div style={{ flex:1,height:1,background:'linear-gradient(90deg,rgba(239,68,68,.55),transparent)' }} />
      <style jsx global>{`@keyframes nowPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════ */
export default function TimetableView({ timetableData }) {
  const schedule   = timetableData?.schedule || MOCK_SCHEDULE;
  const batchLabel = timetableData?.batch ? `Batch ${timetableData.batch}` : 'Batch 1';

  // Detect today's day order from academic calendar
  const todayOrder      = getTodayDayOrder();     // 1–5, null=holiday, undefined=weekend
  const todayHoliday    = getTodayHolidayName();
  const isHolidayToday  = todayOrder === null;
  const isWeekendToday  = todayOrder === undefined;
  const hasTodayClass   = typeof todayOrder === 'number';

  // Start on today's day order if classes, else Day 1
  const [activeDay, setActiveDay]   = useState(hasTodayClass ? todayOrder : 1);
  const [expandedId, setExpandedId] = useState(null);
  const [nowMin, setNowMin]         = useState(getNowMin());
  const [nowLabel, setNowLabel]     = useState(formatNow());
  const [animating, setAnimating]   = useState(false);
  const [animDir, setAnimDir]       = useState(1);
  const [showingToday, setShowingToday] = useState(hasTodayClass);

  useEffect(() => {
    const id = setInterval(() => { setNowMin(getNowMin()); setNowLabel(formatNow()); }, 30_000);
    return () => clearInterval(id);
  }, []);

  const switchDay = useCallback((day) => {
    if (day === activeDay) return;
    setAnimDir(day > activeDay ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setActiveDay(day);
      setExpandedId(null);
      setAnimating(false);
      setShowingToday(hasTodayClass && day === todayOrder);
    }, 180);
  }, [activeDay, hasTodayClass, todayOrder]);

  const dayData  = schedule.find(d => d.day === activeDay);
  const periods  = dayData ? buildPeriods(dayData.table) : [];
  const { liveIdx, nextIdx } = computeStatus(periods, nowMin);
  const isSchoolTime = nowMin >= 0 && nowMin <= 590;

  // Build render items
  const renderItems = [];
  periods.forEach((p, i) => {
    renderItems.push({ type:'marker', key:`m-${i}`, label:p.startLabel, lunchAfter: p.slotIndexEnd === 4 });
    if (isSchoolTime && showingToday && liveIdx === -1 && nextIdx === i) renderItems.push({ type:'now', key:'now' });
    renderItems.push({ type:'card', key:`c-${p.code}-${i}`, period:p, status: i===liveIdx?'live':i===nextIdx?'next':'normal', delay:i*60 });
    if (isSchoolTime && showingToday && liveIdx === i) renderItems.push({ type:'now', key:'now-after' });
  });

  const theoryCount = periods.filter(p => p.courseType==='Theory').length;
  const labCount    = periods.filter(p => p.courseType==='Practical').length;
  const totalHrs    = (periods.reduce((s,p) => s+p.duration, 0)/60).toFixed(1);

  return (
    <div className="tt-root">
      {/* ── HEADER ──────────────────────────────── */}
      <div className="tt-header">
        <div className="tt-title-row">
          <div>
            <h2 className="tt-title">Schedule</h2>
            <p className="tt-sub">{batchLabel} · SRM KTR Campus</p>
          </div>
          <div className="tt-pills">
            {theoryCount > 0 && <div className="tt-pill" style={{'--pc':'#6366f1','--pb':'rgba(99,102,241,0.1)'}}>◈ {theoryCount} Theory</div>}
            {labCount    > 0 && <div className="tt-pill" style={{'--pc':'#10b981','--pb':'rgba(16,185,129,0.1)'}}>⬡ {labCount} Lab</div>}
            {periods.length > 0 && <div className="tt-pill" style={{'--pc':'rgba(255,255,255,0.35)','--pb':'rgba(255,255,255,0.04)'}}>⏱ {totalHrs}h</div>}
          </div>
        </div>

        {/* ── TODAY STATUS BAR ────────────────── */}
        {(isHolidayToday || isWeekendToday || hasTodayClass) && (
          <div className="today-status-bar">
            {hasTodayClass && (
              <div className="tsb-chip tsb-class">
                <span className="tsb-dot" />
                Today is <strong>Day Order {todayOrder}</strong>
              </div>
            )}
            {isHolidayToday && (
              <div className="tsb-chip tsb-holiday">
                🎉 Today is a holiday
                {todayHoliday && <span className="tsb-holiday-name">— {todayHoliday}</span>}
              </div>
            )}
            {isWeekendToday && (
              <div className="tsb-chip tsb-weekend">😴 It's the weekend</div>
            )}
          </div>
        )}

        {/* ── DAY ORDER TABS ──────────────────── */}
        <div className="day-tabs">
          {[1,2,3,4,5].map(d => {
            const dPeriods   = buildPeriods(schedule.find(s => s.day === d)?.table || []);
            const isActive   = d === activeDay;
            const isToday    = hasTodayClass && d === todayOrder;
            const isLiveDay  = isActive && liveIdx !== -1 && isSchoolTime && showingToday;
            return (
              <button
                key={d}
                className={`day-tab ${isActive?'tab-active':''} ${isToday?'tab-today':''} ${!dPeriods.length?'tab-empty':''}`}
                onClick={() => switchDay(d)}
              >
                <span className="tab-num">D{d}</span>
                <span className="tab-lbl">Day Order {d}</span>
                {isToday && !isActive && <span className="tab-today-dot" title="Today" />}
                {isLiveDay && <span className="tab-live-dot" />}
                {!isActive && dPeriods.length > 0 && (
                  <span className="tab-count">{dPeriods.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BODY ────────────────────────────────── */}
      <div className={`tt-body ${animating?(animDir>0?'anim-left':'anim-right'):''}`}>

        {/* Holiday banner — shown when today is holiday AND viewing today's day */}
        {isHolidayToday && showingToday && (
          <HolidayBanner name={todayHoliday} />
        )}
        {isWeekendToday && showingToday && (
          <WeekendBanner />
        )}

        {periods.length === 0 ? (
          <div className="empty-day">
            <div style={{fontSize:40,opacity:.35}}>📅</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:'rgba(255,255,255,0.3)'}}>No Classes Scheduled</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.18)'}}>Day Order {activeDay} has no assigned periods.</div>
          </div>
        ) : (
          <div className="timeline">
            <div className="spine" />
            {renderItems.map(item => {
              if (item.type === 'marker') return (
                <div key={item.key} className="tl-row tl-marker">
                  <div className="tl-left">
                    <div style={{display:'flex',alignItems:'center',gap:0,height:22}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.13)',marginLeft:2}} />
                      <span style={{fontFamily:"'Fira Code',monospace",fontSize:10,color:'rgba(255,255,255,.22)',marginLeft:6}}>{item.label}</span>
                    </div>
                    {item.lunchAfter && (
                      <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0'}}>
                        <div style={{flex:1,borderTop:'1px dashed rgba(245,158,11,.2)'}} />
                        <span style={{fontSize:10,color:'rgba(245,158,11,.45)',fontWeight:600,whiteSpace:'nowrap'}}>☀ Lunch 12:30–1:15</span>
                        <div style={{flex:1,borderTop:'1px dashed rgba(245,158,11,.2)'}} />
                      </div>
                    )}
                  </div>
                  <div className="tl-right" />
                </div>
              );

              if (item.type === 'now') return (
                <div key={item.key} className="tl-row" style={{alignItems:'center',margin:'3px 0',zIndex:5}}>
                  <div className="tl-left" style={{display:'flex',justifyContent:'flex-end',paddingRight:8}}>
                    <div style={{width:10,height:10,borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 8px rgba(239,68,68,.65)',border:'2px solid rgba(239,68,68,.3)'}} />
                  </div>
                  <div className="tl-right"><NowLine label={nowLabel} /></div>
                </div>
              );

              if (item.type === 'card') return (
                <div key={item.key} className="tl-row tl-card" style={{paddingTop:2}}>
                  <div className="tl-left" style={{display:'flex',justifyContent:'flex-end',paddingRight:8,paddingTop:22}}>
                    <div style={{width:16,height:2,background:`linear-gradient(90deg,${TYPE_CONFIG[item.period.courseType]?.accent||'#6366f1'},transparent)`,opacity:.45}} />
                  </div>
                  <div className="tl-right">
                    <SessionCard
                      period={item.period}
                      status={item.status}
                      expanded={expandedId === item.key}
                      onToggle={() => setExpandedId(p => p===item.key?null:item.key)}
                      delay={item.delay}
                    />
                  </div>
                </div>
              );
              return null;
            })}

            {/* End marker */}
            {periods.length > 0 && (
              <div className="tl-row tl-marker" style={{marginTop:6}}>
                <div className="tl-left">
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',marginLeft:1}} />
                    <span style={{fontFamily:"'Fira Code',monospace",fontSize:10,color:'rgba(255,255,255,.16)'}}>{periods[periods.length-1].endLabel}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LEGEND ──────────────────────────────── */}
      {periods.length > 0 && (
        <div className="tt-legend">
          <div className="leg-item"><div className="leg-dot" style={{background:'#6366f1'}} />Theory</div>
          <div className="leg-item"><div className="leg-dot" style={{background:'#10b981'}} />Lab / Practical</div>
          <div className="leg-item"><div className="leg-dot leg-online" />Online</div>
          {isSchoolTime && showingToday && liveIdx !== -1 && (
            <div className="leg-item leg-live"><div className="leg-dot" style={{background:'#ef4444'}} />Currently Live</div>
          )}
          <span className="leg-tip">Tap a card to expand details</span>
        </div>
      )}

      <style jsx>{`
        .tt-root { display:flex; flex-direction:column; gap:0; }

        /* HEADER */
        .tt-header { margin-bottom:20px; }
        .tt-title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:12px; }
        .tt-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:rgba(240,240,250,.95); letter-spacing:-.4px; }
        .tt-sub   { font-size:12px; color:rgba(255,255,255,.3); margin-top:3px; }
        .tt-pills { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
        .tt-pill  { display:flex; align-items:center; gap:5px; background:var(--pb); color:var(--pc); border:1px solid rgba(255,255,255,.06); padding:4px 10px; border-radius:20px; font-size:10.5px; font-weight:600; white-space:nowrap; }

        /* TODAY STATUS BAR */
        .today-status-bar { margin-bottom:12px; }
        .tsb-chip { display:inline-flex; align-items:center; gap:7px; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; }
        .tsb-class { background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.25); color:#a5b4fc; }
        .tsb-class strong { color:#c7d2fe; }
        .tsb-dot { width:6px; height:6px; border-radius:50%; background:var(--emerald,#10b981); box-shadow:0 0 5px var(--emerald,#10b981); animation:tsbPulse 2s ease-in-out infinite; }
        @keyframes tsbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .tsb-holiday { background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.25); color:#fcd34d; }
        .tsb-holiday-name { color:rgba(252,211,77,.7); font-weight:400; margin-left:4px; }
        .tsb-weekend { background:rgba(99,102,241,.07); border:1px solid rgba(99,102,241,.15); color:rgba(240,240,250,.45); }

        /* DAY TABS */
        .day-tabs { display:flex; gap:6px; flex-wrap:wrap; }
        .day-tab {
          position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:2px; padding:10px 18px; border-radius:12px; min-width:74px;
          background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.07);
          color:rgba(255,255,255,.35); cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all .2s cubic-bezier(.4,0,.2,1); user-select:none;
        }
        .day-tab:hover:not(.tab-active) { background:rgba(255,255,255,.05); color:rgba(255,255,255,.6); border-color:rgba(255,255,255,.12); transform:translateY(-2px); }
        .tab-active { background:rgba(99,102,241,.12)!important; border-color:rgba(99,102,241,.35)!important; color:#a5b4fc!important; box-shadow:0 4px 20px rgba(99,102,241,.12); }
        .tab-today  { border-color:rgba(99,102,241,.25)!important; }
        .tab-empty  { opacity:.4; }
        .tab-num  { font-family:'Fira Code',monospace; font-size:17px; font-weight:500; line-height:1; }
        .tab-lbl  { font-size:9px; letter-spacing:.8px; text-transform:uppercase; opacity:.65; }
        .tab-live-dot { position:absolute; top:7px; right:7px; width:6px; height:6px; border-radius:50%; background:#ef4444; box-shadow:0 0 5px #ef4444; animation:tabLive 1.3s ease-in-out infinite; }
        .tab-today-dot { position:absolute; top:7px; right:7px; width:6px; height:6px; border-radius:50%; background:#6366f1; box-shadow:0 0 5px rgba(99,102,241,.6); }
        @keyframes tabLive { 0%,100%{opacity:1} 50%{opacity:.3} }
        .tab-count { position:absolute; top:5px; right:5px; font-size:9px; font-weight:700; background:rgba(255,255,255,.07); color:rgba(255,255,255,.35); border-radius:8px; padding:1px 5px; }

        /* BODY */
        .tt-body { transition:opacity .18s ease,transform .18s ease; }
        .anim-left  { opacity:0; transform:translateX(-12px); pointer-events:none; }
        .anim-right { opacity:0; transform:translateX(12px);  pointer-events:none; }

        /* TIMELINE */
        .timeline { position:relative; display:flex; flex-direction:column; }
        .spine { position:absolute; left:calc(76px - 2px); top:16px; bottom:16px; width:1px; background:linear-gradient(to bottom,transparent,rgba(255,255,255,.07) 8%,rgba(255,255,255,.07) 92%,transparent); pointer-events:none; }
        .tl-row    { display:grid; grid-template-columns:76px 1fr; gap:18px; position:relative; }
        .tl-left   { display:flex; flex-direction:column; align-items:flex-end; padding-right:8px; min-width:0; }
        .tl-right  { min-width:0; }
        .tl-marker { margin-top:6px; align-items:flex-start; }
        .tl-card   { margin-bottom:10px; align-items:flex-start; }

        /* EMPTY */
        .empty-day { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:64px 24px; gap:12px; }

        /* LEGEND */
        .tt-legend { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:20px; padding-top:16px; border-top:1px solid rgba(255,255,255,.05); }
        .leg-item  { display:flex; align-items:center; gap:6px; font-size:11px; color:rgba(255,255,255,.3); }
        .leg-dot   { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .leg-online { background:transparent!important; border:1.5px dashed #f59e0b; }
        .leg-live  { color:rgba(252,165,165,.6); }
        .leg-tip   { margin-left:auto; font-size:10.5px; color:rgba(255,255,255,.15); font-style:italic; }

        /* RESPONSIVE */
        @media (max-width:600px) {
          :root { --rail:52px; }
          .tl-row { grid-template-columns:52px 1fr; gap:12px; }
          .day-tab { padding:8px 12px; min-width:58px; }
          .tab-lbl { display:none; }
          .tt-title-row { flex-direction:column; gap:10px; }
          .leg-tip { display:none; }
        }
      `}</style>
    </div>
  );
}