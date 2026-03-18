import { useState, useCallback, useId } from 'react';
import Head from 'next/head';
import Link from 'next/link';

/* ── SRM Grading System ──────────────────────────── */
const GRADES = [
  { label:'O  — Outstanding', grade:'O',  points:10, color:'#10b981' },
  { label:'A+ — Excellent',   grade:'A+', points:9,  color:'#34d399' },
  { label:'A  — Very Good',   grade:'A',  points:8,  color:'#5b5ef4' },
  { label:'B+ — Good',        grade:'B+', points:7,  color:'#818cf8' },
  { label:'B  — Above Avg',   grade:'B',  points:6,  color:'#f59e0b' },
  { label:'C  — Average',     grade:'C',  points:5,  color:'#f97316' },
  { label:'P  — Pass',        grade:'P',  points:4,  color:'#fb923c' },
  { label:'F  — Fail',        grade:'F',  points:0,  color:'#f43f5e' },
  { label:'Ab — Absent',      grade:'Ab', points:0,  color:'#94a3b8' },
];

const gradeMap = Object.fromEntries(GRADES.map(g => [g.grade, g]));

const defaultSubject = (id) => ({ id, name:'', credits:'3', grade:'O' });
let counter = 4;

const PRESET_COURSES = [
  { name:'Data Structures & Algorithms', credits:'4', grade:'O' },
  { name:'Object Oriented Programming',  credits:'4', grade:'A+' },
  { name:'Digital Electronics',          credits:'3', grade:'A' },
  { name:'Mathematics III',              credits:'4', grade:'A+' },
  { name:'Computer Networks',            credits:'3', grade:'B+' },
];

