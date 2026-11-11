'use client';

import { useRef } from 'react';

const popularGigs = [
  { id: 1, title: 'Nama Gigs', organizer: 'Penyelenggara', price: 'Rp 666.000', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
  { id: 2, title: 'Nama Gigs', organizer: 'Penyelenggara', price: 'Rp 666.000', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
  { id: 3, title: 'Nama Gigs', organizer: 'Penyelenggara', price: 'Rp 666.000', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
  { id: 4, title: 'Nama Gigs', organizer: 'Penyelenggara', price: 'Rp 666.000', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
  { id: 5, title: 'Nama Gigs', organizer: 'Penyelenggara', price: 'Rp 666.000', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
];

const thisWeekGigs = [
  { id: 1, title: 'Nama Gigs', organizer: 'Lokasi — Penyelenggara Gigs', date: '4 Nov', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
  { id: 2, title: 'Nama Gigs', organizer: 'Lokasi — Penyelenggara Gigs', date: null, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
  { id: 3, title: 'Nama Gigs', organizer: 'Lokasi — Penyelenggara Gigs', date: null, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
  { id: 4, title: 'Nama Gigs', organizer: 'Lokasi — Penyelenggara Gigs', date: '6 Nov', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
  { id: 5, title: 'Nama Gigs', organizer: 'Lokasi — Penyelenggara Gigs', date: '7 Nov', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop' },
];

export default function HomePage() {
  const popularSliderRef = useRef(null);

  const scroll = (direction) => {
    if (popularSliderRef.current) {
      const { scrollLeft, clientWidth } = popularSliderRef.current;
      const scrollAmount = clientWidth * 0.75;
      popularSliderRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C]">
      {/* HERO BANNER SECTION */}
      <section className="relative h-[380px] md:h-[450px] w-full overflow-hidden flex items-center justify-center bg-black">
        <img
          src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&auto=format&fit=crop" alt="Concert Hero Visual" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity scale-105"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
        <div className="relative z-10 text-center px-4">
          {/* Judul Bebas Neue Jangkung / Condensed */}
          <h1 className="font-bebas text-7xl md:text-[200px] text-white tracking-[0.05em] leading-none uppercase drop-shadow-md" style={{ fontFamily: 'var(--font-bebas-neue), "Bebas Neue", sans-serif' }}>
            GIGSPACE
          </h1>
          <p className="mt-3 text-xs md:text-sm font-extrabold text-white tracking-[0.25em] uppercase drop-shadow">
            DISCOVER LOCAL MUSIC SCENE AROUND YOU
          </p>
        </div>
      </section>

      {/* KONTEN UTAMA */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
        
        {/* 3. REVISI POPULAR GIGS (ICON GAMBAR KUSTOM) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-[#1C1C1C] flex items-center gap-2.5">
              <img src="/icons/popular.png" alt="Popular Icon" className="w-6 h-6 object-contain" />
              Popular Gigs
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-[#FF2E9A] hover:text-white transition font-bold"
              >
                ‹
              </button>
              <button 
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-[#FF2E9A] hover:text-white transition font-bold"
              >
                ›
              </button>
            </div>
          </div>

          <div 
            ref={popularSliderRef}
            className="flex items-center gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          >
            {popularGigs.map((gig) => (
              <div 
                key={gig.id} 
                className="min-w-[240px] md:min-w-[260px] bg-[#FFF0F6] rounded-2xl p-3 border border-pink-100 flex-shrink-0 shadow-sm"
              >
                <div className="h-32 rounded-xl overflow-hidden mb-3">
                  <img src={gig.image} alt={gig.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Lokasi</p>
                  <h3 className="font-extrabold text-[#FF2E9A] text-base leading-tight">{gig.title}</h3>
                  <p className="text-xs text-gray-400">{gig.organizer}</p>
                  <div className="pt-2 border-t border-pink-200/60 mt-2">
                    <p className="text-[10px] text-gray-400">Mulai dari</p>
                    <p className="font-extrabold text-[#FF2E9A] text-sm">{gig.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. REVISI UPCOMING GIGS (ICON GAMBAR KUSTOM) */}
        <section>
          <h2 className="text-xl font-extrabold text-[#1C1C1C] flex items-center gap-2.5 mb-4">
            <img src="/icons/upcoming.png" alt="Upcoming Icon" className="w-6 h-6 object-contain" />
            Upcoming Gigs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {popularGigs.slice(0, 4).map((gig) => (
              <div 
                key={gig.id} 
                className="bg-[#FFF0F6] rounded-2xl p-3 border border-pink-100 shadow-sm"
              >
                <div className="h-32 rounded-xl overflow-hidden mb-3">
                  <img src={gig.image} alt={gig.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Lokasi</p>
                  <h3 className="font-extrabold text-[#FF2E9A] text-base leading-tight">{gig.title}</h3>
                  <p className="text-xs text-gray-400">{gig.organizer}</p>
                  <div className="pt-2 border-t border-pink-200/60 mt-2">
                    <p className="text-[10px] text-gray-400">Mulai dari</p>
                    <p className="font-extrabold text-[#FF2E9A] text-sm">{gig.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. REVISI THIS WEEK (ICON GAMBAR KUSTOM) */}
        <section className="relative pt-4">
          <h2 className="text-xl font-extrabold text-[#1C1C1C] flex items-center gap-2.5 mb-8">
            <img src="/icons/this-week.png" alt="This Week Icon" className="w-6 h-6 object-contain" />
            This Week
          </h2>

          {/* KONTAINER UTAMA TIMELINE */}
          <div className="relative">
            
            {/* 1. GARIS TIMELINE UTUH (Lurus dari Atas ke Bawah di Sebelah Kanan) */}
            <div className="absolute right-[27px] md:right-[27px] top-6 bottom-6 w-[2px] bg-[#FF2E9A] z-0 pointer-events-none" />

            {/* 2. DAFTAR BARIS GIGS */}
            <div className="space-y-0">
              {thisWeekGigs.map((gig) => {
                const dateParts = gig.date ? gig.date.split(' ') : null;

                return (
                  <div 
                    key={gig.id} 
                    className="relative py-4 pr-20 md:pr-24 min-h-[96px] flex items-center justify-between"
                  >
                    {/* KONTEN KIRI: Gambar & Info Gigs */}
                    <div className="flex items-center gap-4 z-10">
                      <div className="w-28 md:w-36 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={gig.image} alt={gig.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#FF2E9A] text-base md:text-lg leading-tight">
                          {gig.title}
                        </h3>
                        <p className="text-xs text-pink-400 font-medium mt-1">
                          {gig.organizer}
                        </p>
                      </div>
                    </div>

                    {/* KOTAK TANGGAL (Numpuk di Atas Garis Vertikal) */}
                    {dateParts && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                        <div className="bg-[#FFF0F6] border-2 border-[#FF2E9A] rounded-2xl w-14 h-16 flex flex-col items-center justify-center shadow-sm">
                          <span className="text-xl font-black text-[#FF2E9A] leading-none">
                            {dateParts[0]}
                          </span>
                          <span className="text-xs font-bold text-[#FF2E9A] leading-tight mt-0.5">
                            {dateParts[1]}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* GARIS HORIZONTAL TIPIS (Panjangnya dipotong di mr-4 biar BERHENTI SEBELUM garis vertikal) */}
                    <div className="absolute bottom-0 left-0 right-16 md:right-20 mr-4 h-[1px] bg-pink-200/60 pointer-events-none" />
                  </div>
                );
              })}
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}