import { useState, useEffect, useMemo } from 'react';
import { DataStore, sanitizeObject } from '@/lib/security';

/* ── Academic Calendar Data ─────────────────────────── */
const ACADEMIC_CALENDAR = {
  // January 2026
  '2026-01-02': 1, '2026-01-03': 2, '2026-01-05': 3, '2026-01-06': 4, '2026-01-07': 5,
  '2026-01-08': 1, '2026-01-09': 2, '2026-01-03': 3, '2026-01-12': 4, '2026-01-13': 5,
  '2026-01-14': null, '2026-01-15': null, '2026-01-16': null,
  '2026-01-17': 1, '2026-01-19': 2, '2026-01-20': 3, '2026-01-21': 4, '2026-01-22': 5,
  '2026-01-23': 1, '2026-01-24': 2, '2026-01-26': null,
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
  '2026-03-13': 2, '2026-03-16': 3, '2026-03-17': 4, '2026-03-18': null, '2026-03-19': null,
  '2026-03-20': 2, '2026-03-21': 3, '2026-03-23': 4, '2026-03-24': 5,
  '2026-03-25': 1, '2026-03-26': 2, '2026-03-27': 3, '2026-03-28': 4, '2026-03-30': 5, '2026-03-31': 1,
  // April 2026
  '2026-04-01': null, '2026-04-02': 2, '2026-04-03': null, '2026-04-04': 3, '2026-04-06': 4, '2026-04-07': 5,
  '2026-04-08': 1, '2026-04-09': 2, '2026-04-10': 3, '2026-04-13': 4, '2026-04-14': null,
  '2026-04-15': 5, '2026-04-16': 1, '2026-04-17': 2, '2026-04-20': 3, '2026-04-21': 4,
  '2026-04-22': 5, '2026-04-23': 1, '2026-04-24': 2, '2026-04-27': 3, '2026-04-28': 4,
  '2026-04-29': 5, '2026-04-30': 1,
};

