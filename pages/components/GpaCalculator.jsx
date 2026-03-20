import { useState, useCallback, useReducer, useEffect } from 'react';
import { DataStore } from '@/lib/security';
import { useTheme } from '@/context/ThemeContext';

/* ══════════════════════════════════════════════════
   SRM GRADING SYSTEM (Official KTR scale)
   ══════════════════════════════════════════════════ */
const GRADE_SCALE = [
  { grade: 'O',  points: 10, label: 'Outstanding',   range: '91–100', color: '#10b981', textColor: '#6ee7b7' },
  { grade: 'A+', points: 9,  label: 'Excellent',      range: '81–90',  color: '#6366f1', textColor: '#a5b4fc' },
  { grade: 'A',  points: 8,  label: 'Very Good',      range: '71–80',  color: '#8b5cf6', textColor: '#c4b5fd' },
  { grade: 'B+', points: 7,  label: 'Good',           range: '61–70',  color: '#06b6d4', textColor: '#67e8f9' },
  { grade: 'B',  points: 6,  label: 'Above Average',  range: '56–60',  color: '#f59e0b', textColor: '#fcd34d' },
  { grade: 'C',  points: 5,  label: 'Average',        range: '50–55',  color: '#f97316', textColor: '#fdba74' },
  { grade: 'P',  points: 4,  label: 'Pass',           range: '45–49',  color: '#ef4444', textColor: '#fca5a5' },
  { grade: 'F',  points: 0,  label: 'Fail',           range: '< 45',   color: '#7f1d1d', textColor: '#ef4444' },
];

const gradeMap = Object.fromEntries(GRADE_SCALE.map(g => [g.grade, g]));

/* ══════════════════════════════════════════════════
   STATE MANAGEMENT
   ══════════════════════════════════════════════════ */
let idCounter = 10000;
const newSubject = () => ({ id: idCounter++, name: '', credits: 3, grade: 'O', locked: false });
const defaultSubs = [];

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':    return { ...state, subjects: [...state.subjects, newSubject()] };
    case 'REMOVE': return { ...state, subjects: state.subjects.filter(s => s.id !== action.id) };
    case 'UPDATE': return {
      ...state,
      subjects: state.subjects.map(s => s.id === action.id ? { ...s, [action.field]: action.value } : s),
    };
    case 'RESET':   return { ...state, subjects: [] };
    case 'DEMO':    return { ...state, subjects: [
      { id: 1, name: 'Data Structures and Algorithms', credits: 4, grade: 'O',  locked: false },
      { id: 2, name: 'Object Oriented Programming',    credits: 4, grade: 'A+', locked: false },
      { id: 3, name: 'Engineering Physics',            credits: 3, grade: 'A',  locked: false },
      { id: 4, name: 'Transforms & BVP',               credits: 4, grade: 'B+', locked: false },
      { id: 5, name: 'Computer Networks',              credits: 3, grade: 'A+', locked: false },
    ] };
    case 'IMPORT':  return { ...state, subjects: action.subjects };
    case 'SET_PREV_SGPA':   return { ...state, prevSGPA: action.value };
    case 'SET_PREV_CREDITS': return { ...state, prevCredits: action.value };
    case 'SET_TARGET':      return { ...state, target: action.value };
    default: return state;
  }
}

const initState = {
  subjects: defaultSubs,
  prevSGPA: '',
  prevCredits: '',
  target: '9.0',
};

/* ══════════════════════════════════════════════════
   CALCULATIONS
   ══════════════════════════════════════════════════ */
function calcSGPA(subjects) {
  let totalPts = 0, totalCr = 0;
  for (const s of subjects) {
    const g = gradeMap[s.grade];
    if (!g) continue;
    const cr = parseFloat(s.credits) || 0;
    totalPts += g.points * cr;
    totalCr  += cr;
  }
  return totalCr > 0 ? { sgpa: totalPts / totalCr, totalCredits: totalCr, totalPoints: totalPts } : { sgpa: 0, totalCredits: 0, totalPoints: 0 };
}

function calcCGPA(sgpa, totalCr, prevSGPA, prevCr) {
  const ps = parseFloat(prevSGPA) || 0;
  const pc = parseFloat(prevCr)   || 0;
  if (pc === 0) return null;
  const totalPts = sgpa * totalCr + ps * pc;
  return totalPts / (totalCr + pc);
}

