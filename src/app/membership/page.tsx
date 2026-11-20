export default function Membership() {
  const tiers = [
    {
      name: "City",
      price: "12 000 ₽",
      desc: "Доступ в AUREA City",
      features: ["Тренажёрный зал", "Групповые тренировки", "Базовый recovery"],
    },
    {
      name: "Park",
      price: "18 000 ₽",
      desc: "Доступ в AUREA Park",
      features: ["Полный доступ к Park", "Бассейн и спа", "Групповые + персональные бонусы"],
    },
    {
      name: "AUREA",
      price: "24 000 ₽",
      desc: "Оба клуба",
      features: ["Доступ в City и Park", "Приоритетная запись", "Персональный менеджер", "Гостевые визиты"],
    },
  ];

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="text-xs tracking-[0.3em] uppercase text-aurea-gold mb-6">Членство</div>
        <h1 className="font-display text-5xl md:text-6xl mb-8">Выберите формат</h1>
        <p className="max-w-2xl mx-auto text-lg text-aurea-charcoal/80 mb-16">
          Все уровни членства включают доступ к зонам силы, студиям и комьюнити AUREA. 
          Разница — в пространстве и уровне сервиса.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div key={tier.name} className="bg-white p-10 text-left border border-aurea-cream">
              <div className="text-xs tracking-widest uppercase text-aurea-gold mb-2">{tier.name}</div>
              <div className="font-display text-4xl mb-2">{tier.price}</div>
              <div className="text-sm text-aurea-charcoal/60 mb-8">в месяц</div>
              <p className="mb-6 text-sm">{tier.desc}</p>
              <ul className="space-y-3 text-sm mb-10">
                {tier.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <button className="w-full border border-aurea-dark py-3 text-sm tracking-widest uppercase hover:bg-aurea-dark hover:text-white transition">
                Оставить заявку
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}