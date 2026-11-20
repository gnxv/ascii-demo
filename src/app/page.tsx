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
          el.classList.remove("opacity-0", "translate-y-12");
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-12 transition-all duration-900 ease-out ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
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

      {/* Block 1 — Studio */}
      <section className="relative py-28 md:py-40 px-4 md:px-6 bg-[#fff9f5]">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-[#a99584] mb-4">Студия</div>
            <h2 className="font-display text-4xl md:text-6xl max-w-3xl leading-tight">
              Мы создаём пространства, которые усиливают движение.
            </h2>
            <p className="mt-8 max-w-xl text-[#3b322d]/80 text-lg">
              Архитектура, свет и программы работают вместе. Интенсивность и восстановление в одном ритме.
            </p>
            <div className="mt-10">
              <a href="#zones" className="btn-outline">Исследовать</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Block 2 — Dark section */}
      <section className="relative bg-[#201d1c] text-[#fff9f5] py-20 md:py-28 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <img src="/block2.jpg" alt="Восстановление" className="w-full aspect-[4/3] object-cover" />
          </Reveal>
          <Reveal delay={150}>
            <div className="text-xs tracking-[0.3em] uppercase opacity-50 mb-3">Восстановление</div>
            <h3 className="text-3xl md:text-4xl font-medium mb-4">Тишина после нагрузки</h3>
            <p className="opacity-80 max-w-md">
              Парная, свет и пространство, где тело возвращается в баланс. Полный цикл в одном клубе.
            </p>
            <a href="#contact" className="btn-outline mt-8 inline-block">Подробнее</a>
          </Reveal>
        </div>
      </section>

      {/* Block 3 — Featured large image */}
      <section className="relative min-h-[80vh] overflow-hidden">
        <img src="/block3.jpg" alt="Сила" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 min-h-[80vh] flex items-end pb-16 px-4 md:px-6">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-white/70 mb-2">Избранное</div>
            <h3 className="text-4xl md:text-5xl text-white font-medium">Зона силы</h3>
            <a href="#zones" className="btn-outline mt-6 inline-block text-white border-white">Смотреть</a>
          </Reveal>
        </div>
      </section>

      {/* Block 4 — Awards */}
      <section className="py-24 px-4 md:px-6 bg-[#fff9f5]">
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
                <div className="border border-[#3b322d]/10 p-6">
                  <div className="text-xs tracking-widest uppercase text-[#a99584]">{item.year}</div>
                  <h3 className="text-xl mt-2">{item.title}</h3>
                  <p className="mt-2 text-sm opacity-70">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="zones" className="py-16 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto text-center opacity-60">
          <p>Далее — существующие зоны и членство</p>
        </div>
      </section>
    </main>
  );
}