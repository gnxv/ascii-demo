import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl tracking-[0.2em] font-medium text-white mix-blend-difference">
          AUREA
        </Link>

        <nav className="hidden md:flex items-center gap-8 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-sm text-sm font-medium tracking-widest uppercase text-white">
          <Link href="#studio" className="hover:opacity-70 transition">Студия</Link>
          <Link href="#zones" className="hover:opacity-70 transition">Зоны</Link>
          <Link href="#clubs" className="hover:opacity-70 transition">Клубы</Link>
          <Link href="#awards" className="hover:opacity-70 transition">Награды</Link>
          <Link href="#membership" className="hover:opacity-70 transition">Членство</Link>
          <Link href="#contact" className="hover:opacity-70 transition">Контакты</Link>
        </nav>

        <nav className="md:hidden flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-sm text-xs font-medium tracking-widest uppercase text-white">
          <Link href="#zones">Зоны</Link>
          <Link href="#clubs">Клубы</Link>
          <Link href="#contact">Контакты</Link>
        </nav>
      </div>
    </header>
  );
}