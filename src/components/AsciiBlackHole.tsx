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
    for (let i = 0; i < 220; i++) {
      const r = 50 + Math.random() * 160;
      particles.push({
        a: Math.random() * Math.PI * 2,
        r,
        speed: 0.8 / Math.pow(r / 40, 1.5), // Keplerian
        char: "·•○●~≈"[Math.floor(Math.random() * 6)],
      });
    }

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 0.016;
      const cx = w / 2;
      const cy = h / 2;
      const horizon = 38;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // accretion disk particles
      ctx.font = "14px monospace";
      particles.forEach((p) => {
        p.a += p.speed * 0.018;
        const wobble = Math.sin(t * 0.6 + p.r * 0.015) * 6;
        const x = cx + Math.cos(p.a) * (p.r + wobble);
        const y = cy + Math.sin(p.a) * (p.r * 0.38 + wobble * 0.25);
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < horizon + 4) return;

        const alpha = Math.max(0.08, 1 - dist / 240);
        // Doppler: approaching side brighter/bluer
        const doppler = Math.cos(p.a) * 0.3;
        const hue = 28 + doppler * 40;
        const light = 55 + doppler * 20;
        ctx.fillStyle = `hsla(${hue}, 75%, ${light}%, ${alpha})`;
        ctx.fillText(p.char, x, y);
      });

      // event horizon
      ctx.font = "15px monospace";
      ctx.fillStyle = "#000";
      for (let r = 0; r < horizon; r += 4) {
        const pts = 6 + Math.floor(r * 0.4);
        for (let i = 0; i < pts; i++) {
          const ang = (i / pts) * Math.PI * 2;
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r * 0.55;
          ctx.fillText("█", x, y);
        }
      }

      // photon ring
      ctx.fillStyle = "rgba(255,210,120,0.7)";
      for (let i = 0; i < 36; i++) {
        const ang = (i / 36) * Math.PI * 2 + t * 0.4;
        const x = cx + Math.cos(ang) * (horizon + 10);
        const y = cy + Math.sin(ang) * (horizon * 0.55 + 6);
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
