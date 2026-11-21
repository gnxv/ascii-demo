"use client";

import { useEffect, useRef } from "react";

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

    const frogs = Array.from({ length: 7 }, (_, i) => ({
      x: 80 + Math.random() * (w - 160),
      y: h * 0.62 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
      jumpT: 0,
      jumping: false,
      vx: 0,
      startX: 0,
      startY: 0,
      splash: 0,
    }));

    let raf = 0;
    let t = 0;

    const drawFrog = (f: typeof frogs[0], t: number) => {
      const breathe = 1 + Math.sin(t * 1.4 + f.phase) * 0.04;
      const blink = !f.jumping && Math.sin(t * 2.2 + f.phase) > 0.9;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(breathe, 1);

      // body
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#68b84c";
      ctx.fillText("(====)", -28, 0);
      ctx.fillText("/     \\", -32, 14);

      // spots
      ctx.fillStyle = "#1e461e";
      ctx.fillText("·", -12, -2);
      ctx.fillText("·", 6, 2);
      ctx.fillText("·", -4, 10);

      // eyes
      ctx.fillStyle = "#f0f0e4";
      ctx.fillText(blink ? "-" : "●", -18, -10);
      ctx.fillText(blink ? "-" : "●", 6, -10);

      // legs
      ctx.fillStyle = "#5ca442";
      if (f.jumping) {
        ctx.fillText("/  \\", -14, 22);
        ctx.fillText("\\  /", -14, 36);
      } else {
        ctx.fillText("/\\  /\\", -20, 22);
        ctx.fillText("  \\/  ", -12, 34);
      }

      ctx.restore();
    };

    const draw = () => {
      t += 0.016;
      ctx.fillStyle = "#0a1a0a";
      ctx.fillRect(0, 0, w, h);

      // ground / water line
      ctx.fillStyle = "#1a3a1a";
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
      ctx.strokeStyle = "#2a5a2a";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.78);
      ctx.lineTo(w, h * 0.78);
      ctx.stroke();

      frogs.forEach((f) => {
        if (!f.jumping && Math.random() < 0.006) {
          f.jumping = true;
          f.jumpT = 0;
          f.startX = f.x;
          f.startY = f.y;
          f.vx = (Math.random() - 0.5) * 180;
        }

        if (f.jumping) {
          f.jumpT += 0.02;
          const s = f.jumpT;
          const hArc = 4 * s * (1 - s) * 90;
          f.x = f.startX + f.vx * s;
          f.y = f.startY - hArc;
          if (s >= 1) {
            f.jumping = false;
            f.splash = 1;
            f.y = Math.min(f.y, h * 0.7);
          }
        } else {
          f.y += Math.sin(t * 1.3 + f.phase) * 0.4;
        }

        if (f.splash > 0) {
          f.splash -= 0.03;
          ctx.font = "14px monospace";
          ctx.fillStyle = `rgba(140,200,140,${f.splash})`;
          ctx.fillText("~ ~ ~", f.x - 20, f.y + 40);
        }

        drawFrog(f, t);
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
