import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLimit, setSessionLimit] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setStatus('Signing in...');
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password }),
      });
      const loginData = await loginRes.json();

      if (loginData.status === 429 || loginData.session?.sessionLimit) {
        setSessionLimit(loginData.session?.redirectUrl);
        setLoading(false);
        return;
      }

      if (!loginData.authenticated || !loginData.cookies) {
        setError(loginData.message || 'Login failed. Check your credentials.');
        setStatus('');
        setLoading(false);
        return;
      }

      const token = loginData.cookies;

      setStatus('Fetching your data...');
      const dataRes = await fetch('/api/academia', {
        headers: { 'X-CSRF-Token': token },
      });
      const academiaData = await dataRes.json();

      if (academiaData.tokenInvalid || academiaData.error) {
        setError(academiaData.error || academiaData.message || 'Session expired. Please try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem('csrf_token', token);
      sessionStorage.setItem('academia_data', JSON.stringify(academiaData));
      router.push('/dashboard');

    } catch {
      setError('Cannot reach server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>CampusPro — Login</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="root">
        <div className="bg-base" />
        <div className="grid-lines" />
        <div className="scanlines" />
        <div className="orb orb-a" />
        <div className="orb orb-b" />

        <div className="page-col">

          {/* ══ ORBITAL LOGO ══ */}
          <div className="orbital-wrap">
            <div className="ring ring-outer">
              <div className="ring-ball ball-outer" />
            </div>
            <div className="ring ring-inner">
              <div className="ring-ball ball-inner" />
            </div>
            <div className="orbital-core">
              <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="8"  r="3" fill="white"/>
                <circle cx="8"  cy="28" r="3" fill="white"/>
                <circle cx="32" cy="28" r="3" fill="white"/>
                <circle cx="20" cy="20" r="4.5" fill="white" opacity="0.95"/>
                <line x1="20" y1="8"  x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.75"/>
                <line x1="8"  y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.75"/>
                <line x1="32" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.75"/>
                <line x1="8"  y1="28" x2="32" y2="28" stroke="white" strokeWidth="1.5" opacity="0.32"/>
                <line x1="20" y1="8"  x2="8"  y2="28" stroke="white" strokeWidth="1.5" opacity="0.32"/>
                <line x1="20" y1="8"  x2="32" y2="28" stroke="white" strokeWidth="1.5" opacity="0.32"/>
              </svg>
            </div>
          </div>

          {/* ══ BRAND ══ */}
          <div className="brand-block">
            <div className="brand-name">
              <span className="b-campus">Campus</span><span className="b-pro">Pro</span>
            </div>
            <div className="brand-sub">THE ULTIMATE SRM STUDENT HUB</div>
          </div>

          {/* ══ CARD ══ */}
          <div className="card">
            <div className="corner tl" /><div className="corner tr" />
            <div className="corner bl" /><div className="corner br" />

            <div className="card-header">
              <div className="card-title">Welcome back</div>
              <div className="card-sub">Sign in to your SRM Academia Portal</div>
            </div>

            {sessionLimit && (
              <div className="session-warn">
                <span>⚠ Session limit reached.</span>
                <a href={sessionLimit} target="_blank" rel="noreferrer">Manage sessions →</a>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label">Student ID / Email</label>
                <div className="field-wrap">
                  <svg className="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input type="text" placeholder="NetID or SRM Email"
                    value={account} onChange={e => setAccount(e.target.value)}
                    required autoComplete="username" />
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: 26 }}>
                <label className="field-label">Academia Password</label>
                <div className="field-wrap">
                  <svg className="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password" />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div className="err-box">{error}</div>}

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner" />
                    {status}
                  </span>
                ) : 'Login Now →'}
              </button>
            </form>

            {loading && (
              <div className="progress-bar"><div className="progress-fill" /></div>
            )}

            <div className="status-badge">
              <div className="status-dot" />
              All systems operational
            </div>
          </div>

          <div className="footer-note">
            SRM Institute of Science and Technology &nbsp;·&nbsp; Secure Portal
          </div>

        </div>
      </div>

      <style jsx global>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body { height:100%; }
        body { font-family:'Space Grotesk',sans-serif; background:#03050a; overflow:hidden; }
      `}</style>

      <style jsx>{`
        .root {
          min-height:100vh; display:flex; align-items:center; justify-content:center;
          padding:20px; position:relative; overflow:hidden;
        }

        /* background */
        .bg-base {
          position:fixed; inset:0; z-index:0;
          background:
            radial-gradient(ellipse 70% 55% at 50% 0%, rgba(0,245,255,0.05) 0%, transparent 65%),
            radial-gradient(ellipse 50% 60% at 85% 100%, rgba(255,107,43,0.04) 0%, transparent 60%),
            #03050a;
        }
        .grid-lines {
          position:fixed; inset:0; z-index:0;
          background-image:
            linear-gradient(rgba(0,245,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,255,0.022) 1px, transparent 1px);
          background-size:55px 55px;
          animation:gridDrift 24s linear infinite;
        }
        @keyframes gridDrift { 0%{transform:translateY(0)} 100%{transform:translateY(55px)} }
        .scanlines {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.015) 2px,rgba(0,0,0,0.015) 4px);
        }
        .orb { position:fixed; border-radius:50%; filter:blur(90px); pointer-events:none; z-index:0; animation:orbDrift 12s ease-in-out infinite alternate; }
        .orb-a { width:500px; height:500px; background:rgba(0,245,255,0.035); top:-180px; left:-120px; }
        .orb-b { width:380px; height:380px; background:rgba(255,107,43,0.035); bottom:-100px; right:-80px; animation-delay:-5s; animation-duration:15s; }
        @keyframes orbDrift { from{transform:translate(0,0)} to{transform:translate(22px,16px)} }

        /* layout */
        .page-col { position:relative; z-index:10; display:flex; flex-direction:column; align-items:center; }

        /* ── orbital ── */
        .orbital-wrap {
          position:relative; width:120px; height:120px;
          display:flex; align-items:center; justify-content:center;
          margin-bottom:20px;
          animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }
        .ring { position:absolute; border-radius:50%; border:1px solid transparent; }
        .ring-outer { width:120px; height:120px; border-color:rgba(0,245,255,0.18); animation:spinCW 5s linear infinite; }
        .ring-inner { width:78px; height:78px; border-color:rgba(255,107,43,0.22); animation:spinCCW 3.5s linear infinite; }
        .ring-ball { position:absolute; border-radius:50%; top:50%; left:50%; }
        .ball-outer {
          width:8px; height:8px; background:#00f5ff;
          box-shadow:0 0 10px #00f5ff,0 0 22px rgba(0,245,255,0.5);
          transform:translate(-50%,-50%) translateY(-60px);
        }
        .ball-inner {
          width:7px; height:7px; background:#ff6b2b;
          box-shadow:0 0 10px #ff6b2b,0 0 22px rgba(255,107,43,0.5);
          transform:translate(-50%,-50%) translateY(-39px);
        }
        @keyframes spinCW  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spinCCW { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        .orbital-core {
          position:relative; z-index:2; width:52px; height:52px;
          background:linear-gradient(135deg,#ff6b2b,#c43200);
          border-radius:14px; display:flex; align-items:center; justify-content:center;
          box-shadow:0 0 0 1px rgba(255,107,43,0.32),0 0 28px rgba(255,107,43,0.28),inset 0 1px 0 rgba(255,255,255,0.16);
        }
        .orbital-core::before {
          content:''; position:absolute; inset:0; border-radius:14px;
          background:linear-gradient(135deg,rgba(255,255,255,0.12),transparent);
        }
        .orbital-core svg { position:relative; z-index:1; }

        /* brand */
        .brand-block { text-align:center; margin-bottom:26px; animation:fadeUp 0.7s 0.08s cubic-bezier(0.16,1,0.3,1) both; }
        .brand-name { font-family:'Bebas Neue',sans-serif; font-size:54px; letter-spacing:3px; line-height:1; }
        .b-campus { color:#fff; }
        .b-pro {
          background:linear-gradient(90deg,#00f5ff 0%,#ffffff 38%,#ff6b2b 68%,#00f5ff 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:shimmer 2.6s linear infinite;
        }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .brand-sub { font-size:9px; font-weight:500; letter-spacing:4px; text-transform:uppercase; color:rgba(220,235,255,0.24); margin-top:5px; }

        /* card */
        .card {
          width:408px; padding:36px 34px 30px;
          background:rgba(5,9,17,0.94);
          border:1px solid rgba(0,245,255,0.09);
          border-radius:22px; backdrop-filter:blur(28px);
          box-shadow:0 0 0 1px rgba(0,245,255,0.03),0 40px 80px rgba(0,0,0,0.72),inset 0 1px 0 rgba(255,255,255,0.03);
          position:relative; overflow:hidden;
          animation:fadeUp 0.7s 0.14s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(0,245,255,0.4),transparent);
        }

        /* corners */
        .corner { position:absolute; width:15px; height:15px; z-index:2; }
        .tl { top:11px; left:11px; border-top:1.5px solid rgba(0,245,255,0.35); border-left:1.5px solid rgba(0,245,255,0.35); }
        .tr { top:11px; right:11px; border-top:1.5px solid rgba(0,245,255,0.35); border-right:1.5px solid rgba(0,245,255,0.35); }
        .bl { bottom:11px; left:11px; border-bottom:1.5px solid rgba(0,245,255,0.35); border-left:1.5px solid rgba(0,245,255,0.35); }
        .br { bottom:11px; right:11px; border-bottom:1.5px solid rgba(0,245,255,0.35); border-right:1.5px solid rgba(0,245,255,0.35); }

        /* card header */
        .card-header { margin-bottom:26px; }
        .card-title { font-size:20px; font-weight:600; color:#d8e8f8; letter-spacing:-0.3px; }
        .card-sub { font-size:12px; color:rgba(210,230,255,0.3); margin-top:4px; }

        /* session warn */
        .session-warn {
          display:flex; gap:8px; align-items:center; flex-wrap:wrap;
          background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);
          border-radius:9px; padding:9px 12px; margin-bottom:16px;
          font-size:12px; color:#fde68a;
        }
        .session-warn a { color:#fbbf24; font-weight:600; text-decoration:none; }

        /* fields */
        .field-group { margin-bottom:18px; }
        .field-label { display:block; font-size:9px; font-weight:600; letter-spacing:2.5px; text-transform:uppercase; color:rgba(210,230,255,0.28); margin-bottom:7px; }
        .field-wrap { position:relative; display:flex; align-items:center; }
        .field-icon { position:absolute; left:13px; color:rgba(210,230,255,0.22); pointer-events:none; transition:color 0.22s; z-index:1; }
        .field-wrap:focus-within .field-icon { color:#00f5ff; }
        .field-wrap input {
          width:100%; padding:12px 13px 12px 38px;
          background:rgba(0,245,255,0.02);
          border:1px solid rgba(0,245,255,0.08);
          border-radius:10px; color:#d8e8f8;
          font-family:'Space Grotesk',sans-serif; font-size:13.5px; font-weight:400;
          outline:none; transition:all 0.22s; caret-color:#00f5ff;
        }
        .field-wrap input::placeholder { color:rgba(210,230,255,0.14); }
        .field-wrap input:focus {
          border-color:rgba(0,245,255,0.3);
          background:rgba(0,245,255,0.035);
          box-shadow:0 0 0 3px rgba(0,245,255,0.055);
        }
        .eye-btn {
          position:absolute; right:12px;
          background:none; border:none; color:rgba(210,230,255,0.22);
          cursor:pointer; padding:4px; display:flex; align-items:center; transition:color 0.22s;
        }
        .eye-btn:hover { color:#00f5ff; }

        /* error */
        .err-box {
          background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.22);
          border-radius:9px; padding:9px 12px; margin-bottom:14px;
          color:#fca5a5; font-size:12px;
        }

        /* button */
        .btn-submit {
          width:100%; padding:13px;
          background:linear-gradient(135deg,#ff6b2b,#d43200);
          border:none; border-radius:10px; color:#fff;
          font-family:'Space Grotesk',sans-serif; font-size:12px; font-weight:700;
          letter-spacing:2.5px; text-transform:uppercase;
          cursor:pointer; position:relative; overflow:hidden; transition:all 0.22s;
          box-shadow:0 8px 24px rgba(255,107,43,0.22);
        }
        .btn-submit:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(255,107,43,0.36); }
        .btn-submit:disabled { opacity:0.58; cursor:not-allowed; }
        .btn-submit::after {
          content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);
          transition:left 0.45s;
        }
        .btn-submit:not(:disabled):hover::after { left:100%; }
        .btn-loading { display:flex; align-items:center; justify-content:center; gap:9px; }
        .spinner {
          width:14px; height:14px; flex-shrink:0;
          border:2px solid rgba(255,255,255,0.26); border-top-color:#fff;
          border-radius:50%; animation:spin 0.7s linear infinite;
        }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* progress */
        .progress-bar { height:2px; background:rgba(0,245,255,0.06); border-radius:2px; margin-top:13px; overflow:hidden; }
        .progress-fill { height:100%; width:35%; background:linear-gradient(90deg,#00f5ff,#ff6b2b); animation:progSlide 1.2s ease-in-out infinite; }
        @keyframes progSlide { 0%{transform:translateX(-170%)} 100%{transform:translateX(400%)} }

        /* status */
        .status-badge { display:flex; align-items:center; gap:6px; justify-content:center; margin-top:15px; font-size:10px; color:rgba(210,230,255,0.22); letter-spacing:0.7px; }
        .status-dot { width:5px; height:5px; border-radius:50%; background:#22c55e; box-shadow:0 0 6px #22c55e; animation:pulse 2.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.72)} }

        /* footer */
        .footer-note { margin-top:18px; font-size:10px; letter-spacing:0.7px; color:rgba(210,230,255,0.14); text-align:center; animation:fadeUp 0.7s 0.22s cubic-bezier(0.16,1,0.3,1) both; }

        /* mobile */
        @media (max-width:460px) {
          .card { width:calc(100vw - 26px); padding:30px 20px 26px; }
          .brand-name { font-size:44px; }
          .orbital-wrap { width:100px; height:100px; }
          .ring-outer { width:100px; height:100px; }
          .ring-inner { width:66px; height:66px; }
          .ball-outer { transform:translate(-50%,-50%) translateY(-50px); }
          .ball-inner { transform:translate(-50%,-50%) translateY(-33px); }
        }
      `}</style>
    </>
  );
}
