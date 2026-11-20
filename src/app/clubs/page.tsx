export default function Clubs() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-xs tracking-[0.3em] uppercase text-aurea-gold mb-6">Локации</div>
        <h1 className="font-display text-5xl md:text-6xl mb-16">Два клуба</h1>

        <div className="space-y-20">
          <article className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-display text-3xl mb-4">AUREA City</h2>
              <p className="text-aurea-charcoal/80 leading-relaxed mb-6">
                Расположен на улице Красной. Плотный, динамичный формат для тех, кто живёт в ритме города. 
                Здесь сконцентрированы лучшие зоны силы, студия групповых программ и команда персональных тренеров.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Тренажёрный зал премиум-класса</li>
                <li>• Студия йоги и функциональных тренировок</li>
                <li>• Персональные тренировки</li>
                <li>• Lounge и recovery-уголок</li>
              </ul>
              <p className="mt-6 text-sm">ул. Красная, 122<br />Ежедневно 06:00 – 23:00</p>
            </div>
            <div className="bg-aurea-cream aspect-[4/3] flex items-center justify-center text-aurea-charcoal/40 text-sm">
              Фото клуба City
            </div>
          </article>

          <article className="grid md:grid-cols-2 gap-12 items-start">
            <div className="md:order-2">
              <h2 className="font-display text-3xl mb-4">AUREA Park</h2>
              <p className="text-aurea-charcoal/80 leading-relaxed mb-6">
                Просторный клуб на Солнечной. Здесь можно провести весь день: интенсивная тренировка, 
                плавание в бассейне, спа-ритуалы и спокойный отдых в lounge.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Бассейн 25 метров</li>
                <li>• Спа и recovery-зона</li>
                <li>• Расширенный тренажёрный зал</li>
                <li>• Студии и персональные программы</li>
                <li>• Кафе и working space</li>
              </ul>
              <p className="mt-6 text-sm">ул. Солнечная, 48<br />Ежедневно 06:00 – 23:00</p>
            </div>
            <div className="bg-aurea-cream aspect-[4/3] flex items-center justify-center text-aurea-charcoal/40 text-sm md:order-1">
              Фото клуба Park
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}