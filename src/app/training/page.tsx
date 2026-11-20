export default function Training() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-xs tracking-[0.3em] uppercase text-aurea-gold mb-6">Программы</div>
        <h1 className="font-display text-5xl md:text-6xl mb-16">Тренировки</h1>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-2xl mb-4">Зоны силы</h2>
            <p className="text-aurea-charcoal/80 leading-relaxed">
              Премиальное оборудование, свободные веса, функциональные зоны. 
              Пространство спроектировано так, чтобы не мешать и не отвлекать.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl mb-4">Групповые программы</h2>
            <p className="text-aurea-charcoal/80 leading-relaxed">
              Йога, пилатес, функциональный тренинг, силовые и мобильность. 
              Небольшие группы, сильные тренеры, продуманное расписание.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl mb-4">Персональные тренировки</h2>
            <p className="text-aurea-charcoal/80 leading-relaxed">
              Индивидуальный подход. Работа с целями, техникой и восстановлением. 
              Тренеры AUREA — это специалисты с опытом и чувством пространства.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl mb-4">Восстановление</h2>
            <p className="text-aurea-charcoal/80 leading-relaxed">
              Бассейн, спа, recovery-зоны. В AUREA Park можно полноценно закрыть цикл: нагрузка → восстановление.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}