"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference text-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl tracking-[0.2em] font-medium">
          AUREA
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="text-sm tracking-widest uppercase"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-[#201d1c] text-[#fff9f5] flex flex-col items-center justify-center gap-8 text-2xl tracking-widest uppercase z-40">
          <Link href="#clubs" onClick={() => setOpen(false)}>Clubs</Link>
          <Link href="#membership" onClick={() => setOpen(false)}>Membership</Link>
          <Link href="#training" onClick={() => setOpen(false)}>Training</Link>
          <Link href="#recovery" onClick={() => setOpen(false)}>Recovery</Link>
          <Link href="#contact" onClick={() => setOpen(false)}>Connect</Link>
        </div>
      )}
    </header>
  );
}