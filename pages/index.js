import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { TokenStore, DataStore } from '@/lib/security';

const ACADEMIA_SESSIONS_URL =
  'https://academia.srmist.edu.in/accounts/p/10002227248/announcement/sessions-reminder?servicename=ZohoCreator&serviceurl=https://academia.srmist.edu.in/portal/academia-academic-services/redirectFromLogin&service_language=en';

/* ── Detection helpers ───────────────────────────────────────────────────── */
function detectSessionLimit(data) {
  return data?.errorCode === 'SESSION_LIMIT';
}

function detectDailyLimit(data) {
  return data?.errorCode === 'DAILY_LIMIT';
}

function getDisplayError(data) {
  if (!data) return 'Login failed. Check your credentials.';
  const msg = data.message;
  const err = data.error;
  if (typeof msg === 'string' && msg && msg !== 'SESSION_LIMIT' && msg !== 'DAILY_LIMIT') return msg;
  if (typeof err === 'string' && err) return err;
  return 'Login failed. Check your credentials.';
}

function getRedirectUrl(data) {
  return data?.session?.redirectUrl || ACADEMIA_SESSIONS_URL;
}

/* ── Session limit screen ────────────────────────────────────────────────── */
function SessionLimitScreen({ onBack, onRetry, countdown }) {
  return (
    <div className="session-limit-card">
      <div className="sl-icon">⏳</div>
      <h3>Session Being Cleared</h3>
      <p>
        We're automatically clearing your old session. 
        Please <strong>wait 30 seconds</strong> and click the button below to try again.
      </p>
      
      {/* Auto-retry countdown */}
      <div className="sl-countdown">
        Retrying in <strong>{countdown}s</strong>...
      </div>
      
      <button 
        className="sl-retry-btn"
        onClick={onRetry}
        disabled={countdown > 0}
      >
        {countdown > 0 ? `Wait ${countdown}s` : 'Try Login Again →'}
      </button>
      
      <div className="sl-manual">
        Still not working? 
        <a href="https://academia.srmist.edu.in" target="_blank" rel="noreferrer">
          Manually clear sessions on Academia
        </a>
      </div>

      <button className="info-btn-back" onClick={onBack} style={{ marginTop: 24 }}>Back to Login</button>

      <style jsx>{`
        .session-limit-card { text-align: center; padding: 10px 0; }
        .sl-icon { font-size: 42px; margin-bottom: 15px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.95)} }
        h3 { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #fde68a; margin-bottom: 12px; }
        p { font-size: 14px; color: rgba(210,230,255,0.6); line-height: 1.6; margin-bottom: 20px; }
        p strong { color: #fde68a; }
        .sl-countdown { font-size: 13px; color: rgba(0,245,255,0.7); margin-bottom: 20px; font-family: 'Space Grotesk', sans-serif; }
        .sl-countdown strong { color: #00f5ff; }
        .sl-retry-btn {
          width: 100%; padding: 13px; border-radius: 12px;
          background: ${countdown > 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #f59e0b, #d97706)'};
          color: ${countdown > 0 ? 'rgba(210,230,255,0.3)' : '#fff'};
          border: ${countdown > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none'};
          font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700;
          cursor: ${countdown > 0 ? 'not-allowed' : 'pointer'};
          transition: all 0.2s;
          margin-bottom: 20px;
        }
        .sl-retry-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(245,158,11,0.3); }
        .sl-manual { font-size: 12px; color: rgba(210,230,255,0.4); }
        .sl-manual a { color: #f59e0b; text-decoration: underline; margin-left: 4px; }
        .info-btn-back { width: 100%; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(210,230,255,0.4); font-family: 'Space Grotesk', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
      `}</style>
    </div>
  );
}

