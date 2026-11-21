"use client";

import { useEffect, useRef } from "react";

const FROG = [
  "  @..@  ",
  " (----) ",
  "( >__< )",
  "^^ ~~ ^^",
];

export default function AsciiFrogs() {
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

    const frogs = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * (w - 80),
      y: h * 0.55 + Math.random() * (h * 0.3),
      phase: Math.random() * Math.PI * 2,
      jump: 0,
      vx: 0,
      vy: 0,
    }));

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 0.016;
      ctx.fillStyle = "#0a1a0a";
      ctx.fillRect(0, 0, w, h);

      // ground
      ctx.fillStyle = "#1a3a1a";
      ctx.fillRect(0, h * 0.75, w, h * 0.25);

      ctx.font = "14px monospace";
      ctx.textAlign = "left";

      frogs.forEach((f, i) => {
        // occasional jump
        if (Math.random() < 0.008 && f.jump === 0) {
          f.jump = 1;
          f.vy = -4 - Math.random() * 2;
          f.vx = (Math.random() - 0.5) * 3;
        }
        if (f.jump > 0) {
          f.x += f.vx;
          f.y += f.vy;
          f.vy += 0.18;
          f.jump += 1;
          if (f.y > h * 0.55 + 40 || f.jump > 40) {
            f.jump = 0;
            f.vy = 0;
            f.vx = 0;
            f.y = Math.min(f.y, h * 0.7);
          }
        } else {
          // idle breathe
          f.y += Math.sin(t * 1.5 + f.phase) * 0.3;
        }

        // blink
        const blink = Math.sin(t * 2 + f.phase) > 0.92;
        const lines = blink
          ? ["  @..@  ", " (----) ", "( -__- )", "^^ ~~ ^^"]
          : FROG;

        const breathe = Math.sin(t * 1.2 + f.phase) * 0.5;
        ctx.fillStyle = "#7cfc7c";
        lines.forEach((line, li) => {
          ctx.fillText(line, f.x, f.y + li * 16 + breathe);
        });

        // spots
        if (!blink) {
          ctx.fillStyle = "#4a9a4a";
          ctx.fillText("·", f.x + 12, f.y + 18);
          ctx.fillText("·", f.x + 36, f.y + 20);
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
