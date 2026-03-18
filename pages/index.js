import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/* ── Mini Icon Components ────────────────────────── */
const Icon = ({ path, size = 18, stroke = 'currentColor', fill = 'none', sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const FEATURES = [
  {
    icon: <Icon path={<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>} />,
    label: 'Attendance Tracker',
    desc: 'Track attendance per subject. Know how many classes you can safely skip — or need to attend.',
    color: '#5b5ef4',
    tag: 'Smart Alerts',
    stat: '< 75%',
    statLabel: 'instant warning',
  },
  {
    icon: <Icon path={<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>} />,
    label: 'Marks Analytics',
    desc: 'Visualize your test performance with animated charts and spot weak areas instantly.',
    color: '#00d4ff',
    tag: 'Live Charts',
    stat: '10+',
    statLabel: 'tests tracked',
  },
  {
    icon: <Icon path={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
    label: 'Smart Calendar',
    desc: 'Academic calendar with day orders, holidays, and exam dates color-coded for instant clarity.',
    color: '#10b981',
    tag: 'Day Orders',
    stat: '∞',
    statLabel: 'events tracked',
  },
  {
    icon: <Icon path={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>} />,
    label: 'GPA Calculator',
    desc: 'Calculate SGPA & CGPA using SRM\'s exact grading system. Add subjects, see results instantly.',
    color: '#f59e0b',
    tag: 'SRM Grading',
    stat: '10.0',
    statLabel: 'max CGPA',
  },
];

const STATS = [
  { val: '8,000+', label: 'Students' },
  { val: '99.9%', label: 'Uptime' },
  { val: '< 2s',  label: 'Load time' },
  { val: '4.9★',  label: 'Rating' },
];

/* ── Canvas Particle Mesh ────────────────────────── */
function ParticleMesh() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, particles = [], w, h;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.r = Math.random() * 1.5 + 0.5;
        this.a = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(91,94,244,${this.a})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 60; i++) particles.push(new Particle());

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(91,94,244,${0.12 * (1 - d / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

/* ── Animated Counter ────────────────────────────── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      const num = parseFloat(target.replace(/[^0-9.]/g, ''));
      const dur = 1200, steps = 40;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setVal(+(num * (step / steps)).toFixed(1));
        if (step >= steps) { clearInterval(timer); setVal(num); }
      }, dur / steps);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  const prefix = target.match(/^[^0-9]*/)?.[0] || '';
  const suf = target.match(/[^0-9.]+$/)?.[0] || suffix;
  return <span ref={ref}>{prefix}{val}{suf}</span>;
}

/* ── Attendance Preview Card ─────────────────────── */
const PREVIEW_ATT = [
  { name: 'Data Structures', pct: 91, color: '#10b981' },
  { name: 'OOPS with Java', pct: 76, color: '#f59e0b' },
  { name: 'Digital Electronics', pct: 68, color: '#f43f5e' },
  { name: 'Mathematics III', pct: 84, color: '#10b981' },
  { name: 'Computer Networks', pct: 73, color: '#f59e0b' },
];

function PreviewCard() {
  return (
    <div className="preview-card glass-strong">
      <div className="preview-header">
        <div className="preview-dot-wrap">
          {['#f43f5e','#f59e0b','#10b981'].map((c,i) => (
            <div key={i} className="preview-dot" style={{ background: c }} />
          ))}
        </div>
        <span className="preview-title">campuspro · attendance</span>
      </div>
      <div className="preview-inner">
        <div className="preview-top-row">
          <div className="preview-stat">
            <div className="preview-stat-val" style={{ color:'#10b981' }}>80.4%</div>
            <div className="preview-stat-lbl">Average</div>
          </div>
          <div className="preview-stat">
            <div className="preview-stat-val" style={{ color:'#f43f5e' }}>1</div>
            <div className="preview-stat-lbl">Danger</div>
          </div>
          <div className="preview-stat">
            <div className="preview-stat-val" style={{ color:'#5b5ef4' }}>5</div>
            <div className="preview-stat-lbl">Subjects</div>
          </div>
        </div>
        <div className="preview-list">
          {PREVIEW_ATT.map((a, i) => (
            <div key={i} className="preview-row" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="preview-row-info">
                <span className="preview-row-name">{a.name}</span>
                <div className="progress-track" style={{ flex:1, minWidth:80 }}>
                  <div className="progress-fill" style={{ width:`${a.pct}%`, background:a.color, animationDelay:`${i*0.15}s` }} />
                </div>
              </div>
              <span className="preview-row-pct" style={{ color: a.color }}>{a.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────── */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Head>
        <title>CampusPro — The Ultimate SRM Student Hub</title>
        <meta name="description" content="Track attendance, marks, timetable, and GPA — all in one elegant dashboard built for SRM students." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ── NAV ────────────────────────────────────── */}
      <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-logo">⬡</div>
            <span className="nav-wordmark">Campus<strong>Pro</strong></span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#stats" className="nav-link">Stats</a>
            <Link href="/calculator" className="nav-link">GPA Calc</Link>
          </div>
          <div className="nav-cta">
            <Link href="/login" className="btn btn-ghost" style={{ padding:'8px 18px', fontSize:13 }}>Sign In</Link>
            <Link href="/login" className="btn btn-primary" style={{ padding:'8px 18px', fontSize:13 }}>Get Started →</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── HERO ───────────────────────────────────── */}
        <section className="hero">
          <div className="hero-bg">
            <ParticleMesh />
            <div className="orb orb-a" />
            <div className="orb orb-b" />
            <div className="orb orb-c" />
            <div className="grid-overlay" />
          </div>

          <div className="hero-inner">
            <div className="hero-left animate-fade-up">
              <div className="hero-badge tag tag-accent">
                <div className="live-dot" />
                Built for SRM · KTR Campus
              </div>

              <h1 className="hero-h1">
                Your Academic<br />
                <span className="grad-text">Command Center</span>
              </h1>

              <p className="hero-sub">
                Real-time attendance, marks analytics, smart timetable, and GPA calculation.
                Everything you need to stay ahead — in one obsidian interface.
              </p>

              <div className="hero-actions">
                <Link href="/login" className="btn btn-primary" style={{ fontSize:14, padding:'13px 28px' }}>
                  Launch Dashboard →
                </Link>
                <Link href="/calculator" className="btn btn-ghost" style={{ fontSize:14, padding:'13px 28px' }}>
                  GPA Calculator
                </Link>
              </div>

              <div className="hero-micro">
                <span className="hero-micro-dot" style={{ background:'#10b981' }} />
                <span className="hero-micro-text">Free to use · No data stored · SRM Academia powered</span>
              </div>
            </div>

            <div className="hero-right animate-fade-up delay-2">
              <div className="hero-card-float">
                <PreviewCard />
                <div className="hero-badge-floating badge-f1">
                  <span style={{ fontSize:18 }}>🎯</span>
                  <div>
                    <div className="hbf-label">Safe to miss</div>
                    <div className="hbf-val">3 more classes</div>
                  </div>
                </div>
                <div className="hero-badge-floating badge-f2">
                  <span style={{ fontSize:18 }}>⚠️</span>
                  <div>
                    <div className="hbf-label">Digital Electronics</div>
                    <div className="hbf-val" style={{ color:'#f43f5e' }}>Below 75% !</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ──────────────────────────────────── */}
        <section className="stats-band" id="stats">
          <div className="container">
            <div className="stats-grid">
              {STATS.map((s, i) => (
                <div key={i} className="stat-item animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="stat-val font-mono">
                    <Counter target={s.val} />
                  </div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ───────────────────────────────── */}
        <section className="features-section" id="features">
          <div className="container">
            <div className="section-head animate-fade-up">
              <div className="tag tag-accent" style={{ marginBottom:16 }}>Core Features</div>
              <h2 className="section-title">Everything you need<br />to ace this semester</h2>
              <p className="section-sub">Scraped live from SRM Academia. No manual input required.</p>
            </div>

            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="feature-card glass animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="feat-top">
                    <div className="feat-icon" style={{ color: f.color, background:`${f.color}12`, border:`1px solid ${f.color}22` }}>
                      {f.icon}
                    </div>
                    <span className="tag" style={{ background:`${f.color}12`, color:f.color, border:`1px solid ${f.color}20`, fontSize:10 }}>
                      {f.tag}
                    </span>
                  </div>
                  <div className="feat-label">{f.label}</div>
                  <p className="feat-desc">{f.desc}</p>
                  <div className="feat-divider" />
                  <div className="feat-stat">
                    <span className="feat-stat-val font-mono" style={{ color: f.color }}>{f.stat}</span>
                    <span className="feat-stat-label">{f.statLabel}</span>
                  </div>
                  <div className="feat-glow" style={{ background: `radial-gradient(circle at top left, ${f.color}08, transparent 60%)` }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BAND ───────────────────────────────── */}
        <section className="cta-band">
          <div className="cta-inner glass-strong">
            <div className="cta-orb cta-orb-a" />
            <div className="cta-orb cta-orb-b" />
            <div className="cta-content">
              <h2 className="cta-title">Ready to level up<br /><span className="grad-text">your academics?</span></h2>
              <p className="cta-sub">Sign in with your SRM Academia credentials. We never store your password.</p>
              <div className="cta-actions">
                <Link href="/login" className="btn btn-primary" style={{ fontSize:15, padding:'14px 36px' }}>
                  Open Dashboard →
                </Link>
                <Link href="/calculator" className="btn btn-ghost" style={{ fontSize:15, padding:'14px 36px' }}>
                  Try GPA Calculator
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="nav-brand">
            <div className="nav-logo" style={{ fontSize:12 }}>⬡</div>
            <span className="nav-wordmark" style={{ fontSize:14 }}>Campus<strong>Pro</strong></span>
          </div>
          <p className="footer-note">
            SRM Institute of Science and Technology · KTR Campus
            · Unofficial student tool · Not affiliated with SRMIST
          </p>
          <div className="footer-links">
            <Link href="/login" className="footer-link">Dashboard</Link>
            <Link href="/calculator" className="footer-link">GPA Calc</Link>
            <Link href="/calendar" className="footer-link">Calendar</Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        body { background: var(--bg-void); overflow-x: hidden; }
      `}</style>

      <style jsx>{`
        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: all 0.3s var(--ease-smooth);
          padding: 0 24px;
        }
        .nav-scrolled {
          background: rgba(7,7,16,0.88);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(24px);
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center;
          height: 64px; gap: 32px;
        }
        .nav-brand {
          display: flex; align-items: center; gap: 8px; flex: 0 0 auto;
        }
        .nav-logo {
          font-size: 22px; color: var(--accent);
          filter: drop-shadow(0 0 8px var(--accent-glow));
        }
        .nav-wordmark {
          font-family: var(--font-display); font-size: 16px; color: var(--text-1);
          letter-spacing: -0.3px;
        }
        .nav-wordmark strong { color: var(--accent); }
        .nav-links {
          display: flex; align-items: center; gap: 4px; flex: 1;
          justify-content: center;
        }
        .nav-link {
          padding: 6px 14px; border-radius: var(--radius-sm);
          color: var(--text-2); font-size: 13.5px; font-weight: 450;
          transition: all 0.15s;
        }
        .nav-link:hover { color: var(--text-1); background: var(--bg-elevated); }
        .nav-cta { display: flex; gap: 8px; align-items: center; }

        /* HERO */
        .hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center;
          overflow: hidden; padding-top: 64px;
        }
        .hero-bg {
          position: absolute; inset: 0;
        }
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(100px); pointer-events: none;
          animation: orbDrift 10s ease-in-out infinite alternate;
        }
        .orb-a {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(91,94,244,0.12), transparent 70%);
          top: -200px; left: -100px;
        }
        .orb-b {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(0,212,255,0.07), transparent 70%);
          bottom: -100px; right: 10%;
          animation-delay: -4s; animation-duration: 14s;
        }
        .orb-c {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(245,158,11,0.05), transparent 70%);
          top: 40%; left: 40%;
          animation-delay: -7s; animation-duration: 18s;
        }
        .grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(91,94,244,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91,94,244,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridFlow 30s linear infinite;
        }
        .hero-inner {
          position: relative; max-width: 1200px; margin: 0 auto;
          padding: 80px 24px;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 64px; align-items: center; width: 100%;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 7px;
          margin-bottom: 28px; font-size: 11.5px; font-weight: 600;
          letter-spacing: 0.4px;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--emerald);
          box-shadow: 0 0 6px var(--emerald);
          animation: pulse 2s ease-in-out infinite;
        }
        .hero-h1 {
          font-family: var(--font-display);
          font-size: clamp(40px, 5vw, 62px);
          font-weight: 800; line-height: 1.08;
          letter-spacing: -1.5px; color: var(--text-1);
          margin-bottom: 22px;
        }
        .hero-sub {
          font-size: 16px; line-height: 1.65;
          color: var(--text-2); margin-bottom: 36px;
          max-width: 440px;
        }
        .hero-actions { display: flex; gap: 12px; margin-bottom: 28px; }
        .hero-micro {
          display: flex; align-items: center; gap: 8px;
        }
        .hero-micro-dot {
          width: 5px; height: 5px; border-radius: 50%;
        }
        .hero-micro-text { font-size: 12px; color: var(--text-3); }

        /* PREVIEW CARD */
        .hero-card-float {
          position: relative; animation: float 6s ease-in-out infinite;
        }
        .preview-card {
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(91,94,244,0.12);
        }
        .preview-header {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
        }
        .preview-dot-wrap { display: flex; gap: 5px; }
        .preview-dot {
          width: 9px; height: 9px; border-radius: 50%;
          opacity: 0.7;
        }
        .preview-title {
          font-family: var(--font-mono); font-size: 10px;
          color: var(--text-3); letter-spacing: 0.5px;
        }
        .preview-inner { padding: 18px; }
        .preview-top-row {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 8px; margin-bottom: 18px;
        }
        .preview-stat {
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 10px;
          text-align: center;
        }
        .preview-stat-val {
          font-family: var(--font-mono); font-size: 18px; font-weight: 700;
        }
        .preview-stat-lbl {
          font-size: 9px; color: var(--text-3);
          text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;
        }
        .preview-list { display: flex; flex-direction: column; gap: 9px; }
        .preview-row {
          display: flex; align-items: center; gap: 10px;
          animation: fadeUp 0.4s var(--ease-out) both;
        }
        .preview-row-info {
          flex: 1; display: flex; flex-direction: column; gap: 5px;
        }
        .preview-row-name {
          font-size: 11px; color: var(--text-2); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .preview-row-pct {
          font-family: var(--font-mono); font-size: 13px; font-weight: 600;
          flex-shrink: 0; min-width: 40px; text-align: right;
        }

        /* FLOATING BADGES */
        .hero-badge-floating {
          position: absolute;
          display: flex; align-items: center; gap: 10px;
          background: rgba(16,16,36,0.92);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .badge-f1 { bottom: -24px; left: -28px; animation: float 7s 1s ease-in-out infinite; }
        .badge-f2 { top: -20px; right: -24px; animation: float 8s 2s ease-in-out infinite; }
        .hbf-label { font-size: 10px; color: var(--text-3); }
        .hbf-val { font-size: 12px; color: var(--text-1); font-weight: 600; margin-top: 1px; }

        /* STATS BAND */
        .stats-band {
          padding: 48px 24px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: rgba(91,94,244,0.03);
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .stats-grid {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 32px;
        }
        .stat-item { text-align: center; }
        .stat-val {
          font-size: 42px; font-weight: 600; color: var(--text-1);
          letter-spacing: -1px; line-height: 1;
        }
        .stat-label { font-size: 12px; color: var(--text-3); margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }

        /* FEATURES */
        .features-section { padding: 100px 24px; }
        .section-head { text-align: center; margin-bottom: 64px; }
        .section-title {
          font-family: var(--font-display); font-size: clamp(28px, 4vw, 46px);
          font-weight: 800; letter-spacing: -1px; color: var(--text-1);
          line-height: 1.12; margin-bottom: 16px;
        }
        .section-sub { color: var(--text-2); font-size: 15px; }
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr));
          gap: 16px;
        }
        .feature-card {
          border-radius: var(--radius-lg); padding: 24px;
          position: relative; overflow: hidden;
          transition: transform 0.25s var(--ease-smooth), border-color 0.25s, box-shadow 0.25s;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          border-color: var(--border-strong);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .feat-glow {
          position: absolute; inset: 0; pointer-events: none;
        }
        .feat-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 16px;
        }
        .feat-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .feat-label {
          font-family: var(--font-display); font-size: 17px; font-weight: 700;
          color: var(--text-1); margin-bottom: 10px;
        }
        .feat-desc { font-size: 13px; color: var(--text-2); line-height: 1.65; }
        .feat-divider { height: 1px; background: var(--border); margin: 18px 0; }
        .feat-stat { display: flex; align-items: baseline; gap: 6px; }
        .feat-stat-val { font-size: 24px; font-weight: 700; }
        .feat-stat-label { font-size: 11px; color: var(--text-3); }

        /* CTA BAND */
        .cta-band { padding: 80px 24px; }
        .cta-inner {
          max-width: 900px; margin: 0 auto;
          border-radius: 28px; padding: 64px;
          position: relative; overflow: hidden;
          text-align: center;
          box-shadow: 0 0 0 1px var(--accent-border), var(--shadow-accent);
        }
        .cta-orb {
          position: absolute; border-radius: 50%; filter: blur(80px);
          pointer-events: none;
        }
        .cta-orb-a {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(91,94,244,0.18), transparent 70%);
          top: -100px; left: -100px;
        }
        .cta-orb-b {
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(0,212,255,0.1), transparent 70%);
          bottom: -80px; right: -60px;
        }
        .cta-content { position: relative; z-index: 1; }
        .cta-title {
          font-family: var(--font-display); font-size: clamp(28px, 4vw, 42px);
          font-weight: 800; letter-spacing: -0.8px; margin-bottom: 16px;
        }
        .cta-sub { color: var(--text-2); font-size: 15px; margin-bottom: 36px; }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* FOOTER */
        .footer { padding: 40px 24px; border-top: 1px solid var(--border); }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; text-align: center;
        }
        .footer-note { font-size: 12px; color: var(--text-3); max-width: 480px; }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 12px; color: var(--text-3); transition: color 0.15s; }
        .footer-link:hover { color: var(--text-1); }

        /* Responsive */
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; gap: 48px; padding: 60px 20px; }
          .hero-right { display: none; }
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .cta-inner { padding: 40px 24px; }
        }
        @media (max-width: 600px) {
          .nav-links { display: none; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2,1fr); gap: 20px; }
          .hero-actions { flex-direction: column; }
        }
      `}</style>
    </>
  );
}
