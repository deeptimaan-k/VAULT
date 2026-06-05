import React, { useEffect, useRef } from "react";

interface Node {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
}

const PALETTE = [
  "rgba(124,58,237,", // violet
  "rgba(99,102,241,", // indigo
  "rgba(6,182,212,",  // cyan
  "rgba(139,92,246,", // purple
];

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const nodes: Node[] = [];
    const N = 75;
    const MAX_D = 140;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < N; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.8 + 0.4,
        color: PALETTE[i % PALETTE.length],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < N; i++) {
        const p = nodes[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Node dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "0.7)";
        ctx.fill();

        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        grd.addColorStop(0, p.color + "0.12)");
        grd.addColorStop(1, p.color + "0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Connections
        for (let j = i + 1; j < N; j++) {
          const q = nodes[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_D) {
            const alpha = (1 - d / MAX_D) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Deep gradient backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(6,182,212,0.08) 0%, transparent 60%), #000008" }}
      />
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.55 }} />
      {/* Scanline sweep */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 right-0 h-px opacity-20"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), rgba(6,182,212,0.8), transparent)",
            animation: "scan 8s linear infinite",
            top: 0,
          }}
        />
      </div>
    </>
  );
}
