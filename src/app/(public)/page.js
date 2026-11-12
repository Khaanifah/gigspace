'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { eventsData } from '@/lib/eventsData';

export default function HomePage() {
  const popularScrollRef = useRef(null);

  // Ambil data dari eventsData agar saat diklik langsung nyambung ke /events/[id]
  const popularGigs = eventsData.slice(0, 8);
  const upcomingGigs = eventsData.slice(0, 4);
  const thisWeekGroups = [
    {
      date: '4',
      month: 'Nov',
      gigs: eventsData.slice(0, 3),
    },
    {
      date: '12',
      month: 'Nov',
      gigs: eventsData.slice(3, 5),
    },
  ];

  const scrollPopular = (direction) => {
    if (!popularScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -300 : 300;
    popularScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    })
      .format(amount || 0)
      .replace('IDR', 'Rp');
  };

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-20 font-sans">
      
      {/* 1. HERO BANNER FULL-WIDTH (PERSIS SCREENSHOT 1) */}
      <section className="relative h-[320px] sm:h-[400px] md:h-[460px] w-full overflow-hidden bg-black flex flex-col items-center justify-center text-center px-4">
        <img
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop"
          alt="Gigspace Hero Visual"
          className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <h1 className="font-bebas text-7xl sm:text-8xl md:text-[130px] text-white tracking-[0.06em] uppercase leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            GIGSPACE
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm font-bold text-white tracking-[0.22em] uppercase">
            DISCOVER LOCAL MUSIC SCENE AROUND YOU
          </p>
        </div>
      </section>

      {/* KONTEN UTAMA */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-12 space-y-14">
        
        {/* 2. SECTION: POPULAR GIGS (HORIZONTAL CAROUSEL + TOMBOL < >) */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Ikon Chart Pink */}
              <svg
                className="w-5 h-5 stroke-[#FF2E9A]"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5"
                />
              </svg>
              <h2 className="text-lg md:text-xl font-extrabold text-[#1C1C1C]">
                Popular Gigs
              </h2>
            </div>

            {/* Tombol Navigasi Bulat < > */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollPopular('left')}
                aria-label="Geser kiri"
                className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-[#FF2E9A] hover:text-[#FF2E9A] flex items-center justify-center text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollPopular('right')}
                aria-label="Geser kanan"
                className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-[#FF2E9A] hover:text-[#FF2E9A] flex items-center justify-center text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Cards (BISA DIKLIK KE /events/[id]) */}
          <div
            ref={popularScrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-2"
          >
            {popularGigs.map((gig) => (
              <Link
                key={`popular-${gig.id}`}
                href={`/events/${gig.id}`}
                className="group min-w-[235px] sm:min-w-[250px] max-w-[250px] bg-[#FFF0F6] rounded-2xl p-3 border border-pink-100/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between flex-shrink-0"
              >
                <div>
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-black">
                    <img
                      src={gig.image}
                      alt={gig.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="pt-3 px-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#FF2E9A]/60">
                      {gig.location}
                    </p>
                    <h3 className="text-sm font-extrabold text-[#FF2E9A] mt-0.5 line-clamp-1 group-hover:underline">
                      {gig.title}
                    </h3>
                    <p className="text-[11px] font-medium text-[#FF2E9A]/75 line-clamp-1">
                      {gig.organizer}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 px-1 border-t border-[#FF2E9A]/15">
                  <p className="text-[9px] font-medium text-[#FF2E9A]/65">
                    Mulai dari
                  </p>
                  <p className="text-sm font-black text-[#FF2E9A]">
                    {formatRupiah(gig.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. SECTION: UPCOMING GIGS (GRID 4 KOLOM - PERSIS SCREENSHOT 2) */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5">
            {/* Ikon Kalender Panah Pink */}
            <svg
              className="w-5 h-5 stroke-[#FF2E9A]"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 2v4M8 2v4M3 10h18M10 15h5m0 0l-2-2m2 2l-2 2"
              />
            </svg>
            <h2 className="text-lg md:text-xl font-extrabold text-[#1C1C1C]">
              Upcoming Gigs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {upcomingGigs.map((gig) => (
              <Link
                key={`upcoming-${gig.id}`}
                href={`/events/${gig.id}`}
                className="group bg-[#FFF0F6] rounded-2xl p-3 border border-pink-100/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-black">
                    <img
                      src={gig.image}
                      alt={gig.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="pt-3 px-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#FF2E9A]/60">
                      {gig.location}
                    </p>
                    <h3 className="text-sm font-extrabold text-[#FF2E9A] mt-0.5 line-clamp-1 group-hover:underline">
                      {gig.title}
                    </h3>
                    <p className="text-[11px] font-medium text-[#FF2E9A]/75 line-clamp-1">
                      {gig.organizer}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 px-1 border-t border-[#FF2E9A]/15">
                  <p className="text-[9px] font-medium text-[#FF2E9A]/65">
                    Mulai dari
                  </p>
                  <p className="text-sm font-black text-[#FF2E9A]">
                    {formatRupiah(gig.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. SECTION: THIS WEEK (LIST VERTIKAL + TIMELINE TANGGAL DI KANAN) */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            {/* Ikon Kalender Grid Pink */}
            <svg
              className="w-5 h-5 stroke-[#FF2E9A]"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"
              />
            </svg>
            <h2 className="text-lg md:text-xl font-extrabold text-[#1C1C1C]">
              This Week
            </h2>
          </div>

          <div className="space-y-8">
            {thisWeekGroups.map((group) => (
              <div
                key={`${group.date}-${group.month}`}
                className="flex items-stretch justify-between gap-6"
              >
                {/* Kolom Kiri: Daftar Gigs per Tanggal (BISA DIKLIK KE /events/[id]) */}
                <div className="flex-1 divide-y divide-pink-200/40">
                  {group.gigs.map((gig) => (
                    <Link
                      key={`week-${group.date}-${gig.id}`}
                      href={`/events/${gig.id}`}
                      className="group py-4 first:pt-0 flex items-center gap-4 hover:bg-[#FFF0F6]/50 transition rounded-xl px-2 -mx-2"
                    >
                      <div className="w-24 h-16 sm:w-28 sm:h-18 rounded-xl overflow-hidden bg-black flex-shrink-0">
                        <img
                          src={gig.image}
                          alt={gig.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-extrabold text-[#FF2E9A] group-hover:underline">
                          {gig.title}
                        </h3>
                        <p className="text-xs font-medium text-[#FF2E9A]/70">
                          {gig.location} &mdash; {gig.organizer}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Kolom Kanan: Badge Tanggal & Garis Vertikal Pink */}
                <div className="flex flex-col items-center flex-shrink-0 w-12">
                  <div className="w-11 h-12 rounded-xl bg-white border border-[#FF2E9A] flex flex-col items-center justify-center shadow-2xs">
                    <span className="text-sm font-black text-[#FF2E9A] leading-none">
                      {group.date}
                    </span>
                    <span className="text-[10px] font-bold text-[#FF2E9A] mt-0.5">
                      {group.month}
                    </span>
                  </div>
                  <div className="w-[1.5px] flex-1 bg-[#FF2E9A]/40 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}