import { useState, useEffect, useCallback } from 'react';

/* ────────────────────────────────────────────────────────
   TIME CONFIG — SRM KTR slot map
   ──────────────────────────────────────────────────────── */
const SLOTS = [
  { idx: 0, label: '8:00',  start: '8:00 AM',  end: '8:50 AM',  startMin: 0,   endMin: 50  },
  { idx: 1, label: '8:50',  start: '8:50 AM',  end: '9:45 AM',  startMin: 50,  endMin: 105 },
  { idx: 2, label: '9:45',  start: '9:45 AM',  end: '10:40 AM', startMin: 105, endMin: 160 },
  { idx: 3, label: '10:40', start: '10:40 AM', end: '11:35 AM', startMin: 160, endMin: 215 },
  { idx: 4, label: '11:35', start: '11:35 AM', end: '12:30 PM', startMin: 215, endMin: 270 },
  // Lunch 12:30–1:15 (270–315 min) — no slot idx 5 in map
  { idx: 5, label: '1:15',  start: '1:15 PM',  end: '2:10 PM',  startMin: 315, endMin: 370 },
  { idx: 6, label: '2:10',  start: '2:10 PM',  end: '3:05 PM',  startMin: 370, endMin: 425 },
  { idx: 7, label: '3:05',  start: '3:05 PM',  end: '4:00 PM',  startMin: 425, endMin: 480 },
  { idx: 8, label: '4:00',  start: '4:00 PM',  end: '4:50 PM',  startMin: 480, endMin: 530 },
  { idx: 9, label: '4:50',  start: '4:50 PM',  end: '5:40 PM',  startMin: 530, endMin: 590 },
];
const LUNCH_START_MIN = 270; // 12:30 PM offset from 8:00
const LUNCH_END_MIN   = 315; // 1:15 PM
const DAY_START_MIN   = 8 * 60; // 8:00 AM in absolute mins from midnight

const TYPE_CONFIG = {
  Theory: {
    accent:  '#6366f1',
    glow:    'rgba(99,102,241,0.18)',
    bg:      'rgba(99,102,241,0.07)',
    border:  'rgba(99,102,241,0.22)',
    tag:     'rgba(99,102,241,0.15)',
    tagText: '#a5b4fc',
    icon:    '◈',
  },
  Practical: {
    accent:  '#10b981',
    glow:    'rgba(16,185,129,0.18)',
    bg:      'rgba(16,185,129,0.07)',
    border:  'rgba(16,185,129,0.22)',
    tag:     'rgba(16,185,129,0.15)',
    tagText: '#6ee7b7',
    icon:    '⬡',
  },
  online: {
    accent:  '#f59e0b',
    glow:    'rgba(245,158,11,0.15)',
    bg:      'rgba(245,158,11,0.05)',
    border:  'rgba(245,158,11,0.3)',
    tag:     'rgba(245,158,11,0.12)',
    tagText: '#fcd34d',
    icon:    '◎',
    dashed:  true,
  },
};

/* ────────────────────────────────────────────────────────
   MOCK DATA — realistic SRM course names
   ──────────────────────────────────────────────────────── */
