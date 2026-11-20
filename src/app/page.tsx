"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

const products = [
  { cat: "KINETICS SERIES", title: "Cocoon Recovery", desc: "Teardrop-inspired recovery pod with breathable structure on arched frame—calm, sculptural retreat for post-training balance.", img: "/cocoon-fitness.jpg" },
  { cat: "ABSTRACT", title: "Play Curl", desc: "Elevated, translucent curl inviting vertical exploration in a secluded-yet-visible canopy.", img: "/studio-fitness.jpg" },
  { cat: "TREEHOUSES", title: "Tree Hideout", desc: "At Fernvale Link, a tree-trunk-base playscape hides climbs and slides in architectural form.", img: "/awards-fitness.jpg" },
  { cat: "PLAYSPIRE", title: "Playspire Mini", desc: "Space-efficient vertical play that sparks exploration, movement and focused intensity.", img: "/gym.jpg" },
];

const references = [
  { cat: "PARKS", title: "Como Adventure Grove – Singapore", img: "/studio.jpg" },
  { cat: "HOSPITALITY", title: "The Ritz-Carlton – Maldives", img: "/spa.jpg" },
  { cat: "MIXED-USE", title: "The Exchange TRX – Malaysia", img: "/block1.jpg" },
];

export default function Home() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.85,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    gsap.utils.toArray(".clip-reveal").forEach((el: any) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            end: "top 58%",
            scrub: 0.5,
          },
        }
      );
    });

    gsap.utils.toArray(".parallax-el").forEach((el: any) => {
      const speed = parseFloat(el.dataset.speed || "0.25");
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const y = (self.progress - 0.5) * speed * 140;
          el.style.setProperty("--parallax-y", `${y}px`);
        },
      });
    });

    gsap.from(".hero-kicker", { y: 20, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.1 });
    gsap.from(".hero-title", { y: 48, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.3 });
    gsap.from(".hero-desc", { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.55 });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <main ref={mainRef} className="bg-[#fff9f5] text-[#3b322d]">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-end pb-16 md:pb-24 px-5 md:px-10 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 parallax-el" data-speed="0.2">
          <img src="/hero-fitness.jpg" alt="AUREA" className="w-full h-[118%] object-cover" style={{ transform: "translateY(var(--parallax-y, 0px))" }} />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="relative z-10 max-w-5xl">
          <div className="hero-kicker text-[11px] tracking-[0.36em] uppercase mb-4 opacity-80 font-medium">
            GLOBAL BESPOKE FITNESS DESIGN AND SPACES
          </div>
          <h1 className="hero-title font-semibold leading-[0.83] tracking-[-0.033em]" style={{ fontSize: "clamp(52px, 7vw, 67px)" }}>
            BESPOKE<br />ARCHITECTURAL<br />FITNESS
          </h1>
          <p className="hero-desc mt-6 text-base md:text-[17px] max-w-md opacity-90 leading-snug">
            We design and craft bespoke fitness spaces that merge performance, recovery, and architectural precision.
          </p>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="bg-[#f1e6df] py-20 md:py-28 px-5 md:px-10 lg:px-16">
        <div className="max-w-[1320px] mx-auto">
          <div className="text-[11px] tracking-[0.3em] uppercase mb-4 opacity-60 clip-reveal">STUDIO</div>
          <h2 className="text-3xl md:text-[48px] leading-[1.02] tracking-[-0.02em] font-medium max-w-4xl clip-reveal">
            We create extraordinary training spaces that inspire strength, movement, and balance, blending architectural precision and innovation.
          </h2>
          <div className="mt-10">
            <a href="#products" className="inline-flex items-center h-12 min-w-[10em] justify-center border border-[#3b322d] bg-[#f1e6df] px-6 text-[12px] tracking-[0.14em] uppercase font-medium hover:bg-[#3b322d] hover:text-[#fff9f5] transition-all duration-300">
              EXPLORE
            </a>
          </div>
        </div>
      </section>

      {/* Embedded product (Play Curl style) */}
      <section className="bg-[#201d1c] text-[#fff9f5] py-16 md:py-20 px-5 md:px-10 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="overflow-hidden parallax-el" data-speed="0.28">
            <img src="/studio-fitness.jpg" alt="Play Curl" className="w-full aspect-[4/3] object-cover" style={{ transform: "translateY(var(--parallax-y, 0px))" }} />
          </div>
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase mb-3 opacity-60 clip-reveal">ABSTRACT</div>
            <h3 className="text-2xl md:text-[36px] leading-tight tracking-[-0.015em] font-medium mb-4 clip-reveal">Play Curl</h3>
            <p className="opacity-80 leading-relaxed text-[15px] clip-reveal">
              Elevated, translucent curl inviting vertical exploration in a secluded-yet-visible canopy.
            </p>
            <a href="#" className="inline-block mt-6 text-[12px] tracking-[0.12em] uppercase underline underline-offset-4 hover:opacity-60 transition">
              Read more: Play Curl
            </a>
          </div>
        </div>
      </section>

      {/* Approach text */}
      <section className="bg-[#fff9f5] py-16 md:py-20 px-5 md:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg md:text-xl leading-relaxed opacity-85 clip-reveal">
            Our approach combines architectural precision with material innovation to create fitness spaces that feel both refined and intensely functional—where every surface, light and volume supports performance and recovery.
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-[#f1e6df] py-20 md:py-28 px-5 md:px-10 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[11px] tracking-[0.3em] uppercase mb-5 opacity-60 clip-reveal">FEATURED</div>
          <div className="relative overflow-hidden h-[70vh] md:h-[80vh] parallax-el" data-speed="0.18">
            <img src="/awards-fitness.jpg" alt="Featured" className="w-full h-[125%] object-cover" style={{ transform: "translateY(var(--parallax-y, 0px))" }} />
            <div className="absolute bottom-8 left-8">
              <a href="#" className="inline-flex items-center h-12 min-w-[10em] justify-center border border-white text-white px-6 text-[12px] tracking-[0.14em] uppercase font-medium hover:bg-white hover:text-[#3b322d] transition-all duration-300">
                VIEW
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section id="awards" className="bg-[#fff9f5] py-20 md:py-28 px-5 md:px-10 lg:px-16">
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase mb-2 opacity-60 clip-reveal">OUR</div>
            <h2 className="text-5xl md:text-7xl leading-none tracking-[-0.03em] font-medium clip-reveal">AWARDS</h2>
          </div>
          <div className="pt-2">
            <h3 className="text-2xl md:text-3xl font-medium mb-2 clip-reveal">Golden Pin Design Award</h3>
            <div className="text-sm opacity-60 mb-4 clip-reveal">Category / Spatial Design</div>
            <p className="opacity-80 leading-relaxed text-[15px] clip-reveal">
              Since 1981, Taiwan’s Golden Pin Design Award has honored outstanding products and projects in the global Huaren market, with winners receiving the prestigious Design Mark and Best Design trophy.
            </p>
            <a href="#" className="inline-flex items-center h-12 min-w-[10em] justify-center mt-7 border border-[#3b322d] px-6 text-[12px] tracking-[0.14em] uppercase font-medium hover:bg-[#3b322d] hover:text-[#fff9f5] transition-all duration-300">
              VIEW
            </a>
          </div>
        </div>
      </section>

      {/* Products — 4 cards */}
      <section id="products" className="bg-[#fff9f5] py-20 md:py-28 px-5 md:px-10 lg:px-16">
        <div className="max-w-[1320px] mx-auto">
          <div className="text-[11px] tracking-[0.3em] uppercase mb-4 opacity-60 clip-reveal">PRODUCTS</div>
          <h2 className="text-3xl md:text-[48px] leading-[1.02] tracking-[-0.02em] font-medium mb-2 clip-reveal">BESPOKE PRODUCTS</h2>
          <p className="text-lg opacity-80 mb-14 clip-reveal">Performance is more than training—it’s essential</p>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
            {products.map((p) => (
              <div key={p.title} className="clip-reveal">
                <div className="overflow-hidden parallax-el mb-5" data-speed="0.22">
                  <img src={p.img} alt={p.title} className="w-full aspect-[4/3] object-cover" style={{ transform: "translateY(var(--parallax-y, 0px))" }} />
                </div>
                <div className="text-[11px] tracking-[0.3em] uppercase mb-2 opacity-60">{p.cat}</div>
                <h3 className="text-2xl md:text-3xl font-medium mb-3">{p.title}</h3>
                <p className="opacity-80 leading-relaxed text-[15px] mb-5">{p.desc}</p>
                <a href="#" className="text-[12px] tracking-[0.12em] uppercase underline underline-offset-4 hover:opacity-60 transition">
                  Read more: {p.title}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* References */}
      <section id="references" className="bg-[#f1e6df] py-20 md:py-28 px-5 md:px-10 lg:px-16">
        <div className="max-w-[1320px] mx-auto">
          <div className="text-[11px] tracking-[0.3em] uppercase mb-6 opacity-60 clip-reveal">REFERENCES</div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {references.map((r) => (
              <div key={r.title} className="clip-reveal">
                <div className="overflow-hidden parallax-el mb-5" data-speed="0.2">
                  <img src={r.img} alt={r.title} className="w-full aspect-[3/2] object-cover" style={{ transform: "translateY(var(--parallax-y, 0px))" }} />
                </div>
                <div className="text-[11px] tracking-[0.3em] uppercase mb-2 opacity-60">{r.cat}</div>
                <h3 className="text-xl md:text-2xl font-medium mb-4">{r.title}</h3>
                <a href="#" className="text-[12px] tracking-[0.12em] uppercase underline underline-offset-4 hover:opacity-60 transition">
                  Read more: {r.title}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connect */}
      <section id="connect" className="bg-[#fff9f5] py-20 md:py-28 px-5 md:px-10 lg:px-16">
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          <div>
            <h2 className="text-4xl md:text-6xl leading-[0.95] tracking-[-0.025em] font-medium mb-8 clip-reveal">
              LET’S CREATE YOUR NEXT TRAINING SPACE
            </h2>
            <a href="#contact" className="inline-flex items-center h-12 min-w-[10em] justify-center border border-[#3b322d] px-6 text-[12px] tracking-[0.14em] uppercase font-medium hover:bg-[#3b322d] hover:text-[#fff9f5] transition-all duration-300">
              CONTACT
            </a>
          </div>
          <div className="pt-2">
            <h3 className="text-xl md:text-2xl font-medium mb-4 clip-reveal">Keeping up with AUREA</h3>
            <p className="opacity-80 leading-relaxed text-[15px] mb-6 clip-reveal">
              Sometimes, we like to pen or bubble our thoughts on the creative processes, ideations, and little easter eggs that go into the spaces that we create. We’re excited about the work we do every day, and we’re elated to be able to share more about our craft.
            </p>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 border border-[#3b322d]/30 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#3b322d]"
              />
              <button type="submit" className="h-12 px-6 border border-[#3b322d] text-[12px] tracking-[0.14em] uppercase font-medium hover:bg-[#3b322d] hover:text-[#fff9f5] transition-all duration-300">
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
