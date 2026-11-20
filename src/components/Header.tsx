import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference text-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl tracking-[0.2em] font-medium">
          AUREA
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm tracking-widest uppercase">
          <Link href="#clubs" className="hover:opacity-60 transition">Клубы</Link>
          <Link href="#membership" className="hover:opacity-60 transition">Членство</Link>
          <Link href="#training" className="hover:opacity-60 transition">Тренировки</Link>
          <Link href="#recovery" className="hover:opacity-60 transition">Восстановление</Link>
          <Link href="#contact" className="hover:opacity-60 transition">Контакты</Link>
        </nav>

        {/* Mobile simple links */}
        <nav className="md:hidden flex items-center gap-4 text-xs tracking-widest uppercase">
          <Link href="#clubs">Клубы</Link>
          <Link href="#membership">Членство</Link>
          <Link href="#contact">Контакты</Link>
        </nav>
      </div>
    </header>
  );
}