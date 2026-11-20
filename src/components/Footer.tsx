import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-aurea-dark text-aurea-light mt-32">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-12">
        <div>
          <div className="font-display text-3xl tracking-widest mb-4">AUREA</div>
          <p className="text-sm text-aurea-cream/70 leading-relaxed">
            Премиальное пространство силы и восстановления.<br />Краснодар.
          </p>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase mb-4 text-aurea-gold">Навигация</div>
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/clubs">Клубы</Link>
            <Link href="/membership">Членство</Link>
            <Link href="/training">Тренировки</Link>
            <Link href="/contact">Контакты</Link>
          </div>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase mb-4 text-aurea-gold">Клубы</div>
          <div className="text-sm space-y-3">
            <div>AUREA City<br /><span className="text-aurea-cream/60">ул. Красная, 122</span></div>
            <div>AUREA Park<br /><span className="text-aurea-cream/60">ул. Солнечная, 48</span></div>
          </div>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase mb-4 text-aurea-gold">Связь</div>
          <div className="text-sm space-y-2">
            <div>+7 (861) 200-00-00</div>
            <div>hello@aurea.club</div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-aurea-cream/50">
        © {new Date().getFullYear()} AUREA. Все права защищены.
      </div>
    </footer>
  );
}