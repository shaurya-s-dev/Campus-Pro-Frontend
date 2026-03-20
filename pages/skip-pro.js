import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import { DataStore, requireAuth, sanitizeObject } from '@/lib/security';
import AuroraBackground from '@/components/AuroraBackground';

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

export default function SkipPro() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!requireAuth(router)) return;
    const raw = DataStore.get();
    if (!raw) { router.replace('/'); return; }
    setData(sanitizeObject(raw));

    // Warning popup check
    if (!sessionStorage.getItem('skip-pro-warned')) {
      setShowPopup(true);
    }
  }, [router]);

  const handleDismissPopup = () => {
    sessionStorage.setItem('skip-pro-warned', 'true');
    setShowPopup(false);
  };

  const attendance = data?.attendance?.attendance || [];
  const timetable  = data?.timetable || {};
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
      
      // Calculate can skip while staying >= 75%
      const canSkip = Math.floor((attended - 0.75 * conducted) / 0.75);
      
      // Calculate remaining classes
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
        attended,
        conducted,
        currentPct,
        canSkip,
        remainingClasses,
        projectedPct,
        status
      };
    });
  }, [attendance, schedule]);

  const summary = useMemo(() => {
    const safe = processedData.filter(d => d.status === 'safe').length;
    const caution = processedData.filter(d => d.status === 'caution').length;
    const risk = processedData.filter(d => d.status === 'risk').length;
    return { safe, caution, risk };
  }, [processedData]);

  if (!data) return <div className="loading" />;

  return (
    <>
      <Head><title>Attendance Planner — CampusPro</title></Head>

      <AuroraBackground />

      <div className="page-root" style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar activeTab="skippro" user={data.user} />
        
        <main className="main-content">
          <header className="header animate-up">
            <div className="header-left">
              <h1 className="title">Attendance Planner</h1>
              <p className="subtitle">Comprehensive attendance optimization and projection</p>
            </div>
            
            <div className="summary-strip">
              <div className="sum-item">
                <span className="sum-val" style={{ color: 'var(--emerald)' }}>{summary.safe}</span>
                <span className="sum-lbl">Safe</span>
              </div>
              <div className="sum-item">
                <span className="sum-val" style={{ color: 'var(--amber)' }}>{summary.caution}</span>
                <span className="sum-lbl">Caution</span>
              </div>
              <div className="sum-item">
                <span className="sum-val" style={{ color: 'var(--rose)' }}>{summary.risk}</span>
                <span className="sum-lbl">At Risk</span>
              </div>
            </div>
          </header>

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

                  <div className="data-row">
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
                      <div className="data-lbl">Classes Left</div>
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
                      <span className="footer-msg risk">You must attend <strong>{Math.abs(d.canSkip)}</strong> more classes to reach 75%.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
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
                <li>Remaining academic calendar days until April 30</li>
                <li>Assumed regular class schedule from your timetable</li>
              </ul>
              <p className="popup-warning">This does <strong>NOT</strong> account for:</p>
              <ul>
                <li>Classes cancelled by faculty</li>
                <li>Extra classes scheduled</li>
                <li>Holidays added or removed</li>
                <li>Exam schedule changes</li>
              </ul>
              <p>Use this as a rough guide only. Your actual attendance may vary.</p>
            </div>
            <div className="popup-actions">
              <button className="btn-understand" onClick={handleDismissPopup}>I Understand, Show Me</button>
              <button className="btn-back" onClick={() => router.back()}>Go Back</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-root { display: flex; min-height: 100vh; background: var(--bg); }
        .main-content { flex: 1; padding: 40px 60px; max-width: 1400px; margin: 0 auto; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .title { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text-1); letter-spacing: -1px; }
        .title-tag { font-size: 14px; color: var(--accent-light); text-transform: uppercase; letter-spacing: 2px; margin-left: 8px; font-weight: 500; }
        .subtitle { font-size: 14px; color: var(--text-3); margin-top: 4px; }

        .summary-strip { display: flex; gap: 12px; }
        .sum-item { background: var(--glass-bg); padding: 12px 24px; border-radius: 12px; border: 1px solid var(--border); text-align: center; min-width: 100px; }
        .sum-val { font-family: var(--font-mono); font-size: 24px; font-weight: 700; display: block; }
        .sum-lbl { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; }

        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
        .skip-card { border-radius: 20px; overflow: hidden; position: relative; display: flex; }
        .card-accent { width: 4px; flex-shrink: 0; }
        .card-accent.safe { background: var(--emerald); }
        .card-accent.caution { background: var(--amber); }
        .card-accent.risk { background: var(--rose); }

        .card-body { flex: 1; padding: 20px 24px; }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .course-name { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text-1); line-height: 1.4; margin-bottom: 4px; }
        .course-code { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); }
        
        .skip-badge { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; }
        .skip-badge.safe { background: var(--emerald-dim); color: var(--emerald); border: 1px solid var(--emerald-border); }
        .skip-badge.caution { background: var(--amber-dim); color: var(--amber); border: 1px solid var(--amber-border); }
        .skip-badge.risk { background: var(--rose-dim); color: var(--rose); border: 1px solid var(--rose-border); }

        .data-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; }
        .data-item { text-align: center; flex: 1; }
        .data-val { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--text-1); }
        .data-lbl { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
        .data-sep { width: 1px; height: 24px; background: var(--border); }

        .progress-wrap { position: relative; padding-bottom: 20px; margin-bottom: 12px; }
        .progress-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; }
        .progress-marker { position: absolute; top: -4px; height: 14px; width: 2px; background: var(--rose); }
        .marker-label { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); font-size: 9px; color: var(--rose); font-weight: 700; }

        .card-footer { font-size: 13px; color: var(--text-2); padding-top: 12px; border-top: 1px solid var(--border); }
        .footer-msg strong { color: var(--text-1); }
        .footer-msg.risk strong { color: var(--rose); }

        /* Popup */
        .popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .popup-content { max-width: 500px; width: 100%; border-radius: 24px; padding: 32px; border: 1px solid var(--accent-border); box-shadow: 0 32px 64px rgba(0,0,0,0.5); }
        .popup-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .popup-emoji { font-size: 32px; }
        .popup-title { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--text-1); }
        .popup-body { font-size: 14.5px; color: var(--text-2); line-height: 1.6; }
        .popup-body ul { margin: 12px 0 20px 20px; }
        .popup-body li { margin-bottom: 6px; }
        .popup-warning { color: var(--rose); font-weight: 700; margin-top: 20px; }
        .popup-actions { display: flex; gap: 12px; margin-top: 32px; }
        .btn-understand { flex: 1; background: var(--accent); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
        .btn-back { background: rgba(255,255,255,0.05); color: var(--text-3); border: 1px solid var(--border); padding: 14px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; }
        .btn-understand:hover { transform: translateY(-2px); filter: brightness(1.1); }

        @media (max-width: 860px) {
          .main-content { padding: 80px 20px 40px; }
          .header { flex-direction: column; gap: 24px; }
          .cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