const MOCK_SCHEDULE = [
  {
    day: 1,
    table: [
      { code:'21CSE101T', name:'Data Structures and Algorithms',  slot:'A',  roomNo:'TP606',  courseType:'Theory'    },
      { code:'21CSE101T', name:'Data Structures and Algorithms',  slot:'A',  roomNo:'TP606',  courseType:'Theory'    },
      { code:'21MAT201T', name:'Transforms & Boundary Value Prbs',slot:'F',  roomNo:'UB117',  courseType:'Theory'    },
      { code:'21MAT201T', name:'Transforms & Boundary Value Prbs',slot:'F',  roomNo:'UB117',  courseType:'Theory'    },
      { code:'21PHY102T', name:'Engineering Physics',              slot:'G',  roomNo:'SMV208', courseType:'Theory'    },
      null,
      null,
      { code:'21CSE151P', name:'Data Structures Lab',             slot:'P6', roomNo:'UB-G01 Lab', courseType:'Practical' },
      { code:'21CSE151P', name:'Data Structures Lab',             slot:'P7', roomNo:'UB-G01 Lab', courseType:'Practical' },
      { code:'21CSE151P', name:'Data Structures Lab',             slot:'P8', roomNo:'UB-G01 Lab', courseType:'Practical' },
    ],
  },
  {
    day: 2,
    table: [
      null,
      null,
      null,
      null,
      null,
      { code:'21CSE102T', name:'Object Oriented Programming',     slot:'B',  roomNo:'TP501',  courseType:'Theory'    },
      { code:'21CSE102T', name:'Object Oriented Programming',     slot:'B',  roomNo:'TP501',  courseType:'Theory'    },
      { code:'21ECE101T', name:'Digital Electronics',             slot:'G',  roomNo:'UB201',  courseType:'Theory'    },
      { code:'21ECE101T', name:'Digital Electronics',             slot:'G',  roomNo:'UB201',  courseType:'Theory'    },
      { code:'21CSE101T', name:'Data Structures and Algorithms',  slot:'A',  roomNo:'TP606',  courseType:'Theory'    },
    ],
  },
  {
    day: 3,
    table: [
      { code:'21CSE102T', name:'Object Oriented Programming',     slot:'C',  roomNo:'TP501',  courseType:'Theory'    },
      { code:'21CSE102T', name:'Object Oriented Programming',     slot:'C',  roomNo:'TP501',  courseType:'Theory'    },
      { code:'21CSE101T', name:'Data Structures and Algorithms',  slot:'A',  roomNo:'TP606',  courseType:'Theory'    },
      { code:'21CSE301T', name:'Computer Networks',               slot:'D',  roomNo:'SMV101', courseType:'Theory'    },
      { code:'21CSE102T', name:'Object Oriented Programming',     slot:'B',  roomNo:'TP501',  courseType:'Theory'    },
      { code:'21PHY152P', name:'Engineering Physics Lab',         slot:'P26',roomNo:'PHY-Lab',courseType:'Practical' },
      { code:'21PHY152P', name:'Engineering Physics Lab',         slot:'P27',roomNo:'PHY-Lab',courseType:'Practical' },
      { code:'21PHY152P', name:'Engineering Physics Lab',         slot:'P28',roomNo:'PHY-Lab',courseType:'Practical' },
      null,
      null,
    ],
  },
  {
    day: 4,
    table: [
      { code:'21CSE301T', name:'Computer Networks',               slot:'P31',roomNo:'UB-G02 Lab',courseType:'Practical' },
      { code:'21CSE301T', name:'Computer Networks',               slot:'P32',roomNo:'UB-G02 Lab',courseType:'Practical' },
      { code:'21CSE301T', name:'Computer Networks',               slot:'P33',roomNo:'UB-G02 Lab',courseType:'Practical' },
      { code:'21CSE301T', name:'Computer Networks',               slot:'P34',roomNo:'UB-G02 Lab',courseType:'Practical' },
      { code:'21CSE301T', name:'Computer Networks',               slot:'P35',roomNo:'UB-G02 Lab',courseType:'Practical' },
      { code:'21CSE301T', name:'Computer Networks',               slot:'D',  roomNo:'SMV101', courseType:'Theory'    },
      { code:'21CSE301T', name:'Computer Networks',               slot:'D',  roomNo:'SMV101', courseType:'Theory'    },
      { code:'21CSE102T', name:'Object Oriented Programming',     slot:'B',  roomNo:'TP501',  courseType:'Theory'    },
      { code:'21MAT201T', name:'Transforms & Boundary Value Prbs',slot:'E',  roomNo:'UB117',  courseType:'Theory'    },
      { code:'21CSE102T', name:'Object Oriented Programming',     slot:'C',  roomNo:'TP501',  courseType:'Theory'    },
    ],
  },
  {
    day: 5,
    table: [
      { code:'21MAT201T', name:'Transforms & Boundary Value Prbs',slot:'E',  roomNo:'UB117',  courseType:'Theory'    },
      { code:'21MAT201T', name:'Transforms & Boundary Value Prbs',slot:'E',  roomNo:'UB117',  courseType:'Theory'    },
      { code:'21CSE102T', name:'Object Oriented Programming',     slot:'C',  roomNo:'TP501',  courseType:'Theory'    },
      { code:'21PHY102T', name:'Engineering Physics',             slot:'F',  roomNo:'SMV208', courseType:'Theory'    },
      { code:'21CSE301T', name:'Computer Networks',               slot:'D',  roomNo:'SMV101', courseType:'Theory'    },
      { code:'21ECE151P', name:'Digital Electronics Lab',         slot:'P46',roomNo:'ECE-Lab',courseType:'Practical' },
      { code:'21ECE151P', name:'Digital Electronics Lab',         slot:'P47',roomNo:'ECE-Lab',courseType:'Practical' },
      { code:'21ECE151P', name:'Digital Electronics Lab',         slot:'P48',roomNo:'ECE-Lab',courseType:'Practical' },
      null,
      null,
    ],
  },
];

