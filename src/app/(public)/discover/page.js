'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EmptyState, ErrorState, GigsGridSkeleton } from '@/components/shared/UIStates';
import { useApiData } from '@/lib/useApiData';

const GENRE_CHOICES = ['All', 'Indie', 'Rock', 'Classic'];

function isTicketOnSale(ticket) {
  if (!ticket) return false;
  if (ticket.isOnSale === true || ticket.onSale === true) return true;
  if (ticket.isSoldOut === true || ticket.soldOut === true) return false;

  const status = String(ticket.status ?? ticket.state ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return status === 'on_sale' || status === 'available';
}

function getTicketPrice(ticket) {
  const raw = ticket?.price ?? ticket?.harga ?? ticket?.amount ?? 0;
  const num = Number(raw);
  return Number.isNaN(num) ? 0 : num;
}

function getLowestOnSalePrice(gig) {
  if (!gig) return null;

  const explicitOnSaleField =
    gig.lowestOnSalePrice ??
    gig.minOnSalePrice ??
    gig.onSalePrice ??
    gig.lowest_on_sale_price;

  if (explicitOnSaleField !== undefined && explicitOnSaleField !== null) {
    const num = Number(explicitOnSaleField);
    if (!Number.isNaN(num) && num > 0) return num;
  }

  const categories =
    gig.ticketCategories ||
    gig.tickets ||
    gig.ticket_categories ||
    gig.categories ||
    [];

  if (Array.isArray(categories) && categories.length > 0) {
    const onSalePrices = categories
      .filter(isTicketOnSale)
      .map(getTicketPrice)
      .filter((p) => p > 0);

    if (onSalePrices.length > 0) {
      return Math.min(...onSalePrices);
    }

    return null;
  }

  const fallback = Number(gig.startingPrice ?? gig.price ?? 0);
  return !Number.isNaN(fallback) && fallback > 0 ? fallback : null;
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const genreFromUrl = searchParams.get('genre');

  const resolveInitialGenre = (val) => {
    if (!val) return 'All';
    const matched = GENRE_CHOICES.find(
      (g) => g.toLowerCase() === String(val).trim().toLowerCase()
    );
    return matched || String(val).trim();
  };

  const [selectedGenre, setSelectedGenre] = useState(() =>
    resolveInitialGenre(genreFromUrl)
  );
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setSelectedGenre(resolveInitialGenre(genreFromUrl));
    setCurrentPage(1);
  }, [genreFromUrl]);

  const ITEMS_PER_PAGE = 16; // 4 kolom x 4 baris

  // Filter, urutan, dan pagination diproses di server (GET /api/events)
  const query = new URLSearchParams({
    page: String(currentPage),
    pageSize: String(ITEMS_PER_PAGE),
    sort: sortBy,
  });
  if (selectedGenre !== 'All') query.set('genre', selectedGenre);

  const { data, error, isLoading, reload } = useApiData(`/api/events?${query.toString()}`);
  const paginatedConcerts = data?.items ?? [];
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1);

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    })
      .format(amount || 0)
      .replace('IDR', 'Rp');
  };

  const renderStartingPrice = (gig) => {
    const lowestOnSale = getLowestOnSalePrice(gig);
    if (lowestOnSale === null) {
      return <span className="text-[#FF2E9A]/75">Sold Out</span>;
    }
    return formatRupiah(lowestOnSale);
  };

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-16 font-sans">
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-8">
        
        {/* BAGIAN 1: HERO BANNER (IDENTIK DENGAN ABOUT US - KOTAK TAJAM) */}
        <section className="relative h-[220px] sm:h-[280px] md:h-[340px] w-full overflow-hidden bg-black shadow-md flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop"
            alt="All Concerts Banner Visual"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 pointer-events-none" />

          <h1
            className="relative z-10 font-bebas text-5xl sm:text-7xl md:text-8xl text-white tracking-[0.08em] uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
          >
            ALL CONCERTS
          </h1>
        </section>

        {/* BAGIAN 2: FILTER, SORT BY, GRID 4x4 CARDS & PAGINATION */}
        <section className="space-y-6">
          
          {/* Toolbar Filter & Sort By */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowFilterMenu((prev) => !prev);
                  setShowSortMenu(false);
                }}
                className="flex items-center gap-2 text-sm md:text-base font-extrabold text-[#FF2E9A] hover:opacity-80 transition cursor-pointer"
              >
                <svg className="w-4 h-4 stroke-[#FF2E9A]" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span>{selectedGenre === 'All' ? 'All Genre' : selectedGenre}</span>
              </button>

              {showFilterMenu && (
                <div className="absolute left-0 mt-2 w-44 bg-white border border-pink-200 rounded-xl shadow-lg py-1.5 z-30">
                  {GENRE_CHOICES.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        setSelectedGenre(genre);
                        setCurrentPage(1);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition ${
                        selectedGenre === genre
                          ? 'bg-[#FFF0F6] text-[#FF2E9A]'
                          : 'text-gray-700 hover:bg-pink-50'
                      }`}
                    >
                      {genre === 'All' ? 'All Genre' : genre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSortMenu((prev) => !prev);
                  setShowFilterMenu(false);
                }}
                className="flex items-center gap-2 text-sm md:text-base font-extrabold text-[#FF2E9A] hover:opacity-80 transition cursor-pointer"
              >
                <svg className="w-4 h-4 stroke-[#FF2E9A]" fill="none" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 6h14M3 12h10M3 18h6m11-4v6m0 0l-2.5-2.5M20 20l2.5-2.5"
                  />
                </svg>
                <span>Sort by</span>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-pink-200 rounded-xl shadow-lg py-1.5 z-30">
                  {[
                    { label: 'Terbaru', value: 'newest' },
                    { label: 'Harga Terendah', value: 'price-asc' },
                    { label: 'Harga Tertinggi', value: 'price-desc' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition ${
                        sortBy === option.value
                          ? 'bg-[#FFF0F6] text-[#FF2E9A]'
                          : 'text-gray-700 hover:bg-pink-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid 4x4 Concert Cards */}
          {isLoading ? (
            <GigsGridSkeleton count={ITEMS_PER_PAGE} />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : paginatedConcerts.length === 0 ? (
            <EmptyState
              title={`Belum ada konser genre ${selectedGenre}`}
              description="Coba pilih kategori genre lainnya atau tampilkan semua konser."
              actionLabel="Reset Filter"
              onAction={() => {
                setSelectedGenre('All');
                setCurrentPage(1);
              }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedConcerts.map((gig) => (
                  <Link
                    key={gig.id}
                    href={`/events/${gig.id}`}
                    className="group bg-[#FFF0F6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col border border-pink-100"
                  >
                    <div className="relative h-36 w-full overflow-hidden bg-black">
                      <img
                        src={gig.image}
                        alt={gig.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-[10px] font-medium text-[#FF2E9A]/70 leading-tight">
                          {gig.location}
                        </p>
                        <h3 className="text-sm md:text-base font-extrabold text-[#FF2E9A] leading-snug mt-0.5 line-clamp-1">
                          {gig.title}
                        </h3>
                        <p className="text-[11px] font-medium text-[#FF2E9A]/80 mt-0.5 line-clamp-1">
                          {gig.organizer}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-[#FF2E9A]/20">
                        <p className="text-[10px] font-medium text-[#FF2E9A]/70">
                          Mulai dari
                        </p>
                        <p className="text-sm md:text-base font-black text-[#FF2E9A] mt-0.5">
                          {renderStartingPrice(gig)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="pt-6 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Halaman Sebelumnya"
                  className="w-8 h-8 rounded-lg bg-white border border-pink-100 text-[#FF2E9A] flex items-center justify-center text-xs font-bold shadow-sm hover:bg-[#FFF0F6] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-extrabold flex items-center justify-center transition cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#FF2E9A] text-white shadow-sm'
                        : 'bg-white border border-pink-100 text-gray-500 hover:bg-[#FFF0F6] hover:text-[#FF2E9A]'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Halaman Berikutnya"
                  className="w-8 h-8 rounded-lg bg-white border border-pink-100 text-[#FF2E9A] flex items-center justify-center text-xs font-bold shadow-sm hover:bg-[#FFF0F6] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  ›
                </button>
              </div>
            </>
          )}

        </section>
      </main>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#FAF8ED] min-h-screen py-16 px-4 font-sans">
          <GigsGridSkeleton count={16} />
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}