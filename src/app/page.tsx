"use client";

import ThreeFishes from "@/components/ThreeFishes";
import AsciiJellyfish from "@/components/AsciiJellyfish";
import AsciiFrogs from "@/components/AsciiFrogs";

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
  const jellies = useRef<any[]>([]);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mouse: { x: number; y: number }) => {
    if (jellies.current.length === 0) {
      for (let j = 0; j < 3; j++) {
        const rings = 7;
        const pointsPerRing = 16;
        const bell: { x: number; y: number; baseR: number; angle: number }[][] = [];
        for (let r = 0; r < rings; r++) {
          const ring: any[] = [];
          const baseR = 28 + r * 6;
          for (let p = 0; p < pointsPerRing; p++) {
            ring.push({
              x: 0,
              y: 0,
              baseR,
              angle: (p / pointsPerRing) * Math.PI * 2,
            });
          }
          bell.push(ring);
        }
        const tentacles: { x: number; y: number }[][] = [];
        for (let k = 0; k < 9; k++) {
          const chain: any[] = [];
          for (let s = 0; s < 18; s++) chain.push({ x: 0, y: 0 });
          tentacles.push(chain);
        }
        jellies.current.push({
          x: w * 0.25 + j * w * 0.25,
          y: h * 0.35 + Math.sin(j) * 40,
          bell,
          tentacles,
          phase: j * 1.7,
        });
      }
    }

    ctx.fillStyle = "#04040a";
    ctx.fillRect(0, 0, w, h);

    // ambient dust
    ctx.fillStyle = "rgba(180, 210, 255, 0.25)";
    ctx.font = "10px monospace";
    for (let i = 0; i < 40; i++) {
      const dx = ((i * 97) % w);
      const dy = ((i * 53 + t * 12) % h);
      ctx.fillText("·", dx, dy);
    }

    ctx.font = "15px monospace";
    const bellChars = ["~", "≈", "∿", "∼", "·", "•"];
    const tentChars = ["~", "∼", "∿", "≈", "·"];

    jellies.current.forEach((jelly, ji) => {
      const pulse = Math.sin(t * 1.4 + jelly.phase) * 0.18 + 1;
      const driftX = Math.sin(t * 0.25 + jelly.phase) * 30;
      const driftY = Math.cos(t * 0.2 + jelly.phase * 0.7) * 25;
      const cx = jelly.x + driftX;
      const cy = jelly.y + driftY;

      // mouse repulsion (light)
      const mdx = mouse.x - cx;
      const mdy = mouse.y - cy;
      const md = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
      const repel = md < 160 ? (160 - md) * 0.08 : 0;

      // update & draw bell rings
      jelly.bell.forEach((ring: any[], ri: number) => {
        const rScale = pulse * (1 - ri * 0.04);
        ring.forEach((pt, pi) => {
          const ang = pt.angle + t * 0.15;
          pt.x = cx + Math.cos(ang) * pt.baseR * rScale + (mdx / md) * repel * 0.3;
          pt.y = cy + Math.sin(ang) * pt.baseR * 0.55 * rScale - ri * 3 + (mdy / md) * repel * 0.2;
          const alpha = 0.45 + Math.sin(t * 2 + ri + pi) * 0.2;
          ctx.fillStyle = `rgba(186, 130, 255, ${alpha})`;
          const ch = bellChars[(ri + pi + (t * 4) | 0) % bellChars.length];
          ctx.fillText(ch, pt.x, pt.y);
        });
      });

      // tentacles as soft chains following lower bell points
      jelly.tentacles.forEach((chain: any[], ti: number) => {
        const attach = jelly.bell[jelly.bell.length - 1][ti % 16];
        let px = attach.x;
        let py = attach.y + 8;
        chain.forEach((seg, si) => {
          const targetX = px + Math.sin(t * 1.6 + ti + si * 0.4) * 7;
          const targetY = py + 11;
          seg.x += (targetX - seg.x) * 0.35;
          seg.y += (targetY - seg.y) * 0.35;
          const alpha = 0.65 - si * 0.028;
          ctx.fillStyle = `rgba(160, 120, 255, ${Math.max(0.08, alpha)})`;
          const ch = tentChars[(ti + si + (t * 3) | 0) % tentChars.length];
          ctx.fillText(ch, seg.x, seg.y);
          px = seg.x;
          py = seg.y;
        });
      });
    });
  };

  const ref = useCanvas(draw);
  return <canvas ref={ref} className="w-full h-full" />;
}

