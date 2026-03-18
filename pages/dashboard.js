import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri'];

function AnimatedLineChart({ tests, total }) {
  const canvasRef = useRef(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!tests || tests.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 30, right: 20, bottom: 40, left: 45 };

    const points = tests.map((t, i) => {
      const mk = typeof t.marks === 'object' ? t.marks : {};
      const scored = parseFloat(mk.scored) || 0;
      const tot = parseFloat(mk.total) || 1;
      return { label: t.test, pct: (scored / tot) * 100, scored, tot };
    });

    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    let progress = 0;
    const duration = 1000;
    const start = performance.now();

    function draw(now) {
      progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      [0, 25, 50, 75, 100].forEach(v => {
        const y = pad.top + chartH - (v / 100) * chartH;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '10px DM Sans, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v + '%', pad.left - 6, y + 3);
      });

      // X labels
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      points.forEach((p, i) => {
        const x = pad.left + (i / Math.max(points.length - 1, 1)) * chartW;
        ctx.fillText(p.label, x, H - 8);
      });

      // Animated line up to progress
      const totalPoints = points.length;
      const currentCount = ease * (totalPoints - 1);

      const getXY = (i) => ({
        x: pad.left + (i / Math.max(totalPoints - 1, 1)) * chartW,
        y: pad.top + chartH - (points[i].pct / 100) * chartH,
      });

      // Fill gradient under line
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, 'rgba(99,102,241,0.35)');
      grad.addColorStop(1, 'rgba(99,102,241,0)');

      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top + chartH);
      for (let i = 0; i < totalPoints; i++) {
        const frac = Math.min(currentCount - i + 1, 1);
        if (frac <= 0) break;
        const { x, y } = getXY(i);
        const nextIdx = Math.min(i + 1, totalPoints - 1);
        const nx = pad.left + (nextIdx / Math.max(totalPoints - 1, 1)) * chartW;
        const ny = pad.top + chartH - (points[nextIdx].pct / 100) * chartH;
        const interpY = frac < 1 ? y + (ny - y) * frac : y;
        const interpX = frac < 1 ? x + (nx - x) * frac : x;
        if (i === 0) ctx.lineTo(x, y);
        ctx.lineTo(frac < 1 ? interpX : x, frac < 1 ? interpY : y);
      }
      const lastVisible = Math.min(Math.floor(currentCount) + 1, totalPoints - 1);
      ctx.lineTo(getXY(lastVisible).x, pad.top + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line stroke
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let i = 0; i < totalPoints; i++) {
        const frac = Math.min(currentCount - i + 1, 1);
        if (frac <= 0) break;
        const { x, y } = getXY(i);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (frac < 1 && i + 1 < totalPoints) {
          const { x: nx, y: ny } = getXY(i + 1);
          ctx.lineTo(x + (nx - x) * frac, y + (ny - y) * frac);
          break;
        }
      }
      ctx.stroke();

      // Dots + labels
      points.forEach((p, i) => {
        const frac = Math.min(ease * totalPoints - i, 1);
        if (frac <= 0) return;
        const { x, y } = getXY(i);
        const r = 5 * Math.min(frac, 1);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.pct >= 75 ? '#10b981' : p.pct >= 50 ? '#f59e0b' : '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#0a0a0f';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (frac >= 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = 'bold 11px DM Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${p.scored}/${p.tot}`, x, y - 12);
        }
      });

      if (progress < 1) requestAnimationFrame(draw);
      else setAnimated(true);
    }

    requestAnimationFrame(draw);
  }, [tests]);

  return <canvas ref={canvasRef} width={420} height={180} style={{ width:'100%', height:180 }} />;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('attendance');

  useEffect(() => {
    const stored = sessionStorage.getItem('academia_data');
    if (!stored) { router.push('/'); return; }
    setData(JSON.parse(stored));
  }, []);

  const logout = () => { localStorage.clear(); sessionStorage.clear(); router.push('/'); };

  if (!data) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(99,102,241,0.2)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const user = data?.user || {};
  const attendance = data?.attendance?.attendance || [];
  const marks = data?.marks?.marks || [];
  const timetable = data?.timetable?.schedule || [];
  const courses = data?.courses?.courses || [];

  const avgAtt = attendance.length
    ? (attendance.reduce((s,a) => s + parseFloat(a.attendancePercentage), 0) / attendance.length).toFixed(1)
    : '—';
  const below75 = attendance.filter(a => parseFloat(a.attendancePercentage) < 75).length;

  return (
    <>
      <Head><title>CampusPro — {user.name}</title></Head>
      <div className="app">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="brand">⬡ CAMPUS<strong>PRO</strong></div>
          <div className="user-box">
            <div className="avatar">{user.name?.[0] || 'S'}</div>
            <div>
              <div className="uname">{user.name}</div>
              <div className="ureg">{user.regNumber}</div>
              <div className="udept">{user.department?.replace(/\(.*\)/,'').trim()}</div>
            </div>
          </div>
          <div className="stats-mini">
            <div className="sm"><div className="sm-v">{user.semester}</div><div className="sm-l">Sem</div></div>
            <div className="sm"><div className="sm-v" style={{color:below75>0?'#ef4444':'#10b981'}}>{below75}</div><div className="sm-l">&lt;75%</div></div>
            <div className="sm"><div className="sm-v">{avgAtt}%</div><div className="sm-l">Avg</div></div>
          </div>
          <nav>
            {[
              {id:'attendance', icon:'📊', label:'Attendance'},
              {id:'marks',      icon:'📈', label:'Marks'},
              {id:'timetable',  icon:'🗓',  label:'Timetable'},
              {id:'courses',    icon:'📚', label:'Courses'},
            ].map(n => (
              <button key={n.id} className={`nb ${tab===n.id?'nba':''}`} onClick={() => setTab(n.id)}>
                <span>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
          <button className="logout" onClick={logout}>↩ Sign out</button>
        </aside>

        {/* MAIN */}
        <main className="main">

          {/* ATTENDANCE */}
          {tab === 'attendance' && (
            <div>
              <h2 className="title">Attendance</h2>
              <div className="cards">
                {[
                  {label:'Average',    val:avgAtt+'%', color:'#a5b4fc'},
                  {label:'Safe ≥75%',  val:attendance.filter(a=>parseFloat(a.attendancePercentage)>=75).length, color:'#6ee7b7'},
                  {label:'Danger <75%',val:below75, color:'#fca5a5'},
                  {label:'Subjects',   val:attendance.length, color:'#fde68a'},
                ].map((c,i) => (
                  <div key={i} className="card">
                    <div className="card-v" style={{color:c.color}}>{c.val}</div>
                    <div className="card-l">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="att-list">
                {attendance.map((a,i) => {
                  const pct = parseFloat(a.attendancePercentage);
                  const clr = pct>=85?'#10b981':pct>=75?'#f59e0b':'#ef4444';
                  const attended = parseFloat(a.hoursConducted) - parseFloat(a.hoursAbsent);
                  const canMiss = Math.floor(attended - 0.75 * parseFloat(a.hoursConducted));
                  return (
                    <div key={i} className="att-row">
                      <div className="att-info">
                        <div className="att-name">{a.courseTitle}</div>
                        <div className="att-meta">{a.courseCode} · {a.category} · {a.facultyName?.split('(')[0]}</div>
                        <div className="bar-bg"><div className="bar-fill" style={{width:`${Math.min(pct,100)}%`,background:clr,transition:'width 1s ease'}}/></div>
                      </div>
                      <div className="att-right">
                        <div className="att-pct" style={{color:clr}}>{a.attendancePercentage}%</div>
                        <div className="att-hours">{attended}/{a.hoursConducted} hrs</div>
                        <div className="att-margin" style={{color:canMiss>=0?'#6ee7b7':'#fca5a5',background:canMiss>=0?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)'}}>
                          {canMiss>=0?`Miss ${canMiss} more`:`Need ${Math.abs(canMiss)} more`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MARKS */}
          {tab === 'marks' && (
            <div>
              <h2 className="title">Marks</h2>
              <div className="marks-grid">
                {marks.map((m,i) => {
                  const sc = parseFloat(m.overall?.scored)||0;
                  const tot = parseFloat(m.overall?.total)||0;
                  const pct = tot>0?(sc/tot*100):0;
                  const clr = pct>=80?'#10b981':pct>=60?'#f59e0b':'#ef4444';
                  const tests = (m.testPerformance||[]).slice().reverse();
                  return (
                    <div key={i} className="mark-card">
                      <div className="mk-top">
                        <div>
                          <div className="mk-code">{m.courseCode}</div>
                          <div className="mk-name">{m.courseName}</div>
                          <div className="mk-cat">{m.courseType}</div>
                        </div>
                        <div className="mk-score-wrap">
                          <div className="mk-score" style={{color:clr}}>{sc.toFixed(2)}</div>
                          <div className="mk-total">/ {tot.toFixed(2)}</div>
                          <div className="mk-pct" style={{color:clr}}>{pct.toFixed(1)}%</div>
                        </div>
                      </div>

                      {tests.length > 0 ? (
                        <div className="chart-wrap">
                          <AnimatedLineChart tests={tests} total={tot} />
                        </div>
                      ) : (
                        <div className="no-tests">No test data available</div>
                      )}

                      {/* Total bar */}
                      <div className="total-bar-wrap">
                        <div className="total-bar-label">
                          <span>Total: {sc.toFixed(2)} / {tot.toFixed(2)}</span>
                          <span style={{color:clr}}>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="bar-bg">
                          <div className="bar-fill" style={{width:`${pct}%`,background:clr,transition:'width 1.2s ease'}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TIMETABLE */}
          {tab === 'timetable' && (
            <div>
              <h2 className="title">Timetable</h2>
              <div className="tt-scroll">
                <table className="tt">
                  <thead>
                    <tr>
                      <th></th>
                      {['8:00','8:50','9:45','10:40','11:35','12:30','1:15','2:10','3:05','4:00'].map((s,i)=><th key={i}>{s}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.map((d,di)=>(
                      <tr key={di}>
                        <td className="tt-day">{DAY_NAMES[d.day-1]}</td>
                        {(d.table||[]).map((slot,si)=>(
                          <td key={si} className="tt-cell">
                            {slot&&(
                              <div className={`slot ${slot.courseType==='Practical'?'sp':'st'}`}>
                                <div className="slot-c">{slot.code}</div>
                                <div className="slot-r">{slot.roomNo}</div>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COURSES */}
          {tab === 'courses' && (
            <div>
              <h2 className="title">Courses</h2>
              <div className="courses-grid">
                {courses.map((c,i)=>(
                  <div key={i} className="course-card">
                    <div className="cc-top">
                      <span className="cc-code">{c.code}</span>
                      <span className={`badge ${c.slotType==='Theory'?'bt':'bp'}`}>{c.slotType}</span>
                    </div>
                    <div className="cc-title">{c.title}</div>
                    <div className="cc-meta">
                      <div>👤 {c.faculty?.split('(')[0]?.trim()}</div>
                      <div>🏫 {c.room} · 🕐 {c.slot} · ⭐ {c.credit} cr</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0a0a0f; color:#e2e8f0; font-family:'DM Sans',sans-serif; }
      `}</style>

      <style jsx>{`
        .app { display:flex; min-height:100vh; }

        /* SIDEBAR */
        .sidebar { width:230px; min-height:100vh; background:rgba(255,255,255,0.02); border-right:1px solid rgba(255,255,255,0.06); padding:24px 16px; display:flex; flex-direction:column; gap:18px; position:sticky; top:0; height:100vh; overflow-y:auto; }
        .brand { font-family:'Space Mono',monospace; font-size:16px; color:#fff; }
        .brand strong { color:#6366f1; }
        .user-box { display:flex; gap:10px; align-items:flex-start; padding:12px; background:rgba(99,102,241,0.08); border-radius:10px; }
        .avatar { width:36px; height:36px; background:#6366f1; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; flex-shrink:0; }
        .uname { font-size:12px; font-weight:500; color:#fff; }
        .ureg { font-size:10px; color:rgba(255,255,255,0.35); font-family:'Space Mono',monospace; }
        .udept { font-size:10px; color:rgba(255,255,255,0.3); margin-top:2px; line-height:1.4; }
        .stats-mini { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .sm { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px; text-align:center; }
        .sm-v { font-family:'Space Mono',monospace; font-size:14px; font-weight:700; color:#fff; }
        .sm-l { font-size:9px; color:rgba(255,255,255,0.3); margin-top:2px; text-transform:uppercase; }
        nav { display:flex; flex-direction:column; gap:3px; flex:1; }
        .nb { background:none; border:none; color:rgba(255,255,255,0.4); text-align:left; padding:9px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:8px; transition:all 0.15s; }
        .nb:hover { background:rgba(255,255,255,0.05); color:#fff; }
        .nba { background:rgba(99,102,241,0.15); color:#a5b4fc; }
        .logout { background:none; border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.3); padding:9px; border-radius:8px; cursor:pointer; font-size:12px; }
        .logout:hover { border-color:rgba(239,68,68,0.4); color:#fca5a5; }

        /* MAIN */
        .main { flex:1; padding:36px 44px; overflow-x:auto; }
        .title { font-family:'Space Mono',monospace; font-size:20px; color:#fff; margin-bottom:24px; }

        /* CARDS */
        .cards { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
        .card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:18px; }
        .card-v { font-family:'Space Mono',monospace; font-size:26px; font-weight:700; }
        .card-l { font-size:11px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.8px; margin-top:4px; }

        /* ATTENDANCE */
        .att-list { display:flex; flex-direction:column; gap:8px; }
        .att-row { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px 18px; display:flex; gap:16px; align-items:center; }
        .att-info { flex:1; }
        .att-name { font-size:14px; font-weight:500; color:#fff; margin-bottom:2px; }
        .att-meta { font-size:11px; color:rgba(255,255,255,0.35); margin-bottom:8px; }
        .bar-bg { height:4px; background:rgba(255,255,255,0.08); border-radius:2px; }
        .bar-fill { height:100%; border-radius:2px; }
        .att-right { text-align:right; flex-shrink:0; }
        .att-pct { font-family:'Space Mono',monospace; font-size:22px; font-weight:700; }
        .att-hours { font-size:11px; color:rgba(255,255,255,0.35); margin:2px 0 6px; }
        .att-margin { font-size:11px; padding:3px 8px; border-radius:6px; display:inline-block; }

        /* MARKS */
        .marks-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:18px; }
        .mark-card {
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:14px;
          transition:transform 0.2s, border-color 0.2s;
        }
        .mark-card:hover { transform:translateY(-2px); border-color:rgba(99,102,241,0.3); }
        .mk-top { display:flex; justify-content:space-between; align-items:flex-start; }
        .mk-code { font-family:'Space Mono',monospace; font-size:11px; color:#a5b4fc; margin-bottom:4px; }
        .mk-name { font-size:14px; font-weight:500; color:#fff; line-height:1.4; }
        .mk-cat { font-size:11px; color:rgba(255,255,255,0.3); margin-top:3px; }
        .mk-score-wrap { text-align:right; flex-shrink:0; }
        .mk-score { font-family:'Space Mono',monospace; font-size:28px; font-weight:700; line-height:1; }
        .mk-total { font-size:13px; color:rgba(255,255,255,0.3); }
        .mk-pct { font-size:12px; font-weight:600; margin-top:4px; }
        .chart-wrap { background:rgba(0,0,0,0.2); border-radius:10px; padding:8px 4px 4px; }
        .no-tests { font-size:12px; color:rgba(255,255,255,0.25); text-align:center; padding:20px 0; }
        .total-bar-wrap { padding-top:4px; }
        .total-bar-label { display:flex; justify-content:space-between; font-size:12px; color:rgba(255,255,255,0.4); margin-bottom:6px; font-family:'Space Mono',monospace; }

        /* BADGES */
        .badge { font-size:10px; padding:3px 8px; border-radius:4px; font-weight:500; text-transform:uppercase; }
        .bt { background:rgba(99,102,241,0.15); color:#a5b4fc; }
        .bp { background:rgba(16,185,129,0.12); color:#6ee7b7; }

        /* TIMETABLE */
        .tt-scroll { overflow-x:auto; }
        .tt { border-collapse:collapse; min-width:900px; width:100%; }
        .tt th { padding:8px 10px; font-size:10px; color:rgba(255,255,255,0.3); border:1px solid rgba(255,255,255,0.06); text-align:center; background:rgba(255,255,255,0.02); }
        .tt td { border:1px solid rgba(255,255,255,0.05); padding:5px; height:58px; vertical-align:top; }
        .tt-day { font-size:12px; color:rgba(255,255,255,0.5); font-weight:500; white-space:nowrap; padding:8px 14px !important; }
        .slot { border-radius:6px; padding:6px 8px; height:100%; }
        .st { background:rgba(99,102,241,0.15); }
        .sp { background:rgba(16,185,129,0.1); }
        .slot-c { font-size:10px; font-family:'Space Mono',monospace; color:#a5b4fc; }
        .slot-r { font-size:9px; color:rgba(255,255,255,0.3); margin-top:2px; }

        /* COURSES */
        .courses-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
        .course-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:18px; transition:transform 0.2s; }
        .course-card:hover { transform:translateY(-2px); }
        .cc-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .cc-code { font-family:'Space Mono',monospace; font-size:12px; color:#a5b4fc; }
        .cc-title { font-size:14px; font-weight:500; color:#fff; margin-bottom:12px; line-height:1.4; }
        .cc-meta { display:flex; flex-direction:column; gap:5px; font-size:12px; color:rgba(255,255,255,0.4); }
      `}</style>
    </>
  );
}
