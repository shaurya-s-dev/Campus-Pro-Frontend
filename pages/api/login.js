import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount]     = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [sessionLimit, setSessionLimit] = useState(null);
  const [focusField, setFocusField] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      setStatus('Authenticating…');
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
      setStatus('Fetching your data…');
      const dataRes = await fetch('/api/academia', {
        headers: { 'X-CSRF-Token': token },
      });
      const academiaData = await dataRes.json();

      if (academiaData.tokenInvalid || academiaData.error) {
        setError(academiaData.error || academiaData.message || 'Session expired. Try again.');
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
        <title>Sign In — CampusPro</title>
      </Head>

      <div className="root">
        {/* Background */}
        <div className="bg-scene">
          <div className="bg-orb bg-orb-a" />
          <div className="bg-orb bg-orb-b" />
          <div className="bg-grid" />
          <div className="bg-noise" />
        </div>

        {/* Back link */}
        <Link href="/" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>

        <div className="login-wrap">
          {/* Brand */}
          <div className="brand animate-fade-up">
            <div className="brand-icon">⬡</div>
            <div className="brand-text">
              <span className="brand-campus">Campus</span><span className="brand-pro">Pro</span>
            </div>
          </div>

          {/* Card */}
          <div className="card animate-fade-up delay-1">
            <div className="card-shine" />
            <div className="card-border-top" />

            <div className="card-head">
              <h1 className="card-title">Welcome back</h1>
              <p className="card-sub">SRM Academia Portal · Secure Sign In</p>
            </div>

            {sessionLimit && (
              <div className="session-alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Session limit reached.
                <a href={sessionLimit} target="_blank" rel="noreferrer" className="session-link">Manage sessions →</a>
              </div>
            )}

            <form onSubmit={handleLogin} className="form">
              {/* Account field */}
              <div className="field-wrap">
                <label className="field-label">Student ID / Email</label>
                <div className={`field-input-wrap ${focusField==='account' ? 'focused' : ''}`}>
                  <span className="field-icon"><UserIcon /></span>
                  <input
                    type="text"
                    placeholder="NetID or SRM email"
                    value={account}
                    onChange={e => setAccount(e.target.value)}
                    onFocus={() => setFocusField('account')}
                    onBlur={() => setFocusField('')}
                    required
                    autoComplete="username"
                    className="field-input"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="field-wrap">
                <label className="field-label">Academia Password</label>
                <div className={`field-input-wrap ${focusField==='password' ? 'focused' : ''}`}>
                  <span className="field-icon"><LockIcon /></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusField('password')}
                    onBlur={() => setFocusField('')}
                    required
                    autoComplete="current-password"
                    className="field-input"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-box animate-fade-up">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {error}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <span className="submit-loading">
                    <span className="submit-spinner" />
                    {status}
                  </span>
                ) : (
                  <>Launch Dashboard <span className="submit-arrow">→</span></>
                )}
              </button>

              {loading && (
                <div className="progress-track" style={{ marginTop: 10 }}>
                  <div className="progress-indeterminate" />
                </div>
              )}
            </form>

            <div className="card-footer">
              <div className="status-row">
                <div className="status-dot" />
                All systems operational
              </div>
              <div className="security-note">
                🔒 Your credentials are never stored
              </div>
            </div>
          </div>

          <p className="legal animate-fade-up delay-3">
            By signing in, you agree that this is an unofficial tool.<br />
            Not affiliated with SRMIST.
          </p>
        </div>
      </div>

      <style jsx global>{`
        body { background: var(--bg-void); overflow: hidden; }
        @media (max-height: 700px) { body { overflow: auto; } }
      `}</style>

      <style jsx>{`
        .root {
          min-height: 100vh; display: flex; align-items: center;
          justify-content: center; padding: 24px;
          position: relative;
        }
        .bg-scene { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .bg-orb {
          position: absolute; border-radius: 50%; filter: blur(110px);
          animation: orbDrift 14s ease-in-out infinite alternate;
        }
        .bg-orb-a {
          width: 650px; height: 650px;
          background: radial-gradient(circle, rgba(91,94,244,0.1), transparent 70%);
          top: -200px; left: -150px;
        }
        .bg-orb-b {
          width: 450px; height: 450px;
          background: radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%);
          bottom: -120px; right: -80px;
          animation-delay: -6s; animation-duration: 18s;
        }
        .bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(91,94,244,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91,94,244,0.025) 1px, transparent 1px);
          background-size: 55px 55px;
        }
        .bg-noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        .back-link {
          position: fixed; top: 20px; left: 20px; z-index: 10;
          display: flex; align-items: center; gap: 5px;
          color: var(--text-3); font-size: 13px; transition: color 0.15s;
          padding: 6px 12px; border-radius: var(--radius-sm);
        }
        .back-link:hover { color: var(--text-1); background: var(--bg-elevated); }

        .login-wrap {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          width: 100%; max-width: 420px;
        }

        /* Brand */
        .brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 28px;
        }
        .brand-icon {
          font-size: 28px; color: var(--accent);
          filter: drop-shadow(0 0 12px var(--accent-glow));
        }
        .brand-text {
          font-family: var(--font-display); font-size: 26px;
          font-weight: 800; letter-spacing: -0.5px;
        }
        .brand-campus { color: var(--text-1); }
        .brand-pro { color: var(--accent); }

        /* Card */
        .card {
          width: 100%; padding: 36px 32px 28px;
          background: rgba(10,10,24,0.9);
          border: 1px solid rgba(91,94,244,0.12);
          border-radius: 22px;
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          box-shadow:
            0 0 0 1px rgba(91,94,244,0.05),
            0 40px 80px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.04);
          position: relative; overflow: hidden;
        }
        .card-shine {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(91,94,244,0.07), transparent);
        }
        .card-border-top {
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(91,94,244,0.5), rgba(0,212,255,0.3), transparent);
        }

        .card-head { margin-bottom: 28px; }
        .card-title {
          font-family: var(--font-display); font-size: 22px;
          font-weight: 700; color: var(--text-1); letter-spacing: -0.3px;
        }
        .card-sub { font-size: 12.5px; color: var(--text-3); margin-top: 4px; }

        /* Session alert */
        .session-alert {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.22);
          border-radius: var(--radius-md); padding: 10px 13px;
          margin-bottom: 18px; font-size: 12px; color: #fde68a;
        }
        .session-link { color: #fbbf24; font-weight: 600; }

        /* Form */
        .form { display: flex; flex-direction: column; gap: 16px; }
        .field-wrap { display: flex; flex-direction: column; gap: 6px; }
        .field-label {
          font-size: 10px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: var(--text-3);
        }
        .field-input-wrap {
          position: relative; display: flex; align-items: center;
          background: rgba(91,94,244,0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .field-input-wrap.focused {
          border-color: rgba(91,94,244,0.35);
          background: rgba(91,94,244,0.06);
          box-shadow: 0 0 0 3px rgba(91,94,244,0.08);
        }
        .field-icon {
          position: absolute; left: 13px; color: var(--text-4);
          display: flex; align-items: center; pointer-events: none;
          transition: color 0.2s;
        }
        .field-input-wrap.focused .field-icon { color: var(--accent); }
        .field-input {
          width: 100%; padding: 12px 13px 12px 38px;
          background: transparent; border: none; outline: none;
          color: var(--text-1); font-size: 13.5px;
          caret-color: var(--accent);
        }
        .field-input::placeholder { color: var(--text-4); }
        .eye-btn {
          position: absolute; right: 12px;
          background: none; border: none;
          color: var(--text-4); transition: color 0.15s;
          display: flex; align-items: center; padding: 4px;
        }
        .eye-btn:hover { color: var(--text-2); }

        /* Error */
        .error-box {
          display: flex; align-items: center; gap: 8px;
          background: rgba(244,63,94,0.08);
          border: 1px solid rgba(244,63,94,0.2);
          border-radius: var(--radius-md); padding: 10px 13px;
          font-size: 12.5px; color: #fb7185;
        }

        /* Submit */
        .submit-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #5b5ef4 0%, #4a4de0 100%);
          border: none; border-radius: var(--radius-md);
          color: #fff; font-family: var(--font-display);
          font-size: 13px; font-weight: 700; letter-spacing: 0.5px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.22s var(--ease-smooth);
          box-shadow: 0 6px 24px rgba(91,94,244,0.3);
          margin-top: 4px;
        }
        .submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(91,94,244,0.45);
        }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .submit-arrow { display: inline-block; transition: transform 0.2s; }
        .submit-btn:hover .submit-arrow { transform: translateX(4px); }
        .submit-loading {
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .submit-spinner {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        .progress-indeterminate {
          height: 100%; width: 40%;
          background: linear-gradient(90deg, var(--accent), var(--cyan));
          border-radius: 3px;
          animation: progressSlide 1.3s ease-in-out infinite;
        }
        @keyframes progressSlide {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(350%); }
        }

        /* Card footer */
        .card-footer {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .status-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: var(--text-3);
        }
        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--emerald);
          box-shadow: 0 0 5px var(--emerald);
          animation: pulse 2.2s ease-in-out infinite;
        }
        .security-note { font-size: 11px; color: var(--text-3); }

        .legal {
          margin-top: 20px; font-size: 11px; color: var(--text-4);
          text-align: center; line-height: 1.6;
        }

        @media (max-width: 480px) {
          .card { padding: 28px 20px 22px; }
        }
      `}</style>
    </>
  );
}
