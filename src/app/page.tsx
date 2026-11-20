"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Clip-path text reveal (mimics data-text-scroll-reveal)
    gsap.utils.toArray(".clip-reveal").forEach((el: any) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "top 40%",
            scrub: 0.6,
          },
        }
      );
    });

    // Parallax via CSS variables (mimics data-follow-scroll-relative)
    gsap.utils.toArray(".parallax-el").forEach((el: any) => {
      const speed = parseFloat(el.dataset.speed || "0.3");
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          el.style.setProperty("--follow-progress", String(progress));
          el.style.setProperty("--parallax-y", `${(progress - 0.5) * speed * 100}px`);
        },
      });
    });

    // Hero entrance
    gsap.from(".hero-kicker", { y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2 });
    gsap.from(".hero-title", { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.4 });
    gsap.from(".hero-desc", { y: 40, opacity: 0, duration: 1, ease: "power3.out", delay: 0.7 });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <main ref={mainRef} className="bg-[#fff9f5] text-[#3b322d]">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 md:pb-28 px-5 md:px-12 lg:px-20 overflow-hidden">
        <div className="absolute inset-0 parallax-el" data-speed="0.25">
          <img
            src="/hero-fitness.jpg"
            alt="AUREA Fitness"
            className="w-full h-[120%] object-cover"
            style={{ transform: "translateY(var(--parallax-y, 0px))" }}
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>

        <div className="relative z-10 max-w-6xl">
          <div className="hero-kicker text-[11px] md:text-xs tracking-[0.38em] uppercase mb-5 opacity-80 font-medium">
            GLOBAL BESPOKE FITNESS DESIGN AND SPACES
          </div>
          <h1
            className="hero-title font-semibold leading-[0.83] tracking-[-0.033em]"
            style={{ fontSize: "clamp(48px, 6.5vw, 66.67px)" }}
          >
            BESPOKE<br />ARCHITECTURAL<br />FITNESS
          </h1>
          <p className="hero-desc mt-7 text-base md:text-lg max-w-lg opacity-90 leading-snug">
            We design and craft bespoke fitness spaces that merge performance, recovery, and architectural precision.
          </p>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="py-28 md:py-40 px-5 md:px-12 lg:px-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[11px] tracking-[0.32em] uppercase mb-6 opacity-70 clip-reveal">STUDIO</div>
          <h2 className="text-3xl md:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.02em] font-medium max-w-4xl clip-reveal">
            We create extraordinary training spaces that inspire strength, movement, and balance, blending architectural precision and innovation.
          </h2>
          <div className="mt-12">
            <a
              href="#products"
              className="inline-flex items-center border border-[#3b322d] px-7 py-2.5 text-[12px] tracking-[0.14em] uppercase font-medium hover:bg-[#3b322d] hover:text-[#fff9f5] transition-all duration-300"
            >
              EXPLORE
            </a>
          </div>
        </div>
      </section>

      {/* Studio + Abstract */}
      <section className="relative py-16 md:py-24 px-5 md:px-12 lg:px-20">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="overflow-hidden parallax-el" data-speed="0.35">
            <img
              src="/studio-fitness.jpg"
              alt="Studio"
              className="w-full aspect-[4/3] object-cover"
              style={{ transform: "translateY(var(--parallax-y, 0px))" }}
            />
          </div>
          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase mb-4 opacity-70 clip-reveal">ABSTRACT</div>
            <h3 className="text-2xl md:text-4xl leading-tight tracking-[-0.015em] font-medium mb-5 clip-reveal">
              Elevated training environments that invite focused intensity in open, refined spaces.
            </h3>
            <p className="opacity-80 leading-relaxed text-[15px] clip-reveal">
              Architectural excellence, sustainability, and imaginative design create innovative, inclusive fitness spaces built to last.
            </p>
            <a href="#" className="inline-block mt-7 text-[12px] tracking-[0.12em] uppercase underline underline-offset-4 hover:opacity-60 transition">
              Read more
            </a>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-28 md:py-36 px-5 md:px-12 lg:px-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[11px] tracking-[0.32em] uppercase mb-6 opacity-70 clip-reveal">FEATURED</div>
          <div className="relative overflow-hidden h-[65vh] md:h-[75vh] parallax-el" data-speed="0.2">
            <img
              src="/awards-fitness.jpg"
              alt="Featured"
              className="w-full h-[130%] object-cover"
              style={{ transform: "translateY(var(--parallax-y, 0px))" }}
            />
            <div className="absolute bottom-10 left-10">
              <a
                href="#"
                className="inline-flex items-center border border-white text-white px-7 py-2.5 text-[12px] tracking-[0.14em] uppercase font-medium hover:bg-white hover:text-[#3b322d] transition-all duration-300"
              >
                VIEW
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section id="awards" className="py-28 md:py-40 px-5 md:px-12 lg:px-20">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase mb-3 opacity-70 clip-reveal">OUR</div>
            <h2 className="text-6xl md:text-8xl leading-none tracking-[-0.03em] font-medium clip-reveal">AWARDS</h2>
          </div>
          <div className="pt-4 md:pt-8">
            <h3 className="text-2xl md:text-3xl font-medium mb-3 clip-reveal">Golden Pin Design Award</h3>
            <div className="text-sm opacity-60 mb-5 clip-reveal">Category / Spatial Design</div>
            <p className="opacity-80 leading-relaxed text-[15px] clip-reveal">
              Since 1981, Taiwan’s Golden Pin Design Award has honored outstanding products and projects in the global Huaren market, with winners receiving the prestigious Design Mark and Best Design trophy.
            </p>
            <a
              href="#"
              className="inline-flex items-center mt-8 border border-[#3b322d] px-7 py-2.5 text-[12px] tracking-[0.14em] uppercase font-medium hover:bg-[#3b322d] hover:text-[#fff9f5] transition-all duration-300"
            >
              VIEW
            </a>
          </div>
        </div>
      </section>

      {/* Products — Cocoon */}
      <section id="products" className="py-28 md:py-40 px-5 md:px-12 lg:px-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[11px] tracking-[0.32em] uppercase mb-6 opacity-70 clip-reveal">PRODUCTS</div>
          <h2 className="text-3xl md:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.02em] font-medium mb-3 clip-reveal">
            BESPOKE PRODUCTS
          </h2>
          <p className="text-lg md:text-xl opacity-80 mb-16 clip-reveal">Performance is more than training—it’s essential</p>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="overflow-hidden parallax-el" data-speed="0.28">
              <img
                src="/cocoon-fitness.jpg"
                alt="Cocoon Recovery"
                className="w-full aspect-square object-cover"
                style={{ transform: "translateY(var(--parallax-y, 0px))" }}
              />
            </div>
            <div>
              <div className="text-[11px] tracking-[0.32em] uppercase mb-2 opacity-60 clip-reveal">KINETICS SERIES</div>
              <h3 className="text-2xl md:text-4xl font-medium mb-4 clip-reveal">Cocoon Recovery</h3>
              <p className="opacity-80 leading-relaxed text-[15px] clip-reveal">
                Teardrop-inspired recovery pod with breathable structure on arched frame—calm, sculptural retreat for post-training balance.
              </p>
              <a href="#" className="inline-block mt-7 text-[12px] tracking-[0.12em] uppercase underline underline-offset-4 hover:opacity-60 transition">
                Read more: Cocoon Recovery
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
