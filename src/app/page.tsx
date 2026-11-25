"use client";

import AsciiJellyfish from "@/components/AsciiJellyfish";
import ThreeFishSchool from "@/components/ThreeFishSchool";
import AsciiBlackHole from "@/components/AsciiBlackHole";
import OceanStorm from "@/components/OceanStorm";
import Pulsar from "@/components/Pulsar";
import Nebula from "@/components/Nebula";
import AsciiFrogs from "@/components/AsciiFrogs";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

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

    let onScreen = true;
    const io = new IntersectionObserver(
      ([e]) => { onScreen = e.isIntersecting },
      { threshold: 0.02 }
    );
    io.observe(canvas);
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!onScreen) return;
      t += 0.016;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      draw(ctx, w, h, t, mouse.current);
    };
    loop();

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [draw]);

  return ref;
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
  const formulas = [
    "a²-b²=(a-b)(a+b)",
    "(a+b)²=a²+2ab+b²",
    "(a-b)²=a²-2ab+b²",
    "a³+b³=(a+b)(a²-ab+b²)",
    "a³-b³=(a-b)(a²+ab+b²)",
    "(a+b)³=a³+3a²b+3ab²+b³",
    "(a-b)³=a³-3a²b+3ab²-b³",
    "x²-5x+6=(x-2)(x-3)",
    "2x+3=7 → x=2",
    "ax²+bx+c=0",
    "D=b²-4ac",
    "x=(-b±√D)/2a",
    "y=kx+b",
    "y=ax²+bx+c",
    "sin²α+cos²α=1",
    "tanα=sinα/cosα",
    "a/sinA=b/sinB",
    "S=½ab·sinγ",
    "√(a²+b²)=c",
    "log(ab)=log a+log b",
    "aⁿ·aᵐ=aⁿ⁺ᵐ",
    "(aⁿ)ᵐ=aⁿᵐ",
    "1/a + 1/b = (a+b)/ab",
    "x²+y²=r²",
    "(x-a)²+(y-b)²=r²",
    "a(b+c)=ab+ac",
    "(x+y)(x-y)=x²-y²",
    "x²+2xy+y²=(x+y)²",
    "√a · √b = √(ab)",
    "a⁰=1",
    "a¹=a",
  ];

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mouse: { x: number; y: number }) => {
    ctx.fillStyle = "#06060a";
    ctx.fillRect(0, 0, w, h);
    const cols = 32;
    const rows = 18;
    const cw = w / cols;
    const ch = h / rows;
    ctx.font = "11px monospace";
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
        const noise = Math.sin(x * 0.4 + y * 0.3 + t * 1.2) * 0.5 + 0.5;

        const lightness = 48 + influence * 35 + noise * 12;
        const hue = 200 + influence * 80 + (x + y) * 2;
        ctx.fillStyle = `hsl(${hue % 360}, 65%, ${lightness}%)`;

        if (influence > 0.35) {
          const idx = (y * cols + x) % formulas.length;
          ctx.font = "9px monospace";
          ctx.fillText(formulas[idx], px + offsetX, py + offsetY);
          ctx.font = "11px monospace";
        } else if (noise > 0.65) {
          ctx.fillText("·", px + offsetX, py + offsetY);
        } else {
          const mathChars = "0123456789abcnxyzABCXYZ+-*/=<>()[]{}αβγδεθλπσωΣΔΩ√∞∂∫∑∏≠≤≥±×÷·";
          const char = mathChars[(x * 11 + y * 17 + (t * 6) | 0) % mathChars.length];
          ctx.fillText(char, px + offsetX, py + offsetY);
        }
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
    { id: "pulsar", title: "", component: <Pulsar />, bg: "bg-black" },
    { id: "jellyfish", title: "", component: <AsciiJellyfish />, bg: "bg-black" },
    { id: "nebula", title: "", component: <Nebula />, bg: "bg-black" },
    { id: "fish", title: "", component: <ThreeFishSchool />, bg: "bg-black" },
    { id: "blackhole", title: "", component: <AsciiBlackHole />, bg: "bg-black" },
    { id: "ocean", title: "", component: <OceanStorm />, bg: "bg-black" },
    { id: "frogs", title: "", component: <AsciiFrogs />, bg: "bg-green-950" },
    { id: "snow", title: "", component: <Snow />, bg: "bg-slate-950" },
    { id: "physics", title: "", component: <Physics />, bg: "bg-zinc-950" },
    { id: "grid", title: "", component: <Grid />, bg: "bg-black" },
  ];

  return (
    <main className="bg-black text-white">

      {scenes.map((s, i) => (
        <section key={i} id={s.id} className={`relative h-screen ${s.bg} flex items-center justify-center`}>
          <div className="absolute inset-0">{s.component}</div>
        </section>
      ))}

      <footer className="py-12 text-center text-xs opacity-40">
        ASCII DEMO
      </footer>
    </main>
  );
}
