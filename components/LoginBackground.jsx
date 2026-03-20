import { useEffect, useRef } from 'react';

export default function LoginBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId, t = 0;

    const nodes = Array.from({ length: 60 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      r: 1 + Math.random() * 2,
      a: 0.3 + Math.random() * 0.6,
      hue: 180 + Math.random() * 60,
    }));

    const hexagons = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      size: 40 + Math.random() * 80,
      rot: Math.random() * Math.PI,
      speed: 0.0003 + Math.random() * 0.0004,
      a: 0.03 + Math.random() * 0.05,
      hue: 200 + Math.random() * 40,
    }));

    function resize() {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    }

    function drawHex(cx, cy, size, rot) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = rot + (i * Math.PI) / 3;
        const px = cx + size * Math.cos(angle);
        const py = cy + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    function draw() {
      t += 0.4;
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafId = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      // Hexagon grid
      hexagons.forEach(h => {
        h.rot += h.speed;
        drawHex(h.x * W, h.y * H, h.size * (1 + 0.05 * Math.sin(t * 0.02 + h.x * 10)), h.rot);
        ctx.strokeStyle = `hsla(${h.hue},80%,60%,${h.a * (0.5 + 0.5 * Math.sin(t * 0.015 + h.y * 8))})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Node connections
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x * W, a.y * H);
            ctx.lineTo(b.x * W, b.y * H);
            ctx.strokeStyle = `rgba(0,220,255,${(1 - dist / 130) * 0.12})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${n.hue},90%,75%,${n.a})`;
        ctx.shadowColor = `hsla(${n.hue},90%,75%,0.8)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Scan line
      const scanY = ((t * 1.2) % (H + 40)) - 20;
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrad.addColorStop(0, 'rgba(0,220,255,0)');
      scanGrad.addColorStop(0.5, 'rgba(0,220,255,0.04)');
      scanGrad.addColorStop(1, 'rgba(0,220,255,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 40, W, 80);

      // Corner brackets (decorative)
      ctx.strokeStyle = 'rgba(0,220,255,0.15)';
      ctx.lineWidth = 1.5;
      [[20,20],[W-20,20],[20,H-20],[W-20,H-20]].forEach(([cx,cy],i) => {
        const sx = i%2===0?1:-1, sy = i<2?1:-1;
        ctx.beginPath(); ctx.moveTo(cx,cy+sy*20); ctx.lineTo(cx,cy); ctx.lineTo(cx+sx*20,cy); ctx.stroke();
      });

      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden="true" style={{
      position:'fixed', inset:0, width:'100%', height:'100%',
      zIndex:0, pointerEvents:'none', display:'block'
    }} />
  );
}