/* ── Daily limit screen ──────────────────────────────────────────────────── */
function DailyLimitScreen({ onBack }) {
  return (
    <div className="info-screen">
      <div className="info-icon">🌙</div>
      <div className="info-title">Daily Login Limit Reached</div>
      <div className="info-desc">
        SRM Academia allows only <strong>20 sign-ins per day</strong>.
        You have reached this limit for today.
        <br /><br />
        You can sign in again from <strong>12:00 AM tomorrow</strong>.
        This is an SRM restriction — nothing can be done right now.
      </div>
      <div className="daily-notice">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Come back after midnight to use CampusPro
      </div>
      <button className="info-btn-back" onClick={onBack}>← Back to Login</button>
      <style jsx>{`
        .info-screen{display:flex;flex-direction:column;align-items:center;text-align:center;padding:4px 0}
        .info-icon{font-size:38px;margin-bottom:12px}
        .info-title{font-family:'Space Grotesk',sans-serif;font-size:19px;font-weight:700;color:#a5b4fc;margin-bottom:10px}
        .info-desc{font-size:13px;color:rgba(210,230,255,0.5);line-height:1.7;margin-bottom:20px}
        .info-desc strong{color:rgba(210,230,255,0.82)}
        .daily-notice{display:flex;align-items:center;gap:8px;width:100%;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.18);border-radius:10px;padding:12px 14px;font-size:12.5px;color:#a5b4fc;margin-bottom:16px;text-align:left}
        .info-btn-back{width:100%;padding:10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(210,230,255,0.4);font-family:'Space Grotesk',sans-serif;font-size:13px;cursor:pointer;transition:all 0.2s}
        .info-btn-back:hover{background:rgba(255,255,255,0.07);color:rgba(210,230,255,0.7)}
      `}</style>
    </div>
  );
}

