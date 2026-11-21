"use client";

import { useEffect, useRef } from "react";

export default function AsciiBlackHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    canvas.width = w;
    canvas.height = h;

    const particles: { a: number; r: number; speed: number; char: string }[] = [];
    for (let i = 0; i < 180; i++) {
      particles.push({
        a: Math.random() * Math.PI * 2,
        r: 40 + Math.random() * 180,
        speed: 0.3 + Math.random() * 1.2,
        char: "·•○●~≈"[Math.floor(Math.random() * 6)],
      });
    }

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 0.016;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // accretion disk particles
      ctx.font = "14px monospace";
      particles.forEach((p) => {
        p.a += p.speed * 0.012;
        const wobble = Math.sin(t * 0.8 + p.r * 0.02) * 8;
        const x = cx + Math.cos(p.a) * (p.r + wobble);
        const y = cy + Math.sin(p.a) * (p.r * 0.35 + wobble * 0.3);
        const dist = Math.hypot(x - cx, y - cy);
        const alpha = Math.max(0.05, 1 - dist / 220);
        const hue = 200 + (p.r % 80);
        ctx.fillStyle = `hsla(${hue}, 70%, 65%, ${alpha})`;
        ctx.fillText(p.char, x, y);
      });

      // event horizon
      ctx.font = "16px monospace";
      ctx.fillStyle = "#000";
      for (let r = 0; r < 28; r++) {
        const pts = 8 + r * 2;
        for (let i = 0; i < pts; i++) {
          const ang = (i / pts) * Math.PI * 2;
          const x = cx + Math.cos(ang) * (r * 1.6);
          const y = cy + Math.sin(ang) * (r * 0.7);
          ctx.fillText("█", x, y);
        }
      }

      // photon ring
      ctx.fillStyle = "rgba(255,220,140,0.6)";
      for (let i = 0; i < 40; i++) {
        const ang = (i / 40) * Math.PI * 2 + t * 0.5;
        const x = cx + Math.cos(ang) * 46;
        const y = cy + Math.sin(ang) * 20;
        ctx.fillText("·", x, y);
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
