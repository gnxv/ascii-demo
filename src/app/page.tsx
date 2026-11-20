import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="text-xs tracking-[0.4em] uppercase text-white/70 mb-6">Краснодар</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight max-w-4xl">
            High-Performance<br />Living
          </h1>
          <p className="mt-8 text-lg md:text-xl text-white/80 max-w-xl font-light">
            Пространство, где тренировка, восстановление и эстетика работают как одна система.
          </p>
          <div className="mt-12">
            <Link href="#membership" className="btn-primary">
              Стать членом
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-32 px-6 md:px-10 max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <div className="section-title">Философия</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">
              Это не фитнес.<br />Это жизнь.
            </h2>
          </div>
          <div className="md:col-span-7 md:col-start-6 text-lg leading-relaxed text-neutral-700">
            <p>
              AUREA создана для тех, кто воспринимает тело и пространство как единую систему. 
              Два клуба в Краснодаре — City и Park — работают как одна экосистема: интенсивность в одном, глубина восстановления в другом.
            </p>
            <p className="mt-6">
              Архитектура, свет, материалы и ритм дня продуманы так, чтобы не отвлекать, а усиливать. 
              Здесь нет шума ради шума. Есть точность.
            </p>
          </div>
        </div>
      </section>

      {/* Clubs */}
      <section id="clubs" className="py-24 bg-neutral-50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="section-title">Локации</div>
          <h2 className="font-display text-4xl md:text-5xl mb-16">Два клуба</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="group">
              <div className="aspect-[16/10] bg-neutral-200 overflow-hidden mb-6">
                <img src="/gym.jpg" alt="AUREA City" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              </div>
              <h3 className="font-display text-2xl mb-2">AUREA City</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Компактный и энергичный клуб в центре. Полный набор зон силы, студии и персональные тренировки. Для тех, кто ценит время.
              </p>
            </div>
            <div className="group">
              <div className="aspect-[16/10] bg-neutral-200 overflow-hidden mb-6">
                <img src="/spa.jpg" alt="AUREA Park" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              </div>
              <h3 className="font-display text-2xl mb-2">AUREA Park</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Просторный клуб с бассейном, спа и recovery-зоной. Здесь можно провести целый день: тренировка, плавание, восстановление.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="py-32 px-6 md:px-10 max-w-[1400px] mx-auto">
        <div className="section-title">Членство</div>
        <h2 className="font-display text-4xl md:text-5xl mb-6">Один формат.<br />Разный доступ.</h2>
        <p className="max-w-xl text-neutral-600 mb-16">
          Все уровни включают доступ к зонам силы, Signature Classes и комьюнити. Разница — в пространстве и уровне сервиса.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "City", price: "12 000 ₽", items: ["AUREA City", "Групповые тренировки", "Базовый recovery"] },
            { name: "Park", price: "18 000 ₽", items: ["AUREA Park", "Бассейн и спа", "Групповые + бонусы"] },
            { name: "AUREA", price: "24 000 ₽", items: ["Оба клуба", "Приоритетная запись", "Персональный менеджер"] },
          ].map((t) => (
            <div key={t.name} className="border border-neutral-200 p-8 hover:border-black transition duration-300">
              <div className="text-xs tracking-widest uppercase text-neutral-500 mb-4">{t.name}</div>
              <div className="font-display text-4xl mb-1">{t.price}</div>
              <div className="text-xs text-neutral-400 mb-8">в месяц</div>
              <ul className="space-y-3 text-sm mb-10">
                {t.items.map((i) => <li key={i}>• {i}</li>)}
              </ul>
              <button className="btn-dark w-full text-center">Заявка</button>
            </div>
          ))}
        </div>
      </section>

      {/* Training */}
      <section id="training" className="py-24 bg-neutral-50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="section-title">Программы</div>
          <h2 className="font-display text-4xl md:text-5xl mb-16">Signature Classes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <img src="/studio.jpg" alt="Studio" className="aspect-[4/3] object-cover mb-6" />
              <h3 className="font-display text-xl mb-2">Студии</h3>
              <p className="text-sm text-neutral-600">Йога, пилатес, функциональный тренинг. Небольшие группы, сильные тренеры.</p>
            </div>
            <div>
              <img src="/gym.jpg" alt="Strength" className="aspect-[4/3] object-cover mb-6" />
              <h3 className="font-display text-xl mb-2">Зоны силы</h3>
              <p className="text-sm text-neutral-600">Премиальное оборудование и пространство, которое не мешает.</p>
            </div>
            <div>
              <img src="/spa.jpg" alt="Recovery" className="aspect-[4/3] object-cover mb-6" />
              <h3 className="font-display text-xl mb-2">Восстановление</h3>
              <p className="text-sm text-neutral-600">Бассейн, спа, steam, recovery. Полный цикл в одном клубе.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-32 px-6 text-center">
        <h2 className="font-display text-4xl md:text-5xl mb-6">Готовы войти</h2>
        <p className="text-neutral-600 mb-10 max-w-md mx-auto">Запишитесь на тур и посмотрите оба клуба.</p>
        <Link href="#contact" className="btn-dark">Записаться</Link>
      </section>
    </>
  );
}