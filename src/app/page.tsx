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
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Hero text animation
    gsap.from(".hero-title", {
      y: 80,
      opacity: 0,
      duration: 1.4,
      ease: "power3.out",
      delay: 0.3,
    });
    gsap.from(".hero-sub", {
      y: 40,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out",
      delay: 0.6,
    });

    // Scroll reveals
    gsap.utils.toArray(".reveal").forEach((el: any) => {
      gsap.from(el, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // Parallax images
    gsap.utils.toArray(".parallax-img").forEach((img: any) => {
      gsap.to(img, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <main ref={mainRef} className="bg-[#fff9f5] text-[#3b322d]">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-end pb-24 px-6 md:px-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/hero-fitness.jpg"
            alt="AUREA Fitness"
            className="w-full h-full object-cover parallax-img"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="relative z-10 max-w-5xl">
          <div className="text-xs tracking-[0.4em] uppercase mb-6 opacity-80">
            GLOBAL BESPOKE FITNESS DESIGN AND SPACES
          </div>
          <h1 className="hero-title text-6xl md:text-8xl lg:text-9xl font-medium leading-[0.85] tracking-tight">
            BESPOKE<br />ARCHITECTURAL<br />FITNESS
          </h1>
          <p className="hero-sub mt-8 text-lg md:text-xl max-w-xl opacity-90">
            We design and craft bespoke fitness spaces that merge performance, recovery, and architectural precision.
          </p>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="py-32 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-sm tracking-[0.3em] uppercase mb-8 reveal">STUDIO</div>
          <h2 className="text-4xl md:text-6xl leading-tight max-w-4xl reveal">
            We create extraordinary training spaces that inspire strength, movement, and balance, blending architectural precision and innovation.
          </h2>
          <div className="mt-12 reveal">
            <a href="#products" className="inline-block border border-current px-8 py-3 text-sm tracking-widest uppercase hover:bg-[#3b322d] hover:text-[#fff9f5] transition">
              EXPLORE
            </a>
          </div>
        </div>
      </section>

      {/* Studio image + text */}
      <section className="relative py-20 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="overflow-hidden">
            <img src="/studio-fitness.jpg" alt="Studio" className="w-full aspect-[4/3] object-cover parallax-img" />
          </div>
          <div>
            <div className="text-sm tracking-[0.3em] uppercase mb-4 reveal">ABSTRACT</div>
            <h3 className="text-3xl md:text-4xl mb-6 reveal">Elevated training environments that invite focused intensity in open, refined spaces.</h3>
            <p className="opacity-80 reveal">Architectural excellence, sustainability, and imaginative design create innovative, inclusive fitness spaces built to last.</p>
            <a href="#" className="inline-block mt-8 text-sm tracking-widest uppercase underline reveal">Read more</a>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-32 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-sm tracking-[0.3em] uppercase mb-8 reveal">FEATURED</div>
          <div className="relative overflow-hidden h-[70vh]">
            <img src="/awards-fitness.jpg" alt="Featured" className="w-full h-full object-cover parallax-img" />
            <div className="absolute bottom-12 left-12">
              <a href="#" className="inline-block border border-white text-white px-8 py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition">
                VIEW
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section id="awards" className="py-32 px-6 md:px-16 bg-[#fff9f5]">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <div className="text-sm tracking-[0.3em] uppercase mb-4 reveal">OUR</div>
            <h2 className="text-5xl md:text-7xl leading-none reveal">AWARDS</h2>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl mb-4 reveal">Golden Pin Design Award</h3>
            <div className="text-sm opacity-70 mb-6 reveal">Category / Spatial Design</div>
            <p className="opacity-80 leading-relaxed reveal">
              Since 1981, Taiwan’s Golden Pin Design Award has honored outstanding products and projects in the global Huaren market, with winners receiving the prestigious Design Mark and Best Design trophy.
            </p>
            <a href="#" className="inline-block mt-8 border border-current px-8 py-3 text-sm tracking-widest uppercase hover:bg-[#3b322d] hover:text-[#fff9f5] transition reveal">
              VIEW
            </a>
          </div>
        </div>
      </section>

      {/* Products start - Cocoon */}
      <section id="products" className="py-32 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-sm tracking-[0.3em] uppercase mb-8 reveal">PRODUCTS</div>
          <h2 className="text-4xl md:text-6xl mb-4 reveal">BESPOKE PRODUCTS</h2>
          <p className="text-xl opacity-80 mb-16 reveal">Performance is more than training—it’s essential</p>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="overflow-hidden">
              <img src="/cocoon-fitness.jpg" alt="Cocoon Recovery" className="w-full aspect-square object-cover parallax-img" />
            </div>
            <div>
              <div className="text-xs tracking-[0.3em] uppercase mb-2 reveal">KINETICS SERIES</div>
              <h3 className="text-3xl md:text-4xl mb-4 reveal">Cocoon Recovery</h3>
              <p className="opacity-80 leading-relaxed reveal">
                Teardrop-inspired recovery pod with breathable structure on arched frame—calm, sculptural retreat for post-training balance.
              </p>
              <a href="#" className="inline-block mt-8 text-sm tracking-widest uppercase underline reveal">
                Read more: Cocoon Recovery
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
