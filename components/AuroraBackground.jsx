import { useEffect, useRef } from 'react';

const ORBS = [
  { x:.15, y:.25, r:.60, vx: .00018, vy: .00012, h:248, s:85, l:52, a:.10, phase:0.0 },
  { x:.78, y:.12, r:.55, vx:-.00014, vy: .00016, h:270, s:90, l:58, a:.09, phase:1.2 },
  { x:.45, y:.82, r:.65, vx: .00010, vy:-.00013, h:195, s:88, l:52, a:.08, phase:2.4 },
  { x:.88, y:.60, r:.50, vx:-.00016, vy:-.00014, h:312, s:82, l:52, a:.08, phase:0.8 },
  { x:.22, y:.70, r:.45, vx: .00020, vy: .00010, h:222, s:78, l:57, a:.07, phase:3.1 },
  { x:.62, y:.42, r:.40, vx:-.00012, vy: .00018, h:262, s:87, l:62, a:.06, phase:1.7 },
  { x:.50, y:.15, r:.38, vx: .00014, vy: .00012, h:285, s:80, l:55, a:.06, phase:2.0 },
];

const RINGS = [
  { r:.38, count:56, speed: .0018, wobble:12, a:.04, hue:248 },
  { r:.28, count:36, speed:-.0025, wobble: 6, a:.03, hue:270 },
  { r:.50, count:70, speed: .0011, wobble:18, a:.025, hue:220 },
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
    a: 0.04 + Math.random() * 0.08,
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

    function resize() {
      canvas.width  = canvas.offsetWidth  || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    }

    function draw() {
      t += 0.4;
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafId = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      // Stars
      stars.forEach(s => {
        s.tw += s.ts;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 80%, 80%, ${(0.1 + Math.abs(Math.sin(s.tw)) * s.a).toFixed(2)})`;
        ctx.fill();
      });

      // Lines
      lines.forEach(l => {
        l.phase += l.speed;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 30) {
          const y = (l.y0 * H) + Math.sin(x * l.freq + l.phase) * l.amp * H;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${l.hue}, 70%, 65%, ${l.a})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Orbs
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -0.2 || o.x > 1.2) o.vx *= -1;
        if (o.y < -0.2 || o.y > 1.2) o.vy *= -1;
        const grad = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r * W);
        grad.addColorStop(0, `hsla(${o.h}, ${o.s}%, ${o.l}%, ${o.a})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -0.1) { p.y = 1.1; p.x = Math.random(); }
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 75%, ${p.a})`;
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        background: '#0b0c14',
      }}
    />
  );
}
