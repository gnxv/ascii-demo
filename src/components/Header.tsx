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

    const items = menuRef.current.children;

    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(
        items,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.06, ease: "power3.out", delay: 0.12 }
      );
      document.body.style.overflow = "hidden";
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl tracking-[0.2em] font-medium text-white">
            AUREA
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="h-12 min-w-[10em] text-[11px] tracking-[0.16em] uppercase text-white border border-white/40 bg-[#f1e6df]/10 backdrop-blur-sm px-5 hover:bg-[#f1e6df] hover:text-[#3b322d] transition-all duration-300"
          >
            {isOpen ? "CLOSE" : "MENU"}
          </button>
        </div>
      </header>

      <div
        ref={overlayRef}
        className={`fixed inset-0 z-40 bg-[#fff9f5] flex items-center justify-center ${
          isOpen ? "pointer-events-auto" : "pointer-events-none opacity-0"
        }`}
      >
        <nav ref={menuRef} className="text-center">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block text-4xl md:text-6xl lg:text-7xl font-medium tracking-[-0.02em] py-2 md:py-2.5 hover:opacity-50 transition-opacity"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
