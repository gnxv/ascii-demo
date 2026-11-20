"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <Link
          href="/"
          className={`font-display text-2xl tracking-[0.25em] transition-colors ${
            scrolled ? "text-black" : "text-white"
          }`}
        >
          AUREA
        </Link>

        <nav className={`hidden md:flex items-center gap-10 text-[13px] tracking-widest uppercase ${
          scrolled ? "text-black" : "text-white"
        }`}>
          <Link href="#clubs" className="hover:opacity-60 transition">Клубы</Link>
          <Link href="#membership" className="hover:opacity-60 transition">Членство</Link>
          <Link href="#training" className="hover:opacity-60 transition">Тренировки</Link>
          <Link href="#recovery" className="hover:opacity-60 transition">Восстановление</Link>
          <Link href="#contact" className="hover:opacity-60 transition">Контакты</Link>
        </nav>

        <button
          className={`md:hidden ${scrolled ? "text-black" : "text-white"}`}
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          <div className="space-y-1.5">
            <div className="w-6 h-px bg-current"></div>
            <div className="w-6 h-px bg-current"></div>
            <div className="w-4 h-px bg-current"></div>
          </div>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white px-6 py-8 flex flex-col gap-6 text-sm tracking-widest uppercase">
          <Link href="#clubs" onClick={() => setOpen(false)}>Клубы</Link>
          <Link href="#membership" onClick={() => setOpen(false)}>Членство</Link>
          <Link href="#training" onClick={() => setOpen(false)}>Тренировки</Link>
          <Link href="#recovery" onClick={() => setOpen(false)}>Восстановление</Link>
          <Link href="#contact" onClick={() => setOpen(false)}>Контакты</Link>
        </div>
      )}
    </header>
  );
}