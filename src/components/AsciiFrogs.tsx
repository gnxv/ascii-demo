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

    const frogs = Array.from({ length: 6 }, (_, i) => ({
      x: 100 + Math.random() * (w - 200),
      y: h * 0.64 + Math.random() * 30,
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
      const breathe = 1 + Math.sin(t * 1.3 + f.phase) * 0.05;
      const blink = !f.jumping && Math.sin(t * 2.1 + f.phase) > 0.88;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(breathe, 1);

      // pear-shaped body (wider hips)
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#68b84c";
      ctx.fillText("(====)", -26, -2);
      ctx.fillText("(     )", -28, 12);
      ctx.fillText(" \\___/ ", -26, 24);

      // spots with pale halo
      ctx.fillStyle = "#bee28a";
      ctx.fillText("·", -10, 4);
      ctx.fillText("·", 4, 8);
      ctx.fillStyle = "#1e461e";
      ctx.fillText("•", -9, 4);
      ctx.fillText("•", 5, 8);

      // single-cell eyes
      ctx.fillStyle = "#f0f0e4";
      ctx.fillText(blink ? "-" : "●", -16, -8);
      ctx.fillText(blink ? "-" : "●", 4, -8);

      // legs: Z-folded at rest, kicked when leaping
      ctx.fillStyle = "#5ca442";
      if (f.jumping) {
        ctx.fillText("/   \\", -16, 32);
        ctx.fillText("\\   /", -16, 44);
      } else {
        ctx.fillText("/\\  /\\", -20, 30);
        ctx.fillText("  \\/  ", -12, 42);
      }

      ctx.restore();
    };

    const draw = () => {
      t += 0.016;
      ctx.fillStyle = "#0a1a0a";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#1a3a1a";
      ctx.fillRect(0, h * 0.8, w, h * 0.2);
      ctx.strokeStyle = "#2a5a2a";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.8);
      ctx.lineTo(w, h * 0.8);
      ctx.stroke();

      frogs.forEach((f) => {
        if (!f.jumping && Math.random() < 0.005) {
          f.jumping = true;
          f.jumpT = 0;
          f.startX = f.x;
          f.startY = f.y;
          f.vx = (Math.random() - 0.5) * 160;
        }

        if (f.jumping) {
          f.jumpT += 0.018;
          const s = f.jumpT;
          const hArc = 4 * s * (1 - s) * 100;
          f.x = f.startX + f.vx * s;
          f.y = f.startY - hArc;
          if (s >= 1) {
            f.jumping = false;
            f.splash = 1;
            f.y = Math.min(f.y, h * 0.72);
          }
        } else {
          f.y += Math.sin(t * 1.2 + f.phase) * 0.35;
        }

        if (f.splash > 0) {
          f.splash -= 0.025;
          ctx.font = "13px monospace";
          ctx.fillStyle = `rgba(140,200,140,${Math.max(0, f.splash)})`;
          ctx.fillText("~ ~ ~", f.x - 18, f.y + 50);
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