/* ══════════════════════════════════════════════════
   SVG ARC GAUGE
   ══════════════════════════════════════════════════ */
function ArcGauge({ value, max = 10, size = 148, label }) {
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const ARC  = 240;
  const arcLen = (ARC / 360) * circ;
  const filled = Math.min(value / max, 1) * arcLen;
  const rot = 90 + (360 - ARC) / 2;

  const color = value >= 9 ? '#10b981' : value >= 8 ? '#6366f1' : value >= 7 ? '#06b6d4' : value >= 5 ? '#f59e0b' : '#ef4444';
  const grade = GRADE_SCALE.find(g => g.points <= Math.round(value))?.grade || '—';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="no-transition">
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={9}
          strokeDasharray={`${arcLen} ${circ - arcLen}`}
          strokeLinecap="round"
          transform={`rotate(${rot} ${size/2} ${size/2})`}
        />
        {/* Fill */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={9}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform={`rotate(${rot} ${size/2} ${size/2})`}
          style={{ filter:`drop-shadow(0 0 8px ${color}80)`, transition:'stroke-dasharray .8s cubic-bezier(.4,0,.2,1),stroke .4s' }}
        />
        {/* Value text */}
        <text x={size/2} y={size/2 - 4} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={28} fontWeight={700}
          fontFamily="'Fira Code', monospace"
          style={{ transition:'fill .4s' }}>
          {value.toFixed(2)}
        </text>
        <text x={size/2} y={size/2 + 20} textAnchor="middle"
          fill="rgba(240,240,250,0.3)" fontSize={12}
          fontFamily="'DM Sans', sans-serif">
          / 10.00
        </text>
      </svg>
      <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--text-2)', letterSpacing:-.1 }}>{label}</div>
      <div className="tag" style={{ background:`${color}15`, color, border:`1px solid ${color}30`, fontSize:10.5 }}>
        Grade ~{grade}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SUBJECT ROW
   ══════════════════════════════════════════════════ */
function SubjectRow({ s, idx, dispatch, isWeak, isStrong }) {
  const g = gradeMap[s.grade] || GRADE_SCALE[0];
  const contrib = ((parseFloat(s.credits) || 0) * g.points).toFixed(1);

  return (
    <div className={`sub-row ${isWeak ? 'row-weak' : ''} ${isStrong ? 'row-strong' : ''}`}>
      {/* Index */}
      <div className="row-num">{idx + 1}</div>

      {/* Name */}
      <div className="row-name-wrap">
        <input
          className="row-input row-name"
          placeholder="Subject name (optional)"
          value={s.name}
          onChange={e => dispatch({ type:'UPDATE', id:s.id, field:'name', value:e.target.value })}
          maxLength={80}
        />
      </div>

      {/* Credits */}
      <div className="row-credits">
        <div className="credit-btns">
          {[1,2,3,4,5].map(c => (
            <button
              key={c}
              className={`cr-btn ${s.credits === c ? 'cr-active' : ''}`}
              onClick={() => dispatch({ type:'UPDATE', id:s.id, field:'credits', value:c })}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Grade */}
      <div className="row-grade-wrap">
        <select
          className="row-select"
          value={s.grade}
          onChange={e => dispatch({ type:'UPDATE', id:s.id, field:'grade', value:e.target.value })}
          style={{ color: g.textColor, '--grade-bg': `${g.color}15` }}
        >
          {GRADE_SCALE.map(g => (
            <option key={g.grade} value={g.grade}>{g.grade} — {g.label} ({g.points} pts)</option>
          ))}
        </select>
      </div>

      {/* Contribution */}
      <div className="row-contrib">
        <div className="contrib-val" style={{ color: g.textColor }}>{contrib}</div>
        <div className="contrib-lbl">pts</div>
      </div>

      {/* Remove */}
      <button className="row-remove" onClick={() => dispatch({ type:'REMOVE', id:s.id })} title="Remove">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <style jsx>{`
        .sub-row {
          display: grid;
          grid-template-columns: 24px 1fr 120px 170px 52px 28px;
          gap: 10px;
          align-items: center;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          transition: border-color .15s, background .15s;
        }
        .sub-row:hover { border-color: var(--border-strong); }
        .row-weak    { border-color: rgba(239,68,68,.25) !important; background: rgba(239,68,68,.04) !important; }
        .row-strong  { border-color: rgba(16,185,129,.2) !important; }

        .row-num { font-family: var(--font-mono); font-size: 11px; color: var(--text-4); text-align: right; }
        .row-name-wrap { min-width: 0; }
        .row-input {
          background: transparent; border: none; outline: none;
          color: var(--text-1); font-size: 13px; width: 100%;
        }
        .row-input::placeholder { color: var(--text-4); }

        /* Credit buttons */
        .credit-btns { display: flex; gap: 3px; }
        .cr-btn {
          width: 22px; height: 22px; border-radius: 5px;
          background: rgba(255,255,255,.04); border: 1px solid var(--border);
          color: var(--text-3); font-size: 11px; font-weight: 600;
          cursor: pointer; transition: all .14s; padding: 0;
          font-family: var(--font-mono);
        }
        .cr-btn:hover { background: var(--bg-hover); color: var(--text-1); }
        .cr-active { background: var(--accent-dim) !important; border-color: var(--accent-border) !important; color: var(--accent-light) !important; }

        /* Grade select */
        .row-select {
          background: var(--grade-bg, var(--bg-elevated));
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 5px 8px;
          font-size: 11.5px; font-family: var(--font-mono); font-weight: 600;
          outline: none; cursor: pointer; width: 100%;
          transition: border-color .15s;
        }
        .row-select:focus { border-color: var(--accent-border); }
        option { background: var(--bg-surface); color: var(--text-1); }

        /* Contribution */
        .row-contrib { text-align: center; }
        .contrib-val { font-family: var(--font-mono); font-size: 15px; font-weight: 700; }
        .contrib-lbl { font-size: 9px; color: var(--text-4); }

        .row-remove {
          background: none; border: none; color: var(--text-4);
          cursor: pointer; padding: 4px; border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          transition: all .14s;
        }
        .row-remove:hover { color: var(--rose); background: var(--rose-dim); }

        @media (max-width: 700px) {
          .sub-row { grid-template-columns: 24px 1fr 52px 28px; }
          .row-credits, .row-grade-wrap { display: none; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   GRADE REFERENCE TABLE
   ══════════════════════════════════════════════════ */
function GradeTable() {
  return (
    <div className="grade-table glass">
      <div className="gt-title">SRM Grading Scale</div>
      <div className="gt-rows">
        {GRADE_SCALE.map(g => (
          <div key={g.grade} className="gt-row">
            <span className="gt-badge" style={{ background:`${g.color}18`, color:g.textColor, borderColor:`${g.color}25` }}>
              {g.grade}
            </span>
            <span className="gt-label">{g.label}</span>
            <span className="gt-range">{g.range}</span>
            <span className="gt-pts" style={{ color: g.textColor }}>{g.points}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .grade-table { border-radius: var(--radius-lg); padding: 16px; }
        .gt-title { font-size: 9.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-3); margin-bottom: 12px; }
        .gt-rows { display: flex; flex-direction: column; gap: 4px; }
        .gt-row { display: grid; grid-template-columns: 38px 1fr auto 28px; gap: 8px; align-items: center; padding: 5px 4px; border-radius: 7px; transition: background .12s; }
        .gt-row:hover { background: var(--bg-hover); }
        .gt-badge { text-align:center; border-radius:6px; padding:2px 6px; font-family:var(--font-mono); font-size:11px; font-weight:700; border:1px solid; }
        .gt-label { font-size: 11.5px; color: var(--text-2); }
        .gt-range { font-family: var(--font-mono); font-size: 10px; color: var(--text-3); }
        .gt-pts { font-family: var(--font-mono); font-size: 12px; font-weight: 700; text-align: right; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   WHAT-IF ANALYZER
   ══════════════════════════════════════════════════ */
function WhatIf({ subjects, sgpa, totalCredits, dispatch, target }) {
  const targetNum = parseFloat(target) || 0;
  if (targetNum <= 0 || targetNum > 10) return null;

  // Find subjects currently below target grade equivalent
  const targetPts = targetNum;
  const belowTarget = subjects.filter(s => {
    const g = gradeMap[s.grade];
    return g && g.points < targetPts;
  });

  // Calculate what SGPA would be if all below-target become target grade
  const targetGrade = GRADE_SCALE.find(g => g.points >= targetPts - 0.5) || GRADE_SCALE[GRADE_SCALE.length - 2];
  let projPts = 0, projCr = 0;
  for (const s of subjects) {
    const g = gradeMap[s.grade];
    const cr = parseFloat(s.credits) || 0;
    const isBelow = g && g.points < targetPts;
    projPts += (isBelow ? targetGrade.points : g.points) * cr;
    projCr  += cr;
  }
  const projSGPA = projCr > 0 ? projPts / projCr : 0;
  const gain = projSGPA - sgpa;

  return (
    <div className="whatif-box glass animate-up">
      <div className="wi-head">
        <div className="wi-title">What-If Analysis</div>
        <div className="wi-input-wrap">
          <label className="wi-label">Target SGPA</label>
          <input
            type="number" step="0.1" min="0" max="10"
            className="wi-input"
            value={target}
            onChange={e => dispatch({ type:'SET_TARGET', value:e.target.value })}
          />
        </div>
      </div>

      {belowTarget.length > 0 ? (
        <div className="wi-body">
          <p className="wi-desc">
            If you improve {belowTarget.length} subject{belowTarget.length > 1 ? 's' : ''} to <strong>{targetGrade.grade} ({targetGrade.points} pts)</strong>:
          </p>
          <div className="wi-result">
            <div className="wi-proj">
              <div className="wi-proj-val" style={{ color: projSGPA >= 9 ? 'var(--emerald)' : 'var(--accent-light)' }}>
                {projSGPA.toFixed(2)}
              </div>
              <div className="wi-proj-lbl">Projected SGPA</div>
            </div>
            <div className="wi-arrow">→</div>
            <div className="wi-gain">
              <div className="wi-gain-val" style={{ color: gain > 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                {gain > 0 ? '+' : ''}{gain.toFixed(2)}
              </div>
              <div className="wi-proj-lbl">Delta</div>
            </div>
          </div>
          <div className="wi-subjects">
            {belowTarget.map(s => {
              const g = gradeMap[s.grade];
              return (
                <div key={s.id} className="wi-sub">
                  <span className="wi-sub-name">{s.name || `Subject ${s.id}`}</span>
                  <span style={{ color: g.textColor }}>{s.grade}</span>
                  <span style={{ color: 'var(--text-4)' }}>→</span>
                  <span style={{ color: targetGrade.textColor }}>{targetGrade.grade}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="wi-desc wi-ok">✓ All subjects are already at or above your target!</p>
      )}

      <style jsx>{`
        .whatif-box { border-radius: var(--radius-xl); padding: 20px; }
        .wi-head { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:14px; }
        .wi-title { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-1); }
        .wi-input-wrap { display:flex; align-items:center; gap:8px; }
        .wi-label { font-size:11px; color:var(--text-3); white-space:nowrap; }
        .wi-input { width:72px; padding:6px 10px; border-radius:var(--radius-sm); background:var(--bg-elevated); border:1px solid var(--border); color:var(--text-1); font-family:var(--font-mono); font-size:13px; outline:none; text-align:center; }
        .wi-input:focus { border-color:var(--accent-border); }
        .wi-desc { font-size:12.5px; color:var(--text-2); margin-bottom:12px; line-height:1.6; }
        .wi-desc strong { color:var(--text-1); }
        .wi-ok { color:var(--emerald); }
        .wi-result { display:flex; align-items:center; gap:16px; margin-bottom:14px; }
        .wi-proj { text-align:center; }
        .wi-proj-val { font-family:var(--font-mono); font-size:28px; font-weight:700; }
        .wi-proj-lbl { font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:.5px; margin-top:2px; }
        .wi-arrow { font-size:18px; color:var(--text-4); }
        .wi-gain { text-align:center; }
        .wi-gain-val { font-family:var(--font-mono); font-size:24px; font-weight:700; }
        .wi-subjects { display:flex; flex-direction:column; gap:5px; }
        .wi-sub { display:flex; align-items:center; gap:8px; font-size:12px; padding:5px 0; border-top:1px solid var(--border); }
        .wi-sub-name { flex:1; color:var(--text-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   GRADE DISTRIBUTION BAR
   ══════════════════════════════════════════════════ */
function GradeDistribution({ subjects }) {
  const counts = {};
  for (const s of subjects) counts[s.grade] = (counts[s.grade] || 0) + 1;
  const total = subjects.length || 1;

  return (
    <div className="dist-wrap">
      <div className="dist-title">Grade Distribution</div>
      <div className="dist-list">
        {GRADE_SCALE.filter(g => counts[g.grade]).map(g => (
          <div key={g.grade} className="dist-row">
            <span className="dist-grade" style={{ color: g.textColor }}>{g.grade}</span>
            <div className="dist-bar-track">
              <div className="dist-bar-fill" style={{ width:`${(counts[g.grade]/total)*100}%`, background:g.color }} />
            </div>
            <span className="dist-count">{counts[g.grade]}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .dist-wrap { padding: 14px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); }
        .dist-title { font-size: 9.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-3); margin-bottom: 10px; }
        .dist-list { display: flex; flex-direction: column; gap: 5px; }
        .dist-row { display: flex; align-items: center; gap: 8px; }
        .dist-grade { font-family: var(--font-mono); font-size: 11px; font-weight: 700; width: 22px; }
        .dist-bar-track { flex: 1; height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
        .dist-bar-fill { height: 100%; border-radius: 3px; transition: width .6s cubic-bezier(.4,0,.2,1); opacity: .75; }
        .dist-count { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); width: 14px; text-align: right; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN CALCULATOR COMPONENT
   ══════════════════════════════════════════════════ */
export default function GpaCalculator({ courses = [] }) {
  const [state, dispatch] = useReducer(reducer, initState);
  const { subjects, prevSGPA, prevCredits, target } = state;
  const { theme } = useTheme();
  
  const [skippedCount, setSkippedCount] = useState(0);

  const handleImport = () => {
    // Priority: passed prop > DataStore
    const courseData = courses.length > 0 ? courses : (DataStore.get()?.courses?.courses || []);
    const importable = courseData.filter(c => parseFloat(c.credit || '0') > 0);
    
    if (importable.length === 0) {
      alert("No courses with credits found to import.");
      return;
    }

    const skipped = courseData.length - importable.length;
    setSkippedCount(skipped);
    
    const newSubs = importable.map((c, i) => ({
      id: 20000 + i,
      name: c.title || c.courseName || 'Untitled Course',
      credits: parseFloat(c.credit) || 3,
      grade: 'O',
      locked: false
    }));
    dispatch({ type: 'IMPORT', subjects: newSubs });
  };

  const { sgpa, totalCredits, totalPoints } = calcSGPA(subjects);
  const cgpa = calcCGPA(sgpa, totalCredits, prevSGPA, prevCredits);
  const hasCGPA = cgpa !== null;

  const avgPts = totalCredits > 0 ? totalPoints / totalCredits : 0;
  const isStrong = (s) => (gradeMap[s.grade]?.points || 0) >= Math.ceil(avgPts);
  const isWeak   = (s) => (gradeMap[s.grade]?.points || 0) < avgPts;

  return (
    <div className="calc-layout-container">
      <div className="calc-layout">
        {/* ── LEFT SIDEBAR ─────────────────────── */}
        <aside className="calc-aside">
          {/* Gauges */}
          <div className="gauge-panel glass">
            <ArcGauge value={sgpa} label="SGPA" />
            {hasCGPA && <ArcGauge value={cgpa} label="CGPA" size={128} />}
          </div>

          {/* Summary numbers */}
          <div className="calc-nums glass">
            {[
              { l:'Total Credits',  v: totalCredits },
              { l:'Grade Points',   v: totalPoints.toFixed(1) },
              { l:'Subjects',       v: subjects.length },
            ].map((s,i) => (
              <div key={i} className="calc-num-item">
                <div className="cni-val">{s.v}</div>
                <div className="cni-lbl">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Grade distribution */}
          {subjects.length > 0 && <GradeDistribution subjects={subjects} />}

          {/* Grade reference */}
          <GradeTable />
        </aside>

        {/* ── MAIN CONTENT ─────────────────────── */}
        <div className="calc-main">
          {/* Subjects table */}
          <div className="subjects-card glass animate-up delay-1">
            <div className="sc-head">
              <div className="sc-titles-group">
                <h2 className="sc-title">GPA Calculator</h2>
                <p className="section-helper">
                  Uses SRM's official grading scale (O=10, A+=9, A=8...). 
                  Import your courses to get started — then select your expected grade for each subject.
                </p>
              </div>
              <div className="sc-meta">
                <span className="tag tag-accent">{subjects.length} subjects · {totalCredits} credits</span>
              </div>
              <div className="sc-actions">
                <button 
                  className="btn btn-accent" 
                  style={{ fontSize:11, padding:'6px 14px', borderRadius: '8px' }} 
                  onClick={handleImport}
                >
                  ⚡ Import My Courses
                </button>
                <button className="btn btn-ghost" style={{ fontSize:11, padding:'6px 12px' }} onClick={() => dispatch({ type:'DEMO' })}>Load Sample</button>
                <button className="btn btn-ghost" style={{ fontSize:11, padding:'6px 12px' }} onClick={() => dispatch({ type:'RESET' })}>Clear</button>
              </div>
            </div>
            
            {skippedCount > 0 && (
              <div style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--amber)', background: 'var(--amber-dim)', borderBottom: '1px solid var(--amber-border)' }}>
                ⚠️ {skippedCount} zero-credit courses excluded from calculation
              </div>
            )}

            <div className="sc-col-headers">
              <div style={{ gridColumn: '1/3' }}>Subject</div>
              <div>Credits</div>
              <div>Grade</div>
              <div style={{ textAlign:'center' }}>Pts</div>
              <div />
            </div>

            <div className="subjects-list">
              {subjects.length === 0 ? (
                <div className="gpa-empty animate-up">
                  <div className="gpa-empty-icon">%</div>
                  <div className="gpa-empty-title">No subjects added yet</div>
                  <div className="gpa-empty-sub">
                    Click "Import My Courses" to load your subjects automatically, 
                    or add them manually using the button below.
                  </div>
                </div>
              ) : (
                subjects.map((s, i) => (
                  <SubjectRow
                    key={s.id}
                    s={s}
                    idx={i}
                    dispatch={dispatch}
                    isStrong={isStrong(s)}
                    isWeak={isWeak(s)}
                  />
                ))
              )}
            </div>

            <button className="add-btn" onClick={() => dispatch({ type:'ADD' })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Subject
            </button>

            <div className="sc-legend">
              <div className="sc-leg-item"><div className="sc-leg-dot" style={{ background:'rgba(16,185,129,.5)' }} />Above average</div>
              <div className="sc-leg-item"><div className="sc-leg-dot" style={{ background:'rgba(239,68,68,.5)' }} />Below average</div>
            </div>
          </div>

          <div className="cgpa-card glass animate-up delay-2">
            <div className="cgpa-head">
              <h2 className="sc-title">CGPA Calculator</h2>
              <span className="tag tag-amber" style={{ fontSize:10 }}>Optional</span>
            </div>
            <p className="cgpa-desc">
              Enter previous semesters' points and credits to calculate overall CGPA.
            </p>
            <div className="cgpa-inputs">
              <div className="cgpa-field">
                <label className="cgpa-label">Σ GPA Points</label>
                <input
                  type="number" step="0.01" min="0" placeholder="e.g. 68.5"
                  className="form-input"
                  value={prevSGPA}
                  onChange={e => dispatch({ type:'SET_PREV_SGPA', value:e.target.value })}
                />
              </div>
              <div className="cgpa-field">
                <label className="cgpa-label">Total Credits</label>
                <input
                  type="number" step="1" min="0" placeholder="e.g. 96"
                  className="form-input"
                  value={prevCredits}
                  onChange={e => dispatch({ type:'SET_PREV_CREDITS', value:e.target.value })}
                />
              </div>
            </div>
            {hasCGPA && (
              <div className="cgpa-result animate-scale">
                <div className="cgpa-result-label">Projected CGPA</div>
                <div className="cgpa-result-val" style={{
                  color: cgpa >= 9 ? 'var(--emerald)' : cgpa >= 8 ? 'var(--accent-light)' : cgpa >= 7 ? 'var(--cyan)' : 'var(--amber)'
                }}>
                  {cgpa.toFixed(2)} / 10.00
                </div>
              </div>
            )}
          </div>

          <WhatIf
            subjects={subjects}
            sgpa={sgpa}
            totalCredits={totalCredits}
            dispatch={dispatch}
            target={target}
          />
        </div>
      </div>

      <style jsx>{`
        .calc-layout-container { width: 100%; position: relative; z-index: 1; margin-top: 10px; }
        .calc-layout { display:grid; grid-template-columns:280px 1fr; gap:20px; }
        .calc-aside { display:flex; flex-direction:column; gap:14px; }
        .gauge-panel { border-radius:var(--radius-xl); padding:22px; display:flex; flex-direction:column; align-items:center; gap:16px; }
        .calc-nums { border-radius:var(--radius-lg); padding:14px; display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .calc-num-item { text-align:center; padding:10px 4px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); }
        .cni-val { font-family:var(--font-mono); font-size:16px; font-weight:700; color:var(--text-1); }
        .cni-lbl { font-size:9px; color:var(--text-4); text-transform:uppercase; letter-spacing:.5px; margin-top:2px; }
        .calc-main { display:flex; flex-direction:column; gap:16px; }
        .subjects-card { border-radius:var(--radius-xl); padding:22px; }
        .sc-head { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .sc-title { font-family:var(--font-display); font-size:16px; font-weight:700; color:var(--text-1); }
        .sc-meta { flex:1; }
        .sc-actions { display:flex; gap:8px; }
        .sc-col-headers {
          display:grid; grid-template-columns:24px 1fr 120px 170px 52px 28px; gap:10px;
          padding:0 14px 8px; font-size:9.5px; color:var(--text-4); text-transform:uppercase; letter-spacing:.6px; font-weight:600;
        }
        .subjects-list { display:flex; flex-direction:column; gap:7px; margin-bottom:12px; min-height: 100px; }
        
        .section-helper { font-size: 12.5px; color: var(--text-3); margin-top: 4px; margin-bottom: 16px; line-height: 1.6; max-width: 600px; }
        .gpa-empty { padding: 40px 20px; text-align: center; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px dashed var(--border); }
        .gpa-empty-icon { font-size: 32px; color: var(--text-4); margin-bottom: 12px; opacity: 0.5; }
        .gpa-empty-title { font-size: 15px; font-weight: 700; color: var(--text-2); margin-bottom: 6px; }
        .gpa-empty-sub { font-size: 12.5px; color: var(--text-4); max-width: 320px; margin: 0 auto; line-height: 1.6; }

        .add-btn {
          display:flex; align-items:center; gap:8px;
          width:100%; padding:11px 14px; border-radius:var(--radius-md);
          background:var(--accent-dim); border:1px dashed var(--accent-border);
          color:var(--accent-light); font-size:13px; cursor:pointer;
          transition:all .15s; font-family:var(--font-body); font-weight:500;
        }
        .sc-legend { display:flex; gap:16px; margin-top:12px; }
        .sc-leg-item { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-4); }
        .sc-leg-dot { width:8px; height:8px; border-radius:50%; }

        /* CGPA */
        .cgpa-card { border-radius:var(--radius-xl); padding:22px; }
        .cgpa-head { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
        .cgpa-desc { font-size:13px; color:var(--text-2); margin-bottom:18px; }
        .cgpa-inputs { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        .cgpa-field { display:flex; flex-direction:column; gap:6px; }
        .cgpa-label { font-size:10.5px; color:var(--text-3); font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
        .form-input { 
          background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); 
          padding:10px 14px; color:var(--text-1); font-family:var(--font-mono); font-size:14px; outline:none;
        }
        .form-input:focus { border-color:var(--accent-border); }
        .cgpa-result { background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px; text-align:center; }
        .cgpa-result-label { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
        .cgpa-result-val { font-family:var(--font-mono); font-size:24px; font-weight:800; }

        @media (max-width: 960px) {
          .calc-layout { grid-template-columns: 1fr; }
          .calc-aside { order: 2; }
          .calc-main { order: 1; }
        }
      `}</style>
    </div>
  );
}
