"use client";

import { useEffect, useRef } from "react";

export default function PocketFrogs() {
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

    const frogs = Array.from({ length: 5 }, (_, i) => ({
      x: 120 + Math.random() * (w - 240),
      y: h * 0.66 + Math.random() * 20,
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

    const drawFrog = (f: typeof frogs[0]) => {
      const breathe = 1 + Math.sin(t * 1.25 + f.phase) * 0.06;
      const blink = !f.jumping && Math.sin(t * 2.0 + f.phase) > 0.9;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(breathe, 1);

      // pear body — wider at hips
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#68b84c";
      ctx.fillText("(====)", -28, -4);
      ctx.fillText("(     )", -30, 12);
      ctx.fillText(" \\___/ ", -28, 26);

      // pale ridges
      ctx.fillStyle = "#cee296";
      ctx.fillText("~", -8, 6);
      ctx.fillText("~", 2, 10);

      // spots with halo
      ctx.fillStyle = "#bee28a";
      ctx.fillText("o", -12, 4);
      ctx.fillText("o", 6, 10);
      ctx.fillStyle = "#1e461e";
      ctx.fillText("•", -11, 4);
      ctx.fillText("•", 7, 10);

      // single-cell eyes
      ctx.fillStyle = "#f0f0e4";
      ctx.fillText(blink ? "-" : "●", -18, -10);
      ctx.fillText(blink ? "-" : "●", 6, -10);

      // Z-folded legs at rest / kicked when leaping
      ctx.fillStyle = "#5ca442";
      if (f.jumping) {
        ctx.fillText("/   \\", -18, 34);
        ctx.fillText("\\   /", -18, 48);
      } else {
        ctx.fillText("/\\  /\\", -22, 32);
        ctx.fillText("  \\/  ", -14, 46);
      }

      ctx.restore();
    };

    const draw = () => {
      t += 0.016;
      ctx.fillStyle = "#081208";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#1a3a1a";
      ctx.fillRect(0, h * 0.82, w, h * 0.18);
      ctx.strokeStyle = "#2a5a2a";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.82);
      ctx.lineTo(w, h * 0.82);
      ctx.stroke();

      frogs.forEach((f) => {
        if (!f.jumping && Math.random() < 0.004) {
          f.jumping = true;
          f.jumpT = 0;
          f.startX = f.x;
          f.startY = f.y;
          f.vx = (Math.random() - 0.5) * 150;
        }

        if (f.jumping) {
          f.jumpT += 0.016;
          const s = f.jumpT;
          const hArc = 4 * s * (1 - s) * 110;
          f.x = f.startX + f.vx * s;
          f.y = f.startY - hArc;
          if (s >= 1) {
            f.jumping = false;
            f.splash = 1;
            f.y = Math.min(f.y, h * 0.74);
          }
        } else {
          f.y += Math.sin(t * 1.1 + f.phase) * 0.3;
        }

        if (f.splash > 0) {
          f.splash -= 0.02;
          ctx.font = "14px monospace";
          ctx.fillStyle = `rgba(140,200,140,${Math.max(0, f.splash)})`;
          ctx.fillText("~ ~ ~", f.x - 20, f.y + 55);
        }

        drawFrog(f);
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