/* ────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────── */
function getNowMin() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() - DAY_START_MIN;
}

function formatNow() {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function shortName(name) {
  if (!name) return '—';
  // Abbreviate long names gracefully
  if (name.length > 38) return name.slice(0, 36) + '…';
  return name;
}

// Merge consecutive slots of same course into one "period" block
function buildPeriods(table) {
  const periods = [];
  let i = 0;
  while (i < table.length) {
    const slot = table[i];
    if (!slot) { i++; continue; }
    let j = i + 1;
    // Merge consecutive identical course slots
    while (j < table.length && table[j] && table[j].code === slot.code) j++;
    const startSlot = SLOTS[i];
    const endSlot   = SLOTS[j - 1];
    if (!startSlot || !endSlot) { i = j; continue; }
    periods.push({
      ...slot,
      slotIndexStart: i,
      slotIndexEnd:   j - 1,
      slotCount:      j - i,
      startLabel:     startSlot.label,
      endLabel:       endSlot.label,
      startTime:      startSlot.start,
      endTime:        endSlot.end,
      startMin:       startSlot.startMin,
      endMin:         endSlot.endMin,
      duration:       endSlot.endMin - startSlot.startMin,
    });
    i = j;
  }
  return periods;
}

// Compute LIVE / NEXT status
function computeStatus(periods, nowMin) {
  let liveIdx = -1, nextIdx = -1;
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    if (nowMin >= p.startMin && nowMin < p.endMin) { liveIdx = i; break; }
    if (nowMin < p.startMin && nextIdx === -1) { nextIdx = i; }
  }
  return { liveIdx, nextIdx };
}

/* ────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ──────────────────────────────────────────────────────── */

// Pulsing "LIVE" dot
function LiveDot() {
  return (
    <span className="live-dot-wrap">
      <span className="live-dot-ring" />
      <span className="live-dot-core" />
      <style jsx>{`
        .live-dot-wrap { position:relative; display:inline-flex; align-items:center; justify-content:center; width:10px; height:10px; }
        .live-dot-core { width:6px; height:6px; border-radius:50%; background:#ef4444; position:relative; z-index:1; }
        .live-dot-ring {
          position:absolute; width:14px; height:14px; border-radius:50%;
          border:1.5px solid rgba(239,68,68,0.6);
          animation: liveRing 1.4s ease-out infinite;
        }
        @keyframes liveRing { 0%{transform:scale(0.6);opacity:1} 100%{transform:scale(1.6);opacity:0} }
      `}</style>
    </span>
  );
}

