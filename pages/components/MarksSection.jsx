import { useRef, useEffect, useState } from 'react';

/* ══════════════════════════════════════════════════
   GRADE CONFIG — subtle, tasteful palette
   ══════════════════════════════════════════════════ */
function getGrade(pct) {
  if (pct >= 91) return { grade: 'O',  label: 'Outstanding',  color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)' };
  if (pct >= 81) return { grade: 'A+', label: 'Excellent',     color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)' };
  if (pct >= 71) return { grade: 'A',  label: 'Very Good',     color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)' };
  if (pct >= 61) return { grade: 'B+', label: 'Good',          color: '#67e8f9', bg: 'rgba(103,232,249,0.1)', border: 'rgba(103,232,249,0.2)' };
  if (pct >= 51) return { grade: 'B',  label: 'Above Average', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)' };
  if (pct >= 45) return { grade: 'C',  label: 'Average',       color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)' };
  if (pct > 0)   return { grade: 'P',  label: 'Pass',          color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' };
  return           { grade: '—',  label: 'No Data',       color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' };
}

/* ── Radial ring score ───────────────────────────── */
function RadialScore({ pct, color, size = 72 }) {
  const r    = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const fill = circ * Math.min(pct / 100, 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5.5} />
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={5.5}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
}

/* ── Test history bar chart (canvas) ────────────── */
function TestBarChart({ tests, color }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!tests?.length || !ref.current) return;
    const canvas = ref.current;
    const ctx    = canvas.getContext('2d');
    const W      = canvas.offsetWidth || 280;
    const H      = 72;
    const dpr    = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad    = { l: 4, r: 4, t: 8, b: 20 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const n      = tests.length;
    const barW   = Math.min(28, (chartW / n) * 0.55);
    const gap    = chartW / n;

    ctx.clearRect(0, 0, W, H);

    // Draw bars
    tests.forEach((t, i) => {
      const scored = parseFloat(t.marks?.scored) || 0;
      const total  = parseFloat(t.marks?.total)  || 1;
      const pct    = scored / total;
      const x      = pad.l + i * gap + gap / 2 - barW / 2;
      const bh     = chartH * pct;
      const y      = pad.t + chartH - bh;
      const isAbs  = t.marks?.scored === 'Abs';

      // Track bar (background)
      const rx = 3;
      ctx.beginPath();
      ctx.roundRect?.(x, pad.t, barW, chartH, rx);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();

      if (!isAbs && pct > 0) {
        // Filled bar
        const g = ctx.createLinearGradient(0, y, 0, y + bh);
        g.addColorStop(0, color);
        g.addColorStop(1, color + '88');
        ctx.beginPath();
        ctx.roundRect?.(x, y, barW, bh, rx);
        ctx.fillStyle = g;
        ctx.shadowColor = color;
        ctx.shadowBlur  = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Score label above bar
      ctx.fillStyle = isAbs ? 'rgba(255,255,255,0.2)' : color;
      ctx.font = `500 9px 'Fira Code', monospace`;
      ctx.textAlign = 'center';
      const lbl = isAbs ? 'Ab' : `${scored}`;
      ctx.fillText(lbl, x + barW / 2, y - 3);

      // Test name below
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.font = `400 8px 'DM Sans', sans-serif`;
      ctx.fillText(t.test?.slice(0, 5) || `T${i+1}`, x + barW / 2, H - 4);
    });
  }, [tests, color]);

  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height: 72, display: 'block' }}
    />
  );
}

