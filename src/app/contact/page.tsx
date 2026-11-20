"use client";

import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-xs tracking-[0.3em] uppercase text-aurea-gold mb-6">Связь</div>
        <h1 className="font-display text-5xl md:text-6xl mb-12">Контакты</h1>

        <div className="mb-16 space-y-4 text-lg">
          <p>+7 (861) 200-00-00</p>
          <p>hello@aurea.club</p>
          <p>Краснодар</p>
        </div>

        {!sent ? (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <input
              type="text"
              placeholder="Имя"
              required
              className="w-full border-b border-aurea-charcoal/30 bg-transparent py-3 focus:outline-none focus:border-aurea-gold"
            />
            <input
              type="tel"
              placeholder="Телефон"
              required
              className="w-full border-b border-aurea-charcoal/30 bg-transparent py-3 focus:outline-none focus:border-aurea-gold"
            />
            <textarea
              placeholder="Сообщение"
              rows={4}
              className="w-full border-b border-aurea-charcoal/30 bg-transparent py-3 focus:outline-none focus:border-aurea-gold resize-none"
            />
            <button
              type="submit"
              className="bg-aurea-dark text-white px-10 py-4 text-sm tracking-widest uppercase hover:bg-aurea-gold hover:text-aurea-dark transition"
            >
              Отправить
            </button>
          </form>
        ) : (
          <div className="text-center py-12">
            <p className="font-display text-2xl">Спасибо</p>
            <p className="mt-2 text-aurea-charcoal/70">Мы свяжемся с вами в ближайшее время.</p>
          </div>
        )}
      </div>
    </div>
  );
}