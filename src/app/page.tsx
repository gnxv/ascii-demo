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
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-12 transition-all duration-1000 ease-out ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Card({ card, index }: { card: any; index: number }) {
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-6");
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="group relative aspect-[4/3] overflow-hidden bg-neutral-900"
      onMouseEnter={(e) => {
        const video = e.currentTarget.querySelector("video");
        if (video) video.play();
      }}
      onMouseLeave={(e) => {
        const video = e.currentTarget.querySelector("video");
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      }}
    >
      <video
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={card.video}
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500" />

      <div className="absolute top-6 left-6 text-white z-10">
        <div className="text-xs tracking-[0.2em] uppercase opacity-70">{card.category}</div>
        <h3 className="text-2xl md:text-3xl font-medium mt-0.5">{card.title}</h3>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
        <p
          ref={textRef}
          className="text-sm text-white/90 max-w-sm opacity-0 translate-y-6 transition-all duration-700 ease-out"
          style={{ transitionDelay: `${index * 100}ms` }}
        >
          {card.desc}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const cards = [
    {
      video: "/card1.mp4",
      title: "Сила",
      category: "Зоны",
      desc: "Пространство для точной работы с весом. Свобода движения и премиальное оборудование.",
    },
    {
      video: "/card2.mp4",
      title: "Восстановление",
      category: "Спа",
      desc: "Парная, тишина и ритуалы после нагрузки. Полный цикл в одном клубе.",
    },
    {
      video: "/card3.mp4",
      title: "Студии",
      category: "Группы",
      desc: "Йога, пилатес и функционал. Небольшие группы, сильные тренеры.",
    },
    {
      video: "/card4.mp4",
      title: "Бассейн",
      category: "Вода",
      desc: "Спокойная вода для плавания и восстановления. Часть ежедневного ритма.",
    },
  ];

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

      {/* Studio */}
      <section id="studio" className="relative py-28 md:py-40 section-pad">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-[#a99584] mb-5">Студия</div>
            <h2 className="font-display text-4xl md:text-6xl max-w-3xl leading-tight">
              Два клуба.<br />Одна система.
            </h2>
            <p className="mt-10 max-w-xl text-[#3b322d]/80 text-lg leading-relaxed">
              Архитектура, свет и программы продуманы так, чтобы не отвлекать, а усиливать. Интенсивность в одном, глубина восстановления в другом.
            </p>
            <div className="mt-12">
              <a href="#zones" className="btn-outline">Исследовать</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured */}
      <section className="relative bg-[#201d1c] text-[#fff9f5] py-32 section-pad overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase opacity-50 mb-6">Избранное</div>
            <h2 className="font-display text-4xl md:text-5xl mb-16 max-w-2xl">
              Пространства, которые остаются с тобой.
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-8">
            <Reveal delay={100}>
              <img src="/gym.jpg" alt="AUREA Сити" className="w-full aspect-[4/3] object-cover" />
              <div className="mt-5 text-sm uppercase tracking-widest opacity-50">Сити</div>
              <h3 className="text-2xl mt-1">AUREA Сити</h3>
              <p className="mt-2 opacity-75 text-sm max-w-sm">Компактный энергичный зал в центре. Сила, студии и точность.</p>
            </Reveal>
            <Reveal delay={200}>
              <img src="/spa.jpg" alt="AUREA Парк" className="w-full aspect-[4/3] object-cover" />
              <div className="mt-5 text-sm uppercase tracking-widest opacity-50">Парк</div>
              <h3 className="text-2xl mt-1">AUREA Парк</h3>
              <p className="mt-2 opacity-75 text-sm max-w-sm">Бассейн, спа и полное восстановление. Место, где можно остаться дольше.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section id="awards" className="py-28 section-pad">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-[#a99584] mb-5">Награды</div>
            <h2 className="font-display text-4xl md:text-5xl mb-14">Признание</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { year: "2024", title: "Best Wellness Space", desc: "Южная Россия. За архитектуру recovery-зоны." },
              { year: "2023", title: "Design Award", desc: "Краснодар. За целостность пространства." },
              { year: "2022", title: "Community Choice", desc: "Голосование членов. За атмосферу." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="border border-[#3b322d]/10 p-7 h-full">
                  <div className="text-xs tracking-widest uppercase text-[#a99584]">{item.year}</div>
                  <h3 className="text-xl mt-3">{item.title}</h3>
                  <p className="mt-2 text-sm opacity-70">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Zones */}
      <section id="zones" className="py-16 section-pad bg-[#fff9f5]">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-[#a99584] mb-5">Зоны</div>
            <h2 className="font-display text-4xl md:text-5xl mb-12">Четыре пространства</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-4">
            {cards.map((card, i) => (
              <Card key={card.title} card={card} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="py-28 section-pad">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="text-xs tracking-[0.3em] uppercase text-[#a99584] mb-5">Членство</div>
            <h2 className="font-display text-4xl md:text-5xl mb-14">Индивидуальный доступ</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Сити", price: "12 000 ₽", desc: "Доступ в AUREA Сити. Групповые тренировки и основные зоны." },
              { name: "Парк", price: "18 000 ₽", desc: "AUREA Парк с бассейном, спа и расширенным восстановлением." },
              { name: "AUREA", price: "24 000 ₽", desc: "Оба клуба. Приоритетная запись и персональная поддержка." },
            ].map((item, i) => (
              <Reveal key={item.name} delay={i * 100}>
                <div className="border border-[#3b322d]/10 p-7">
                  <div className="text-xs tracking-widest uppercase text-[#a99584]">{item.name}</div>
                  <div className="text-3xl mt-3">{item.price}</div>
                  <p className="mt-4 text-sm opacity-80">{item.desc}</p>
                  <button className="btn-outline mt-8 text-xs">Заявка</button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-36 section-pad text-center">
        <Reveal>
          <h2 className="font-display text-4xl md:text-5xl">Контакты</h2>
          <p className="mt-5 opacity-70 max-w-sm mx-auto">Запишитесь на экскурсию по обоим клубам.</p>
          <div className="mt-10">
            <a href="mailto:hello@aurea.club" className="btn-outline">Связаться</a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}