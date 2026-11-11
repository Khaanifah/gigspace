'use client';

const alurPemesanan = [
  'Pilih konser',
  'Pilih kategori tiket',
  'Cek detail pesanan',
  'Metode pembayaran',
  'Bayar',
];

const alurKerjasama = [
  'Hubungi kami melalui email dengan subjek "kerjasama"',
  'Cantumkan proposal pada email',
  'Tunggu konfirmasi dari pihak kami',
  'Metode pembayaran',
  'Bayar',
];

export default function AboutPage() {
  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-16 font-sans">
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-12">
        
        {/* BAGIAN 1: HERO BANNER (CONTAINED / NON-FULL) */}
        <section className="relative h-[220px] sm:h-[280px] md:h-[340px] w-full rounded-none overflow-hidden bg-black shadow-md flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop"
            alt="About Us Banner Visual"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          {/* Subtle Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 pointer-events-none" />

          {/* Judul ABOUT US (Bebas Neue) */}
          <h1 
            className="relative z-10 font-bebas text-5xl sm:text-7xl md:text-8xl text-white tracking-[0.08em] uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: 'var(--font-bebas-neue), "Bebas Neue", sans-serif' }}
          >
            ABOUT US
          </h1>
        </section>

        {/* BAGIAN 2: DESKRIPSI GIGSPACE */}
        <section className="space-y-4 max-w-4xl">
          {/* Title Badge Fuchsia */}
          <div className="inline-block bg-[#FF2E9A] text-white px-5 py-2 rounded-none">
            <h2 
              className="font-bebas text-2xl md:text-3xl tracking-wide uppercase leading-none"
              style={{ fontFamily: 'var(--font-bebas-neue), "Bebas Neue", sans-serif' }}
            >
              GIGSPACE
            </h2>
          </div>

          <p className="text-sm md:text-base text-[#FF2E9A] leading-relaxed font-medium">
            Gigspace adalah platform penemuan dan pemesanan tiket pertunjukan musik lokal secara instan. Kami hadir untuk menghubungkan penikmat musik dengan berbagai gig lokal, festival, dan panggung independen secara mudah, transparan, dan terintegrasi dalam satu wadah visual yang dinamis.
          </p>
        </section>

        {/* BAGIAN 3: ALUR PEMESANAN TIKET */}
        <section className="space-y-5 max-w-4xl">
          {/* Title Badge Fuchsia */}
          <div className="inline-block bg-[#FF2E9A] text-white px-5 py-2 rounded-none">
            <h2 
              className="font-bebas text-2xl md:text-3xl tracking-wide uppercase leading-none"
              style={{ fontFamily: 'var(--font-bebas-neue), "Bebas Neue", sans-serif' }}
            >
              ALUR PEMESANAN TIKET
            </h2>
          </div>

          {/* List Step 1-5 */}
          <div className="space-y-3 pt-1">
            {alurPemesanan.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-none border border-[#FF2E9A]/40 bg-[#FFF0F6] text-[#FF2E9A] flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                  {index + 1}
                </div>
                <span className="text-sm md:text-base text-[#FF2E9A] font-medium">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* BAGIAN 4: ALUR KERJASAMA (EO) */}
        <section className="space-y-5 max-w-4xl">
          {/* Title Badge Fuchsia */}
          <div className="inline-block bg-[#FF2E9A] text-white px-5 py-2 rounded-none">
            <h2 
              className="font-bebas text-2xl md:text-3xl tracking-wide uppercase leading-none"
              style={{ fontFamily: 'var(--font-bebas-neue), "Bebas Neue", sans-serif' }}
            >
              ALUR KERJASAMA
            </h2>
          </div>

          {/* List Step 1-5 */}
          <div className="space-y-3 pt-1">
            {alurKerjasama.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-none border border-[#FF2E9A]/40 bg-[#FFF0F6] text-[#FF2E9A] flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                  {index + 1}
                </div>
                <span className="text-sm md:text-base text-[#FF2E9A] font-medium">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}