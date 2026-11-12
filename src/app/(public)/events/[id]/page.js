'use client';

import { useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { eventsData } from '@/lib/eventsData';
import { EmptyState } from '@/components/shared/UIStates';

export default function EventDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const tabsRef = useRef(null);

  const event = eventsData.find((item) => item.id === resolvedParams.id);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('deskripsi'); // 'deskripsi' | 'tiket'
  const [quantities, setQuantities] = useState({});

  if (!event) {
    return (
      <div className="bg-[#FAF8ED] min-h-screen py-16 px-4 font-sans">
        <EmptyState
          title="Acara tidak ditemukan"
          description="Konser yang Anda cari tidak tersedia atau sudah berakhir."
          actionLabel="Kembali ke Discover"
          onAction={() => router.push('/discover')}
        />
      </div>
    );
  }

  const photos = event.gallery?.length ? event.gallery : [event.image];

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Update kuantitas tiket
  const updateQuantity = (catId, delta, maxQuota) => {
    setQuantities((prev) => {
      const current = prev[catId] || 0;
      const next = Math.min(maxQuota, Math.max(0, current + delta));
      const updated = { ...prev };
      if (next === 0) {
        delete updated[catId];
      } else {
        updated[catId] = next;
      }
      return updated;
    });
  };

  // List item yang sedang dipilih user untuk Rincian Pesanan
  const selectedTickets = event.ticketCategories.filter(
    (cat) => (quantities[cat.id] || 0) > 0
  );

  const totalSelectedItems = Object.values(quantities).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const subtotalPrice = selectedTickets.reduce((sum, cat) => {
    return sum + (quantities[cat.id] || 0) * cat.price;
  }, 0);

  // Format Rupiah (contoh: Rp 190.000)
  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    })
      .format(amount || 0)
      .replace('IDR', 'Rp');
  };

  // Format Rupiah rapat untuk ringkasan kanan atas (contoh: Rp190.000)
  const formatRupiahCompact = (amount) => {
    return formatRupiah(amount).replace(/\s/g, '');
  };

  // Handler klik "Beli Sekarang" saat keranjang masih 0 (pindah ke tab Tiket)
  const handleQuickBuyClick = () => {
    setActiveTab('tiket');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handler klik "Beli Sekarang" saat sudah ada item di keranjang (ke Checkout)
  const handleProceedCheckout = () => {
    // Simpan sementara ke sessionStorage agar halaman Checkout bisa membacanya
    const checkoutPayload = {
      eventId: event.id,
      eventTitle: event.title,
      items: selectedTickets.map((cat) => ({
        id: cat.id,
        name: cat.name,
        price: cat.price,
        quantity: quantities[cat.id],
      })),
      subtotal: subtotalPrice,
      totalItems: totalSelectedItems,
    };
    sessionStorage.setItem('gigspace_checkout', JSON.stringify(checkoutPayload));
    router.push(`/checkout?eventId=${event.id}`);
  };

  // Kelompokkan tiket berdasarkan status sesuai 3 baris pada desain
  const onSaleTickets = event.ticketCategories.filter((t) => t.status === 'on_sale');
  const notReleasedTickets = event.ticketCategories.filter(
    (t) => t.status === 'not_released'
  );
  const soldOutTickets = event.ticketCategories.filter((t) => t.status === 'sold_out');

  // Komponen Internal: Kartu Tiket dengan Notch Sobekan & Status Badge
  const renderTicketCard = (ticket) => {
    const qty = quantities[ticket.id] || 0;
    const isOnSale = ticket.status === 'on_sale';

    const statusBadge = {
      on_sale: {
        label: 'On Sale',
        className: 'bg-[#E3F9E5] text-[#2E9E5B] border-[#9AE6B4]',
      },
      not_released: {
        label: 'Not Released',
        className: 'bg-[#FEF9C3] text-[#B45309] border-[#FDE047]',
      },
      sold_out: {
        label: 'Sold Out',
        className: 'bg-[#FDE8E8] text-[#E05252] border-[#F8B4B4]',
      },
    }[ticket.status];

    return (
      <div
        key={ticket.id}
        className="bg-[#FFF0F6] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 border border-pink-100/90 shadow-xs"
      >
        {/* 1. Badge Status di Pojok Kiri Atas */}
        <div>
          <span
            className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* 2. Inner White Notched Ticket Box */}
        <div className="relative bg-white rounded-xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(255,46,154,0.04)] overflow-hidden">
          {/* Bagian Atas Ticket: Nama & Periode */}
          <div className="pb-3.5">
            <h3 className="text-sm sm:text-base font-extrabold text-[#FF2E9A] leading-tight">
              {ticket.name}
            </h3>
            <p className="text-[11px] font-medium text-[#FF2E9A]/70 mt-1">
              {ticket.period}
            </p>
          </div>

          {/* Garis Sobekan Horizontal & Lekukan Setengah Lingkaran Kiri-Kanan */}
          <div className="relative flex items-center my-1">
            {/* Notch Kiri (menyatu dengan warna card pink #FFF0F6) */}
            <div className="w-5 h-5 rounded-full bg-[#FFF0F6] -ml-7 flex-shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-[#FFF0F6]" />
            {/* Notch Kanan */}
            <div className="w-5 h-5 rounded-full bg-[#FFF0F6] -mr-7 flex-shrink-0" />
          </div>

          {/* Bagian Bawah Ticket: Harga */}
          <div className="pt-3">
            <p className="text-sm sm:text-base font-black text-[#FF2E9A]">
              {formatRupiah(ticket.price)}
            </p>
          </div>
        </div>

        {/* 3. Aksi Bawah Kanan: Tombol Beli ATAU Stepper (-) 1 (+) */}
        <div className="flex justify-end items-center min-h-[34px]">
          {isOnSale ? (
            qty > 0 ? (
              /* Stepper Lingkaran Pink (-) angka (+) */
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(ticket.id, -1, ticket.quota)}
                  aria-label="Kurangi tiket"
                  className="w-6 h-6 rounded-full bg-[#FF2E9A] text-white font-bold text-sm flex items-center justify-center hover:bg-pink-600 transition cursor-pointer leading-none"
                >
                  −
                </button>
                <span className="text-sm font-extrabold text-[#FF2E9A] min-w-[16px] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(ticket.id, 1, ticket.quota)}
                  disabled={qty >= ticket.quota}
                  aria-label="Tambah tiket"
                  className="w-6 h-6 rounded-full bg-[#FF2E9A] text-white font-bold text-sm flex items-center justify-center hover:bg-pink-600 disabled:opacity-40 transition cursor-pointer leading-none"
                >
                  +
                </button>
              </div>
            ) : (
              /* Tombol "Beli" Aktif */
              <button
                type="button"
                onClick={() => updateQuantity(ticket.id, 1, ticket.quota)}
                className="bg-[#FF2E9A] text-white text-xs font-bold px-8 py-2 rounded-md hover:bg-pink-600 transition shadow-xs cursor-pointer"
              >
                Beli
              </button>
            )
          ) : (
            /* Tombol "Beli" Disabled (Untuk Not Released & Sold Out) */
            <button
              type="button"
              disabled
              className="bg-[#FF2E9A]/30 text-white text-xs font-bold px-8 py-2 rounded-md cursor-not-allowed"
            >
              Beli
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-20 font-sans">
      
      {/* BAGIAN 1: SLIDER FOTO DOKUMENTASI KONSER (FULL-WIDTH) */}
      <section className="relative w-full h-[260px] sm:h-[360px] md:h-[440px] bg-black overflow-hidden select-none group">
        <img
          src={photos[currentSlide]}
          alt={`${event.title} - Dokumentasi ${currentSlide + 1}`}
          className="w-full h-full object-cover transition-all duration-500"
        />

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Foto sebelumnya"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/45 hover:bg-[#FF2E9A] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Foto berikutnya"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/45 hover:bg-[#FF2E9A] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              ›
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Lihat foto ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx
                      ? 'w-2.5 bg-white'
                      : 'w-2 bg-white/45 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* BAGIAN 2: INFORMASI KONSER + WIDGET KANAN ATAS + TABS */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-10 space-y-8">
        
        {/* Baris Atas: Kiri (Info Konser) & Kanan (Harga Mulai Dari / Rincian Pesanan) */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
          
          {/* SISI KIRI: Judul, Penyelenggara, Lokasi, Tanggal, Jam */}
          <div className="space-y-4 flex-1">
            <div className="space-y-2.5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FF2E9A] tracking-tight leading-tight">
                {event.title}
              </h1>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#D9D9D9] flex-shrink-0" />
                <span className="text-sm md:text-base font-medium text-[#FF2E9A]/85">
                  {event.organizer}
                </span>
              </div>
            </div>

            <div className="max-w-md border-b border-[#FF2E9A]/25 pt-1" />

            <ul className="space-y-2.5 pt-1 text-xs sm:text-sm font-medium text-[#FF2E9A]/90">
              <li className="flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 stroke-[#FF2E9A] flex-shrink-0"
                  fill="none"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z"
                  />
                  <circle cx="12" cy="11" r="2.2" />
                </svg>
                <span>{event.location}</span>
              </li>

              <li className="flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 stroke-[#FF2E9A] flex-shrink-0"
                  fill="none"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7v5l3 2"
                  />
                </svg>
                <span>{event.dateLabel}</span>
              </li>

              <li className="flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 stroke-[#FF2E9A] flex-shrink-0"
                  fill="none"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 2v4M8 2v4M3 10h18"
                  />
                </svg>
                <span>{event.timeLabel}</span>
              </li>
            </ul>
          </div>

          {/* SISI KANAN: WIDGET DINAMIS (KOSONG = HARGA MULAI DARI | ADA ITEM = RINCIAN PESANAN) */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            {totalSelectedItems === 0 ? (
              /* Kondisi 1: Belum ada tiket dipilih */
              <div className="bg-[#FFF0F6] border border-pink-100 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 shadow-xs">
                <div>
                  <p className="text-[10px] font-medium text-[#FF2E9A]/80 leading-tight">
                    Harga Mulai Dari
                  </p>
                  <p className="text-base sm:text-lg font-black text-[#FF2E9A] mt-0.5">
                    {formatRupiah(event.price)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleQuickBuyClick}
                  className="bg-[#FF2E9A] text-white text-xs font-bold px-5 py-2.5 rounded-md hover:bg-pink-600 transition shadow-xs cursor-pointer flex-shrink-0"
                >
                  Beli Sekarang
                </button>
              </div>
            ) : (
              /* Kondisi 2: Sudah ada tiket yang dipilih (Rincian Pesanan) */
              <div className="bg-[#FFF0F6] border border-pink-100 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                {/* Header Rincian Pesanan */}
                <div className="flex items-center gap-2 text-[#FF2E9A] font-extrabold text-sm">
                  <svg
                    className="w-4 h-4 stroke-[#FF2E9A]"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 9a2 2 0 012-2h12a2 2 0 012 2v1.5a1.5 1.5 0 000 3V15a2 2 0 01-2 2H6a2 2 0 01-2-2v-1.5a1.5 1.5 0 000-3V9z"
                    />
                  </svg>
                  <span>Rincian Pesanan</span>
                </div>

                {/* Inner White Summary Box */}
                <div className="bg-white rounded-xl p-4 space-y-3 text-xs">
                  {/* List Tiket Terpilih */}
                  <div className="space-y-2.5">
                    {selectedTickets.map((cat) => {
                      const qty = quantities[cat.id];
                      return (
                        <div key={cat.id} className="space-y-0.5">
                          <p className="font-bold text-[#FF2E9A]">{cat.name}</p>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#FF2E9A]/70 font-medium">
                              {qty}x
                            </span>
                            <span className="font-extrabold text-[#FF2E9A]">
                              {formatRupiahCompact(cat.price * qty)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Garis Pemisah */}
                  <div className="border-t border-pink-100 pt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#FF2E9A]/75 font-medium">Subtotal</span>
                      <span className="font-bold text-[#FF2E9A]">
                        {formatRupiahCompact(subtotalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="font-bold text-[#FF2E9A]">
                        Total {totalSelectedItems} Item
                      </span>
                      <span className="font-black text-[#FF2E9A]">
                        {formatRupiahCompact(subtotalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Beli Sekarang */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleProceedCheckout}
                      className="bg-[#FF2E9A] text-white text-xs font-bold px-6 py-2 rounded-md hover:bg-pink-600 transition shadow-xs cursor-pointer"
                    >
                      Beli Sekarang
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TAB SWITCHER: DESKRIPSI & TIKET */}
        <div ref={tabsRef} className="pt-2 space-y-8 scroll-mt-24">
          <div className="inline-flex items-stretch">
            <button
              type="button"
              onClick={() => setActiveTab('deskripsi')}
              className={`px-7 py-2 text-sm md:text-base font-bold transition cursor-pointer border-b-2 ${
                activeTab === 'deskripsi'
                  ? 'bg-[#FFD1E8] text-[#FF2E9A] border-[#FF2E9A]'
                  : 'bg-transparent text-[#FF2E9A]/85 border-[#FF2E9A]/25 hover:bg-[#FFF0F6]'
              }`}
            >
              Deskripsi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tiket')}
              className={`px-9 py-2 text-sm md:text-base font-bold transition cursor-pointer border-b-2 ${
                activeTab === 'tiket'
                  ? 'bg-[#FFD1E8] text-[#FF2E9A] border-[#FF2E9A]'
                  : 'bg-transparent text-[#FF2E9A]/85 border-[#FF2E9A]/25 hover:bg-[#FFF0F6]'
              }`}
            >
              Tiket
            </button>
          </div>

          {/* KONTEN TAB 1: DESKRIPSI & SYARAT KETENTUAN */}
          {activeTab === 'deskripsi' && (
            <div className="space-y-8 max-w-4xl">
              <div className="space-y-3">
                <h2 className="text-base md:text-lg font-extrabold text-[#FF2E9A]">
                  Deskripsi
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-[#FF2E9A]/90 leading-relaxed font-medium text-justify">
                  {event.description}
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-base md:text-lg font-extrabold text-[#FF2E9A]">
                  Syarat &amp; Ketentuan
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-[#FF2E9A]/90 leading-relaxed font-medium text-justify">
                  {event.terms}
                </p>
              </div>
            </div>
          )}

          {/* KONTEN TAB 2: GRID KARTU TIKET (ON SALE, NOT RELEASED, SOLD OUT) */}
          {activeTab === 'tiket' && (
            <div className="space-y-8">
              {/* Baris 1: Tiket On Sale */}
              {onSaleTickets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {onSaleTickets.map((ticket) => renderTicketCard(ticket))}
                </div>
              )}

              {/* Baris 2: Tiket Not Released */}
              {notReleasedTickets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notReleasedTickets.map((ticket) => renderTicketCard(ticket))}
                </div>
              )}

              {/* Baris 3: Tiket Sold Out */}
              {soldOutTickets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {soldOutTickets.map((ticket) => renderTicketCard(ticket))}
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}