"use client";

import { useEffect, useRef } from "react";

export default function AsciiJellyfish() {
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

    const jellies = Array.from({ length: 3 }, (_, j) => ({
      x: w * 0.25 + j * w * 0.25,
      y: h * 0.32 + Math.sin(j) * 30,
      phase: j * 1.8,
      rings: 6,
      pts: 18,
      tentacles: 10,
    }));

    const dust = Array.from({ length: 50 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      s: 0.3 + Math.random() * 0.5,
    }));

    let raf = 0;
    let t = 0;
    const bellChars = ["~", "≈", "∿", "∼", "·", "•"];
    const tentChars = ["~", "∼", "∿", "≈", "·"];

    const draw = () => {
      t += 0.016;
      ctx.fillStyle = "#04040a";
      ctx.fillRect(0, 0, w, h);

      // dust
      ctx.font = "11px monospace";
      ctx.fillStyle = "rgba(180,210,255,0.25)";
      dust.forEach((d) => {
        d.y += d.s;
        if (d.y > h) d.y = 0;
        ctx.fillText("·", d.x, d.y);
      });

      ctx.font = "15px monospace";
      jellies.forEach((jelly) => {
        const pulse = 1 + Math.sin(t * 1.5 + jelly.phase) * 0.16;
        const cx = jelly.x + Math.sin(t * 0.25 + jelly.phase) * 25;
        const cy = jelly.y + Math.cos(t * 0.2 + jelly.phase) * 18;

        // bell rings
        for (let r = 0; r < jelly.rings; r++) {
          const rad = (22 + r * 7) * pulse;
          const alpha = 0.5 + Math.sin(t * 2 + r) * 0.2;
          ctx.fillStyle = `rgba(186,130,255,${alpha})`;
          for (let p = 0; p < jelly.pts; p++) {
            const ang = (p / jelly.pts) * Math.PI * 2 + t * 0.12;
            const x = cx + Math.cos(ang) * rad;
            const y = cy - Math.sin(ang) * rad * 0.5 - r * 4;
            const ch = bellChars[(r + p + (t * 4) | 0) % bellChars.length];
            ctx.fillText(ch, x, y);
          }
        }

        // tentacles
        for (let k = 0; k < jelly.tentacles; k++) {
          const ang = (k / jelly.tentacles) * Math.PI * 2;
          let px = cx + Math.cos(ang) * 28 * pulse;
          let py = cy + 18;
          for (let s = 0; s < 14; s++) {
            const wave = Math.sin(t * 1.5 + k + s * 0.4) * 6;
            px += wave * 0.15;
            py += 11;
            const alpha = 0.65 - s * 0.035;
            ctx.fillStyle = `rgba(160,120,255,${Math.max(0.08, alpha)})`;
            const ch = tentChars[(k + s + (t * 3) | 0) % tentChars.length];
            ctx.fillText(ch, px, py);
          }
        }
      });

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
