import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLimit, setSessionLimit] = useState(null); // holds redirectUrl

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSessionLimit(null);
    setLoading(true);

    try {
      // Step 1: Login
      setStatus('Signing in...');
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password }),
      });
      const loginData = await loginRes.json();

      // Session limit hit — show redirect button
      if (loginData.status === 429 || loginData.session?.sessionLimit) {
        setSessionLimit(loginData.session?.redirectUrl);
        setLoading(false);
        return;
      }

      if (!loginData.authenticated || !loginData.cookies) {
        setError(loginData.message || 'Login failed. Check your credentials.');
        setLoading(false);
        return;
      }

      const token = loginData.cookies;

      // Step 2: Immediately fetch all data while session is still fresh
      setStatus('Fetching your data...');
      const dataRes = await fetch('/api/academia', {
        headers: { 'X-CSRF-Token': token },
      });
      const academiaData = await dataRes.json();

      if (academiaData.tokenInvalid || academiaData.error) {
        setError('Session expired. Please try again.');
        setLoading(false);
        return;
      }

      // Step 3: Store and go to dashboard
      localStorage.setItem('csrf_token', token);
      sessionStorage.setItem('academia_data', JSON.stringify(academiaData));
      router.push('/dashboard');

    } catch {
      setError('Cannot reach server. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>CampusPro — Login</title></Head>
      <div className="root">
        <div className="card">
          <div className="logo">⬡ CAMPUS<strong>PRO</strong></div>
          <p className="sub">SRM Academia Portal</p>

          {/* SESSION LIMIT UI */}
          {sessionLimit ? (
            <div className="session-box">
              <div className="session-icon">⚠️</div>
              <div className="session-title">Session Limit Reached</div>
              <p className="session-desc">
                SRM Academia allows only 2 active sessions. You need to terminate your other sessions before logging in.
              </p>
              <a
                href={sessionLimit}
                target="_blank"
                rel="noopener noreferrer"
                className="session-btn"
              >
                Terminate Other Sessions →
              </a>
              <button className="retry-btn" onClick={() => setSessionLimit(null)}>
                ← Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <label>SRM Email</label>
              <input
                type="text"
                placeholder="ms5215@srmist.edu.in"
                value={account}
                onChange={e => setAccount(e.target.value)}
                required
              />
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <div className="err">{error}</div>}
              <button type="submit" disabled={loading}>
                {loading ? status : 'Sign In →'}
              </button>
              {loading && <div className="bar"><div className="fill" /></div>}
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .root {
          min-height: 100vh; background: #0a0a0f; display: flex;
          align-items: center; justify-content: center; padding: 20px;
          font-family: 'DM Sans', sans-serif;
        }
        .card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 48px 40px; width: 100%; max-width: 420px;
        }
        .logo { font-family: 'Space Mono', monospace; font-size: 20px; color: #fff; margin-bottom: 6px; }
        .logo strong { color: #6366f1; }
        .sub { color: rgba(255,255,255,0.35); font-size: 13px; margin-bottom: 36px; }

        label {
          display: block; color: rgba(255,255,255,0.45); font-size: 11px;
          text-transform: uppercase; letter-spacing: 1px; margin: 18px 0 6px;
        }
        input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 12px 14px; color: #fff; font-size: 14px;
          font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s;
        }
        input:focus { border-color: #6366f1; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        .err {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px; color: #fca5a5; font-size: 13px; padding: 10px 14px; margin-top: 16px;
        }
        button[type="submit"] {
          width: 100%; margin-top: 28px; padding: 14px; background: #6366f1;
          color: #fff; border: none; border-radius: 8px; font-size: 15px;
          font-family: 'Space Mono', monospace; cursor: pointer; transition: all 0.2s;
        }
        button[type="submit"]:hover:not(:disabled) { background: #4f46e5; }
        button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }
        .bar { height: 2px; background: rgba(255,255,255,0.06); border-radius: 2px; margin-top: 20px; overflow: hidden; }
        .fill { height: 100%; width: 40%; background: #6366f1; animation: slide 1.2s ease-in-out infinite; }
        @keyframes slide { 0%{transform:translateX(-150%)} 100%{transform:translateX(400%)} }

        /* SESSION LIMIT */
        .session-box { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
        .session-icon { font-size: 40px; }
        .session-title { font-size: 18px; font-weight: 600; color: #fff; }
        .session-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }
        .session-btn {
          display: block; width: 100%; padding: 14px; background: #f59e0b;
          color: #000; border-radius: 8px; font-size: 14px; font-weight: 600;
          font-family: 'Space Mono', monospace; text-decoration: none;
          transition: background 0.2s; margin-top: 8px;
        }
        .session-btn:hover { background: #d97706; }
        .retry-btn {
          background: none; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4);
          padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 13px;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .retry-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
      `}</style>
    </>
  );
}
