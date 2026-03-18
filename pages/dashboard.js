import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri'];

function hexA(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function scoreColor(pct) {
  return pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
}

function GlowLineChart({ tests }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!tests || tests.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 360;
    const H = 140;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top:30, right:16, bottom:26, left:38 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const pts = tests.map((t,i) => {
      const s = parseFloat(t.marks?.scored) || 0;
      const tot = parseFloat(t.marks?.total) || 1;
      const pct = (s/tot)*100;
      return {
        x: pad.left + (i/Math.max(tests.length-1,1))*cW,
        y: pad.top + cH - (pct/100)*cH,
        pct, label:`${s}/${tot}`, xLabel:t.test, color:scoreColor(pct),
      };
    });

    let prog = 0;
    const start = performance.now();

    function draw(now) {
      prog = Math.min((now-start)/1000,1);
      const ease = 1-Math.pow(1-prog,4);
      ctx.clearRect(0,0,W,H);

      [0,25,50,75,100].forEach(v => {
        const y = pad.top+cH-(v/100)*cH;
        ctx.beginPath(); ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
        ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+cW,y); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.font='9px DM Sans,sans-serif';
        ctx.textAlign='right'; ctx.fillText(v+'%',pad.left-5,y+3);
      });

      if (pts.length < 1) return;
      const totalLen = Math.max(pts.length-1,1);
      const drawTo = ease*totalLen;
      const fullSeg = Math.floor(drawTo);
      const partial = drawTo-fullSeg;
      const animPts = pts.slice(0,fullSeg+1);
      if (fullSeg < pts.length-1 && partial>0) {
        const a=pts[fullSeg],b=pts[fullSeg+1];
        animPts.push({x:a.x+(b.x-a.x)*partial,y:a.y+(b.y-a.y)*partial,color:a.color,partial:true});
      }
      if (animPts.length < 2) { if(prog<1) requestAnimationFrame(draw); return; }

      const domColor = pts[pts.length-1]?.color||'#6366f1';

      ctx.beginPath();
      ctx.moveTo(animPts[0].x,pad.top+cH);
      ctx.lineTo(animPts[0].x,animPts[0].y);
      for(let i=1;i<animPts.length;i++){
        const prev=animPts[i-1],cur=animPts[i];
        const cpx=(prev.x+cur.x)/2;
        ctx.bezierCurveTo(cpx,prev.y,cpx,cur.y,cur.x,cur.y);
      }
      ctx.lineTo(animPts[animPts.length-1].x,pad.top+cH);
      ctx.closePath();
      const fillGrad=ctx.createLinearGradient(0,pad.top,0,pad.top+cH);
      fillGrad.addColorStop(0,hexA(domColor,0.3));
      fillGrad.addColorStop(1,hexA(domColor,0.01));
      ctx.fillStyle=fillGrad; ctx.fill();

      ctx.beginPath();
      ctx.moveTo(animPts[0].x,animPts[0].y);
      for(let i=1;i<animPts.length;i++){
        const prev=animPts[i-1],cur=animPts[i];
        const cpx=(prev.x+cur.x)/2;
        ctx.bezierCurveTo(cpx,prev.y,cpx,cur.y,cur.x,cur.y);
      }
      ctx.strokeStyle=domColor; ctx.lineWidth=2.5;
      ctx.lineJoin='round'; ctx.lineCap='round';
      ctx.shadowColor=domColor; ctx.shadowBlur=10;
      ctx.stroke(); ctx.shadowBlur=0;

      pts.forEach((p,i) => {
        const frac=Math.min(ease*totalLen-i+0.5,1);
        if(frac<=0) return;
        const r=5*Math.min(frac*2,1);
        ctx.beginPath(); ctx.arc(p.x,p.y,r+4,0,Math.PI*2);
        ctx.fillStyle=hexA(p.color,0.15); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
        ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=12;
        ctx.fill(); ctx.shadowBlur=0;
        ctx.strokeStyle='#0d0d14'; ctx.lineWidth=2; ctx.stroke();
        if(frac>=0.85){
          ctx.font='bold 10px DM Sans,sans-serif';
          const tw=ctx.measureText(p.label).width+12;
          const bx=p.x-tw/2,by=p.y-24;
          ctx.fillStyle=hexA(p.color,0.18);
          ctx.beginPath();
          if(ctx.roundRect) ctx.roundRect(bx,by,tw,14,4); else ctx.rect(bx,by,tw,14);
          ctx.fill();
          ctx.fillStyle=p.color; ctx.textAlign='center';
          ctx.fillText(p.label,p.x,by+10);
        }
        ctx.fillStyle='rgba(255,255,255,0.28)';
        ctx.font='9px DM Sans,sans-serif'; ctx.textAlign='center';
        ctx.fillText(p.xLabel,p.x,H-4);
      });
      if(prog<1) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  },[tests]);

  return <canvas ref={canvasRef} style={{width:'100%',height:140,display:'block'}} />;
}