export default function AttendancePlanner({ attendance: propAttendance = [], courses: propCourses = [] }) {
  const [warned, setWarned] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ap_warning_ok') === 'true'
  );

  const [data, setData] = useState(null);

  useEffect(() => {
    if (!propAttendance || propAttendance.length === 0) {
      const raw = DataStore.get();
      if (raw) setData(sanitizeObject(raw));
    }
  }, [propAttendance]);

  const attendance = propAttendance?.length > 0 ? propAttendance : data?.attendance?.attendance || [];
  
  // Find timetable from data store for day order mapping
  const timetable  = data?.timetable || DataStore.get()?.timetable || {};
  const schedule   = timetable?.schedule || [];

  const processedData = useMemo(() => {
    if (!attendance || attendance.length === 0) return [];

    const today = new Date();
    const semesterEnd = new Date('2026-04-30');

    return attendance.map(a => {
      const conducted = parseFloat(a.hoursConducted) || 0;
      const absent    = parseFloat(a.hoursAbsent) || 0;
      const attended  = conducted - absent;
      const percentage = conducted > 0 ? (attended / conducted) * 100 : 0;
      const currentPct = parseFloat(percentage.toFixed(2));
      
      const canSkip = conducted > 0 
        ? Math.floor((attended - 0.75 * conducted) / 0.75) 
        : 0;
      
      const classesNeeded = currentPct < 75 && conducted > 0
        ? Math.ceil((0.75 * conducted - attended) / 0.25)
        : 0;

      let remainingClasses = 0;
      const dayOrdersForCourse = [];
      schedule.forEach(s => {
        const count = s.table?.filter(p => p && p.code === a.courseCode).length || 0;
        if (count > 0) dayOrdersForCourse.push({ day: s.day, count });
      });

      for (let d = new Date(today); d <= semesterEnd; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        const dayOrder = ACADEMIC_CALENDAR[key];
        if (dayOrder) {
          const match = dayOrdersForCourse.find(doc => doc.day === dayOrder);
          if (match) remainingClasses += match.count;
        }
      }

      const totalPossibleHours = conducted + remainingClasses;
      const projectedPct = totalPossibleHours > 0 ? (attended / totalPossibleHours) * 100 : 0;

      let status = 'safe';
      if (canSkip <= 0) status = 'risk';
      else if (canSkip <= 3) status = 'caution';

      return {
        ...a,
        attended, conducted, currentPct, canSkip, classesNeeded, remainingClasses, projectedPct, status
      };
    });
  }, [attendance, schedule]);

  const summary = useMemo(() => {
    const safe = processedData.filter(d => d.status === 'safe').length;
    const caution = processedData.filter(d => d.status === 'caution').length;
    const risk = processedData.filter(d => d.status === 'risk').length;
    return { safe, caution, risk };
  }, [processedData]);

  // If no data, show empty state
  if (!attendance || attendance.length === 0) {
    return (
      <div className="ap-empty glass">
        <div style={{fontSize:48, marginBottom:20}}>📭</div>
        <p style={{fontSize:16, color:'var(--text-1)', fontWeight:600}}>No attendance data available.</p>
        <p style={{fontSize:14, color:'var(--text-3)', marginTop:8}}>Please check your connection or refresh the dashboard.</p>
        <style jsx>{`
          .ap-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; border-radius: 20px; text-align: center; }
        `}</style>
      </div>
    );
  }

  // Show warning first
  if (!warned) {
    return (
      <div className="ap-overlay">
        <div className="ap-warning-modal glass">
          <div style={{fontSize:32,textAlign:'center',marginBottom:12}}>⚠️</div>
          <h3 style={{color:'var(--amber)',textAlign:'center',marginBottom:12,fontFamily:'var(--font-display)'}}>Before You Use Attendance Planner</h3>
          <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.7,marginBottom:24,textAlign:'center'}}>
            This is an <strong>estimate</strong> only. Does not account for cancelled classes, 
            extra classes, or holiday changes. Use as a rough guide.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button className="btn btn-primary" onClick={() => {
              sessionStorage.setItem('ap_warning_ok','true');
              setWarned(true);
            }}>I Understand, Show Me →</button>
            <button className="btn btn-ghost" onClick={() => window.history.back()}>Go Back</button>
          </div>
        </div>
        <style jsx>{`
          .ap-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
          .ap-warning-modal { max-width: 440px; width: 100%; border-radius: 24px; padding: 32px; border: 1px solid var(--amber-border); }
          .btn { padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; border: none; }
          .btn-primary { background: var(--accent); color: white; }
          .btn-primary:hover { background: var(--accent-light); transform: translateY(-2px); }
          .btn-ghost { background: transparent; color: var(--text-3); }
          .btn-ghost:hover { color: var(--text-1); background: var(--bg-hover); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="skippro-container animate-in">
      <header className="page-hd">
        <div className="header-left">
          <div className="page-title-bar">
            <h1 className="page-title">Attendance Planner</h1>
          </div>
          <p className="page-sub">Comprehensive attendance optimization and projection</p>
        </div>
        
        <div className="summary-strip">
          <div className="sum-item glass">
            <span className="sum-val" style={{ color: 'var(--emerald)' }}>{summary.safe}</span>
            <span className="sum-lbl">Safe</span>
          </div>
          <div className="sum-item glass">
            <span className="sum-val" style={{ color: 'var(--amber)' }}>{summary.caution}</span>
            <span className="sum-lbl">Caution</span>
          </div>
          <div className="sum-item glass">
            <span className="sum-val" style={{ color: 'var(--rose)' }}>{summary.risk}</span>
            <span className="sum-lbl">At Risk</span>
          </div>
        </div>
      </header>

      <div className="ap-header glass">
        <div className="ap-header-icon">📊</div>
        <div className="ap-header-content">
          <h2 className="ap-title">Optimization Strategy</h2>
          <p className="ap-description">
            See exactly how many classes you can afford to miss — or how many you need 
            to attend — to stay above the 75% minimum requirement. Calculations incorporate 
            your current attendance and remaining academic calendar days.
          </p>
          <div className="ap-disclaimer">
            ⚠️ Disclaimer: These are estimates based on the official academic calendar. 
            Real-world schedules shift due to cancellations or extra sessions.
          </div>
        </div>
      </div>

      <div className="cards-grid">
        {processedData.map((d, i) => (
          <div key={d.courseCode || i} className={`skip-card glass animate-up`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`card-accent ${d.status}`} />
            <div className="card-body">
              <div className="card-top">
                <div className="course-info">
                  <div className="course-name">{d.courseTitle}</div>
                  <div className="course-code">{d.courseCode}</div>
                </div>
                <div className={`skip-badge ${d.status}`}>
                  {d.canSkip > 0 ? `Skip ${d.canSkip}` : d.canSkip === 0 ? 'No Margin' : `Need ${d.classesNeeded}`}
                </div>
              </div>

              <div className="data-row-box">
                <div className="data-item">
                  <div className="data-val">{d.currentPct}%</div>
                  <div className="data-lbl">Current</div>
                </div>
                <div className="data-sep" />
                <div className="data-item">
                  <div className="data-val">{d.projectedPct.toFixed(1)}%</div>
                  <div className="data-lbl">Projected</div>
                </div>
                <div className="data-sep" />
                <div className="data-item">
                  <div className="data-val">{d.remainingClasses}</div>
                  <div className="data-lbl">Left</div>
                </div>
              </div>

              <div className="progress-wrap">
                <div className="progress-track">
                  <div className="progress-fill" style={{ 
                    width: `${d.currentPct}%`, 
                    background: d.status === 'safe' ? 'var(--emerald)' : d.status === 'caution' ? 'var(--amber)' : 'var(--rose)' 
                  }} />
                </div>
                <div className="progress-marker" style={{ left: '75%' }}>
                  <span className="marker-label">75%</span>
                </div>
                <div className="progress-marker marker-85" style={{ left: '85%' }}>
                  <span className="marker-label label-85">85%</span>
                </div>
              </div>
              
              <div className="card-footer">
                {d.canSkip > 0 ? (
                  <span className="footer-msg">You can safely skip <strong>{d.canSkip}</strong> more classes.</span>
                ) : (
                  <span className="footer-msg risk">You must attend <strong>{d.classesNeeded}</strong> more to reach 75%.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .skippro-container { width: 100%; position: relative; z-index: 1; }
        .page-hd { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-title { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-1); letter-spacing: -0.5px; }
        .page-sub { font-size: 13px; color: var(--text-3); margin-top: 2px; }

        .page-title-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .page-title-bar::before { content: ''; width: 4px; height: 32px; background: linear-gradient(180deg, var(--accent), transparent); border-radius: 2px; flex-shrink: 0; }

        .ap-header { display: flex; align-items: flex-start; gap: 20px; padding: 24px; border-radius: var(--radius-xl); margin-bottom: 24px; border: 1px solid var(--border); }
        .ap-header-icon { font-size: 32px; padding: 12px; background: var(--bg-elevated); border-radius: 16px; border: 1px solid var(--border); line-height: 1; }
        .ap-header-content { flex: 1; }
        .ap-title { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--text-1); margin-bottom: 6px; }
        .ap-description { font-size: 14px; color: var(--text-2); line-height: 1.6; margin-bottom: 14px; }
        .ap-disclaimer { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--amber-dim); border: 1px solid var(--amber-border); border-radius: 8px; font-size: 11px; color: var(--amber-light); font-weight: 500; line-height: 1.4; }

        .summary-strip { display: flex; gap: 10px; }
        .sum-item { padding: 10px 20px; border-radius: 12px; text-align: center; min-width: 90px; }
        .sum-val { font-family: var(--font-mono); font-size: 20px; font-weight: 700; display: block; }
        .sum-lbl { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }

        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
        .skip-card { border-radius: 16px; overflow: hidden; position: relative; display: flex; }
        .card-accent { width: 3px; flex-shrink: 0; }
        .card-accent.safe { background: var(--emerald); }
        .card-accent.caution { background: var(--amber); }
        .card-accent.risk { background: var(--rose); }

        .card-body { flex: 1; padding: 18px 20px; }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .course-name { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--text-1); line-height: 1.4; margin-bottom: 2px; }
        .course-code { font-family: var(--font-mono); font-size: 10px; color: var(--text-3); }
        
        .skip-badge { padding: 4px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; }
        .skip-badge.safe { background: var(--emerald-dim); color: var(--emerald); border: 1px solid var(--emerald-border); }
        .skip-badge.caution { background: var(--amber-dim); color: var(--amber); border: 1px solid var(--amber-border); }
        .skip-badge.risk { background: var(--rose-dim); color: var(--rose); border: 1px solid var(--rose-border); }

        .data-row-box { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 10px; }
        .data-item { text-align: center; flex: 1; }
        .data-val { font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--text-1); }
        .data-lbl { font-size: 8px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }
        .data-sep { width: 1px; height: 20px; background: var(--border); }

        .progress-wrap { position: relative; padding-bottom: 22px; margin-bottom: 10px; }
        .progress-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width 1s ease-out; }
        .progress-marker { position: absolute; top: -2px; height: 10px; width: 2px; background: var(--rose); transform: translateX(-50%); }
        .marker-85 { background: var(--emerald); }
        .marker-label { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); font-size: 9px; color: var(--rose); font-weight: 800; }
        .label-85 { color: var(--emerald); }

        .card-footer { font-size: 12px; color: var(--text-2); padding-top: 10px; border-top: 1px solid var(--border); }
        .footer-msg strong { color: var(--text-1); }
        .footer-msg.risk strong { color: var(--rose); }

        @media (max-width: 600px) {
          .page-hd { flex-direction: column; gap: 16px; }
          .cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