/* ── Overview summary strip ─────────────────────── */
function MarksSummaryStrip({ marks, courses = [] }) {
  // Filter OUT subjects that have 0 credits
  const validMarks = marks.filter(m => {
    const course = courses.find(c => c.code === m.courseCode);
    return !course || (parseFloat(course.credit) > 0);
  });
  
  const total = validMarks.length;
  if (!total) return null;

  const grades = validMarks.map(m => {
    const sc  = parseFloat(m.overall?.scored) || 0;
    const tot = parseFloat(m.overall?.total)  || 1;
    return getGrade((sc / tot) * 100);
  });

  const gradeCounts = {};
  grades.forEach(g => { gradeCounts[g.grade] = (gradeCounts[g.grade] || 0) + 1; });

  const totalScored = validMarks.reduce((s, m) => s + (parseFloat(m.overall?.scored) || 0), 0);
  const totalMax    = validMarks.reduce((s, m) => s + (parseFloat(m.overall?.total) || 1), 0);
  const avgPct      = (totalScored / totalMax) * 100;

  const topSubject = [...validMarks].sort((a, b) => {
    const pa = (parseFloat(a.overall?.scored)||0) / (parseFloat(a.overall?.total)||1);
    const pb = (parseFloat(b.overall?.scored)||0) / (parseFloat(b.overall?.total)||1);
    return pb - pa;
  })[0];

  const topPct = topSubject
    ? ((parseFloat(topSubject.overall?.scored)||0) / (parseFloat(topSubject.overall?.total)||1) * 100).toFixed(1)
    : 0;

  const avgGrade = getGrade(avgPct);

  return (
    <div className="summary-strip">

      {/* Average gauge */}
      <div className="ss-main glass">
        <div className="ss-gauge-wrap">
          <RadialScore pct={avgPct} color={avgGrade.color} size={80} />
          <div className="ss-gauge-center">
            <div className="ss-avg-pct" style={{ color: avgGrade.color }}>{avgPct.toFixed(1)}%</div>
            <div className="ss-avg-label">Avg</div>
          </div>
        </div>
        <div className="ss-info">
          <div className="ss-grade-badge" style={{ color: avgGrade.color, background: avgGrade.bg, border: `1px solid ${avgGrade.border}` }}>
            Grade {avgGrade.grade} · {avgGrade.label}
          </div>
          <div className="ss-total-marks">
            Total Scored: <strong style={{ color: '#fff' }}>{totalScored.toFixed(2)}</strong> / {totalMax.toFixed(0)}
          </div>
          <div className="ss-sub-text">{total} graded subjects · <span style={{ color: 'var(--amber)' }}>{marks.length - validMarks.length} courses (0 credits) skipped</span></div>
          {topSubject && (
            <div className="ss-top-sub">
              🏆 Current Best: <span style={{ color: avgGrade.color }}>{topSubject.courseName}</span>
              <span className="ss-top-pct">{topPct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Grade distribution mini-bars */}
      <div className="ss-dist glass">
        <div className="ssd-title">Grade Distribution</div>
        {['O','A+','A','B+','B','C','P'].map(g => {
          const cnt = gradeCounts[g] || 0;
          if (!cnt) return null;
          const gi = getGrade(g === 'O' ? 95 : g === 'A+' ? 85 : g === 'A' ? 75 : g === 'B+' ? 65 : g === 'B' ? 55 : g === 'C' ? 50 : 46);
          return (
            <div key={g} className="ssd-row">
              <span className="ssd-grade" style={{ color: gi.color }}>{g}</span>
              <div className="ssd-bar-track">
                <div className="ssd-bar-fill" style={{ width: `${(cnt/total)*100}%`, background: gi.color }} />
              </div>
              <span className="ssd-cnt">{cnt}</span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .summary-strip { display:grid; grid-template-columns:1fr 200px; gap:14px; margin-bottom:22px; }
        .ss-main { border-radius:18px; padding:22px; display:flex; align-items:center; gap:22px; position: relative; overflow: hidden; }
        .ss-main::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.03), transparent); pointer-events: none; }
        .ss-gauge-wrap { position:relative; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .ss-gauge-center { position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ss-avg-pct  { font-family:'Fira Code',monospace; font-size:18px; font-weight:700; line-height:1; }
        .ss-avg-label { font-size:9px; color:rgba(255,255,255,0.3); margin-top:2px; text-transform:uppercase; letter-spacing:0.5px; }
        .ss-info { flex:1; }
        .ss-grade-badge { display:inline-block; font-size:11px; font-weight:700; padding:4.5px 12px; border-radius:20px; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.4px; }
        .ss-total-marks { font-size: 15px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
        .ss-sub-text { font-size:11px; color:rgba(255,255,255,0.25); margin-bottom:12px; }
        .ss-top-sub { font-size:11.5px; color:rgba(255,255,255,0.35); display:flex; align-items:center; gap:6px; flex-wrap:wrap; background: rgba(0,0,0,0.1); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04); }
        .ss-top-pct { font-family:'Fira Code',monospace; font-size:10.5px; font-weight:700; }

        .ss-dist { border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:8px; }
        .ssd-title { font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-bottom:4px; }
        .ssd-row { display:flex; align-items:center; gap:8px; }
        .ssd-grade { font-family:'Fira Code',monospace; font-size:11px; font-weight:700; width:22px; }
        .ssd-bar-track { flex:1; height:5px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden; }
        .ssd-bar-fill { height:100%; border-radius:3px; transition:width 1s cubic-bezier(.4,0,.2,1); opacity:0.8; }
        .ssd-cnt { font-family:'Fira Code',monospace; font-size:11px; color:rgba(255,255,255,0.3); width:14px; text-align:right; }

        @media (max-width:700px) { .summary-strip { grid-template-columns:1fr; } .ss-dist { display:none; } }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN MARKS SECTION
   ══════════════════════════════════════════════════ */
export default function MarksSection({ marks, courses = [] }) {
  const [sortBy, setSortBy]   = useState('default'); // 'default' | 'high' | 'low' | 'type'
  const [filter, setFilter]   = useState('all');     // 'all' | 'Theory' | 'Practical'
  const [expanded, setExpanded] = useState(null);

  // Filter OUT subjects that have 0 credits
  const validMarksForList = marks.filter(m => {
    const course = courses.find(c => c.code === m.courseCode);
    return !course || (parseFloat(course.credit) > 0);
  });

  const sorted = [...validMarksForList]
    .filter(m => filter === 'all' || m.courseType === filter)
    .sort((a, b) => {
      const pa = (parseFloat(a.overall?.scored)||0)/(parseFloat(a.overall?.total)||1);
      const pb = (parseFloat(b.overall?.scored)||0)/(parseFloat(b.overall?.total)||1);
      if (sortBy === 'high') return pb - pa;
      if (sortBy === 'low')  return pa - pb;
      return 0;
    });

  if (!marks.length) return (
    <div className="empty-state">
      No marks data available yet.
    </div>
  );

  return (
    <div className="marks-section">

      {/* Summary strip */}
      <MarksSummaryStrip marks={marks} courses={courses} />

      {/* Toolbar */}
      <div className="marks-toolbar">

        {/* Filter */}
        <div className="tb-filters">
          {['all','Theory','Practical'].map(f => (
            <button
              key={f}
              className={`tb-filter ${filter===f?'tb-active':''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        {/* Sort */}
        <div className="tb-sort">
          <span className="tb-sort-label">Sort:</span>
          {[['default','Default'],['high','Highest'],['low','Lowest']].map(([v,l]) => (
            <button
              key={v}
              className={`tb-filter ${sortBy===v?'tb-active':''}`}
              onClick={() => setSortBy(v)}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="marks-grid">
        {sorted.map((m, i) => {
          const sc    = parseFloat(m.overall?.scored) || 0;
          const tot   = parseFloat(m.overall?.total)  || 0;
          const pct   = tot > 0 ? (sc / tot) * 100 : 0;
          const gi    = getGrade(pct);
          const tests = (m.testPerformance || []).slice().reverse();
          const isExp = expanded === i;

          // Test stats
          const testScores = tests.map(t => {
            const ts = parseFloat(t.marks?.scored) || 0;
            const tt = parseFloat(t.marks?.total)  || 1;
            return (ts / tt) * 100;
          });
          const bestTest  = testScores.length ? Math.max(...testScores).toFixed(0) : null;
          const worstTest = testScores.length ? Math.min(...testScores).toFixed(0) : null;
          const trend     = testScores.length >= 2
            ? testScores[testScores.length-1] > testScores[testScores.length-2] ? 'up' : testScores[testScores.length-1] < testScores[testScores.length-2] ? 'down' : 'flat'
            : null;

          return (
            <div
              key={i}
              className={`mk-card glass ${isExp ? 'mk-expanded' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="card-shimmer"></div>
              {/* Top accent line */}
              <div className="mk-accent-line" style={{ background: `linear-gradient(90deg, ${gi.color}, transparent)` }} />

              {/* Header */}
              <div className="mk-header" onClick={() => setExpanded(isExp ? null : i)}>
                <div className="mk-left">
                  {/* Radial + score */}
                  <div className="mk-radial-wrap">
                    <RadialScore pct={pct} color={gi.color} size={58} />
                    <div className="mk-radial-center">
                      <div className="mk-grade-letter" style={{ color: gi.color }}>{gi.grade}</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mk-info">
                    <div className="mk-code-row">
                      <span className="mk-code">{m.courseCode}</span>
                      <span className="mk-type-chip" style={{ background: gi.bg, color: gi.color, border: `1px solid ${gi.border}` }}>
                        {m.courseType}
                      </span>
                    </div>
                    <div className="mk-name">{m.courseName}</div>
                    <div className="mk-score-row">
                      <span className="mk-score-num" style={{ color: gi.color }}>{sc.toFixed(1)}</span>
                      <span className="mk-score-denom">/ {tot.toFixed(1)}</span>
                      <span className="mk-pct" style={{ color: gi.color }}>{pct.toFixed(1)}%</span>
                      {trend && (
                        <span className="mk-trend" style={{ color: trend==='up' ? '#34d399' : trend==='down' ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                {tests.length > 0 && (
                  <div className="mk-quick-stats">
                    {bestTest && (
                      <div className="mqs-item">
                        <div className="mqs-val" style={{ color: '#34d399' }}>{bestTest}%</div>
                        <div className="mqs-lbl">Best</div>
                      </div>
                    )}
                    {worstTest && (
                      <div className="mqs-item">
                        <div className="mqs-val" style={{ color: worstTest < 50 ? '#f87171' : 'rgba(255,255,255,0.5)' }}>{worstTest}%</div>
                        <div className="mqs-lbl">Worst</div>
                      </div>
                    )}
                    <div className="mqs-item">
                      <div className="mqs-val" style={{ color: 'rgba(255,255,255,0.4)' }}>{tests.length}</div>
                      <div className="mqs-lbl">Tests</div>
                    </div>
                  </div>
                )}

                <button className="mk-expand-btn" aria-label={isExp ? 'Collapse' : 'Expand'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                    style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>

              {/* Score progress bar */}
              <div className="mk-bar-wrap">
                <div className="mk-bar-track">
                  <div className="mk-bar-fill" style={{ width: `${Math.min(pct,100)}%`, background: `linear-gradient(90deg, ${gi.color}cc, ${gi.color}55)` }} />
                </div>
              </div>

              {/* Expanded: test bar chart */}
              {isExp && (
                <div className="mk-details animate-in">
                  {tests.length > 0 ? (
                    <>
                      <div className="mk-chart-label">Test Performance</div>
                      <div className="mk-chart-area">
                        <TestBarChart tests={tests} color={gi.color} />
                      </div>

                      {/* Test data table */}
                      <div className="mk-test-table">
                        {tests.map((t, ti) => {
                          const ts  = parseFloat(t.marks?.scored);
                          const tt  = parseFloat(t.marks?.total) || 1;
                          const tp  = isNaN(ts) ? 0 : (ts / tt) * 100;
                          const tgi = getGrade(tp);
                          const isAbs = t.marks?.scored === 'Abs';
                          return (
                            <div key={ti} className="mtt-row">
                              <span className="mtt-name">{t.test}</span>
                              <div className="mtt-bar-track">
                                <div className="mtt-bar-fill" style={{ width: `${tp}%`, background: tgi.color, opacity: 0.65 }} />
                              </div>
                              <span className="mtt-score" style={{ color: isAbs ? 'rgba(255,255,255,0.25)' : tgi.color }}>
                                {isAbs ? 'Absent' : `${ts?.toFixed(1)} / ${tt}`}
                              </span>
                              {!isAbs && (
                                <span className="mtt-grade" style={{ color: tgi.color, background: tgi.bg, border: `1px solid ${tgi.border}` }}>
                                  {tgi.grade}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="mk-no-tests">No test data available yet for this subject.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .marks-section { display:flex; flex-direction:column; gap:0; }

        /* TOOLBAR */
        .marks-toolbar {
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          margin-bottom:16px; flex-wrap:wrap;
        }
        .tb-filters, .tb-sort { display:flex; align-items:center; gap:4px; }
        .tb-sort-label { font-size:11px; color:rgba(255,255,255,0.3); margin-right:4px; }
        .tb-filter {
          padding:5px 13px; border-radius:8px;
          background:none; border:1px solid rgba(255,255,255,0.07);
          color:rgba(255,255,255,0.35); font-size:12px; cursor:pointer;
          transition:all .15s; font-family:'DM Sans',sans-serif;
        }
        .tb-filter:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.7); }
        .tb-active { background:rgba(99,102,241,0.12)!important; border-color:rgba(99,102,241,0.3)!important; color:#a5b4fc!important; }

        /* GRID */
        .marks-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:12px; }

        /* CARD */
        .mk-card {
          border-radius:16px; overflow:hidden; position:relative;
          transition:transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s, border-color .2s;
          animation:fadeUp .4s cubic-bezier(.4,0,.2,1) both;
          cursor:default;
        }
        .mk-card:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,0.4); }
        .mk-expanded { transform:translateY(-2px); }

        .card-shimmer {
          position: absolute;
          top: 0; left: 0; right: 0; height: 80px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.03), transparent);
          pointer-events: none;
        }

        /* Accent top line */
        .mk-accent-line { height:3px; width:100%; }

        /* Header */
        .mk-header { display:flex; align-items:center; gap:12px; padding:14px 16px 8px; cursor:pointer; }
        .mk-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }

        /* Radial */
        .mk-radial-wrap { position:relative; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .mk-radial-center { position:absolute; display:flex; align-items:center; justify-content:center; }
        .mk-grade-letter { font-family:'Syne',sans-serif; font-size:14px; font-weight:800; }

        /* Info */
        .mk-info { flex:1; min-width:0; }
        .mk-code-row { display:flex; align-items:center; gap:7px; margin-bottom:4px; }
        .mk-code { font-family:'Fira Code',monospace; font-size:9.5px; color:rgba(255,255,255,0.3); }
        .mk-type-chip { font-size:9.5px; font-weight:700; padding:1.5px 7px; border-radius:8px; text-transform:uppercase; letter-spacing:.4px; }
        .mk-name { font-family:'Syne',sans-serif; font-size:13.5px; font-weight:700; color:rgba(240,240,250,0.9); line-height:1.3; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mk-score-row { display:flex; align-items:baseline; gap:4px; }
        .mk-score-num { font-family:'Fira Code',monospace; font-size:20px; font-weight:700; line-height:1; }
        .mk-score-denom { font-size:11px; color:rgba(255,255,255,0.3); }
        .mk-pct { font-family:'Fira Code',monospace; font-size:12px; font-weight:600; margin-left:4px; }
        .mk-trend { font-size:14px; font-weight:700; }

        /* Quick stats */
        .mk-quick-stats { display:flex; gap:10px; flex-shrink:0; }
        .mqs-item { text-align:center; }
        .mqs-val { font-family:'Fira Code',monospace; font-size:13px; font-weight:700; }
        .mqs-lbl { font-size:8.5px; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:.5px; margin-top:1px; }

        /* Expand button */
        .mk-expand-btn {
          width:26px; height:26px; border-radius:7px; flex-shrink:0;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07);
          color:rgba(255,255,255,0.3); cursor:pointer; display:flex;
          align-items:center; justify-content:center; transition:all .15s;
        }
        .mk-expand-btn:hover { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.7); }

        /* Progress bar */
        .mk-bar-wrap { padding:0 16px 12px; }
        .mk-bar-track { height:3px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
        .mk-bar-fill { height:100%; border-radius:2px; transition:width 1.1s cubic-bezier(.4,0,.2,1); }

        /* Expanded content */
        .mk-details { padding:0 16px 16px; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; }
        .animate-in { animation:fadeUp .3s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .mk-chart-label { font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-bottom:8px; }
        .mk-chart-area { background:rgba(0,0,0,0.15); border-radius:10px; padding:8px 8px 4px; margin-bottom:12px; }

        /* Test table */
        .mk-test-table { display:flex; flex-direction:column; gap:5px; }
        .mtt-row { display:flex; align-items:center; gap:8px; padding:4px 0; }
        .mtt-name { font-size:10.5px; color:rgba(255,255,255,0.4); min-width:52px; flex-shrink:0; }
        .mtt-bar-track { flex:1; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
        .mtt-bar-fill { height:100%; border-radius:2px; transition:width .8s ease; }
        .mtt-score { font-family:'Fira Code',monospace; font-size:10.5px; font-weight:600; white-space:nowrap; min-width:70px; text-align:right; }
        .mtt-grade { font-size:9.5px; font-weight:700; padding:1.5px 6px; border-radius:6px; min-width:24px; text-align:center; }

        .mk-no-tests { font-size:12px; color:rgba(255,255,255,0.22); font-style:italic; padding:8px 0; }

        /* Responsive */
        @media (max-width:700px) {
          .marks-grid { grid-template-columns:1fr; }
          .mk-quick-stats { display:none; }
          .marks-toolbar { flex-direction:column; align-items:flex-start; }
        }
      `}</style>
    </div>
  );
}
