import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 py-16 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-4 gap-12 text-sm">
        <div>
          <div className="font-display text-2xl tracking-[0.25em] mb-4">AUREA</div>
          <p className="text-neutral-500 leading-relaxed">
            High-Performance Living.<br />Краснодар.
          </p>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase text-neutral-400 mb-4">Навигация</div>
          <div className="flex flex-col gap-3">
            <Link href="#clubs">Клубы</Link>
            <Link href="#membership">Членство</Link>
            <Link href="#training">Тренировки</Link>
          </div>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase text-neutral-400 mb-4">Клубы</div>
          <div className="space-y-3 text-neutral-600">
            <div>City · ул. Красная, 122</div>
            <div>Park · ул. Солнечная, 48</div>
          </div>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase text-neutral-400 mb-4">Связь</div>
          <div className="space-y-2 text-neutral-600">
            <div>+7 (861) 200-00-00</div>
            <div>hello@aurea.club</div>
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-neutral-100 text-xs text-neutral-400">
        © {new Date().getFullYear()} AUREA
      </div>
    </footer>
  );
}