export default function Dashboard() {
  const router = useRouter();
  const [data,setData] = useState(null);
  const [tab,setTab] = useState('attendance');

  useEffect(() => {
    const stored = sessionStorage.getItem('academia_data');
    if(!stored){router.push('/');return;}
    setData(JSON.parse(stored));
  },[]);

  const logout = () => { localStorage.clear(); sessionStorage.clear(); router.push('/'); };

  if(!data) return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,border:'3px solid rgba(99,102,241,0.15)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const user = data?.user||{};
  const attendance = data?.attendance?.attendance||[];
  const marks = data?.marks?.marks||[];
  const timetable = data?.timetable?.schedule||[];
  const courses = data?.courses?.courses||[];
  const avgAtt = attendance.length
    ? (attendance.reduce((s,a)=>s+parseFloat(a.attendancePercentage||0),0)/attendance.length).toFixed(1)
    : '—';
  const below75 = attendance.filter(a=>parseFloat(a.attendancePercentage)<75).length;

  return (
    <>
      <Head><title>CampusPro — {user.name||'Dashboard'}</title></Head>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">⬡ CAMPUS<strong>PRO</strong></div>
          <div className="user-box">
            <div className="avatar">{(user.name||'S')[0]}</div>
            <div>
              <div className="uname">{user.name}</div>
              <div className="ureg">{user.regNumber}</div>
              <div className="udept">{user.department?.replace(/\(.*\)/,'').trim()}</div>
            </div>
          </div>
          <div className="stats-mini">
            <div className="sm"><div className="smv">{user.semester}</div><div className="sml">Sem</div></div>
            <div className="sm"><div className="smv" style={{color:below75>0?'#ef4444':'#10b981'}}>{below75}</div><div className="sml">&lt;75%</div></div>
            <div className="sm"><div className="smv">{avgAtt}%</div><div className="sml">Avg</div></div>
          </div>
          <nav>
            {[
              {id:'attendance',label:'Attendance'},
              {id:'marks',label:'Marks'},
              {id:'timetable',label:'Timetable'},
              {id:'courses',label:'Courses'},
            ].map(t=>(
              <button key={t.id} className={`nb${tab===t.id?' nba':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
            ))}
          </nav>
          <button className="logout" onClick={logout}>↩ Sign out</button>
        </aside>

        <main className="main">

          {tab==='attendance' && (
            <section>
              <h2 className="title">Attendance</h2>
              <div className="sum-cards">
                {[
                  {label:'Average',val:avgAtt+'%',color:'#a5b4fc'},
                  {label:'Safe ≥ 75%',val:attendance.filter(a=>parseFloat(a.attendancePercentage)>=75).length,color:'#6ee7b7'},
                  {label:'Danger < 75%',val:below75,color:'#fca5a5'},
                  {label:'Subjects',val:attendance.length,color:'#fde68a'},
                ].map((c,i)=>(
                  <div key={i} className="sc">
                    <div className="scv" style={{color:c.color}}>{c.val}</div>
                    <div className="scl">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="att-list">
                {attendance.map((a,i)=>{
                  const pct=parseFloat(a.attendancePercentage);
                  const clr=pct>=85?'#10b981':pct>=75?'#f59e0b':'#ef4444';
                  const conducted=parseFloat(a.hoursConducted)||0;
                  const absent=parseFloat(a.hoursAbsent)||0;
                  const attended=conducted-absent;
                  const canMiss=Math.floor(attended-0.75*conducted);
                  return (
                    <div key={i} className="att-row">
                      <div className="att-info">
                        <div className="att-name">{a.courseTitle}</div>
                        <div className="att-meta">{a.courseCode} · {a.category} · {a.facultyName?.split('(')[0]?.trim()}</div>
                        <div className="bbar"><div className="bfill" style={{width:`${Math.min(pct,100)}%`,background:clr}}/></div>
                      </div>
                      <div className="att-right">
                        <div className="att-pct" style={{color:clr}}>{a.attendancePercentage}%</div>
                        <div className="att-hrs">{attended}/{conducted} hrs</div>
                        <div className="att-tag" style={{color:canMiss>=0?'#6ee7b7':'#fca5a5',background:canMiss>=0?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)'}}>
                          {canMiss>=0?`Miss ${canMiss} more`:`Need ${Math.abs(canMiss)} more`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {tab==='marks' && (
            <section>
              <h2 className="title">Marks</h2>
              <div className="marks-grid">
                {marks.map((m,i)=>{
                  const sc=parseFloat(m.overall?.scored)||0;
                  const tot=parseFloat(m.overall?.total)||0;
                  const pct=tot>0?(sc/tot)*100:0;
                  const clr=scoreColor(pct);
                  const tests=(m.testPerformance||[]).slice().reverse();
                  return (
                    <div key={i} className="mk-card">
                      <div className="mk-head">
                        <div>
                          <div className="mk-code">{m.courseCode}</div>
                          <div className="mk-name">{m.courseName}</div>
                          <div className="mk-type">{m.courseType}</div>
                        </div>
                        <div className="mk-score-block">
                          <div className="mk-score" style={{color:clr}}>{sc.toFixed(2)}</div>
                          <div className="mk-denom">/ {tot.toFixed(2)}</div>
                          <div className="mk-badge" style={{color:clr,background:hexA(clr,0.1),border:`1px solid ${hexA(clr,0.25)}`}}>{pct.toFixed(1)}%</div>
                        </div>
                      </div>
                      {tests.length>0
                        ? <div className="mk-chart"><GlowLineChart tests={tests}/></div>
                        : <div className="mk-empty">No test data</div>
                      }
                      <div className="mk-footer">
                        <div className="mk-bar-label">
                          <span>Total: {sc.toFixed(2)} / {tot.toFixed(2)}</span>
                          <span style={{color:clr}}>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="bbar">
                          <div className="bfill" style={{width:`${Math.min(pct,100)}%`,background:clr,boxShadow:`0 0 6px ${hexA(clr,0.5)}`}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {tab==='timetable' && (
            <section>
              <h2 className="title">Timetable</h2>
              <div style={{overflowX:'auto'}}>
                <table className="tt">
                  <thead>
                    <tr>
                      <th style={{width:46}}></th>
                      {['8:00','8:50','9:45','10:40','11:35','12:30','1:15','2:10','3:05','4:00'].map((s,i)=><th key={i}>{s}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.map((d,di)=>(
                      <tr key={di}>
                        <td className="tt-day">{DAY_NAMES[d.day-1]||d.day}</td>
                        {(d.table||[]).map((slot,si)=>(
                          <td key={si} className="tt-cell">
                            {slot&&<div className={`slot ${slot.courseType==='Practical'?'sp':'st'}`}>
                              <div className="slot-c">{slot.code}</div>
                              <div className="slot-r">{slot.roomNo}</div>
                            </div>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab==='courses' && (
            <section>
              <h2 className="title">Courses</h2>
              <div className="courses-grid">
                {courses.map((c,i)=>(
                  <div key={i} className="cc">
                    <div className="cc-top">
                      <span className="cc-code">{c.code}</span>
                      <span className={`badge ${c.slotType==='Theory'?'bt':'bp'}`}>{c.slotType||'—'}</span>
                    </div>
                    <div className="cc-title">{c.title}</div>
                    <div className="cc-meta">
                      <span>👤 {c.faculty?.split('(')[0]?.trim()||'—'}</span>
                      <span>🏫 {c.room} · {c.slot} · ⭐ {c.credit} cr</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f;color:#e2e8f0;font-family:'DM Sans',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <style jsx>{`
        .app{display:flex;min-height:100vh}
        .sidebar{width:220px;min-height:100vh;background:rgba(255,255,255,0.025);border-right:1px solid rgba(255,255,255,0.06);padding:22px 14px;display:flex;flex-direction:column;gap:16px;position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0}
        .brand{font-family:'Space Mono',monospace;font-size:15px;color:#fff}
        .brand strong{color:#6366f1}
        .user-box{display:flex;gap:10px;align-items:flex-start;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.12);border-radius:10px;padding:12px}
        .avatar{width:34px;height:34px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
        .uname{font-size:12px;font-weight:500;color:#fff;line-height:1.3}
        .ureg{font-size:10px;color:rgba(255,255,255,0.35);font-family:'Space Mono',monospace;margin-top:2px}
        .udept{font-size:10px;color:rgba(255,255,255,0.28);margin-top:3px;line-height:1.4}
        .stats-mini{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
        .sm{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:7px;text-align:center}
        .smv{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:#fff}
        .sml{font-size:9px;color:rgba(255,255,255,0.28);margin-top:2px;text-transform:uppercase;letter-spacing:0.5px}
        nav{display:flex;flex-direction:column;gap:2px;flex:1}
        .nb{background:none;border:none;color:rgba(255,255,255,0.38);text-align:left;padding:9px 10px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:8px;transition:all 0.15s;width:100%}
        .nb:hover{background:rgba(255,255,255,0.05);color:#e2e8f0}
        .nba{background:rgba(99,102,241,0.15);color:#a5b4fc}
        .logout{background:none;border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.28);padding:9px;border-radius:8px;cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;transition:all 0.15s}
        .logout:hover{border-color:rgba(239,68,68,0.35);color:#fca5a5}
        .main{flex:1;padding:36px 40px;min-width:0}
        .title{font-family:'Space Mono',monospace;font-size:18px;color:#fff;margin-bottom:22px;letter-spacing:-0.3px}
        .sum-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
        .sc{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:11px;padding:16px}
        .scv{font-family:'Space Mono',monospace;font-size:24px;font-weight:700}
        .scl{font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.6px;margin-top:4px}
        .att-list{display:flex;flex-direction:column;gap:7px}
        .att-row{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.055);border-radius:11px;padding:14px 16px;display:flex;gap:14px;align-items:center;transition:border-color 0.15s}
        .att-row:hover{border-color:rgba(255,255,255,0.12)}
        .att-info{flex:1;min-width:0}
        .att-name{font-size:13px;font-weight:500;color:#f1f5f9;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .att-meta{font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:8px}
        .bbar{height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden}
        .bfill{height:100%;border-radius:2px;transition:width 1.2s ease}
        .att-right{text-align:right;flex-shrink:0}
        .att-pct{font-family:'Space Mono',monospace;font-size:20px;font-weight:700}
        .att-hrs{font-size:11px;color:rgba(255,255,255,0.3);margin:2px 0 6px}
        .att-tag{font-size:10px;padding:3px 8px;border-radius:5px;display:inline-block;font-weight:500}
        .marks-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
        .mk-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:12px;transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s}
        .mk-card:hover{transform:translateY(-3px);border-color:rgba(99,102,241,0.35);box-shadow:0 8px 30px rgba(0,0,0,0.3)}
        .mk-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
        .mk-code{font-family:'Space Mono',monospace;font-size:10px;color:#818cf8;margin-bottom:4px}
        .mk-name{font-size:13px;font-weight:500;color:#f1f5f9;line-height:1.35}
        .mk-type{font-size:10px;color:rgba(255,255,255,0.28);margin-top:3px;text-transform:uppercase;letter-spacing:0.5px}
        .mk-score-block{text-align:right;flex-shrink:0}
        .mk-score{font-family:'Space Mono',monospace;font-size:26px;font-weight:700;line-height:1}
        .mk-denom{font-size:11px;color:rgba(255,255,255,0.28);margin-top:1px}
        .mk-badge{font-size:11px;font-weight:600;padding:3px 8px;border-radius:5px;margin-top:5px;display:inline-block}
        .mk-chart{background:rgba(0,0,0,0.22);border-radius:10px;padding:6px 4px 2px}
        .mk-empty{font-size:12px;color:rgba(255,255,255,0.2);text-align:center;padding:22px 0}
        .mk-footer{padding-top:2px}
        .mk-bar-label{display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:5px;font-family:'Space Mono',monospace}
        .tt{border-collapse:collapse;min-width:860px;width:100%}
        .tt th{padding:8px 10px;font-size:10px;color:rgba(255,255,255,0.28);border:1px solid rgba(255,255,255,0.05);text-align:center;background:rgba(255,255,255,0.02)}
        .tt td{border:1px solid rgba(255,255,255,0.04);padding:4px;height:54px;vertical-align:top}
        .tt-day{font-size:11px;color:rgba(255,255,255,0.45);white-space:nowrap;padding:8px 12px !important;font-weight:500;text-align:center}
        .tt-cell{min-width:70px}
        .slot{border-radius:6px;padding:5px 7px;height:100%}
        .st{background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.18)}
        .sp{background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15)}
        .slot-c{font-size:10px;font-family:'Space Mono',monospace;color:#a5b4fc}
        .slot-r{font-size:9px;color:rgba(255,255,255,0.28);margin-top:2px}
        .courses-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
        .cc{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.065);border-radius:12px;padding:16px;transition:transform 0.2s,border-color 0.2s}
        .cc:hover{transform:translateY(-2px);border-color:rgba(99,102,241,0.25)}
        .cc-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
        .cc-code{font-family:'Space Mono',monospace;font-size:11px;color:#818cf8}
        .cc-title{font-size:13px;font-weight:500;color:#f1f5f9;line-height:1.4;margin-bottom:10px}
        .cc-meta{display:flex;flex-direction:column;gap:4px;font-size:11px;color:rgba(255,255,255,0.35)}
        .badge{font-size:10px;padding:3px 8px;border-radius:5px;font-weight:500}
        .bt{background:rgba(99,102,241,0.12);color:#a5b4fc}
        .bp{background:rgba(16,185,129,0.1);color:#6ee7b7}
      `}</style>
    </>
  );
}
