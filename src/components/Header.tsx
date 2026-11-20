"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";

const menuItems = [
  { label: "Products", href: "#products" },
  { label: "References", href: "#references" },
  { label: "Studio", href: "#studio" },
  { label: "Services", href: "#services" },
  { label: "Awards", href: "#awards" },
  { label: "Materials/Fabrication", href: "#materials" },
  { label: "Connect", href: "#connect" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current || !menuRef.current) return;

    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(
        menuRef.current.children,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.2 }
      );
      document.body.style.overflow = "hidden";
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" });
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl tracking-[0.25em] font-medium text-white">
            AUREA
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-sm tracking-[0.2em] uppercase text-white border border-white/40 px-5 py-2 hover:bg-white hover:text-black transition-colors"
          >
            {isOpen ? "CLOSE" : "MENU"}
          </button>
        </div>
      </header>

      <div
        ref={overlayRef}
        className={`fixed inset-0 z-40 bg-[#fff9f5] flex items-center justify-center ${isOpen ? "pointer-events-auto" : "pointer-events-none opacity-0"}`}
      >
        <nav ref={menuRef} className="text-center">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block text-5xl md:text-7xl font-medium tracking-tight py-3 hover:opacity-60 transition-opacity"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
