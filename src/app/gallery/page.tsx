export default function Gallery() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-xs tracking-[0.3em] uppercase text-aurea-gold mb-6">Пространство</div>
        <h1 className="font-display text-5xl md:text-6xl mb-16">Галерея</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-aurea-cream aspect-square flex items-center justify-center text-aurea-charcoal/30 text-sm"
            >
              Фото {i + 1}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-aurea-charcoal/50 mt-12">
          Демо-галерея. В реальном проекте здесь будут профессиональные фотографии клубов.
        </p>
      </div>
    </div>
  );
}