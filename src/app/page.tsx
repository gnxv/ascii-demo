export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 min-h-screen flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-6">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white max-w-5xl">
            BESPOKE<br />ARCHITECTURAL<br />PERFORMANCE
          </h1>
          <p className="mt-6 text-white/80 text-base md:text-lg max-w-md">
            We design and craft spaces that merge intensity, recovery, and precision.
          </p>
        </div>
      </section>

      {/* Studio / Philosophy */}
      <section className="py-24 md:py-32 section-pad max-w-[1400px] mx-auto">
        <div className="text-xs tracking-[0.25em] uppercase text-[#a99584] mb-4">Studio</div>
        <h2 className="font-display text-4xl md:text-6xl max-w-3xl">
          We create extraordinary environments that inspire movement and clarity.
        </h2>
        <p className="mt-8 max-w-xl text-[#3b322d]/80">
          Two clubs in Krasnodar operate as one system. Architecture, light, and material are treated with the same care as programming.
        </p>
        <div className="mt-10">
          <a href="#clubs" className="btn-outline">Explore</a>
        </div>
      </section>

      {/* Featured / Clubs */}
      <section id="clubs" className="bg-[#201d1c] text-[#fff9f5] py-20 section-pad">
        <div className="text-xs tracking-[0.25em] uppercase opacity-60 mb-6">Featured</div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <img src="/gym.jpg" alt="AUREA City" className="w-full aspect-[4/3] object-cover" />
            <div className="mt-4 text-sm uppercase tracking-widest opacity-60">City</div>
            <h3 className="text-2xl mt-1">AUREA City</h3>
            <p className="mt-2 opacity-80 text-sm max-w-sm">Compact, high-energy training floor in the center. Strength, studios, and precision.</p>
          </div>
          <div>
            <img src="/spa.jpg" alt="AUREA Park" className="w-full aspect-[4/3] object-cover" />
            <div className="mt-4 text-sm uppercase tracking-widest opacity-60">Park</div>
            <h3 className="text-2xl mt-1">AUREA Park</h3>
            <p className="mt-2 opacity-80 text-sm max-w-sm">Pool, spa, and full recovery. A place to stay longer.</p>
          </div>
        </div>
      </section>

      {/* Products / Membership */}
      <section id="membership" className="py-24 section-pad">
        <div className="text-xs tracking-[0.25em] uppercase text-[#a99584] mb-4">Membership</div>
        <h2 className="font-display text-4xl md:text-5xl mb-12">Bespoke Access</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "City", price: "12 000 ₽", desc: "Access to AUREA City. Group training and core zones." },
            { name: "Park", price: "18 000 ₽", desc: "AUREA Park with pool, spa, and extended recovery." },
            { name: "AUREA", price: "24 000 ₽", desc: "Both clubs. Priority booking and dedicated support." },
          ].map((item) => (
            <div key={item.name} className="border border-[#3b322d]/10 p-6">
              <div className="text-xs tracking-widest uppercase text-[#a99584]">{item.name}</div>
              <div className="text-3xl mt-3">{item.price}</div>
              <p className="mt-4 text-sm opacity-80">{item.desc}</p>
              <button className="btn-outline mt-8 text-xs">Inquire</button>
            </div>
          ))}
        </div>
      </section>

      {/* References / Training */}
      <section id="training" className="py-20 section-pad bg-[#fff9f5]">
        <div className="text-xs tracking-[0.25em] uppercase text-[#a99584] mb-6">Programs</div>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <img src="/studio.jpg" alt="Studios" className="w-full aspect-[3/2] object-cover" />
            <h3 className="mt-4 text-xl">Signature Studios</h3>
            <p className="mt-1 text-sm opacity-70">Yoga, pilates, and functional formats in small groups.</p>
          </div>
          <div>
            <img src="/gym.jpg" alt="Strength" className="w-full aspect-[3/2] object-cover" />
            <h3 className="mt-4 text-xl">Strength Floors</h3>
            <p className="mt-1 text-sm opacity-70">Premium equipment and unobstructed space.</p>
          </div>
          <div>
            <img src="/spa.jpg" alt="Recovery" className="w-full aspect-[3/2] object-cover" />
            <h3 className="mt-4 text-xl">Recovery</h3>
            <p className="mt-1 text-sm opacity-70">Pool, steam, and dedicated recovery protocols.</p>
          </div>
        </div>
      </section>

      {/* Connect */}
      <section id="contact" className="py-32 section-pad text-center">
        <h2 className="font-display text-4xl md:text-5xl">Connect</h2>
        <p className="mt-4 opacity-70 max-w-sm mx-auto">Schedule a visit to both clubs.</p>
        <div className="mt-8">
          <a href="mailto:hello@aurea.club" className="btn-outline">Get in touch</a>
        </div>
      </section>
    </main>
  );
}