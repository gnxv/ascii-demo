"use client";

import { useEffect, useRef } from "react";

export default function AsciiFrogs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = useRef(true);

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
      x: 140 + Math.random() * (w - 280),
      y: h * 0.68 + Math.random() * 15,
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
      const breathe = 1 + Math.sin(t * 1.2 + f.phase) * 0.07;
      const blink = !f.jumping && Math.sin(t * 1.9 + f.phase) > 0.92;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(breathe, 1);

      // body — pear, wider hips
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#6aaa48";
      ctx.fillText("(====)", -28, -6);
      ctx.fillText("(     )", -30, 10);
      ctx.fillText(" \\___/ ", -28, 24);

      // pale ridges
      ctx.fillStyle = "#d0e0a0";
      ctx.fillText("~", -6, 4);
      ctx.fillText("~", 4, 8);

      // spots with halo
      ctx.fillStyle = "#c0e090";
      ctx.fillText("o", -12, 2);
      ctx.fillText("o", 8, 12);
      ctx.fillStyle = "#204020";
      ctx.fillText("•", -11, 2);
      ctx.fillText("•", 9, 12);

      // eyes — single cell
      ctx.fillStyle = "#f4f4e0";
      ctx.fillText(blink ? "-" : "●", -18, -12);
      ctx.fillText(blink ? "-" : "●", 6, -12);

      // legs
      ctx.fillStyle = "#58a040";
      if (f.jumping) {
        ctx.fillText("/   \\", -18, 34);
        ctx.fillText("\\   /", -18, 50);
      } else {
        ctx.fillText("/\\  /\\", -22, 32);
        ctx.fillText("  \\/  ", -14, 48);
      }

      ctx.restore();
    };

    const io = new IntersectionObserver(
      ([e]) => { visible.current = e.isIntersecting },
      { threshold: 0.02 }
    )
    io.observe(canvas)
    const draw = () => {
      if (!visible.current) { raf = requestAnimationFrame(draw); return }
      t += 0.016;
      ctx.fillStyle = "#081008";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#1a3018";
      ctx.fillRect(0, h * 0.82, w, h * 0.18);
      ctx.strokeStyle = "#2a5028";
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
          f.vx = (Math.random() - 0.5) * 140;
        }

        if (f.jumping) {
          f.jumpT += 0.015;
          const s = f.jumpT;
          const hArc = 4 * s * (1 - s) * 120;
          f.x = f.startX + f.vx * s;
          f.y = f.startY - hArc;
          if (s >= 1) {
            f.jumping = false;
            f.splash = 1;
            f.y = Math.min(f.y, h * 0.75);
          }
        } else {
          f.y += Math.sin(t * 1.0 + f.phase) * 0.25;
        }

        if (f.splash > 0) {
          f.splash -= 0.018;
          ctx.font = "14px monospace";
          ctx.fillStyle = `rgba(140,200,140,${Math.max(0, f.splash)})`;
          ctx.fillText("~ ~ ~", f.x - 20, f.y + 58);
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
      io.disconnect()
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