function Snow() {
  const flakes = useRef<{ x: number; y: number; s: number; v: number; phase: number; char: string }[]>([]);
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    if (flakes.current.length === 0) {
      const chars = ["*", "·", "•", "❄", "+", "·", "◦"];
      for (let i = 0; i < 180; i++) {
        flakes.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          s: 9 + Math.random() * 14,
          v: 0.25 + Math.random() * 1.1,
          phase: Math.random() * Math.PI * 2,
          char: chars[i % chars.length],
        });
      }
    }
    // gradient night sky
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#050814");
    g.addColorStop(1, "#0c1428");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    flakes.current.forEach((p, i) => {
      p.y += p.v;
      p.x += Math.sin(t * 0.8 + p.phase) * 0.45;
      if (p.y > h + 10) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      const alpha = 0.35 + Math.sin(t * 1.5 + p.phase) * 0.25;
      ctx.font = `${p.s}px monospace`;
      ctx.fillStyle = `rgba(230, 240, 255, ${alpha})`;
      ctx.fillText(p.char, p.x, p.y);
    });
  };
  const ref = useCanvas(draw);
  return <canvas ref={ref} className="w-full h-full" />;
}

function Physics() {
  const parts = useRef<{ x: number; y: number; vx: number; vy: number; char: string }[]>([]);
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mouse: { x: number; y: number }) => {
    if (parts.current.length === 0) {
      const chars = "$%&*+-=#@<>{}[]";
      for (let i = 0; i < 110; i++) {
        parts.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          char: chars[i % chars.length],
        });
      }
    }
    ctx.fillStyle = "#08080f";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "16px monospace";

    parts.current.forEach((p, i) => {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      // attract within range, gentle repulsion very close
      let force = 0;
      if (d < 200) force = (200 - d) * 0.0018;
      if (d < 40) force = -0.12;
      p.vx += (dx / d) * force;
      p.vy += (dy / d) * force;
      // mild mutual repulsion
      parts.current.forEach((o, j) => {
        if (i === j) return;
        const ox = p.x - o.x;
        const oy = p.y - o.y;
        const od = Math.sqrt(ox * ox + oy * oy) || 1;
        if (od < 28) {
          p.vx += (ox / od) * 0.04;
          p.vy += (oy / od) * 0.04;
        }
      });
      p.vx *= 0.965;
      p.vy *= 0.965;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 10 || p.x > w - 10) p.vx *= -0.8;
      if (p.y < 10 || p.y > h - 10) p.vy *= -0.8;

      const hue = 280 + (i * 7) % 80;
      const alpha = 0.55 + Math.min(d / 200, 1) * 0.4;
      ctx.fillStyle = `hsla(${hue}, 70%, 72%, ${alpha})`;
      ctx.fillText(p.char, p.x, p.y);
    });
  };
  const ref = useCanvas(draw);
  return <canvas ref={ref} className="w-full h-full" />;
}

function Grid() {
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mouse: { x: number; y: number }) => {
    ctx.fillStyle = "#06060a";
    ctx.fillRect(0, 0, w, h);
    const cols = 32;
    const rows = 18;
    const cw = w / cols;
    const ch = h / rows;
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * cw + cw / 2;
        const py = y * ch + ch / 2;
        const dx = mouse.x - px;
        const dy = mouse.y - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - d / 220);
        const offsetX = dx * influence * 0.35;
        const offsetY = dy * influence * 0.35;
        // density + character shift based on influence and time
        const noise = Math.sin(x * 0.4 + y * 0.3 + t * 1.2) * 0.5 + 0.5;
        let char: string;
        if (influence > 0.45) char = "█";
        else if (influence > 0.2) char = "▓";
        else if (noise > 0.65) char = "·";
        else char = String.fromCharCode(33 + ((x * 11 + y * 17 + (t * 6) | 0) % 48));

        const lightness = 48 + influence * 35 + noise * 12;
        const hue = 200 + influence * 80 + (x + y) * 2;
        ctx.fillStyle = `hsl(${hue % 360}, 65%, ${lightness}%)`;
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
    { title: "Fishes", component: <ThreeFishes />, bg: "bg-slate-900" },
    { title: "ASCII Jellyfish", component: <AsciiJellyfish />, bg: "bg-black" },
    { title: "ASCII Frogs", component: <AsciiFrogs />, bg: "bg-green-950" },
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