// Session card
function SessionCard({ period, status, expanded, onToggle, delay }) {
  const cfg = period.online
    ? TYPE_CONFIG.online
    : TYPE_CONFIG[period.courseType] || TYPE_CONFIG.Theory;

  const isLive = status === 'live';
  const isNext = status === 'next';

  const durationLabel = period.slotCount > 1
    ? `${period.duration} min  ·  ${period.slotCount} periods`
    : `${period.duration} min`;

  return (
    <div
      className={`card ${isLive ? 'card-live' : ''} ${isNext ? 'card-next' : ''} ${expanded ? 'card-expanded' : ''}`}
      style={{ animationDelay: `${delay}ms`, '--accent': cfg.accent, '--glow': cfg.glow, '--bg': cfg.bg, '--bdr': cfg.border }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onToggle()}
    >
      {/* Left accent rail */}
      <div className="card-rail" />

      {/* Status badge */}
      {isLive && (
        <div className="status-badge badge-live">
          <LiveDot /> LIVE NOW
        </div>
      )}
      {isNext && !isLive && (
        <div className="status-badge badge-next">
          <span className="next-arrow">↑</span> UP NEXT
        </div>
      )}

      {/* Main content */}
      <div className="card-body">
        <div className="card-top">
          <div className="card-type-icon" style={{ color: cfg.accent }}>{cfg.icon}</div>
          <span className="card-type-tag" style={{ background: cfg.tag, color: cfg.tagText }}>
            {period.online ? 'Online' : period.courseType}
          </span>
          {period.slotCount > 1 && (
            <span className="card-multi-tag">×{period.slotCount}</span>
          )}
          <span className="card-expand-hint">{expanded ? '↑' : '↓'}</span>
        </div>

        <div className="card-name">{shortName(period.name)}</div>

        <div className="card-time-row">
          <span className="card-time">{period.startTime}</span>
          <span className="card-time-sep">→</span>
          <span className="card-time">{period.endTime}</span>
          <span className="card-duration">{durationLabel}</span>
        </div>

        {/* Duration bar */}
        <div className="duration-track">
          <div className="duration-fill" style={{ width: `${(period.duration / 110) * 100}%` }} />
        </div>

        {/* Expanded details */}
        <div className={`card-details ${expanded ? 'details-open' : ''}`}>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-icon">🏫</span>
              <div>
                <div className="detail-label">Room</div>
                <div className="detail-val">{period.roomNo}</div>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">🔖</span>
              <div>
                <div className="detail-label">Slot</div>
                <div className="detail-val">{period.slot}</div>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">📋</span>
              <div>
                <div className="detail-label">Code</div>
                <div className="detail-val detail-code">{period.code}</div>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">⏱</span>
              <div>
                <div className="detail-label">Duration</div>
                <div className="detail-val">{period.duration} min</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glow overlay when live */}
      {isLive && <div className="card-live-glow" />}

      <style jsx>{`
        .card {
          position: relative;
          background: var(--bg);
          border: 1px solid var(--bdr);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1),
                      box-shadow 0.22s ease,
                      border-color 0.2s ease,
                      background 0.2s ease;
          animation: cardIn 0.4s cubic-bezier(.4,0,.2,1) both;
          will-change: transform;
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .card:hover {
          transform: translateY(-4px) scale(1.008);
          box-shadow: 0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px var(--bdr), 0 0 28px var(--glow);
          border-color: var(--accent);
        }
        .card:focus-visible { outline: 2px solid var(--accent); outline-offset:3px; }
        .card-live {
          border-color: rgba(239,68,68,0.4);
          box-shadow: 0 0 0 1px rgba(239,68,68,0.2), 0 4px 24px rgba(239,68,68,0.12);
          background: rgba(239,68,68,0.05);
        }
        .card-live:hover { border-color: rgba(239,68,68,0.7); }
        .card-next { border-color: rgba(0,212,255,0.25); }
        .card-expanded { border-color: var(--accent); }

        /* Left rail accent */
        .card-rail {
          position: absolute; left:0; top:0; bottom:0; width:3.5px;
          background: var(--accent);
          border-radius: 16px 0 0 16px;
          box-shadow: 2px 0 12px var(--glow);
        }
        .card-live .card-rail { background: #ef4444; box-shadow: 2px 0 12px rgba(239,68,68,0.5); }

        /* Status badge */
        .status-badge {
          position: absolute; top:10px; right:10px;
          display: flex; align-items:center; gap:5px;
          font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
          padding: 3px 8px; border-radius: 20px;
        }
        .badge-live {
          background: rgba(239,68,68,0.12);
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,0.3);
          animation: liveBadge 2s ease-in-out infinite;
        }
        @keyframes liveBadge {
          0%,100% { background:rgba(239,68,68,0.12); }
          50%      { background:rgba(239,68,68,0.22); }
        }
        .badge-next {
          background: rgba(0,212,255,0.08);
          color: #22d3ee;
          border: 1px solid rgba(0,212,255,0.2);
        }
        .next-arrow { font-size:11px; animation: nextBounce 1.2s ease-in-out infinite; display:inline-block; }
        @keyframes nextBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }

        /* Body */
        .card-body { padding: 14px 16px 14px 20px; }
        .card-top {
          display: flex; align-items:center; gap:7px;
          margin-bottom: 9px;
        }
        .card-type-icon { font-size:14px; }
        .card-type-tag {
          font-size:10px; font-weight:700; letter-spacing:0.6px;
          padding:2px 8px; border-radius:10px; text-transform:uppercase;
        }
        .card-multi-tag {
          font-size:10px; font-weight:700;
          color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          padding:2px 7px; border-radius:10px;
        }
        .card-expand-hint {
          margin-left:auto; font-size:11px; color:rgba(255,255,255,0.2);
          transition: transform 0.2s;
        }
        .card-expanded .card-expand-hint { transform:rotate(180deg); }

        .card-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
          color: rgba(240,240,250,0.92);
          line-height: 1.3; margin-bottom: 10px;
          letter-spacing: -0.2px;
        }
        .card-time-row {
          display: flex; align-items:center; gap:6px;
          margin-bottom: 10px;
        }
        .card-time {
          font-family: 'Fira Code', monospace;
          font-size: 11.5px; font-weight:500;
          color: var(--accent); letter-spacing:0.3px;
        }
        .card-time-sep { font-size:11px; color:rgba(255,255,255,0.2); }
        .card-duration {
          margin-left:auto; font-size:10.5px;
          color:rgba(255,255,255,0.28);
          font-family:'Fira Code',monospace;
        }

        /* Duration bar */
        .duration-track { height:2px; background:rgba(255,255,255,0.05); border-radius:1px; overflow:hidden; }
        .duration-fill {
          height:100%; background:var(--accent);
          border-radius:1px; max-width:100%;
          opacity:0.45;
          transition:width 0.6s ease;
        }

        /* Expandable details */
        .card-details {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, margin 0.25s ease;
          opacity: 0;
        }
        .details-open { max-height: 120px; opacity:1; margin-top:12px; }

        .detail-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        .detail-item { display:flex; align-items:flex-start; gap:7px; }
        .detail-icon { font-size:13px; margin-top:1px; }
        .detail-label { font-size:9px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:0.6px; }
        .detail-val { font-size:12px; color:rgba(240,240,250,0.75); margin-top:2px; font-weight:500; }
        .detail-code { font-family:'Fira Code',monospace; font-size:10.5px; }

        /* Live glow */
        .card-live-glow {
          position:absolute; inset:0; pointer-events:none;
          background: radial-gradient(ellipse at top left, rgba(239,68,68,0.07), transparent 60%);
          animation: liveGlowPulse 2.5s ease-in-out infinite;
        }
        @keyframes liveGlowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

// Time marker on the rail
function TimeMarker({ label, isLunchAfter }) {
  return (
    <>
      <div className="time-marker">
        <div className="tm-dot" />
        <span className="tm-label">{label}</span>
      </div>
      {isLunchAfter && (
        <div className="lunch-break">
          <div className="lb-line" />
          <span className="lb-label">☀ Lunch  12:30 – 1:15 PM</span>
          <div className="lb-line" />
        </div>
      )}
      <style jsx>{`
        .time-marker { display:flex; align-items:center; gap:0; height:24px; position:relative; pointer-events:none; }
        .tm-dot { width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); flex-shrink:0; margin-left:1px; }
        .tm-label {
          font-family:'Fira Code',monospace; font-size:10px; font-weight:500;
          color:rgba(255,255,255,0.22); white-space:nowrap;
          margin-left:6px;
        }
        .lunch-break {
          display:flex; align-items:center; gap:8px;
          margin:4px 0; padding:0 2px;
        }
        .lb-line { flex:1; height:1px; background:rgba(245,158,11,0.12); border-top:1px dashed rgba(245,158,11,0.18); }
        .lb-label { font-size:10px; color:rgba(245,158,11,0.45); white-space:nowrap; font-weight:600; letter-spacing:0.4px; }
      `}</style>
    </>
  );
}

// The NOW indicator line
function NowIndicator({ nowLabel, visible }) {
  if (!visible) return null;
  return (
    <div className="now-line">
      <div className="now-pill">
        <span className="now-dot" />
        {nowLabel}
      </div>
      <div className="now-track" />
      <style jsx>{`
        .now-line {
          display:flex; align-items:center; gap:0;
          position:relative; z-index:10; pointer-events:none;
          animation:nowFadeIn 0.4s ease both;
        }
        @keyframes nowFadeIn { from{opacity:0} to{opacity:1} }
        .now-pill {
          display:flex; align-items:center; gap:5px;
          background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4);
          color:#fca5a5; font-family:'Fira Code',monospace;
          font-size:10px; font-weight:700; letter-spacing:0.6px;
          padding:3px 9px; border-radius:20px; white-space:nowrap;
          box-shadow:0 0 12px rgba(239,68,68,0.2);
        }
        .now-dot {
          width:5px; height:5px; border-radius:50%;
          background:#ef4444; box-shadow:0 0 5px #ef4444;
          animation:nowDotPulse 1.2s ease-in-out infinite;
        }
        @keyframes nowDotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
        .now-track {
          flex:1; height:1px;
          background:linear-gradient(90deg, rgba(239,68,68,0.6), rgba(239,68,68,0.08), transparent);
        }
      `}</style>
    </div>
  );
}

// Empty state
function EmptyDay() {
  return (
    <div className="empty-day">
      <div className="empty-icon">📅</div>
      <div className="empty-title">No Classes Scheduled</div>
      <div className="empty-sub">This day order has no assigned periods.</div>
      <style jsx>{`
        .empty-day { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:64px 24px; gap:12px; }
        .empty-icon { font-size:40px; opacity:0.4; }
        .empty-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:rgba(255,255,255,0.3); }
        .empty-sub { font-size:13px; color:rgba(255,255,255,0.18); }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────────────── */
