import { useState, useEffect, useMemo } from 'react';
import { DataStore, sanitizeObject } from '@/lib/security';

/* ── Academic Calendar Data ─────────────────────────── */
const ACADEMIC_CALENDAR = {
  // January 2026
  '2026-01-02': 1, '2026-01-03': 2, '2026-01-05': 3, '2026-01-06': 4, '2026-01-07': 5,
  '2026-01-08': 1, '2026-01-09': 2, '2026-01-10': 3, '2026-01-12': 4, '2026-01-13': 5,
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

export default function AttendancePlanner({ attendance: propAttendance, courses: propCourses }) {
  const [data, setData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!propAttendance) {
      const raw = DataStore.get();
      if (raw) setData(sanitizeObject(raw));
    }

    if (!sessionStorage.getItem('ap-warned')) {
      setShowPopup(true);
    }
  }, [propAttendance]);

  const handleDismissPopup = () => {
    sessionStorage.setItem('ap-warned', 'true');
    setShowPopup(false);
  };

  const attendance = propAttendance || data?.attendance?.attendance || [];
  const courses    = propCourses || data?.courses?.courses || [];
  
  // Find timetable from data store for day order mapping
  const timetable  = data?.timetable || DataStore.get()?.timetable || {};
  const schedule   = timetable?.schedule || [];

  const processedData = useMemo(() => {
    if (!attendance.length) return [];

    const today = new Date();
    const semesterEnd = new Date('2026-04-30');

    return attendance.map(a => {
      const conducted = parseFloat(a.hoursConducted) || 0;
      const absent    = parseFloat(a.hoursAbsent) || 0;
      const attended  = conducted - absent;
      const currentPct = conducted > 0 ? (attended / conducted) * 100 : 0;
      const canSkip = Math.floor((attended - 0.75 * conducted) / 0.75);
      
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
        attended, conducted, currentPct, canSkip, remainingClasses, projectedPct, status
      };
    });
  }, [attendance, schedule]);

  const summary = useMemo(() => {
    const safe = processedData.filter(d => d.status === 'safe').length;
    const caution = processedData.filter(d => d.status === 'caution').length;
    const risk = processedData.filter(d => d.status === 'risk').length;
    return { safe, caution, risk };
  }, [processedData]);

  if (!data) return null;

  return (
    <div className="skippro-container">
      <header className="page-hd animate-up">
        <div className="header-left">
          <h1 className="page-title">Attendance Planner</h1>
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

      <div className="ap-header glass animate-up">
        <div className="ap-header-icon">📊</div>
        <div className="ap-header-content">
          <h2 className="ap-title">Attendance Planner</h2>
          <p className="ap-description">
            See exactly how many classes you can afford to miss — or how many you need 
            to attend — to stay above the 75% minimum requirement. Calculated based on 
            your current attendance and remaining academic calendar days till end of semester.
          </p>
          <div className="ap-disclaimer">
            ⚠️ These are estimates based on the academic calendar. Actual classes may 
            vary due to cancellations, extra classes, or schedule changes.
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
                  {d.canSkip > 0 ? `Skip ${d.canSkip}` : d.canSkip === 0 ? 'No Margin' : `Need ${Math.abs(d.canSkip)}`}
                </div>
              </div>

              <div className="data-row-box">
                <div className="data-item">
                  <div className="data-val">{d.currentPct.toFixed(1)}%</div>
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
                    width: `${Math.min(d.currentPct, 100)}%`, 
                    background: d.status === 'safe' ? 'var(--emerald)' : d.status === 'caution' ? 'var(--amber)' : 'var(--rose)' 
                  }} />
                </div>
                <div className="progress-marker" style={{ left: '75%' }}>
                  <span className="marker-label">75%</span>
                </div>
              </div>
              
              <div className="card-footer">
                {d.canSkip > 0 ? (
                  <span className="footer-msg">You can safely skip <strong>{d.canSkip}</strong> more classes.</span>
                ) : (
                  <span className="footer-msg risk">You must attend <strong>{Math.abs(d.canSkip)}</strong> more to reach 75%.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content glass">
            <div className="popup-header">
              <span className="popup-emoji">⚠️</span>
              <h2 className="popup-title">Heads Up — This is an Estimate</h2>
            </div>
            <div className="popup-body">
              <p>Attendance Planner calculates based on:</p>
              <ul>
                <li>Your current attendance data from Academia</li>
                <li>Academic calendar days until April 30</li>
                <li>Your regular class timetable</li>
              </ul>
              <p className="popup-warning">This does NOT account for cancelled or extra classes.</p>
            </div>
            <div className="popup-actions">
              <button className="btn-understand" onClick={handleDismissPopup}>I Understand</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .skippro-container { width: 100%; position: relative; z-index: 1; }
        .page-hd { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-title { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-1); letter-spacing: -0.5px; }
        .page-sub { font-size: 13px; color: var(--text-3); margin-top: 2px; }

        /* ── Attendance Planner Header ───────── */
        .ap-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 24px;
          border-radius: var(--radius-xl);
          margin-bottom: 24px;
          border: 1px solid var(--border);
        }
        .ap-header-icon {
          font-size: 32px;
          padding: 12px;
          background: var(--bg-elevated);
          border-radius: 16px;
          border: 1px solid var(--border);
          line-height: 1;
        }
        .ap-header-content { flex: 1; }
        .ap-title { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--text-1); margin-bottom: 6px; }
        .ap-description { font-size: 14px; color: var(--text-2); line-height: 1.6; margin-bottom: 14px; }
        .ap-disclaimer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--amber-dim);
          border: 1px solid var(--amber-border);
          border-radius: 8px;
          font-size: 11px;
          color: var(--amber-light);
          font-weight: 500;
          line-height: 1.4;
        }

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

        .progress-wrap { position: relative; padding-bottom: 16px; margin-bottom: 10px; }
        .progress-track { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 2px; }
        .progress-marker { position: absolute; top: -3px; height: 10px; width: 1.5px; background: var(--rose); }
        .marker-label { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); font-size: 8px; color: var(--rose); font-weight: 700; }

        .card-footer { font-size: 12px; color: var(--text-2); padding-top: 10px; border-top: 1px solid var(--border); }
        .footer-msg strong { color: var(--text-1); }
        .footer-msg.risk strong { color: var(--rose); }

        .popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .popup-content { max-width: 420px; width: 100%; border-radius: 20px; padding: 24px; border: 1px solid var(--accent-border); }
        .popup-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .popup-emoji { font-size: 24px; }
        .popup-title { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--text-1); }
        .popup-body { font-size: 13.5px; color: var(--text-2); line-height: 1.5; }
        .popup-body ul { margin: 10px 0 10px 18px; }
        .popup-warning { color: var(--rose); font-weight: 700; margin-top: 14px; }
        .popup-actions { margin-top: 24px; }
        .btn-understand { width: 100%; background: var(--accent); color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; }

        @media (max-width: 600px) {
          .page-hd { flex-direction: column; gap: 16px; }
          .cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
