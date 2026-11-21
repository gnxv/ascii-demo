"use client";

import { useEffect, useRef } from "react";

export default function AsciiMoon() {
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

    // crater positions relative to moon center
    const craters = [
      { x: -0.25, y: -0.15, r: 0.18 },
      { x: 0.15, y: 0.1, r: 0.22 },
      { x: 0.05, y: -0.3, r: 0.12 },
      { x: -0.1, y: 0.28, r: 0.15 },
      { x: 0.3, y: -0.05, r: 0.1 },
      { x: -0.3, y: 0.2, r: 0.08 },
    ];

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 0.008;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.32;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // stars
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(200,200,220,0.4)";
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137.5) % w;
        const sy = (i * 89.3) % h;
        if (Math.hypot(sx - cx, sy - cy) > radius + 20) {
          ctx.fillText("·", sx, sy);
        }
      }

      // moon surface
      ctx.font = "13px monospace";
      const step = 10;
      for (let y = -radius; y < radius; y += step) {
        for (let x = -radius; x < radius; x += step) {
          const d = Math.hypot(x, y);
          if (d > radius) continue;

          // terminator (phase shift over time)
          const phase = Math.sin(t * 0.3) * 0.4;
          const lit = x / radius > phase - 0.15;

          // crater check
          let inCrater = false;
          for (const c of craters) {
            const cxr = c.x * radius;
            const cyr = c.y * radius;
            if (Math.hypot(x - cxr, y - cyr) < c.r * radius) {
              inCrater = true;
              break;
            }
          }

          const px = cx + x;
          const py = cy + y;
          if (!lit) {
            ctx.fillStyle = "#1a1a22";
            ctx.fillText("░", px, py);
          } else if (inCrater) {
            ctx.fillStyle = "#888";
            ctx.fillText("▒", px, py);
          } else {
            const shade = 180 + Math.sin(d * 0.05) * 20;
            ctx.fillStyle = `rgb(${shade},${shade},${shade + 10})`;
            ctx.fillText("█", px, py);
          }
        }
      }

      // soft limb darkening
      ctx.font = "12px monospace";
      for (let a = 0; a < Math.PI * 2; a += 0.08) {
        const x = cx + Math.cos(a) * (radius + 6);
        const y = cy + Math.sin(a) * (radius + 6);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
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
