import { useRef, useEffect, useState, useMemo } from 'react';

/**
 * Vibrant Color Evaluator
 * Based on the new dashboard design system
 */
const getSubjectColor = (pct) => {
  if (pct >= 85) return '#00f5a0';   // var(--green)
  if (pct >= 75) return '#ffd60a';   // var(--amber)
  if (pct >= 60) return '#ff9500';   // var(--orange)
  return '#ff3b5c';                 // var(--red)
};

/**
 * Mini Line Chart Component (Pure SVG Implementation)
 * Renders score progression for a subject across tests.
 */
const MiniLineChart = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  
  const width = 400, height = 100, pad = 24;
  
  // Convert test results to percentage scale (0-100)
  const vals = data.map(d => {
    const sc = parseFloat(d.marks?.scored);
    const to = parseFloat(d.marks?.total) || 1;
    return isNaN(sc) ? 0 : (sc / to) * 100;
  });

  // Handle single data point
  if (vals.length === 1) {
    const p = { x: width / 2, y: height - pad - ((vals[0] / 100) * (height - pad * 2)) };
    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{width:'100%', height: 100, overflow:'visible'}}>
        <circle cx={p.x} cy={p.y} r="5" fill={color} style={{ filter:`drop-shadow(0 0 8px ${color})` }} />
        <text x={p.x} y={height - 4} textAnchor="middle" fontSize="10" fill="var(--text-3)" fontWeight="600">{data[0].test}</text>
      </svg>
    );
  }
  
  const points = vals.map((v, i) => ({
    x: pad + (i / (vals.length - 1)) * (width - pad * 2),
    y: height - pad - ((v / 100) * (height - pad * 2))
  }));
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:'100%', height: 110, overflow:'visible'}} className="mlc-svg">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#','')})`}/>
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter:`drop-shadow(0 0 5px ${color}44)` }}/>
      {points.map((p, i) => (
        <g key={i} className="mlc-point">
          <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="var(--bg-surface)" strokeWidth="1.5"/>
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="10" fill="var(--text-4)" fontWeight="600" style={{ letterSpacing:'.5px' }}>
            {data[i].test?.split('-')[0]?.split(' ')[0]}
          </text>
        </g>
      ))}
    </svg>
  );
};

/**
 * Summary Card used in the top row
 */
function SummaryStat({ label, value, sub, color, delay }) {
  return (
    <div className="summary-stat glass animate-up" style={{ '--accent-c': color, animationDelay: `${delay}ms` }}>
      <div className="ss-accent" />
      <div className="ss-val" style={{ color }}>{value}</div>
      <div className="ss-lbl">{label}</div>
      <div className="ss-sub">{sub}</div>
    </div>
  );
}

const GradeThresholds = {
  'O': 91, 'A+': 81, 'A': 71, 'B+': 61, 'B': 56, 'C': 50, 'P': 45
};

/**
 * Target Grade Calculator
 */
