"use client";

import { useEffect, useRef } from "react";

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-10");
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-10 transition-all duration-800 ease-out ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => {
      const y = window.scrollY;
      root.style.setProperty("--scroll-y", `${y}px`);
      root.style.setProperty("--parallax-slow", `${y * 0.12}px`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 min-h-screen flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-6">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white max-w-4xl leading-[0.92]">
            Высокая<br />производительность
          </h1>
          <p className="mt-6 text-white/75 text-base md:text-lg max-w-md">
            Пространство, где тренировка и восстановление работают как одна система.
          </p>
        </div>
      </section>

      {/* 1. Studio */}
      <section className="relative py-24 md:py-36 px-4 md:px-6 bg-[#fff9f5] text-[#3b322d]">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-[#a99584] mb-4">Студия</div>
            <h2 className="font-display text-4xl md:text-6xl max-w-3xl leading-tight">
              Мы создаём пространства, которые усиливают движение и тишину.
            </h2>
            <p className="mt-8 max-w-xl text-[#3b322d]/80 text-lg leading-relaxed">
              Архитектурная точность и ощущение свободы. Интенсивность и восстановление в одном ритме.
            </p>
            <div className="mt-10">
              <a href="#zones" className="btn-outline">Исследовать</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. Dark section with parallax */}
      <section className="relative bg-[#201d1c] text-[#fff9f5] overflow-hidden py-20 md:py-28 px-4 md:px-6">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ transform: "translateY(var(--parallax-slow))" }}
        />
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-10 items-center relative">
          <Reveal>
            <img src="/block2.jpg" alt="Восстановление" className="w-full aspect-[4/3] object-cover rounded-lg" />
          </Reveal>
          <Reveal delay={120}>
            <div className="text-xs tracking-[0.3em] uppercase opacity-50 mb-3">Восстановление</div>
            <h3 className="text-3xl md:text-4xl font-medium mb-4">Тишина после нагрузки</h3>
            <p className="opacity-80 max-w-md leading-relaxed">
              Парная, свет и пространство, где тело возвращается в баланс. Полный цикл в одном клубе.
            </p>
            <a href="#contact" className="btn-outline mt-8 inline-block">Подробнее</a>
          </Reveal>
        </div>
      </section>

      {/* 3. Featured with sticky */}
      <section className="relative min-h-[90vh] overflow-hidden">
        <img src="/block3.jpg" alt="Зона силы" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="sticky top-0 min-h-[90vh] flex items-end pb-16 px-4 md:px-6">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-white/60 mb-2">Избранное</div>
            <h3 className="text-4xl md:text-5xl text-white font-medium">Зона силы</h3>
            <a href="#zones" className="btn-outline mt-6 inline-block text-white border-white">Смотреть</a>
          </Reveal>
        </div>
      </section>

      {/* 4. Awards */}
      <section className="relative py-20 md:py-28 px-4 md:px-6 bg-[#fff9f5]">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-[#a99584] mb-4">Наши</div>
            <h2 className="font-display text-4xl md:text-5xl mb-12">Награды</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { year: "2024", title: "Best Wellness Space", desc: "За архитектуру зоны восстановления." },
              { year: "2023", title: "Design Award", desc: "За целостность пространства клуба." },
              { year: "2022", title: "Community Choice", desc: "Выбор членов клуба." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="border border-[#3b322d]/10 p-6 rounded-lg">
                  <div className="text-xs tracking-widest uppercase text-[#a99584]">{item.year}</div>
                  <h3 className="text-xl mt-2">{item.title}</h3>
                  <p className="mt-2 text-sm opacity-70">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Membership intro */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-[#fff9f5]">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-[#a99584] mb-4">Членство</div>
            <h2 className="font-display text-4xl md:text-5xl max-w-2xl">
              Индивидуальный доступ к двум клубам.
            </h2>
            <p className="mt-6 max-w-xl text-[#3b322d]/80">
              Выбирайте формат, который соответствует вашему ритму. Сити, Парк или оба пространства.
            </p>
            <div className="mt-10">
              <a href="#membership" className="btn-outline">Смотреть варианты</a>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="zones" className="py-12 text-center opacity-50 text-sm">
        Далее — существующие зоны
      </section>
    </main>
  );
}