import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { DataStore, TokenStore, requireAuth, logout } from '@/lib/security';
import dynamic from 'next/dynamic';
const AuroraBackground = dynamic(() => import('@/components/AuroraBackground'), { ssr: false });

/* ── Icon helper ─────────────────────────────────── */
const Ico = ({ d, size = 16, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  back:    'M19 12H5m0 0l7 7m-7-7l7-7',
  user:    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mail:    'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm18 2l-10 7L2 6',
  phone:   'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  hash:    'M4 9h16M4 15h16M10 3L8 21M16 3l-2 18',
  book:    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  sun:     'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  moon:    'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  logout:  'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  shield:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  award:   'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  calendar:'M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z',
  info:    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M12 12v4',
};

/* ── Stat card ───────────────────────────────────── */
function StatCard({ label, value, color, sub }) {
  return (
    <div className="stat-card glass animate-up">
      <div className="stat-val" style={{ color }}>{value}</div>
      <div className="stat-lbl">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <style jsx>{`
        .stat-card { border-radius: var(--radius-lg); padding: 18px; text-align: center; transition: transform .2s; }
        .stat-card:hover { transform: translateY(-3px); }
        .stat-val { font-family: var(--font-mono); font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .stat-lbl { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: .6px; }
        .stat-sub { font-size: 11px; color: var(--text-4); margin-top: 3px; }
      `}</style>
    </div>
  );
}

/* ── Info row ────────────────────────────────────── */
function InfoRow({ icon, label, value }) {
  return (
    <div className="info-row">
      <div className="info-icon"><Ico d={icon} /></div>
      <div className="info-content">
        <div className="info-label">{label}</div>
        <div className="info-value">{value || '—'}</div>
      </div>
      <style jsx>{`
        .info-row { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .info-row:last-child { border-bottom: none; }
        .info-icon { width: 34px; height: 34px; border-radius: 9px; background: var(--accent-dim); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; color: var(--accent-light); flex-shrink: 0; }
        .info-content { flex: 1; min-width: 0; }
        .info-label { font-size: 10.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: .6px; font-weight: 600; }
        .info-value { font-size: 13.5px; color: var(--text-1); font-weight: 500; margin-top: 2px; }
      `}</style>
    </div>
  );
}

/* ── Theme Toggle Row ────────────────────────────── */
function ThemeRow({ theme, toggle }) {
  return (
    <div className="pref-row">
      <div className="pref-left">
        <div className="pref-icon">
          <Ico d={theme === 'dark' ? ICONS.moon : ICONS.sun} />
        </div>
        <div>
          <div className="pref-title">Appearance</div>
          <div className="pref-sub">{theme === 'dark' ? 'Dark mode — premium feel' : 'Light mode — clean & minimal'}</div>
        </div>
      </div>
      <button className="pref-toggle" onClick={toggle} aria-label="Toggle theme">
        <div className={`toggle-track ${theme === 'light' ? 'track-on' : ''}`}>
          <div className="toggle-thumb" />
        </div>
      </button>
      <style jsx>{`
        .pref-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border); }
        .pref-row:last-child { border-bottom: none; }
        .pref-left { display: flex; align-items: center; gap: 12px; }
        .pref-icon { width: 34px; height: 34px; border-radius: 9px; background: var(--amber-dim); border: 1px solid rgba(245,158,11,.2); display: flex; align-items: center; justify-content: center; color: var(--amber); flex-shrink: 0; }
        .pref-title { font-size: 13px; font-weight: 600; color: var(--text-1); }
        .pref-sub { font-size: 11.5px; color: var(--text-3); margin-top: 1px; }
        .pref-toggle { background: none; border: none; cursor: pointer; padding: 4px; }
        .toggle-track { width: 38px; height: 22px; border-radius: 11px; background: var(--border-strong); position: relative; transition: background .25s; }
        .track-on { background: var(--accent); box-shadow: 0 0 8px var(--accent-glow); }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: white; box-shadow: 0 1px 4px rgba(0,0,0,.25); transition: transform .22s cubic-bezier(.34,1.56,.64,1); }
        .track-on .toggle-thumb { transform: translateX(16px); }
      `}</style>
    </div>
  );
}

/* ── Security badge ──────────────────────────────── */
function SecurityBadge() {
  return (
    <div className="sec-badge animate-up delay-4">
      <div className="sec-icon"><Ico d={ICONS.shield} size={15} /></div>
      <div className="sec-text">
        <strong>Your data is safe.</strong> Credentials are never stored.
        Session data is tab-scoped and clears when you close the browser.
      </div>
      <style jsx>{`
        .sec-badge { display: flex; align-items: flex-start; gap: 10px; background: var(--emerald-dim); border: 1px solid var(--emerald-border); border-radius: var(--radius-md); padding: 12px 14px; }
        .sec-icon { color: var(--emerald); flex-shrink: 0; margin-top: 1px; }
        .sec-text { font-size: 12px; color: var(--text-2); line-height: 1.55; }
        .sec-text strong { color: var(--emerald); font-weight: 600; }
      `}</style>
    </div>
  );
}

/* ── Main ────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!requireAuth(router)) return;
    setData(DataStore.get());
  }, []);

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const user       = data?.user || {};
  const attendance = data?.attendance?.attendance || [];
  const marks      = data?.marks?.marks || [];

  // Derived stats
  const avgAtt = attendance.length
    ? (attendance.reduce((s, a) => s + parseFloat(a.attendancePercentage || 0), 0) / attendance.length).toFixed(1)
    : '—';
  const below75 = attendance.filter(a => parseFloat(a.attendancePercentage) < 75).length;
  const avgScore = marks.length
    ? (marks.reduce((s, m) => {
        const sc  = parseFloat(m.overall?.scored) || 0;
        const tot = parseFloat(m.overall?.total)  || 1;
        return s + (sc / tot) * 100;
      }, 0) / marks.length).toFixed(1)
    : '—';

  const attColor  = parseFloat(avgAtt) >= 75 ? 'var(--emerald)' : 'var(--rose)';
  const scoreColor = parseFloat(avgScore) >= 75 ? 'var(--emerald)' : parseFloat(avgScore) >= 60 ? 'var(--amber)' : 'var(--rose)';

  return (
    <>
      <Head><title>Profile — CampusPro</title></Head>

      <AuroraBackground />

      <div className="page" style={{ position: 'relative', zIndex: 1 }}>

        {/* Back nav */}
        <Link href="/dashboard" className="back-btn animate-up">
          <Ico d={ICONS.back} size={15} />
          Back to Dashboard
        </Link>

        <div className="profile-wrap">
          {/* ── Left column ──────────────────────── */}
          <div className="left-col">

            {/* Avatar card */}
            <div className="avatar-card glass animate-up">
              <div className="avatar-ring">
                <div className="avatar-circle">
                  {(user.name || 'S')[0].toUpperCase()}
                </div>
              </div>
              <div className="avatar-name">{user.name || 'Student'}</div>
              <div className="avatar-reg">{user.regNumber}</div>
              <div className="avatar-dept">{user.department?.replace(/\(.*\)/, '').trim()}</div>

              <div className="avatar-tags">
                <span className="tag tag-accent">Sem {user.semester}</span>
                <span className="tag tag-emerald">Year {user.year}</span>
                {user.section && <span className="tag tag-amber">Sec {user.section}</span>}
              </div>

              <div className="divider" style={{ margin: '18px 0' }} />

              {/* Logout */}
              <button className="btn btn-danger w-full" onClick={() => logout(router)}>
                <Ico d={ICONS.logout} size={15} />
                Sign Out
              </button>
            </div>

            {/* Security note */}
            <SecurityBadge />
          </div>

          {/* ── Right column ─────────────────────── */}
          <div className="right-col">

            {/* Stats row */}
            <div className="stats-row">
              <StatCard label="Avg Attendance" value={`${avgAtt}%`} color={attColor} sub={`${below75} subject(s) < 75%`} />
              <StatCard label="Avg Score"      value={`${avgScore}%`} color={scoreColor} sub={`${marks.length} subjects`} />
              <StatCard label="Subjects"        value={data?.courses?.courses?.length || '—'} color="var(--accent-light)" />
              <StatCard label="Semester"        value={user.semester || '—'} color="var(--amber)" sub={user.program?.slice(0, 16)} />
            </div>

            {/* Info card */}
            <div className="section-card glass animate-up delay-2">
              <div className="section-head">
                <div className="section-icon accent"><Ico d={ICONS.user} /></div>
                <h2 className="section-title">Personal Info</h2>
              </div>
              <div className="info-list">
                <InfoRow icon={ICONS.user}     label="Full Name"    value={user.name} />
                <InfoRow icon={ICONS.hash}     label="Register No." value={user.regNumber} />
                <InfoRow icon={ICONS.book}     label="Department"   value={user.department} />
                <InfoRow icon={ICONS.award}    label="Program"      value={user.program} />
                <InfoRow icon={ICONS.calendar} label="Semester"     value={`Semester ${user.semester} · Year ${user.year}`} />
                <InfoRow icon={ICONS.info}     label="Section"      value={user.section} />
                {user.mobile && <InfoRow icon={ICONS.phone} label="Mobile" value={user.mobile} />}
              </div>
            </div>

            {/* Preferences card */}
            <div className="section-card glass animate-up delay-3">
              <div className="section-head">
                <div className="section-icon amber"><Ico d={ICONS.sun} /></div>
                <h2 className="section-title">Preferences</h2>
              </div>
              <div className="info-list">
                <ThemeRow theme={theme} toggle={toggle} />
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx global>{`
        body { background: #05060f; }
        @keyframes floatBlob  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-28px) scale(1.06)} 66%{transform:translate(-24px,18px) scale(0.96)} }
        @keyframes floatBlob2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-35px,22px) scale(1.04)} 70%{transform:translate(28px,-15px) scale(0.98)} }
        @keyframes floatBlob3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.07)} }
        @keyframes floatBlob4 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px, -40px) scale(1.08); } }
        @keyframes gridDrift  { from{transform:translateY(0)} to{transform:translateY(48px)} }
        @keyframes gridFade   { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes slowSpin   { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        
        .dash-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
        .dash-bg::before { content:''; position:absolute; width:900px; height:900px; top:50%; left:50%; transform:translate(-50%,-50%); border-radius:50%; background:conic-gradient(from 0deg,transparent 0%,rgba(99,102,241,0.03) 25%,transparent 50%,rgba(34,211,238,0.03) 75%,transparent 100%); animation:slowSpin 40s linear infinite; pointer-events:none; }
        .dash-bg-grid { position:absolute; inset:-100px; background-image:radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px); background-size:28px 28px; animation:gridDrift 14s linear infinite, gridFade 8s ease-in-out infinite; }
        .dash-blob-1 { position:absolute; width:700px; height:700px; top:-200px; left:-180px; border-radius:50%; background:radial-gradient(circle at 40% 40%, rgba(99,102,241,0.17) 0%, rgba(99,102,241,0.06) 45%, transparent 70%); filter:blur(60px); animation:floatBlob 20s ease-in-out infinite; will-change:transform; }
        .dash-blob-2 { position:absolute; width:600px; height:600px; bottom:-150px; right:-150px; border-radius:50%; background:radial-gradient(circle at 60% 60%, rgba(34,211,238,0.13) 0%, rgba(34,211,238,0.05) 45%, transparent 70%); filter:blur(55px); animation:floatBlob2 24s ease-in-out infinite; will-change:transform; }
        .dash-blob-3 { position:absolute; width:420px; height:420px; top:38%; left:52%; border-radius:50%; background:radial-gradient(circle at 50% 50%, rgba(167,139,250,0.11) 0%, rgba(167,139,250,0.04) 50%, transparent 70%); filter:blur(50px); animation:floatBlob3 16s ease-in-out infinite 4s; will-change:transform; }
        .dash-blob-4 { position:absolute; width:300px; height:300px; top:60%; left:20%; border-radius:50%; background:radial-gradient(circle at 50% 50%, rgba(244,63,94,0.05) 0%, transparent 70%); filter:blur(50px); animation:floatBlob4 22s ease-in-out infinite 8s; will-change:transform; }
        .dash-bg-vignette { position:absolute; inset:0; background:radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(5,6,15,0.5) 100%); }
        
        @media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }

      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 32px 24px 64px;
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
        }
        /* Background orbs */
        /* blob background handled by .dash-bg */

        /* Back button */
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--text-3);
          font-size: 13px;
          padding: 7px 14px 7px 10px;
          border-radius: var(--radius-sm);
          transition: all .15s;
          margin-bottom: 28px;
          position: relative;
          z-index: 1;
        }
        .back-btn:hover { background: var(--bg-hover); color: var(--text-1); }

        /* Layout */
        .profile-wrap {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        /* Left column */
        .left-col { display: flex; flex-direction: column; gap: 14px; }

        /* Avatar card */
        .avatar-card {
          border-radius: var(--radius-xl);
          padding: 28px 22px;
          text-align: center;
        }
        .avatar-ring {
          width: 88px; height: 88px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #4f46e5);
          padding: 3px;
          margin: 0 auto 16px;
          box-shadow: 0 0 0 1px var(--accent-border), 0 8px 32px var(--accent-glow);
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .avatar-circle {
          width: 100%; height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #4f46e5);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-size: 36px; font-weight: 800;
          color: white;
        }
        .avatar-name {
          font-family: var(--font-display);
          font-size: 18px; font-weight: 700;
          color: var(--text-1); margin-bottom: 4px;
        }
        .avatar-reg {
          font-family: var(--font-mono);
          font-size: 11px; color: var(--text-3);
          letter-spacing: .5px; margin-bottom: 3px;
        }
        .avatar-dept { font-size: 12px; color: var(--text-2); margin-bottom: 16px; }
        .avatar-tags { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
        .w-full { width: 100%; justify-content: center; }

        /* Stats row */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        /* Section cards */
        .section-card {
          border-radius: var(--radius-xl);
          padding: 22px;
        }
        .section-head {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 18px;
        }
        .section-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .section-icon.accent { background: var(--accent-dim); border: 1px solid var(--accent-border); color: var(--accent-light); }
        .section-icon.amber  { background: var(--amber-dim); border: 1px solid rgba(245,158,11,.2); color: var(--amber); }
        .section-title {
          font-family: var(--font-display);
          font-size: 16px; font-weight: 700;
          color: var(--text-1);
        }
        .info-list { display: flex; flex-direction: column; }
        .right-col { display: flex; flex-direction: column; gap: 16px; }

        /* Responsive */
        @media (max-width: 900px) {
          .profile-wrap { grid-template-columns: 1fr; }
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .stats-row { grid-template-columns: 1fr 1fr; }
          .page { padding: 16px 14px 48px; }
        }
      `}</style>
    </>
  );
}