function TargetCalculator({ marks }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState('');
  const [targetGrade, setTargetGrade] = useState('A+');

  useEffect(() => {
    if (marks.length && !selectedSub) setSelectedSub(marks[0].courseCode);
  }, [marks, selectedSub]);

  const sub = marks.find(m => m.courseCode === selectedSub);
  const scored = parseFloat(sub?.overall?.scored) || 0;
  const totalWeight = parseFloat(sub?.overall?.total) || 0;
  
  const threshold = GradeThresholds[targetGrade];
  const remaining = 100 - totalWeight;
  const needed = Math.max(0, threshold - scored);
  
  const isPossible = remaining >= needed;
  const isAlreadyMet = scored >= threshold;

  return (
    <div className={`target-calc-card glass ${isOpen ? 'is-open' : ''}`}>
      <div className="tc-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="tc-title">
          <span className="tc-icon">🎯</span>
          <div className="tc-txt">
            <strong>Target Grade Calculator</strong>
            <span>What do I need to score next?</span>
          </div>
        </div>
        <div className={`tc-toggle ${isOpen ? 'up' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>

      {isOpen && (
        <div className="tc-body animate-down">
          <div className="tc-controls">
            <div className="tc-field">
              <label>Subject</label>
              <select value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)} className="glass">
                {marks.map(m => (
                  <option key={m.courseCode} value={m.courseCode}>{m.courseName}</option>
                ))}
              </select>
            </div>
            <div className="tc-field">
              <label>Target Grade</label>
              <div className="grade-selector">
                {Object.keys(GradeThresholds).map(g => (
                  <button 
                    key={g} 
                    className={`grade-btn ${targetGrade === g ? 'active' : ''}`}
                    onClick={() => setTargetGrade(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="tc-result glass">
            {isAlreadyMet ? (
              <div className="res-msg success">
                <span className="res-big">Grade {targetGrade} Secured! 🎉</span>
                <p>You already have {scored.toFixed(1)} points. Threshold is {threshold}.</p>
              </div>
            ) : !isPossible ? (
              <div className="res-msg danger">
                <span className="res-big">Math says No. ❌</span>
                <p>You need {needed.toFixed(1)} more points, but only {remaining.toFixed(1)} weight remains.</p>
              </div>
            ) : (
              <div className="res-msg info">
                <div className="res-main">
                  You need <span className="res-highlight">{needed.toFixed(1)} / {remaining.toFixed(1)}</span>
                </div>
                <p>in the upcoming assessments to secure an <strong>{targetGrade}</strong></p>
                <div className="res-mini-bar">
                  <div className="res-p" style={{ width: `${(needed/remaining)*100}%` }} />
                </div>
                <span className="res-sub">Currently: {scored.toFixed(1)} / {totalWeight.toFixed(0)} scored · Need {threshold}% total</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarksSection({ marks = [] }) {
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Highest'); // Highest | Lowest | Default

  // Perform filtering and sorting
  const processedMarks = useMemo(() => {
    let result = [...marks];
    
    // Filter by type
    if (filter !== 'All') {
      result = result.filter(m => m.courseType === filter);
    }

    // Sort
    result.sort((a, b) => {
      const pctA = (a.overall?.scored || 0) / (a.overall?.total || 1);
      const pctB = (b.overall?.scored || 0) / (b.overall?.total || 1);
      if (sortBy === 'Highest') return pctB - pctA;
      if (sortBy === 'Lowest')  return pctA - pctB;
      return 0; // Default matches API order
    });

    return result;
  }, [marks, filter, sortBy]);

  // Global aggregate stats
  const stats = useMemo(() => {
    if (!marks.length) return null;
    let scoredTotal = 0, maxTotal = 0;
    marks.forEach(m => {
      scoredTotal += parseFloat(m.overall?.scored) || 0;
      maxTotal    += parseFloat(m.overall?.total) || 0;
    });
    const avg = maxTotal > 0 ? (scoredTotal / maxTotal) * 100 : 0;
    const activeComp = marks[0]?.testPerformance?.[0]?.test || 'CAT-2';
    
    return {
      avg: Math.floor(avg),
      total: `${Math.floor(scoredTotal)}/${Math.floor(maxTotal)}`,
      count: marks.length,
      active: activeComp
    };
  }, [marks]);

  if (!marks || marks.length === 0) {
    return (
      <div className="marks-empty glass">
        <div className="me-icon">◈</div>
        <p>No marks data found in Academia servers.</p>
      </div>
    );
  }

  return (
    <div className="marks-tab-container">
      {/* Summary Bar */}
      <div className="marks-summary-bar">
        <SummaryStat label="AVG SCORE" value={`${stats.avg}%`} sub="Overall performance" color="#00d4ff" delay={0} />
        <SummaryStat label="TOTAL MARKS" value={stats.total} sub="Accumulated points" color="#bf5af2" delay={50} />
        <SummaryStat label="SUBJECTS" value={stats.count} sub="Tracked courses" color="#00f5a0" delay={100} />
        <SummaryStat label="ACTIVE COMP" value={stats.active} sub="Latest assessment" color="#ffd60a" delay={150} />
      </div>

      <TargetCalculator marks={marks} />

      {/* Toolbar Filter / Sort */}
      <div className="marks-toolbar animate-up" style={{ animationDelay:'200ms' }}>
        <div className="tb-group">
          <span className="tb-label">Type:</span>
          {['All', 'Theory', 'Practical'].map(f => (
            <button key={f} className={`tb-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="tb-group">
          <span className="tb-label">Sort:</span>
          {['Highest', 'Lowest', 'Default'].map(s => (
            <button key={s} className={`tb-btn ${sortBy === s ? 'active' : ''}`} onClick={() => setSortBy(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="marks-grid">
        {processedMarks.map((m, i) => {
          const sc  = parseFloat(m.overall?.scored) || 0;
          const tot = parseFloat(m.overall?.total) || 1;
          const pct = (sc / tot) * 100;
          const color = getSubjectColor(pct);
          const tests = (m.testPerformance || []).slice().reverse(); // Show progression over time
          
          return (
            <div key={m.courseCode || i} className="marks-card glass animate-up" style={{ animationDelay: `${250 + i * 40}ms` }}>
              {/* Vibrant side indicator */}
              <div className="card-sidebar" style={{ background: color }} />
              
              <div className="mc-head">
                <div className="mc-titles">
                  <h3 className="mc-name">{m.courseName}</h3>
                  <div className="mc-meta">
                    <span className="mc-code">{m.courseCode}</span>
                    <span className="mc-dot">·</span>
                    <span className="mc-type">{m.courseType}</span>
                  </div>
                </div>
                <div className="mc-score-bubble" style={{ color: color, background: `${color}15`, borderColor: `${color}30` }}>
                  {sc.toFixed(1)} / {tot.toFixed(0)}
                </div>
              </div>

              {/* Enhanced Chart Section */}
              {tests.length > 0 ? (
                <div className="mc-chart-wrap">
                  <MiniLineChart data={tests} color={color} />
                </div>
              ) : (
                <div className="mc-no-tests" style={{ height: 110 }}>No component breakdown available</div>
              )}

              {/* Data Chips */}
              <div className="mc-chips">
                {tests.map((t, idx) => (
                  <div key={idx} className="mc-chip glass">
                    <span className="mcc-label">{t.test}</span>
                    <span className="mcc-val">{t.marks?.scored}/{t.marks?.total}</span>
                  </div>
                ))}
              </div>

              {/* Global Progress Fill (Neon) */}
              <div className="mc-progress-track">
                <div className="progress-fill" style={{ width: `${Math.min(pct,100)}%`, '--fill-color': color }} />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .marks-tab-container { display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px; }

        /* Summary Bar */
        .marks-summary-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .summary-stat { 
          padding: 18px; border-radius: 18px; position: relative; overflow: hidden;
          background: rgba(255,255,255,0.03); 
        }
        .ss-accent { position: absolute; top: 0; left: 0; bottom: 0; width: 3px; background: var(--accent-c); opacity: 0.8; }
        .ss-val { font-family: var(--font-mono); font-size: 24px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .ss-lbl { font-size: 10px; font-weight: 700; color: var(--text-4); text-transform: uppercase; letter-spacing: 1px; }
        .ss-sub { font-size: 11px; color: var(--text-3); margin-top: 4px; }

        /* Target Calculator */
        .target-calc-card { background: rgba(255,165,0,0.05); border: 1px solid rgba(255,165,0,0.1); border-radius: 20px; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .target-calc-card.is-open { background: rgba(99,102,241,0.05); border-color: rgba(99,102,241,0.2); }
        .tc-header { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
        .tc-title { display: flex; align-items: center; gap: 14px; }
        .tc-icon { font-size: 24px; }
        .tc-txt { display: flex; flex-direction: column; }
        .tc-txt strong { font-size: 14px; color: #fff; }
        .tc-txt span { font-size: 11px; color: var(--text-3); }
        .tc-toggle { transition: transform 0.3s; color: var(--text-3); }
        .tc-toggle.up { transform: rotate(180deg); color: var(--accent-light); }
        .tc-body { padding: 0 20px 20px; }
        .tc-controls { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-bottom: 20px; }
        .tc-field { display: flex; flex-direction: column; gap: 8px; }
        .tc-field label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-4); letter-spacing: 1px; }
        .tc-field select { background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: #fff; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; outline: none; }
        .tc-field select option { background: #1a1a2e; color: #fff; }
        .grade-selector { display: flex; gap: 4px; flex-wrap: wrap; }
        .grade-btn { padding: 6px 10px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--text-3); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; flex: 1; }
        .grade-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .grade-btn.active { background: var(--accent); color: #fff; border-color: var(--accent-light); box-shadow: 0 0 10px var(--accent)44; }
        .tc-result { padding: 24px; border-radius: 16px; background: rgba(255,255,255,0.02); text-align: center; }
        .res-msg { display: flex; flex-direction: column; gap: 8px; }
        .res-big { font-size: 20px; font-weight: 850; letter-spacing: -0.5px; }
        .res-msg.success .res-big { color: var(--emerald); }
        .res-msg.danger .res-big { color: var(--rose); }
        .res-msg.info .res-big { color: var(--cyan); }
        .res-main { font-size: 18px; font-weight: 700; color: #fff; }
        .res-highlight { color: var(--cyan); font-family: var(--font-mono); font-size: 22px; font-weight: 800; border-bottom: 2px solid var(--cyan)44; }
        .res-sub { font-size: 11px; color: var(--text-4); margin-top: 10px; }
        .res-mini-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; margin: 12px auto; width: 200px; }
        .res-p { height: 100%; background: linear-gradient(90deg, var(--accent), var(--cyan)); border-radius: 3px; }
        .summary-stat { 
          padding: 18px; border-radius: 18px; position: relative; overflow: hidden;
          background: rgba(255,255,255,0.03); 
        }
        .ss-accent { position: absolute; top: 0; left: 0; bottom: 0; width: 3px; background: var(--accent-c); opacity: 0.8; }
        .ss-val { font-family: var(--font-mono); font-size: 24px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .ss-lbl { font-size: 10px; font-weight: 700; color: var(--text-4); text-transform: uppercase; letter-spacing: 1px; }
        .ss-sub { font-size: 11px; color: var(--text-3); margin-top: 4px; }

        /* Toolbar */
        .marks-toolbar { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 10px 16px; border-radius: 12px; background: rgba(0,0,0,0.15); border: 1px solid var(--border);
        }
        .tb-group { display: flex; align-items: center; gap: 8px; }
        .tb-label { font-size: 11px; font-weight: 700; color: var(--text-4); text-transform: uppercase; letter-spacing: 0.5px; }
        .tb-btn { 
          padding: 5px 14px; border-radius: 6px; background: none; border: 1px solid transparent;
          color: var(--text-3); font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .tb-btn:hover { color: var(--text-2); background: var(--bg-hover); }
        .tb-btn.active { color: var(--text-1); background: var(--accent-dim); border-color: var(--accent-border); }

        /* Grid */
        .marks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; }

        /* Cards */
        .marks-card { 
          position: relative; border-radius: 20px; padding: 20px; transition: transform 0.2s, box-shadow 0.2s;
          display: flex; flex-direction: column; gap: 16px; cursor: default;
        }
        .marks-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.4); }
        .card-sidebar { position: absolute; top: 20px; left: 0; bottom: 20px; width: 4px; border-radius: 0 2px 2px 0; opacity: 0.8; }

        .mc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
        .mc-name { font-family: var(--font-display); font-size: 15px; font-weight: 750; color: var(--text-1); line-height: 1.4; }
        .mc-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
        .mc-code { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); }
        .mc-dot { color: var(--text-4); }
        .mc-type { font-size: 11px; font-weight: 700; color: var(--text-4); text-transform: uppercase; }
        
        .mc-score-bubble { 
          padding: 5px 12px; border-radius: 10px; border: 1px solid; 
          font-family: var(--font-mono); font-size: 13px; font-weight: 700; white-space: nowrap;
        }

        .mc-chart-wrap { margin: -10px -10px 0 -22px; }
        .mc-no-tests { display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--text-4); font-style: italic; background: rgba(0,0,0,0.1); border-radius: 10px; }

        .mc-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .mc-chip { 
          padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); 
          display: flex; flex-direction: column; gap: 2px; min-width: 65px;
        }
        .mcc-label { font-size: 9px; font-weight: 700; color: var(--text-4); text-transform: uppercase; }
        .mcc-val { font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; color: var(--text-1); }

        .mc-progress-track { height: 4px; background: var(--border); border-radius: 3px; overflow: hidden; margin-top: 4px; }

        @media (max-width: 1000px) {
          .marks-summary-bar { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .marks-summary-bar { display: none; }
          .marks-grid { grid-template-columns: 1fr; }
          .marks-toolbar { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>
    </div>
  );
}