/* ── Circular Arc Gauge ──────────────────────────── */
function GaugeArc({ value, max = 10, size = 160, label, sub }) {
  const r = (size / 2) - 16;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);

  // Arc: 240° total span, start at 210°
  const ARC = 240;
  const arcLen = (ARC / 360) * circ;
  const filled = pct * arcLen;
  const gap = circ - arcLen;

  // Rotation so arc starts at bottom-left
  const rotation = 90 + (360 - ARC) / 2;

  const gpaColor = value >= 8.5 ? '#10b981' : value >= 7 ? '#5b5ef4' : value >= 5 ? '#f59e0b' : '#f43f5e';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10}
          strokeDasharray={`${arcLen} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${size/2} ${size/2})`}
        />
        {/* Fill */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={gpaColor} strokeWidth={10}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${size/2} ${size/2})`}
          style={{ filter:`drop-shadow(0 0 8px ${gpaColor})`, transition:'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s' }}
        />
        {/* Center text */}
        <text x={size/2} y={size/2 - 4} textAnchor="middle" dominantBaseline="middle"
          fill={gpaColor} fontSize={28} fontWeight={700}
          fontFamily="'Fira Code', monospace"
          style={{ transition:'fill 0.4s' }}>
          {value.toFixed(2)}
        </text>
        <text x={size/2} y={size/2 + 22} textAnchor="middle"
          fill="rgba(240,240,250,0.35)" fontSize={11}
          fontFamily="'DM Sans', sans-serif">
          {sub}
        </text>
      </svg>
      <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:600, color:'var(--text-2)' }}>{label}</div>
    </div>
  );
}

/* ── Grade Badge in table row ─────────────────────── */
function GradeBadge({ grade }) {
  const g = gradeMap[grade];
  if (!g) return null;
  return (
    <span style={{
      background:`${g.color}14`, color:g.color,
      border:`1px solid ${g.color}25`, borderRadius:6,
      padding:'2px 8px', fontSize:11, fontWeight:700,
      fontFamily:'var(--font-mono)',
    }}>{g.grade}</span>
  );
}

/* ── Subject Row ─────────────────────────────────── */
function SubjectRow({ s, idx, onChange, onRemove }) {
  const info = gradeMap[s.grade] || GRADES[0];
  const pts  = parseFloat(s.credits) || 0;
  const contribution = (pts * info.points).toFixed(1);

  return (
    <div className="subject-row">
      <div className="sr-num">{idx + 1}</div>

      <input
        className="sr-input sr-name"
        placeholder="Course name (optional)"
        value={s.name}
        onChange={e => onChange(s.id, 'name', e.target.value)}
      />

      <div className="sr-credits-wrap">
        <label className="sr-mini-label">Credits</label>
        <div className="sr-credit-btns">
          {[1,2,3,4,5].map(c => (
            <button
              key={c}
              className={`cr-btn ${parseInt(s.credits)===c?'cr-btn-active':''}`}
              onClick={() => onChange(s.id, 'credits', String(c))}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="sr-grade-wrap">
        <label className="sr-mini-label">Grade</label>
        <select
          className="sr-select"
          value={s.grade}
          onChange={e => onChange(s.id, 'grade', e.target.value)}
          style={{ color: info.color }}
        >
          {GRADES.map(g => (
            <option key={g.grade} value={g.grade}>{g.label}</option>
          ))}
        </select>
      </div>

      <div className="sr-contrib">
        <div className="sr-contrib-val" style={{ color: info.color }}>
          {contribution}
        </div>
        <div className="sr-contrib-label">Grade × Cr</div>
      </div>

      <button className="sr-remove" onClick={() => onRemove(s.id)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

/* ── Grade Reference Table ───────────────────────── */
function GradeTable() {
  return (
    <div className="grade-ref glass">
      <div className="gr-title">SRM Grading System</div>
      <div className="gr-grid">
        {GRADES.filter(g=>g.grade!=='Ab').map(g => (
          <div key={g.grade} className="gr-row" style={{ '--gc': g.color }}>
            <div className="gr-badge" style={{ background:`${g.color}14`, color:g.color, border:`1px solid ${g.color}25` }}>
              {g.grade}
            </div>
            <div className="gr-desc">{g.label.split('— ')[1]}</div>
            <div className="gr-pts" style={{ color:g.color }}>{g.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Calculator ─────────────────────────────── */
export default function Calculator() {
  const [subjects, setSubjects] = useState(
    PRESET_COURSES.map((c, i) => ({ id:i, ...c }))
  );
  const [prevSemesters, setPrevSemesters] = useState('');
  const [prevCredits, setPrevCredits]     = useState('');

  const addSubject = () => {
    setSubjects(prev => [...prev, defaultSubject(counter++)]);
  };

  const removeSubject = useCallback((id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSubject = useCallback((id, field, val) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  }, []);

  const clearAll = () => {
    setSubjects([defaultSubject(counter++)]);
    setPrevSemesters('');
    setPrevCredits('');
  };

  const loadPreset = () => {
    setSubjects(PRESET_COURSES.map((c, i) => ({ id: counter++, ...c })));
  };

  // Calculate SGPA
  const totalCredits = subjects.reduce((s, sub) => s + (parseFloat(sub.credits)||0), 0);
  const totalPoints  = subjects.reduce((s, sub) => {
    const info = gradeMap[sub.grade] || GRADES[0];
    return s + (parseFloat(sub.credits)||0) * info.points;
  }, 0);
  const sgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  // CGPA
  const prevPts = parseFloat(prevSemesters)||0;
  const prevCr  = parseFloat(prevCredits)||0;
  const cgpa    = (prevCr + totalCredits) > 0
    ? (prevPts * prevCr + totalPoints) / (prevCr + totalCredits)
    : 0;
  const hasCGPA = prevCr > 0;

  // Grade distribution
  const distrib = GRADES.map(g => ({
    ...g,
    count: subjects.filter(s => s.grade === g.grade).length,
  })).filter(g => g.count > 0);

  // What-if: grade needed for target SGPA
  const [targetSGPA, setTargetSGPA] = useState('9.0');
  const remainingSubjects = subjects.filter(s => s.grade === 'F' || s.grade === 'Ab');
  const lockedPoints = subjects.filter(s => s.grade !== 'F' && s.grade !== 'Ab')
    .reduce((s, sub) => s + (parseFloat(sub.credits)||0) * (gradeMap[sub.grade]?.points||0), 0);
  const lockedCredits = subjects.filter(s => s.grade !== 'F' && s.grade !== 'Ab')
    .reduce((s, sub) => s + (parseFloat(sub.credits)||0), 0);
  const neededAvg = totalCredits > 0
    ? ((parseFloat(targetSGPA)||0) * totalCredits - lockedPoints) / Math.max(totalCredits - lockedCredits, 0.1)
    : null;
  const neededGrade = GRADES.find(g => g.points >= (neededAvg||0)) || GRADES[GRADES.length-1];

  return (
    <>
      <Head>
        <title>GPA Calculator — CampusPro</title>
      </Head>

      <div className="app-shell">
        {/* ── SIDEBAR ────────────────────────────────── */}
        <aside className="sidebar glass">
          <Link href="/" className="brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-text">Campus<strong>Pro</strong></span>
          </Link>

          {/* Gauges */}
          <div className="gauge-panel">
            <GaugeArc value={sgpa} label="SGPA" sub="This Semester" />
            {hasCGPA && <GaugeArc value={cgpa} label="CGPA" sub="Cumulative" size={130} />}
          </div>

          {/* Stats */}
          <div className="calc-stats">
            {[
              { label:'Total Credits', val:totalCredits },
              { label:'Grade Points', val:totalPoints.toFixed(1) },
              { label:'Subjects', val:subjects.length },
            ].map((s,i) => (
              <div key={i} className="calc-stat">
                <div className="calc-stat-val">{s.val}</div>
                <div className="calc-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Dist */}
          {distrib.length > 0 && (
            <div className="dist-panel">
              <div className="dist-title">Grade Distribution</div>
              {distrib.map(d => (
                <div key={d.grade} className="dist-row">
                  <GradeBadge grade={d.grade} />
                  <div className="dist-bar-track">
                    <div className="dist-bar-fill" style={{ width:`${(d.count/subjects.length)*100}%`, background:d.color }} />
                  </div>
                  <span className="dist-count">{d.count}</span>
                </div>
              ))}
            </div>
          )}

          <GradeTable />
        </aside>

        {/* ── MAIN ───────────────────────────────────── */}
        <main className="main-panel">
          {/* Header */}
          <div className="calc-header animate-fade-up">
            <div>
              <div className="tag tag-accent" style={{ marginBottom:10, fontSize:10.5 }}>SRM KTR · Grading System</div>
              <h1 className="calc-title">GPA Calculator</h1>
              <p className="calc-sub">Real-time SGPA & CGPA · SRM grading scale · Add subjects below</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-ghost" onClick={clearAll} style={{ fontSize:12 }}>Clear</button>
              <button className="btn btn-ghost" onClick={loadPreset} style={{ fontSize:12 }}>Load Sample</button>
            </div>
          </div>

          {/* Subject builder */}
          <div className="subjects-card glass animate-fade-up delay-1">
            <div className="subjects-head">
              <h2 className="subjects-title">Subjects</h2>
              <span className="tag tag-accent">{subjects.length} subjects · {totalCredits} credits</span>
            </div>

            <div className="subjects-list">
              {subjects.map((s, i) => (
                <SubjectRow key={s.id} s={s} idx={i}
                  onChange={updateSubject} onRemove={removeSubject} />
              ))}
            </div>

            <button className="add-subject-btn" onClick={addSubject}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Subject
            </button>
          </div>

          {/* CGPA Section */}
          <div className="cgpa-card glass animate-fade-up delay-2">
            <div className="cgpa-card-head">
              <h2 className="subjects-title">CGPA Calculator</h2>
              <span className="tag tag-cyan" style={{ fontSize:10.5 }}>Optional</span>
            </div>
            <p className="cgpa-desc">Enter your previous semesters' GPA × Credits sum and total credits to calculate cumulative GPA.</p>
            <div className="cgpa-inputs">
              <div className="cgpa-field">
                <label className="cgpa-label">Σ (GPA × Credits) of Past Semesters</label>
                <input
                  type="number" step="0.01" min="0"
                  className="cgpa-input"
                  placeholder="e.g. 68.5"
                  value={prevSemesters}
                  onChange={e => setPrevSemesters(e.target.value)}
                />
              </div>
              <div className="cgpa-field">
                <label className="cgpa-label">Total Credits (Past Semesters)</label>
                <input
                  type="number" step="1" min="0"
                  className="cgpa-input"
                  placeholder="e.g. 24"
                  value={prevCredits}
                  onChange={e => setPrevCredits(e.target.value)}
                />
              </div>
            </div>
            {hasCGPA && (
              <div className="cgpa-result animate-fade-up">
                <div className="cgpa-result-label">Projected CGPA</div>
                <div className="cgpa-result-val" style={{
                  color: cgpa >= 8.5 ? '#10b981' : cgpa >= 7 ? '#5b5ef4' : cgpa >= 5 ? '#f59e0b' : '#f43f5e'
                }}>
                  {cgpa.toFixed(2)} / 10.0
                </div>
              </div>
            )}
          </div>

          {/* What-if analysis */}
          <div className="whatif-card glass animate-fade-up delay-3">
            <h2 className="subjects-title">What-If Analysis</h2>
            <p className="cgpa-desc">What average grade points do you need across remaining subjects to hit your target SGPA?</p>
            <div className="whatif-row">
              <div className="whatif-field">
                <label className="cgpa-label">Target SGPA</label>
                <input
                  type="number" step="0.1" min="0" max="10"
                  className="cgpa-input" style={{ maxWidth:120 }}
                  value={targetSGPA}
                  onChange={e => setTargetSGPA(e.target.value)}
                />
              </div>
              <div className="whatif-result">
                {neededAvg !== null && neededAvg <= 10 ? (
                  <>
                    <div className="cgpa-result-label">Minimum Grade Needed</div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:6 }}>
                      <GradeBadge grade={neededGrade.grade} />
                      <span className="cgpa-result-val" style={{ color:neededGrade.color, fontSize:18 }}>
                        {Math.min(neededAvg, 10).toFixed(1)} avg points
                      </span>
                    </div>
                    <div className="cgpa-result-label" style={{ marginTop:4 }}>
                      {neededAvg > 10 ? '⚠ Target unreachable with remaining subjects.' : '✓ Achievable!'}
                    </div>
                  </>
                ) : (
                  <div className="cgpa-result-label">Locked in — no failing subjects to optimize</div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile SGPA result */}
          <div className="mobile-result glass animate-fade-up">
            <div className="mobile-result-label">Your SGPA</div>
            <div className="mobile-result-val" style={{
              color: sgpa >= 8.5 ? '#10b981' : sgpa >= 7 ? '#5b5ef4' : sgpa >= 5 ? '#f59e0b' : '#f43f5e'
            }}>
              {sgpa.toFixed(2)}
            </div>
            {hasCGPA && <div className="mobile-result-sub">CGPA: {cgpa.toFixed(2)}</div>}
          </div>
        </main>
      </div>

      <style jsx global>{`
        body { background: var(--bg-void); overflow-x: hidden; }
        option { background: #0c0c1e; color: var(--text-1); }
      `}</style>

      <style jsx>{`
        .app-shell { display:flex; min-height:100vh; }

        /* SIDEBAR */
        .sidebar {
          width:300px; min-height:100vh; flex-shrink:0;
          padding:24px 18px; display:flex; flex-direction:column; gap:20px;
          position:sticky; top:0; height:100vh; overflow-y:auto;
          border-right:1px solid var(--border); border-radius:0;
        }
        .brand { display:flex; align-items:center; gap:8px; }
        .brand-icon { font-size:22px; color:var(--accent); filter:drop-shadow(0 0 8px var(--accent-glow)); }
        .brand-text { font-family:var(--font-display); font-size:16px; color:var(--text-1); font-weight:700; }
        .brand-text strong { color:var(--accent); }

        .gauge-panel { display:flex; flex-direction:column; align-items:center; gap:12px; padding:16px 0; }

        .calc-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .calc-stat { text-align:center; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); padding:10px 6px; }
        .calc-stat-val { font-family:var(--font-mono); font-size:16px; font-weight:700; color:var(--text-1); }
        .calc-stat-lbl { font-size:9px; color:var(--text-4); margin-top:3px; text-transform:uppercase; letter-spacing:0.4px; }

        .dist-panel { background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); padding:14px; }
        .dist-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--text-3); margin-bottom:12px; }
        .dist-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
        .dist-bar-track { flex:1; height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
        .dist-bar-fill { height:100%; border-radius:2px; transition:width 0.6s var(--ease-smooth); }
        .dist-count { font-family:var(--font-mono); font-size:11px; color:var(--text-3); min-width:14px; text-align:right; }

        /* GRADE REF */
        .grade-ref { border-radius:var(--radius-md); padding:14px; }
        .gr-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--text-3); margin-bottom:10px; }
        .gr-grid { display:flex; flex-direction:column; gap:5px; }
        .gr-row { display:flex; align-items:center; gap:10px; }
        .gr-badge { width:36px; text-align:center; border-radius:5px; padding:2px 5px; font-size:11px; font-weight:700; font-family:var(--font-mono); flex-shrink:0; }
        .gr-desc { flex:1; font-size:11px; color:var(--text-3); }
        .gr-pts { font-family:var(--font-mono); font-size:12px; font-weight:700; }

        /* MAIN */
        .main-panel { flex:1; padding:36px; display:flex; flex-direction:column; gap:20px; min-width:0; }
        .calc-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
        .calc-title { font-family:var(--font-display); font-size:32px; font-weight:800; color:var(--text-1); letter-spacing:-0.8px; }
        .calc-sub { font-size:13.5px; color:var(--text-2); margin-top:4px; }
        .header-actions { display:flex; gap:8px; flex-shrink:0; }

        /* SUBJECTS CARD */
        .subjects-card { border-radius:var(--radius-xl); padding:22px; }
        .subjects-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .subjects-title { font-family:var(--font-display); font-size:16px; font-weight:700; color:var(--text-1); }
        .subjects-list { display:flex; flex-direction:column; gap:10px; margin-bottom:16px; }

        /* SUBJECT ROW */
        .subject-row {
          display:flex; align-items:center; gap:12px;
          background:var(--bg-elevated); border:1px solid var(--border);
          border-radius:var(--radius-md); padding:12px 14px;
          transition:border-color 0.15s;
        }
        .subject-row:hover { border-color:var(--border-strong); }
        .sr-num { font-family:var(--font-mono); font-size:11px; color:var(--text-4); width:16px; flex-shrink:0; }
        .sr-input { background:transparent; border:none; outline:none; color:var(--text-1); font-size:13px; flex-shrink:0; }
        .sr-name { flex:1; min-width:0; }
        .sr-name::placeholder { color:var(--text-4); }
        .sr-mini-label { font-size:9px; color:var(--text-4); text-transform:uppercase; letter-spacing:0.6px; margin-bottom:5px; display:block; }

        .sr-credits-wrap { flex-shrink:0; }
        .sr-credit-btns { display:flex; gap:4px; }
        .cr-btn {
          width:26px; height:26px; border-radius:6px;
          background:rgba(255,255,255,0.04); border:1px solid var(--border);
          color:var(--text-3); font-size:12px; font-weight:600;
          cursor:pointer; transition:all 0.15s; font-family:var(--font-mono);
        }
        .cr-btn:hover { background:var(--bg-hover); color:var(--text-1); }
        .cr-btn-active { background:var(--accent-dim); border-color:var(--accent-border); color:#a5b4fc; }

        .sr-grade-wrap { flex-shrink:0; min-width:130px; }
        .sr-select {
          background:rgba(255,255,255,0.04); border:1px solid var(--border);
          border-radius:var(--radius-sm); padding:5px 8px;
          font-size:11.5px; font-family:var(--font-mono); font-weight:600;
          outline:none; cursor:pointer; transition:border-color 0.15s; width:100%;
        }
        .sr-select:focus { border-color:var(--border-strong); }

        .sr-contrib { text-align:right; min-width:52px; flex-shrink:0; }
        .sr-contrib-val { font-family:var(--font-mono); font-size:15px; font-weight:700; transition:color 0.3s; }
        .sr-contrib-label { font-size:9px; color:var(--text-4); margin-top:1px; }

        .sr-remove {
          background:none; border:none; color:var(--text-4);
          cursor:pointer; padding:4px; transition:color 0.15s; flex-shrink:0;
          display:flex; align-items:center; border-radius:5px;
        }
        .sr-remove:hover { color:#fb7185; background:rgba(244,63,94,0.08); }

        .add-subject-btn {
          display:flex; align-items:center; gap:8px;
          width:100%; padding:11px 14px; border-radius:var(--radius-md);
          background:rgba(91,94,244,0.06); border:1px dashed rgba(91,94,244,0.25);
          color:var(--accent); font-size:13px; cursor:pointer;
          transition:all 0.15s; font-family:var(--font-body); font-weight:500;
        }
        .add-subject-btn:hover { background:var(--accent-dim); border-color:var(--accent-border); }

        /* CGPA */
        .cgpa-card, .whatif-card { border-radius:var(--radius-xl); padding:22px; }
        .cgpa-card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .cgpa-desc { font-size:12.5px; color:var(--text-3); margin-bottom:16px; line-height:1.6; }
        .cgpa-inputs { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .cgpa-field { display:flex; flex-direction:column; gap:6px; }
        .cgpa-label { font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.8px; font-weight:600; }
        .cgpa-input {
          background:var(--bg-elevated); border:1px solid var(--border);
          border-radius:var(--radius-md); padding:10px 13px;
          color:var(--text-1); font-size:14px; outline:none;
          transition:border-color 0.2s;
          font-family:var(--font-mono);
        }
        .cgpa-input:focus { border-color:rgba(91,94,244,0.4); box-shadow:0 0 0 3px rgba(91,94,244,0.08); }
        .cgpa-result {
          margin-top:16px; padding:14px;
          background:rgba(91,94,244,0.06); border:1px solid var(--accent-border);
          border-radius:var(--radius-md);
          display:flex; align-items:center; justify-content:space-between;
        }
        .cgpa-result-label { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.6px; font-weight:600; }
        .cgpa-result-val { font-family:var(--font-mono); font-size:26px; font-weight:700; }

        /* WHAT IF */
        .whatif-row { display:flex; align-items:flex-start; gap:32px; flex-wrap:wrap; }
        .whatif-field { display:flex; flex-direction:column; gap:6px; }
        .whatif-result { flex:1; min-width:200px; }

        /* MOBILE RESULT (hidden on desktop) */
        .mobile-result { display:none; border-radius:var(--radius-lg); padding:20px; text-align:center; }
        .mobile-result-label { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px; }
        .mobile-result-val { font-family:var(--font-mono); font-size:48px; font-weight:700; }
        .mobile-result-sub { font-size:13px; color:var(--text-3); margin-top:6px; }

        /* RESPONSIVE */
        @media (max-width: 1000px) {
          .app-shell { flex-direction:column; }
          .sidebar { width:100%; min-height:auto; height:auto; position:static; flex-direction:row; flex-wrap:wrap; gap:16px; overflow:visible; }
          .gauge-panel { flex-direction:row; width:100%; }
          .mobile-result { display:block; }
          .main-panel { padding:20px; }
        }
        @media (max-width: 640px) {
          .cgpa-inputs { grid-template-columns:1fr; }
          .subject-row { flex-wrap:wrap; }
          .sr-name { width:100%; }
        }
      `}</style>
    </>
  );
}
