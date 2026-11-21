"use client";

const menuItems = [
  { label: "Jellyfish", href: "#jellyfish" },
  { label: "Black Hole", href: "#blackhole" },
  { label: "Frogs", href: "#frogs" },
  { label: "Snow", href: "#snow" },
  { label: "Physics", href: "#physics" },
  { label: "Grid", href: "#grid" },
];

export default function Header() {
  return (
    <header className="fixed top-4 right-8 z-50">
      <nav className="flex items-center gap-1 bg-black/80 backdrop-blur-sm px-1 py-0.5 border border-white/15" style={{ borderRadius: "2px" }}>
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="px-3 py-1.5 text-xs md:text-sm font-mono text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
