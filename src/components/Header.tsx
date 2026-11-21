"use client";

import { useState } from "react";

const menuItems = [
  { label: "Jellyfish", href: "#jellyfish" },
  { label: "Black Hole", href: "#blackhole" },
  { label: "Frogs", href: "#frogs" },
  { label: "Snow", href: "#snow" },
  { label: "Physics", href: "#physics" },
  { label: "Grid", href: "#grid" },
];

export default function Header() {
  const [hovered, setHovered] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 mix-blend-difference"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="max-w-[1600px] mx-auto px-5 md:px-8 h-16 md:h-20 flex items-center">
        <nav className="flex w-full">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex-1 text-center py-3 text-sm md:text-base font-mono tracking-wide text-white border-r border-white/20 last:border-r-0 hover:bg-[#f1e6df] hover:text-[#3b322d] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}