export default function TimetableView({ timetableData }) {
  const schedule   = timetableData?.schedule || MOCK_SCHEDULE;
  const batchLabel = timetableData?.batch ? `Batch ${timetableData.batch}` : 'Batch 1';

  const [activeDay, setActiveDay]     = useState(1);
  const [expandedId, setExpandedId]   = useState(null);
  const [nowMin, setNowMin]           = useState(getNowMin());
  const [nowLabel, setNowLabel]       = useState(formatNow());
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDir, setAnimDir]         = useState(1); // 1=forward, -1=back

  // Update clock every 30 seconds
  useEffect(() => {
    const tick = () => { setNowMin(getNowMin()); setNowLabel(formatNow()); };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const switchDay = useCallback((day) => {
    if (day === activeDay) return;
    setAnimDir(day > activeDay ? 1 : -1);
    setIsAnimating(true);
    setTimeout(() => {
      setActiveDay(day);
      setExpandedId(null);
      setIsAnimating(false);
    }, 180);
  }, [activeDay]);

  // Build periods for active day
  const dayData  = schedule.find(d => d.day === activeDay);
  const periods  = dayData ? buildPeriods(dayData.table) : [];
  const { liveIdx, nextIdx } = computeStatus(periods, nowMin);

  // Is current time within today's school hours?
  const isSchoolDay = nowMin >= 0 && nowMin <= 590;

  // Build the render list: interleave time markers, NOW line, and cards
  const renderItems = [];
  periods.forEach((period, i) => {
    // Time marker for this slot
    renderItems.push({
      type:   'marker',
      key:    `m-${i}`,
      label:  period.startLabel,
      lunchAfter: period.slotIndexEnd === 4, // lunch after slot 4
    });

    // Insert NOW line if it falls before this card
    if (isSchoolDay && liveIdx === -1 && nextIdx === i) {
      renderItems.push({ type:'now', key:'now' });
    }

    renderItems.push({
      type:     'card',
      key:      `c-${period.code}-${i}`,
      period,
      status:   i === liveIdx ? 'live' : i === nextIdx ? 'next' : 'normal',
      delay:    i * 60,
    });

    // NOW line after a live card
    if (isSchoolDay && liveIdx === i) {
      renderItems.push({ type:'now', key:'now' });
    }
  });

  // Count per type for the header pills
  const theoryCount   = periods.filter(p => !p.online && p.courseType === 'Theory').length;
  const labCount      = periods.filter(p => !p.online && p.courseType === 'Practical').length;
  const totalHours    = (periods.reduce((s,p) => s + p.duration, 0) / 60).toFixed(1);

  return (
    <div className="tt-root">
      {/* ── HEADER ──────────────────────────────────── */}
      <div className="tt-header">
        <div className="tt-title-row">
          <div>
            <h2 className="tt-title">Schedule</h2>
            <p className="tt-sub">{batchLabel} · SRM KTR Campus</p>
          </div>
          <div className="tt-header-pills">
            {theoryCount > 0 && (
              <div className="header-pill" style={{ '--pc':'#6366f1', '--pb':'rgba(99,102,241,0.1)' }}>
                ◈ {theoryCount} Theory
              </div>
            )}
            {labCount > 0 && (
              <div className="header-pill" style={{ '--pc':'#10b981', '--pb':'rgba(16,185,129,0.1)' }}>
                ⬡ {labCount} Lab
              </div>
            )}
            {periods.length > 0 && (
              <div className="header-pill" style={{ '--pc':'rgba(255,255,255,0.35)', '--pb':'rgba(255,255,255,0.04)' }}>
                ⏱ {totalHours}h
              </div>
            )}
          </div>
        </div>

        {/* Day Order Tabs */}
        <div className="day-tabs">
          {[1,2,3,4,5].map(d => {
            const dPeriods = buildPeriods(schedule.find(s => s.day === d)?.table || []);
            const hasContent = dPeriods.length > 0;
            const isLive = d === activeDay && liveIdx !== -1 && isSchoolDay;
            return (
              <button
                key={d}
                className={`day-tab ${activeDay === d ? 'day-tab-active' : ''} ${!hasContent ? 'day-tab-empty' : ''}`}
                onClick={() => switchDay(d)}
              >
                <span className="day-tab-num">D{d}</span>
                <span className="day-tab-label">Day Order {d}</span>
                {isLive && <span className="day-tab-live" />}
                {hasContent && activeDay !== d && (
                  <span className="day-tab-dot-count">{dPeriods.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TIMELINE ────────────────────────────────── */}
      <div className={`tt-body ${isAnimating ? (animDir > 0 ? 'slide-out-left' : 'slide-out-right') : ''}`}>
        {periods.length === 0 ? (
          <EmptyDay />
        ) : (
          <div className="timeline">
            {/* Vertical spine */}
            <div className="timeline-spine" />

            {/* Render items */}
            {renderItems.map(item => {
              if (item.type === 'marker') return (
                <div key={item.key} className="tl-row tl-row-marker">
                  <div className="tl-left">
                    <TimeMarker label={item.label} isLunchAfter={item.lunchAfter} />
                  </div>
                  <div className="tl-right" />
                </div>
              );

              if (item.type === 'now') return (
                <div key={item.key} className="tl-row tl-row-now">
                  <div className="tl-left">
                    <div className="tl-now-dot" />
                  </div>
                  <div className="tl-right">
                    <NowIndicator nowLabel={nowLabel} visible={isSchoolDay} />
                  </div>
                </div>
              );

              if (item.type === 'card') return (
                <div key={item.key} className="tl-row tl-row-card">
                  <div className="tl-left">
                    <div className="tl-connector" style={{ '--acc': (item.period.online ? '#f59e0b' : (TYPE_CONFIG[item.period.courseType]?.accent || '#6366f1')) }} />
                  </div>
                  <div className="tl-right">
                    <SessionCard
                      period={item.period}
                      status={item.status}
                      expanded={expandedId === item.key}
                      onToggle={() => setExpandedId(p => p === item.key ? null : item.key)}
                      delay={item.delay}
                    />
                  </div>
                </div>
              );
              return null;
            })}

            {/* End marker */}
            {periods.length > 0 && (
              <div className="tl-row tl-row-marker">
                <div className="tl-left">
                  <div className="time-end-marker">
                    <div className="tm-dot-end" />
                    <span className="tm-end-label">{periods[periods.length-1].endLabel}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LEGEND ──────────────────────────────────── */}
      {periods.length > 0 && (
        <div className="tt-legend">
          {Object.entries(TYPE_CONFIG).filter(([k]) => k !== 'online').map(([key, cfg]) => (
            <div key={key} className="legend-item">
              <div className="legend-dot" style={{ background:cfg.accent }} />
              <span>{key}</span>
            </div>
          ))}
          <div className="legend-item">
            <div className="legend-dot legend-dot-online" />
            <span>Online</span>
          </div>
          {isSchoolDay && liveIdx !== -1 && (
            <div className="legend-item legend-live">
              <div className="legend-dot" style={{ background:'#ef4444' }} />
              <span>Currently Live</span>
            </div>
          )}
          <span className="legend-tip">Tap a card to expand details</span>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Fira+Code:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>

      <style jsx>{`
        /* ROOT */
        .tt-root {
          display:flex; flex-direction:column; gap:0;
          background:transparent;
          --rail-w: 72px;
        }

        /* HEADER */
        .tt-header { margin-bottom:24px; }
        .tt-title-row {
          display:flex; align-items:flex-start; justify-content:space-between;
          gap:16px; margin-bottom:18px;
        }
        .tt-title {
          font-family:'Syne',sans-serif; font-size:22px; font-weight:800;
          color:rgba(240,240,250,0.95); letter-spacing:-0.4px;
        }
        .tt-sub { font-size:12px; color:rgba(255,255,255,0.3); margin-top:3px; }
        .tt-header-pills { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
        .header-pill {
          display:flex; align-items:center; gap:5px;
          background:var(--pb); color:var(--pc);
          border:1px solid rgba(255,255,255,0.06);
          padding:4px 10px; border-radius:20px;
          font-size:11px; font-weight:600; letter-spacing:0.3px;
          white-space:nowrap;
        }

        /* DAY TABS */
        .day-tabs {
          display:flex; gap:6px; flex-wrap:wrap;
        }
        .day-tab {
          position:relative;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:2px;
          padding:10px 18px; border-radius:12px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          color:rgba(255,255,255,0.35);
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all 0.2s cubic-bezier(.4,0,.2,1);
          min-width:72px;
        }
        .day-tab:hover:not(.day-tab-active) {
          background:rgba(255,255,255,0.06);
          color:rgba(255,255,255,0.6);
          border-color:rgba(255,255,255,0.12);
          transform:translateY(-2px);
        }
        .day-tab-active {
          background:rgba(99,102,241,0.12);
          border-color:rgba(99,102,241,0.35);
          color:#a5b4fc;
          box-shadow:0 4px 20px rgba(99,102,241,0.15);
        }
        .day-tab-empty { opacity:0.45; }
        .day-tab-num {
          font-family:'Fira Code',monospace; font-size:16px; font-weight:500;
          line-height:1;
        }
        .day-tab-label { font-size:9px; letter-spacing:0.6px; text-transform:uppercase; opacity:0.7; }
        .day-tab-live {
          position:absolute; top:6px; right:7px;
          width:6px; height:6px; border-radius:50%;
          background:#ef4444; box-shadow:0 0 5px #ef4444;
          animation:tabLive 1.3s ease-in-out infinite;
        }
        @keyframes tabLive { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .day-tab-dot-count {
          position:absolute; top:5px; right:5px;
          font-size:9px; font-weight:700;
          background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.35);
          border-radius:8px; padding:1px 5px;
        }

        /* BODY TRANSITION */
        .tt-body { transition:opacity 0.18s ease, transform 0.18s ease; }
        .slide-out-left { opacity:0; transform:translateX(-12px); }
        .slide-out-right { opacity:0; transform:translateX(12px); }

        /* TIMELINE */
        .timeline {
          position:relative;
          display:flex; flex-direction:column; gap:0;
        }

        /* Vertical spine */
        .timeline-spine {
          position:absolute; left:calc(var(--rail-w) - 3px); top:12px; bottom:12px;
          width:1px;
          background:linear-gradient(to bottom, transparent, rgba(255,255,255,0.07) 8%, rgba(255,255,255,0.07) 92%, transparent);
          pointer-events:none; z-index:0;
        }

        /* Row base */
        .tl-row { display:grid; grid-template-columns:var(--rail-w) 1fr; gap:16px; position:relative; }

        /* Marker row */
        .tl-row-marker { margin-top:6px; align-items:flex-start; }
        .tl-left { display:flex; flex-direction:column; align-items:flex-end; padding-right:8px; min-width:0; }
        .tl-right { min-width:0; }

        /* Now row */
        .tl-row-now { align-items:center; margin:2px 0; }
        .tl-now-dot {
          width:10px; height:10px; border-radius:50%;
          background:#ef4444; box-shadow:0 0 8px rgba(239,68,68,0.6);
          border:2px solid rgba(239,68,68,0.3);
          margin-left:auto; margin-right:1px;
        }

        /* Card row */
        .tl-row-card { margin-bottom:10px; align-items:flex-start; padding-top:2px; }
        .tl-connector {
          width:16px; height:2px;
          background:linear-gradient(90deg, var(--acc), transparent);
          margin-top:24px; margin-left:auto;
          opacity:0.5;
        }

        /* End marker */
        .time-end-marker { display:flex; align-items:center; gap:6px; padding-top:4px; }
        .tm-dot-end {
          width:8px; height:8px; border-radius:50%;
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1);
          margin-left:auto; margin-right:1px;
        }
        .tm-end-label { font-family:'Fira Code',monospace; font-size:10px; color:rgba(255,255,255,0.18); }

        /* LEGEND */
        .tt-legend {
          display:flex; align-items:center; gap:14px; flex-wrap:wrap;
          margin-top:20px; padding-top:16px;
          border-top:1px solid rgba(255,255,255,0.05);
        }
        .legend-item { display:flex; align-items:center; gap:6px; font-size:11px; color:rgba(255,255,255,0.3); }
        .legend-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .legend-dot-online { background:transparent; border:1.5px dashed #f59e0b; }
        .legend-live { color:rgba(252,165,165,0.6); }
        .legend-tip { margin-left:auto; font-size:10.5px; color:rgba(255,255,255,0.15); font-style:italic; }

        /* RESPONSIVE */
        @media (max-width: 600px) {
          .tt-root { --rail-w: 52px; }
          .day-tab { padding:8px 12px; min-width:58px; }
          .day-tab-num { font-size:14px; }
          .day-tab-label { display:none; }
          .tt-title-row { flex-direction:column; gap:10px; }
          .tt-header-pills { gap:5px; }
          .legend-tip { display:none; }
        }
      `}</style>
    </div>
  );
}