/* ── Main Login ──────────────────────────────────────────────────────────── */
export default function Login() {
  const router = useRouter();
  const [account, setAccount]   = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [screen, setScreen]     = useState(null); // null | 'session' | 'daily'
  const [sessionRedirectUrl, setSessionRedirectUrl] = useState(null);
  
  const [savedCredentials, setSavedCredentials] = useState(null);
  const [countdown, setCountdown] = useState(30);

  const [captchaData, setCaptchaData] = useState(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const { theme } = useTheme();
  useEffect(() => {
    if (screen === 'session' && !captchaData) {
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto retry login
            handleLogin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [screen]);

  // Clear credentials on unmount
  useEffect(() => {
    return () => setSavedCredentials(null);
  }, []);

  const handleRefreshCaptcha = async () => {
    if (!captchaData?.cdigest) return;
    try {
      const u = savedCredentials?.account || account;
      const p = savedCredentials?.password || password;
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: u, password: p }),
      });
      const data = await res.json();
      if (data.errorCode === 'CAPTCHA_REQUIRED' && data.captcha?.image) {
        setCaptchaData({ image: data.captcha.image, cdigest: data.captcha.cdigest });
        setCaptchaInput('');
        setCaptchaError('');
      }
    } catch {}
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    // Validate captcha if required
    if (captchaData && !captchaInput.trim()) {
      setCaptchaError('Please enter the CAPTCHA text above.');
      return;
    }

    setError('');
    setStatus('Initiating login…');
    setLoading(true);

    // Prioritize saved credentials for auto-retry
    const finalAccount = savedCredentials?.account || account;
    const finalPassword = savedCredentials?.password || password;

    if (!finalAccount || !finalPassword) {
      setError('Please enter your credentials.');
      setLoading(false);
      return;
    }

    setSavedCredentials({ account: finalAccount, password: finalPassword });

    try {
      setStatus('Signing in...');
      const body = { account: finalAccount, password: finalPassword };
      if (captchaData) {
        body.cdigest = captchaData.cdigest;
        body.captcha = captchaInput.trim();
      }

      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const loginData = await loginRes.json();

      // If captcha was required or incorrect
      if (loginData.errorCode === 'CAPTCHA_REQUIRED') {
        if (captchaData) setCaptchaError('Incorrect CAPTCHA. Please try again.');
        if (loginData.captcha?.image) {
          setCaptchaData({
            image: loginData.captcha.image,
            cdigest: loginData.captcha.cdigest,
          });
          setCaptchaInput('');
        } else {
          setError('CAPTCHA required but image failed to load. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Clear captcha on any other result
      setCaptchaData(null);
      setCaptchaInput('');
      setCaptchaError('');

      // Daily limit — check first (more specific)
      if (detectDailyLimit(loginData)) {
        setScreen('daily'); setLoading(false); return;
      }
      // Session limit
      if (detectSessionLimit(loginData)) {
        setSessionRedirectUrl(getRedirectUrl(loginData));
        setScreen('session'); setLoading(false); return;
      }

      if (!loginData.authenticated || !loginData.cookies) {
        setError(getDisplayError(loginData));
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

      if (detectDailyLimit(academiaData)) {
        setScreen('daily'); setLoading(false); return;
      }
      if (detectSessionLimit(academiaData)) {
        setSessionRedirectUrl(getRedirectUrl(academiaData));
        setScreen('session'); setLoading(false); return;
      }

      if (academiaData.tokenInvalid || academiaData.error) {
        setError(academiaData.error || academiaData.message || 'Session expired. Please try again.');
        setLoading(false);
        return;
      }

      TokenStore.set(token);
      DataStore.set(academiaData);
      router.push('/dashboard');

    } catch {
      setError('Cannot reach server. Please try again.');
      setLoading(false);
    }
  };

  const goBack = () => { setScreen(null); setError(''); };

  return (
    <>
      <Head>
        <title>CampusPro — Login</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="bg-base" />
      <div className="grid-lines" />
      <div className="scanlines" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      <div className="root" style={{ position: 'relative', zIndex: 2 }}>
        <div className="page-col">
          <div className="orbital-wrap">
            <div className="ring ring-outer"><div className="ring-ball ball-outer" /></div>
            <div className="ring ring-inner"><div className="ring-ball ball-inner" /></div>
            <div className="orbital-core">
              <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="8" r="3" fill="white"/><circle cx="8" cy="28" r="3" fill="white"/>
                <circle cx="32" cy="28" r="3" fill="white"/><circle cx="20" cy="20" r="4.5" fill="white" opacity="0.95"/>
                <line x1="20" y1="8" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.75"/>
                <line x1="8" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.75"/>
                <line x1="32" y1="28" x2="20" y2="20" stroke="white" strokeWidth="1.5" opacity="0.75"/>
                <line x1="8" y1="28" x2="32" y2="28" stroke="white" strokeWidth="1.5" opacity="0.32"/>
                <line x1="20" y1="8" x2="8" y2="28" stroke="white" strokeWidth="1.5" opacity="0.32"/>
                <line x1="20" y1="8" x2="32" y2="28" stroke="white" strokeWidth="1.5" opacity="0.32"/>
              </svg>
            </div>
          </div>

          <div className="brand-block">
            <div className="brand-name"><span className="b-campus">Campus</span><span className="b-pro">Pro</span></div>
            <div className="brand-sub">THE ULTIMATE SRM STUDENT HUB</div>
          </div>

          <div className="card">
            <div className="corner tl"/><div className="corner tr"/>
            <div className="corner bl"/><div className="corner br"/>

            {screen === 'session' && (
              <SessionLimitScreen 
                onRetry={() => handleLogin()} 
                countdown={countdown}
                onBack={goBack} 
              />
            )}
            {screen === 'daily'   && <DailyLimitScreen onBack={goBack} />}

            {screen === null && (
              <>
                <div className="card-header">
                  <div className="card-title">Welcome back</div>
                  <div className="card-sub">Sign in to your SRM Academia Portal</div>
                </div>
                <form onSubmit={handleLogin}>
                  <div className="field-group">
                    <label className="field-label">Student ID / Email</label>
                    <div className="field-wrap">
                      <svg className="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" placeholder="NetID or SRM Email" value={account} onChange={e => setAccount(e.target.value)} required autoComplete="username" />
                    </div>
                  </div>
                  <div className="field-group" style={{ marginBottom:26 }}>
                    <label className="field-label">Academia Password</label>
                    <div className="field-wrap">
                      <svg className="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input type={showPass ? 'text' : 'password'} placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                      <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>
                        {showPass
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {captchaData && (
                    <div className="captcha-section animate-up">
                      <div className="captcha-label">Security Check</div>
                      <p className="captcha-hint">
                        SRM Academia requires you to solve this challenge. 
                        Type the characters shown in the image below.
                      </p>
                      
                      <div className="captcha-image-wrap">
                        <img 
                          src={`data:image/png;base64,${captchaData.image}`}
                          alt="CAPTCHA"
                          className="captcha-image"
                        />
                        <button 
                          type="button" 
                          className="captcha-refresh"
                          onClick={handleRefreshCaptcha}
                          title="Get new CAPTCHA"
                        >
                          ↻
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Type characters..."
                        value={captchaInput}
                        onChange={e => setCaptchaInput(e.target.value)}
                        className="captcha-input field-wrap input"
                        autoComplete="off"
                        autoFocus
                      />
                      
                      {captchaError && (
                        <div className="err-box" style={{ marginTop: 10, marginBottom: 0 }}>{captchaError}</div>
                      )}
                    </div>
                  )}

                  {error && <div className="err-box">{error}</div>}
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? <span className="btn-loading"><span className="spinner"/>{status}</span> : 'Login Now →'}
                  </button>
                </form>
                {loading && <div className="progress-bar"><div className="progress-fill"/></div>}
                <div className="status-badge"><div className="status-dot"/>All systems operational</div>
              </>
            )}
          </div>

          <div className="footer-note">SRM Institute of Science and Technology &nbsp;·&nbsp; Secure Portal</div>
        </div>
      </div>

      <style jsx global>{`* { box-sizing:border-box; margin:0; padding:0; } html,body { height:100%; } body { font-family:'Space Grotesk',sans-serif; background:#03050a; overflow:hidden; }`}</style>
      <style jsx>{`
        .root{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
        .bg-base{position:fixed;inset:0;z-index:0;background:radial-gradient(ellipse 70% 55% at 50% 0%,rgba(0,245,255,0.05) 0%,transparent 65%),radial-gradient(ellipse 50% 60% at 85% 100%,rgba(255,107,43,0.04) 0%,transparent 60%),#03050a}
        .grid-lines{position:fixed;inset:0;z-index:0;background-image:linear-gradient(rgba(0,245,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.022) 1px,transparent 1px);background-size:55px 55px;animation:gridDrift 24s linear infinite}
        @keyframes gridDrift{0%{transform:translateY(0)}100%{transform:translateY(55px)}}
        .scanlines{position:fixed;inset:0;z-index:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.015) 2px,rgba(0,0,0,0.015) 4px)}
        .orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;animation:orbDrift 12s ease-in-out infinite alternate}
        .orb-a{width:500px;height:500px;background:rgba(0,245,255,0.035);top:-180px;left:-120px}
        .orb-b{width:380px;height:380px;background:rgba(255,107,43,0.035);bottom:-100px;right:-80px;animation-delay:-5s}
        @keyframes orbDrift{from{transform:translate(0,0)}to{transform:translate(22px,16px)}}
        .page-col{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center}
        .orbital-wrap{position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both}
        .ring{position:absolute;border-radius:50%;border:1px solid transparent}
        .ring-outer{width:120px;height:120px;border-color:rgba(0,245,255,0.18);animation:spinCW 5s linear infinite}
        .ring-inner{width:78px;height:78px;border-color:rgba(255,107,43,0.22);animation:spinCCW 3.5s linear infinite}
        .ring-ball{position:absolute;border-radius:50%;top:50%;left:50%}
        .ball-outer{width:8px;height:8px;background:#00f5ff;box-shadow:0 0 10px #00f5ff;transform:translate(-50%,-50%) translateY(-60px)}
        .ball-inner{width:7px;height:7px;background:#ff6b2b;box-shadow:0 0 10px #ff6b2b;transform:translate(-50%,-50%) translateY(-39px)}
        @keyframes spinCW{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes spinCCW{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
        .orbital-core{position:relative;z-index:2;width:52px;height:52px;background:linear-gradient(135deg,#ff6b2b,#c43200);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px rgba(255,107,43,0.32),0 0 28px rgba(255,107,43,0.28)}
        .brand-block{text-align:center;margin-bottom:26px;animation:fadeUp 0.7s 0.08s cubic-bezier(0.16,1,0.3,1) both}
        .brand-name{font-family:'Bebas Neue',sans-serif;font-size:54px;letter-spacing:3px;line-height:1}
        .b-campus{color:#fff}
        .b-pro{background:linear-gradient(90deg,#00f5ff 0%,#ffffff 38%,#ff6b2b 68%,#00f5ff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.6s linear infinite}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .brand-sub{font-size:9px;font-weight:500;letter-spacing:4px;text-transform:uppercase;color:rgba(220,235,255,0.24);margin-top:5px}
        .card{width:408px;padding:36px 34px 30px;background:rgba(5,9,17,0.94);border:1px solid rgba(0,245,255,0.09);border-radius:22px;backdrop-filter:blur(28px);box-shadow:0 0 0 1px rgba(0,245,255,0.03),0 40px 80px rgba(0,0,0,0.72);position:relative;overflow:hidden;animation:fadeUp 0.7s 0.14s cubic-bezier(0.16,1,0.3,1) both}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,245,255,0.4),transparent)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .corner{position:absolute;width:15px;height:15px;z-index:2}
        .tl{top:11px;left:11px;border-top:1.5px solid rgba(0,245,255,0.35);border-left:1.5px solid rgba(0,245,255,0.35)}
        .tr{top:11px;right:11px;border-top:1.5px solid rgba(0,245,255,0.35);border-right:1.5px solid rgba(0,245,255,0.35)}
        .bl{bottom:11px;left:11px;border-bottom:1.5px solid rgba(0,245,255,0.35);border-left:1.5px solid rgba(0,245,255,0.35)}
        .br{bottom:11px;right:11px;border-bottom:1.5px solid rgba(0,245,255,0.35);border-right:1.5px solid rgba(0,245,255,0.35)}
        .card-header{margin-bottom:26px}
        .card-title{font-size:20px;font-weight:600;color:#d8e8f8;letter-spacing:-0.3px}
        .card-sub{font-size:12px;color:rgba(210,230,255,0.3);margin-top:4px}
        .field-group{margin-bottom:18px}
        .field-label{display:block;font-size:9px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:rgba(210,230,255,0.28);margin-bottom:7px}
        .field-wrap{position:relative;display:flex;align-items:center}
        .field-icon{position:absolute;left:13px;color:rgba(210,230,255,0.22);pointer-events:none;transition:color 0.22s;z-index:1}
        .field-wrap:focus-within .field-icon{color:#00f5ff}
        .field-wrap input{width:100%;padding:12px 13px 12px 38px;background:rgba(0,245,255,0.02);border:1px solid rgba(0,245,255,0.08);border-radius:10px;color:#d8e8f8;font-family:'Space Grotesk',sans-serif;font-size:13.5px;outline:none;transition:all 0.22s;caret-color:#00f5ff}
        .field-wrap input::placeholder{color:rgba(210,230,255,0.14)}
        .field-wrap input:focus{border-color:rgba(0,245,255,0.3);background:rgba(0,245,255,0.035);box-shadow:0 0 0 3px rgba(0,245,255,0.055)}
        .eye-btn{position:absolute;right:12px;background:none;border:none;color:rgba(210,230,255,0.22);cursor:pointer;padding:4px;display:flex;align-items:center;transition:color 0.22s}
        .eye-btn:hover{color:#00f5ff}
        .err-box{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.22);border-radius:9px;padding:9px 12px;margin-bottom:14px;color:#fca5a5;font-size:12px}

        .captcha-section { margin-bottom: 22px; padding: 18px; background: rgba(0,245,255,0.02); border: 1px solid rgba(0,245,255,0.12); border-radius: 14px; }
        .captcha-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(210,230,255,0.3); margin-bottom: 8px; }
        .captcha-hint { font-size: 11.5px; color: rgba(210,230,255,0.4); margin-bottom: 14px; line-height: 1.5; }
        .captcha-image-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .captcha-image { border-radius: 8px; border: 1px solid rgba(0,245,255,0.2); background: white; padding: 4px; max-height: 52px; }
        .captcha-refresh { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(210,230,255,0.4); border-radius: 8px; width: 34px; height: 34px; font-size: 16px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .captcha-refresh:hover { background: rgba(0,245,255,0.08); color: #00f5ff; border-color: rgba(0,245,255,0.3); }
        .captcha-input { width: 100% !important; letter-spacing: 4px; font-family: 'Fira Code', monospace; font-size: 16px !important; text-align: center; padding-left: 12px !important; }

        .btn-submit{width:100%;padding:13px;background:linear-gradient(135deg,#ff6b2b,#d43200);border:none;border-radius:10px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;transition:all 0.22s;box-shadow:0 8px 24px rgba(255,107,43,0.22)}
        .btn-submit:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,107,43,0.36)}
        .btn-submit:disabled{opacity:0.58;cursor:not-allowed}
        .btn-loading{display:flex;align-items:center;justify-content:center;gap:9px}
        .spinner{width:14px;height:14px;flex-shrink:0;border:2px solid rgba(255,255,255,0.26);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .progress-bar{height:2px;background:rgba(0,245,255,0.06);border-radius:2px;margin-top:13px;overflow:hidden}
        .progress-fill{height:100%;width:35%;background:linear-gradient(90deg,#00f5ff,#ff6b2b);animation:progSlide 1.2s ease-in-out infinite}
        @keyframes progSlide{0%{transform:translateX(-170%)}100%{transform:translateX(400%)}}
        .status-badge{display:flex;align-items:center;gap:6px;justify-content:center;margin-top:15px;font-size:10px;color:rgba(210,230,255,0.22)}
        .status-dot{width:5px;height:5px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;animation:pulse 2.2s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.72)}}
        .footer-note{margin-top:18px;font-size:10px;letter-spacing:0.7px;color:rgba(210,230,255,0.14);text-align:center;animation:fadeUp 0.7s 0.22s cubic-bezier(0.16,1,0.3,1) both}
        @media (max-width:640px){.card{width:calc(100vw - 24px);padding:24px 18px}.brand-name{font-size:40px}}
      `}</style>
    </>
  );
}