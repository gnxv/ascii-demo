"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mouse: { x: number; y: number }) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener("mousemove", onMove);

    const loop = () => {
      t += 0.016;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      draw(ctx, w, h, t, mouse.current);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [draw]);

  return ref;
}

function Jellyfish() {
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = "#06060e";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "18px monospace";
    const bellChars = ["~", "≈", "∿", "∼", "·", "•", "°", "◦"];
    const tentacleChars = ["~", "∼", "∿", "≈"];

    for (let i = 0; i < 4; i++) {
      const x = (w * 0.18 + i * w * 0.22 + Math.sin(t * 0.35 + i * 1.2) * 50) | 0;
      const y = (h * 0.38 + Math.cos(t * 0.25 + i * 0.9) * 70) | 0;
      const scale = 1.4 + (i % 2) * 0.3;

      // larger bell
      for (let r = 0; r < 14; r++) {
        const angle = (r / 14) * Math.PI;
        const bx = Math.cos(angle) * 28 * scale;
        const by = Math.sin(angle) * 16 * scale - 8;
        const c = bellChars[(r + (t * 5 + i * 4) | 0) % bellChars.length];
        ctx.fillStyle = `rgba(125, 211, 252, ${0.55 + Math.sin(t * 2 + r) * 0.25})`;
        ctx.fillText(c, x + bx, y + by);
      }

      // inner texture
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = "rgba(186, 230, 253, 0.35)";
        ctx.fillText("·", x + (k - 2.5) * 8 * scale, y + 4);
      }

      // longer tentacles
      for (let k = 0; k < 8; k++) {
        const tx = x + (k - 3.5) * 7 * scale;
        const wave = Math.sin(t * 1.8 + k * 0.6 + i) * 12;
        for (let seg = 0; seg < 5; seg++) {
          const ty = y + 22 * scale + seg * 14 + wave * (seg * 0.3);
          const tc = tentacleChars[(seg + k + (t * 3) | 0) % tentacleChars.length];
          ctx.fillStyle = `rgba(125, 211, 252, ${0.7 - seg * 0.1})`;
          ctx.fillText(tc, tx, ty);
        }
      }
    }
  };
  const ref = useCanvas(draw);
  return <canvas ref={ref} className="w-full h-full" />;
}

function Snow() {
  const particles = useRef<{ x: number; y: number; s: number; v: number }[]>([]);
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    if (particles.current.length === 0) {
      for (let i = 0; i < 120; i++) {
        particles.current.push({ x: Math.random() * w, y: Math.random() * h, s: 8 + Math.random() * 10, v: 0.3 + Math.random() * 0.8 });
      }
    }
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "16px monospace";
    const chars = ["*", "·", "•", "❄", "·", "+"];
    particles.current.forEach((p, i) => {
      p.y += p.v;
      p.x += Math.sin(t + i) * 0.3;
      if (p.y > h) p.y = -10;
      ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(t * 2 + i) * 0.3})`;
      ctx.fillText(chars[i % chars.length], p.x, p.y);
    });
  };
  const ref = useCanvas(draw);
  return <canvas ref={ref} className="w-full h-full" />;
}

function Physics() {
  const parts = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mouse: { x: number; y: number }) => {
    if (parts.current.length === 0) {
      for (let i = 0; i < 80; i++) {
        parts.current.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0 });
      }
    }
    ctx.fillStyle = "#0c0c14";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "14px monospace";
    parts.current.forEach((p, i) => {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = d < 140 ? (140 - d) * 0.002 : 0;
      p.vx += (dx / d) * force;
      p.vy += (dy / d) * force;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.fillStyle = d < 100 ? "#f472b6" : "#a78bfa";
      ctx.fillText(String.fromCharCode(36 + (i % 20)), p.x, p.y);
    });
  };
  const ref = useCanvas(draw);
  return <canvas ref={ref} className="w-full h-full" />;
}

function Grid() {
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mouse: { x: number; y: number }) => {
    ctx.fillStyle = "#08080c";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "13px monospace";
    const cols = 28;
    const rows = 16;
    const cw = w / cols;
    const ch = h / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * cw + cw / 2;
        const py = y * ch + ch / 2;
        const dx = mouse.x - px;
        const dy = mouse.y - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - d / 180);
        const offsetX = dx * influence * 0.25;
        const offsetY = dy * influence * 0.25;
        const char = influence > 0.3 ? "█" : String.fromCharCode(33 + ((x * 7 + y * 13 + (t * 5) | 0) % 50));
        ctx.fillStyle = `hsl(${(x * 8 + y * 4 + t * 40) % 360}, 70%, ${50 + influence * 30}%)`;
        ctx.fillText(char, px + offsetX, py + offsetY);
      }
    }
  };
  const ref = useCanvas(draw);
  return <canvas ref={ref} className="w-full h-full" />;
}

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const scenes = [
    { title: "Jellyfish", component: <Jellyfish />, bg: "bg-black" },
    { title: "Snow", component: <Snow />, bg: "bg-slate-950" },
    { title: "Physics", component: <Physics />, bg: "bg-zinc-950" },
    { title: "Reactive Grid", component: <Grid />, bg: "bg-black" },
  ];

  return (
    <main className="bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center mix-blend-difference">
        <div className="text-sm tracking-[0.3em] uppercase">ASCII DEMO</div>
        <div className="text-xs opacity-60">6 scenes · code-drawn</div>
      </header>

      {scenes.map((s, i) => (
        <section key={i} className={`relative h-screen ${s.bg} flex items-center justify-center`}>
          <div className="absolute inset-0">{s.component}</div>
          <div className="relative z-10 text-center pointer-events-none">
            <div className="text-[11px] tracking-[0.4em] uppercase opacity-50 mb-2">0{i + 1}</div>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight">{s.title}</h2>
          </div>
        </section>
      ))}

      <footer className="py-12 text-center text-xs opacity-40">
        ASCII / character animations · Next.js + Canvas + GSAP/Lenis
      </footer>
    </main>
  );
}
