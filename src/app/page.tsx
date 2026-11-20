export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 min-h-screen flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-6">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white max-w-5xl">
            АРХИТЕКТУРНАЯ<br />ПРОИЗВОДИТЕЛЬНОСТЬ
          </h1>
          <p className="mt-6 text-white/80 text-base md:text-lg max-w-md">
            Пространства, где интенсивность, восстановление и точность работают вместе.
          </p>
        </div>
      </section>

      {/* Studio / Philosophy */}
      <section className="py-24 md:py-32 section-pad max-w-[1400px] mx-auto">
        <div className="text-xs tracking-[0.25em] uppercase text-[#a99584] mb-4">Студия</div>
        <h2 className="font-display text-4xl md:text-6xl max-w-3xl">
          Мы создаём среды, которые вдохновляют на движение и ясность.
        </h2>
        <p className="mt-8 max-w-xl text-[#3b322d]/80">
          Два клуба в Краснодаре работают как одна система. Архитектура, свет и материалы продуманы с той же тщательностью, что и программы.
        </p>
        <div className="mt-10">
          <a href="#clubs" className="btn-outline">Исследовать</a>
        </div>
      </section>

      {/* Featured / Clubs */}
      <section id="clubs" className="bg-[#201d1c] text-[#fff9f5] py-20 section-pad">
        <div className="text-xs tracking-[0.25em] uppercase opacity-60 mb-6">Избранное</div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <img src="/gym.jpg" alt="AUREA City" className="w-full aspect-[4/3] object-cover" />
            <div className="mt-4 text-sm uppercase tracking-widest opacity-60">Сити</div>
            <h3 className="text-2xl mt-1">AUREA Сити</h3>
            <p className="mt-2 opacity-80 text-sm max-w-sm">Компактный энергичный зал в центре. Сила, студии и точность.</p>
          </div>
          <div>
            <img src="/spa.jpg" alt="AUREA Park" className="w-full aspect-[4/3] object-cover" />
            <div className="mt-4 text-sm uppercase tracking-widest opacity-60">Парк</div>
            <h3 className="text-2xl mt-1">AUREA Парк</h3>
            <p className="mt-2 opacity-80 text-sm max-w-sm">Бассейн, спа и полное восстановление. Место, где можно остаться дольше.</p>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="py-24 section-pad">
        <div className="text-xs tracking-[0.25em] uppercase text-[#a99584] mb-4">Членство</div>
        <h2 className="font-display text-4xl md:text-5xl mb-12">Индивидуальный доступ</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Сити", price: "12 000 ₽", desc: "Доступ в AUREA Сити. Групповые тренировки и основные зоны." },
            { name: "Парк", price: "18 000 ₽", desc: "AUREA Парк с бассейном, спа и расширенным восстановлением." },
            { name: "AUREA", price: "24 000 ₽", desc: "Оба клуба. Приоритетная запись и персональная поддержка." },
          ].map((item) => (
            <div key={item.name} className="border border-[#3b322d]/10 p-6">
              <div className="text-xs tracking-widest uppercase text-[#a99584]">{item.name}</div>
              <div className="text-3xl mt-3">{item.price}</div>
              <p className="mt-4 text-sm opacity-80">{item.desc}</p>
              <button className="btn-outline mt-8 text-xs">Заявка</button>
            </div>
          ))}
        </div>
      </section>

      {/* Training */}
      <section id="training" className="py-20 section-pad bg-[#fff9f5]">
        <div className="text-xs tracking-[0.25em] uppercase text-[#a99584] mb-6">Программы</div>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <img src="/studio.jpg" alt="Студии" className="w-full aspect-[3/2] object-cover" />
            <h3 className="mt-4 text-xl">Студии</h3>
            <p className="mt-1 text-sm opacity-70">Йога, пилатес и функциональные форматы в небольших группах.</p>
          </div>
          <div>
            <img src="/gym.jpg" alt="Сила" className="w-full aspect-[3/2] object-cover" />
            <h3 className="mt-4 text-xl">Зоны силы</h3>
            <p className="mt-1 text-sm opacity-70">Премиальное оборудование и свободное пространство.</p>
          </div>
          <div>
            <img src="/spa.jpg" alt="Восстановление" className="w-full aspect-[3/2] object-cover" />
            <h3 className="mt-4 text-xl">Восстановление</h3>
            <p className="mt-1 text-sm opacity-70">Бассейн, парная и специальные протоколы восстановления.</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-32 section-pad text-center">
        <h2 className="font-display text-4xl md:text-5xl">Контакты</h2>
        <p className="mt-4 opacity-70 max-w-sm mx-auto">Запишитесь на экскурсию по обоим клубам.</p>
        <div className="mt-8">
          <a href="mailto:hello@aurea.club" className="btn-outline">Связаться</a>
        </div>
      </section>
    </main>
  );
}