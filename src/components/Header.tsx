"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference text-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl tracking-[0.2em] font-medium">
            AUREA
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="text-sm tracking-widest uppercase"
          >
            Меню
          </button>
        </div>
      </header>

      {/* Full-screen menu like Kinetics */}
      <div
        className={`fixed inset-0 z-[60] bg-[#201d1c] text-[#fff9f5] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center px-6 h-16">
            <div className="text-xl tracking-[0.2em]">AUREA</div>
            <button
              onClick={() => setOpen(false)}
              className="text-sm tracking-widest uppercase"
            >
              Закрыть
            </button>
          </div>

          <nav className="flex-1 flex flex-col justify-center items-center gap-8 md:gap-10">
            <Link
              href="#clubs"
              onClick={() => setOpen(false)}
              className="text-4xl md:text-6xl font-medium tracking-tight hover:opacity-70 transition"
            >
              Клубы
            </Link>
            <Link
              href="#membership"
              onClick={() => setOpen(false)}
              className="text-4xl md:text-6xl font-medium tracking-tight hover:opacity-70 transition"
            >
              Членство
            </Link>
            <Link
              href="#training"
              onClick={() => setOpen(false)}
              className="text-4xl md:text-6xl font-medium tracking-tight hover:opacity-70 transition"
            >
              Тренировки
            </Link>
            <Link
              href="#recovery"
              onClick={() => setOpen(false)}
              className="text-4xl md:text-6xl font-medium tracking-tight hover:opacity-70 transition"
            >
              Восстановление
            </Link>
            <Link
              href="#contact"
              onClick={() => setOpen(false)}
              className="text-4xl md:text-6xl font-medium tracking-tight hover:opacity-70 transition"
            >
              Контакты
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}