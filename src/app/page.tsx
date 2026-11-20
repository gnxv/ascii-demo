import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="video-hero">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="font-display text-5xl md:text-7xl lg:text-8xl tracking-widest mb-6">
            AUREA
          </div>
          <p className="max-w-xl text-lg md:text-xl font-light tracking-wide mb-10 opacity-90">
            Пространство силы, восстановления<br />и тихой роскоши
          </p>
          <Link
            href="/membership"
            className="border border-white/60 px-10 py-4 text-sm tracking-widest uppercase hover:bg-white hover:text-aurea-dark transition duration-300"
          >
            Стать членом
          </Link>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="text-xs tracking-[0.3em] uppercase text-aurea-gold mb-6">Два клуба. Одна философия</div>
        <h2 className="font-display text-4xl md:text-5xl mb-8 leading-tight">
          Архитектура движения
        </h2>
        <p className="text-lg leading-relaxed text-aurea-charcoal/80">
          AUREA — это не просто тренажёрный зал. Это тщательно спроектированное пространство, 
          где сила встречается с эстетикой, а восстановление становится частью ритуала. 
          Две локации в Краснодаре: плотный и динамичный City и просторный Park с бассейном и спа.
        </p>
      </section>

      {/* Clubs preview */}
      <section className="bg-aurea-cream py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <div className="bg-white p-12">
            <div className="text-xs tracking-widest uppercase text-aurea-gold mb-4">Центр</div>
            <h3 className="font-display text-3xl mb-4">AUREA City</h3>
            <p className="text-aurea-charcoal/80 mb-6 leading-relaxed">
              Компактный и энергичный клуб в самом сердце города. Идеален для тех, кто ценит время и интенсивность. 
              Полный набор зон силы, студии и персональные тренировки.
            </p>
            <Link href="/clubs" className="text-sm tracking-widest uppercase border-b border-aurea-gold pb-1">
              Подробнее
            </Link>
          </div>
          <div className="bg-white p-12">
            <div className="text-xs tracking-widest uppercase text-aurea-gold mb-4">Спа-зона</div>
            <h3 className="font-display text-3xl mb-4">AUREA Park</h3>
            <p className="text-aurea-charcoal/80 mb-6 leading-relaxed">
              Просторный клуб с бассейном, спа и recovery-зоной. Здесь можно провести целый день: 
              тренировка, плавание, восстановление и lounge.
            </p>
            <Link href="/clubs" className="text-sm tracking-widest uppercase border-b border-aurea-gold pb-1">
              Подробнее
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h2 className="font-display text-4xl md:text-5xl mb-6">Готовы войти</h2>
        <p className="text-lg text-aurea-charcoal/80 mb-10">
          Членство в AUREA — это доступ к обоим клубам, персональному подходу и пространству, которое работает на вас.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-aurea-dark text-white px-12 py-4 text-sm tracking-widest uppercase hover:bg-aurea-gold hover:text-aurea-dark transition duration-300"
        >
          Записаться на тур
        </Link>
      </section>
    </>
  );
}