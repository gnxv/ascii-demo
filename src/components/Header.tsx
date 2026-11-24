"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const menuItems = [
  { label: "Jelly", href: "#jellyfish" },
  { label: "Fish", href: "#fish" },
  { label: "Black Hole", href: "#blackhole" },
  { label: "Ocean", href: "#ocean" },
  { label: "Nebula", href: "#nebula" },
  { label: "Frogs", href: "#frogs" },
  { label: "Snow", href: "#snow" },
  { label: "Physics", href: "#physics" },
  { label: "Grid", href: "#grid" },
];

export default function Header() {
  const navRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navRef.current || !labelRef.current) return;
    gsap.fromTo(
      navRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.2 }
    );
    gsap.fromTo(
      labelRef.current,
      { opacity: 0, x: -6 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power2.out", delay: 0.1 }
    );
  }, []);

  return (
    <header className="fixed top-4 left-6 right-24 z-50 flex items-center justify-between">
      <div
        ref={labelRef}
        className="text-[11px] tracking-[0.28em] uppercase text-white/60 font-mono select-none"
      >
        ASCII DEMO
      </div>
      <nav
        ref={navRef}
        className="flex items-center gap-0.5 bg-black/75 backdrop-blur-md px-1 py-0.5 border border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
        style={{ borderRadius: "2px" }}
      >
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="relative px-3 py-1.5 text-xs md:text-sm font-mono text-white/75 hover:text-white transition-all duration-200 group hover:shadow-[0_2px_0_rgba(255,255,255,0.15)] hover:-translate-y-px"
          >
            <span className="relative z-10">{item.label}</span>
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </nav>
    </header>
  );
}
