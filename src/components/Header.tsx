"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-aurea-light/90 backdrop-blur-md border-b border-aurea-cream">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-widest text-aurea-dark">
          AUREA
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm tracking-wide">
          <Link href="/clubs" className="hover:text-aurea-gold transition">Клубы</Link>
          <Link href="/membership" className="hover:text-aurea-gold transition">Членство</Link>
          <Link href="/training" className="hover:text-aurea-gold transition">Тренировки</Link>
          <Link href="/gallery" className="hover:text-aurea-gold transition">Галерея</Link>
          <Link href="/about" className="hover:text-aurea-gold transition">О клубе</Link>
          <Link href="/contact" className="hover:text-aurea-gold transition">Контакты</Link>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          <div className="w-6 h-0.5 bg-aurea-dark mb-1.5"></div>
          <div className="w-6 h-0.5 bg-aurea-dark mb-1.5"></div>
          <div className="w-6 h-0.5 bg-aurea-dark"></div>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-aurea-light border-t border-aurea-cream px-6 py-6 flex flex-col gap-5 text-sm">
          <Link href="/clubs" onClick={() => setOpen(false)}>Клубы</Link>
          <Link href="/membership" onClick={() => setOpen(false)}>Членство</Link>
          <Link href="/training" onClick={() => setOpen(false)}>Тренировки</Link>
          <Link href="/gallery" onClick={() => setOpen(false)}>Галерея</Link>
          <Link href="/about" onClick={() => setOpen(false)}>О клубе</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Контакты</Link>
        </div>
      )}
    </header>
  );
}