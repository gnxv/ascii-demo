export default function Footer() {
  return (
    <footer className="border-t border-[#3b322d]/10 py-12 section-pad text-sm">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="tracking-[0.2em] text-lg">AUREA</div>
          <p className="mt-2 opacity-60">Высокая производительность · Краснодар</p>
        </div>
        <div className="opacity-60">
          Сити · ул. Красная, 122<br />
          Парк · ул. Солнечная, 48
        </div>
      </div>
    </footer>
  );
}