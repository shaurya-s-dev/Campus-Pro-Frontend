import { useEffect, useRef } from 'react';

const ORBS = [
  { x:.15, y:.25, r:.60, vx: .00018, vy: .00012, h:248, s:85, l:52, a:.10, phase:0.0 }, // was .16
  { x:.78, y:.12, r:.55, vx:-.00014, vy: .00016, h:270, s:90, l:58, a:.09, phase:1.2 }, // was .14
  { x:.45, y:.82, r:.65, vx: .00010, vy:-.00013, h:195, s:88, l:52, a:.08, phase:2.4 }, // was .12
  { x:.88, y:.60, r:.50, vx:-.00016, vy:-.00014, h:312, s:82, l:52, a:.08, phase:0.8 }, // was .13
  { x:.22, y:.70, r:.45, vx: .00020, vy: .00010, h:222, s:78, l:57, a:.07, phase:3.1 }, // was .11
  { x:.62, y:.42, r:.40, vx:-.00012, vy: .00018, h:262, s:87, l:62, a:.06, phase:1.7 }, // was .10
  { x:.50, y:.15, r:.38, vx: .00014, vy: .00012, h:285, s:80, l:55, a:.06, phase:2.0 }, // was .09
];

const RINGS = [
  { r:.38, count:56, speed: .0018, wobble:12, a:.04, hue:248 }, // was .07
  { r:.28, count:36, speed:-.0025, wobble: 6, a:.03, hue:270 }, // was .05
  { r:.50, count:70, speed: .0011, wobble:18, a:.025, hue:220 }, // was .04
];

function makeStars(n) {
  return Array.from({ length: n }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.4 + 0.2,
    tw: Math.random() * Math.PI * 2,
    ts: 0.004 + Math.random() * 0.012,
    a: 0.08 + Math.random() * 0.55,
    hue: 200 + Math.random() * 80,
  }));
}

function makeLines(n) {
  return Array.from({ length: n }, (_, i) => ({
    y0: 0.1 + i * 0.11,
    amp: 0.04 + Math.random() * 0.06,
    freq: 0.003 + Math.random() * 0.002,
    speed: 0.0004 + Math.random() * 0.0003,
    phase: Math.random() * Math.PI * 2,
    hue: 240 + i * 12,
    a: 0.022 + Math.random() * 0.018,
  }));
}

function makeParticles(n) {
  return Array.from({ length: n }, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0004,
    vy: -0.0003 - Math.random() * 0.0004,
    r: 0.8 + Math.random() * 2,
    a: 0.04 + Math.random() * 0.08, // was 0.06 + Math.random() * 0.18
    hue: 220 + Math.random() * 80,
  }));
}

export default function AuroraBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof document === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const orbs      = ORBS.map(o => ({ ...o }));
    const rings     = RINGS.map(r => ({ ...r }));
    const stars     = makeStars(120);
    const lines     = makeLines(8);
    const particles = makeParticles(55);
    const shoots    = [];
    let t = 0, shootTimer = 0, rafId;

    function spawnShoot() {
      shoots.push({
        x: Math.random() * 0.7 + 0.15,
        y: Math.random() * 0.3,
        angle: Math.PI / 6 + Math.random() * 0.3,
        speed: 4 + Math.random() * 4,
        life: 1,
        decay: 0.018 + Math.random() * 0.012,
      });
    }

    function resize() {
      canvas.width  = canvas.offsetWidth  || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    }

    function draw() {
      t += 0.4;
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafId = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      // — Stars —
      stars.forEach(s => {
        s.tw += s.ts;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},70%,85%,${s.a * (0.4 + 0.6 * Math.sin(s.tw))})`;
        ctx.fill();
      });

      // — Aurora orbs —
      orbs.forEach(o => {
        o.x += o.vx * (1 + 0.3 * Math.sin(t * 0.007 + o.phase));
        o.y += o.vy * (1 + 0.3 * Math.cos(t * 0.009 + o.phase));
        if (o.x < -0.15 || o.x > 1.15) o.vx *= -1;
        if (o.y < -0.15 || o.y > 1.15) o.vy *= -1;
        const hs = Math.sin(t * 0.004 + o.phase) * 20;
        const cx = o.x * W, cy = o.y * H;
        const rad = o.r * Math.max(W, H) * (1 + 0.06 * Math.sin(t * 0.008 + o.phase));
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0,    `hsla(${o.h+hs},${o.s}%,${o.l}%,${o.a})`);
        g.addColorStop(0.40, `hsla(${o.h+hs+15},${o.s}%,${o.l-8}%,${o.a*0.5})`);
        g.addColorStop(0.75, `hsla(${o.h+hs+30},${o.s}%,${o.l-18}%,${o.a*0.15})`);
        g.addColorStop(1,    `hsla(${o.h+hs+50},${o.s}%,${o.l-25}%,0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // — Flowing wave lines —
      lines.forEach(l => {
        l.phase += l.speed;
        ctx.beginPath();
        for (let px = 0; px <= W; px += 4) {
          const nx = px / W;
          const ny = l.y0
            + Math.sin(nx * l.freq * W + t * l.speed * 300 + l.phase) * l.amp
            + Math.sin(nx * l.freq * W * 0.7 + t * l.speed * 200) * l.amp * 0.4;
          px === 0 ? ctx.moveTo(px, ny * H) : ctx.lineTo(px, ny * H);
        }
        ctx.strokeStyle = `hsla(${l.hue},80%,70%,${l.a * (0.5 + 0.5 * Math.sin(t * 0.006 + l.phase))})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // — Dot grid —
      ctx.strokeStyle = 'rgba(99,102,241,0.035)';
      ctx.lineWidth = 0.5;
      const gs = 44;
      for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // — Particle rings (elliptical, counter-rotating) —
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      rings.forEach(ring => {
        const rPx = ring.r * Math.min(W, H);
        for (let i = 0; i < ring.count; i++) {
          const angle = (i / ring.count) * Math.PI * 2 + t * ring.speed;
          const wobble = Math.sin(t * 0.012 + i * 0.28) * ring.wobble;
          const px = Math.cos(angle) * (rPx + wobble);
          const py = Math.sin(angle) * (rPx + wobble) * 0.6;
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${ring.hue},80%,75%,${ring.a * (0.4 + 0.6 * Math.sin(t * 0.018 + i * 0.35))})`;
          ctx.fill();
        }
      });
      ctx.restore();

      // — Rising particles —
      particles.forEach(p => {
        p.x += p.vx + Math.sin(t * 0.005 + p.x * 10) * 0.0001;
        p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},70%,75%,${p.a})`;
        ctx.fill();
      });

      // — Shooting stars —
      shootTimer++;
      if (shootTimer > 90 + Math.random() * 120) { shootTimer = 0; spawnShoot(); }
      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i];
        s.life -= s.decay;
        if (s.life <= 0) { shoots.splice(i, 1); continue; }
        const ex = s.x * W + Math.cos(s.angle) * s.speed * 20;
        const ey = s.y * H + Math.sin(s.angle) * s.speed * 20;
        const g2 = ctx.createLinearGradient(s.x * W, s.y * H, ex, ey);
        g2.addColorStop(0,   'rgba(200,210,255,0)');
        g2.addColorStop(0.5, `rgba(200,210,255,${s.life * 0.35})`);
        g2.addColorStop(1,   'rgba(200,210,255,0)');
        ctx.beginPath();
        ctx.moveTo(s.x * W, s.y * H);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = g2;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        s.x += Math.cos(s.angle) * s.speed / W * 2;
        s.y += Math.sin(s.angle) * s.speed / H * 2;
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
