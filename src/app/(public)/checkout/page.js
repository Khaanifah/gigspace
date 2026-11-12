'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { eventsData } from '@/lib/eventsData';
import { EmptyState, StatusAlert } from '@/components/shared/UIStates';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get('eventId') || '1';

  const [orderSummary, setOrderSummary] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [buyerForm, setBuyerForm] = useState({
    fullName: '',
    gender: '',
    whatsapp: '',
    email: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Ambil data tiket yang dipilih dari sessionStorage (atau fallback dari eventId)
  useEffect(() => {
    const matchedEvent = eventsData.find((ev) => ev.id === eventIdParam);

    try {
      const savedRaw = sessionStorage.getItem('gigspace_checkout');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && parsed.items?.length > 0) {
          setOrderSummary({
            ...parsed,
            dateLabel: matchedEvent?.dateLabel || 'Kamis, 12 November 2026',
            timeLabel: matchedEvent?.timeLabel || '16:30 WIB',
            location: matchedEvent?.location || 'JIExpo Kemayoran, Jakarta Pusat',
            image:
              matchedEvent?.image ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop',
          });
          setIsLoaded(true);
          return;
        }
      }
    } catch {
      // Abaikan jika sessionStorage tidak terbaca
    }

    if (matchedEvent) {
      const defaultItems = matchedEvent.ticketCategories
        .filter((t) => t.status === 'on_sale')
        .slice(0, 2)
        .map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          quantity: 1,
        }));

      const subtotal = defaultItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const totalItems = defaultItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      setOrderSummary({
        eventId: matchedEvent.id,
        eventTitle: matchedEvent.title,
        dateLabel: matchedEvent.dateLabel,
        timeLabel: matchedEvent.timeLabel,
        location: matchedEvent.location,
        image: matchedEvent.image,
        items: defaultItems,
        subtotal,
        totalItems,
      });
    }

    setIsLoaded(true);
  }, [eventIdParam]);

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    })
      .format(amount || 0)
      .replace('IDR', 'Rp');
  };

  const formatRupiahCompact = (amount) => {
    return formatRupiah(amount).replace(/\s/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBuyerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !buyerForm.fullName.trim() ||
      !buyerForm.gender ||
      !buyerForm.whatsapp.trim() ||
      !buyerForm.email.trim()
    ) {
      setErrorMessage(
        'Harap lengkapi seluruh data pemesan sebelum melanjutkan ke pembayaran.'
      );
      return;
    }

    const updatedOrder = {
      ...orderSummary,
      buyer: buyerForm,
    };
    sessionStorage.setItem('gigspace_checkout', JSON.stringify(updatedOrder));
    router.push(`/checkout/payment?eventId=${orderSummary.eventId}`);
  };

  if (!isLoaded) {
    return <div className="bg-[#FAF8ED] min-h-screen" />;
  }

  if (!orderSummary) {
    return (
      <div className="bg-[#FAF8ED] min-h-screen py-16 px-4 font-sans">
        <EmptyState
          title="Belum ada pesanan tiket"
          description="Silakan pilih konser dan kategori tiket terlebih dahulu sebelum melanjutkan pemesanan."
          actionLabel="Jelajahi Konser"
          onAction={() => router.push('/discover')}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-20 font-sans">
      
      {/* BAGIAN 1: HERO BANNER ACARA (FULL-WIDTH) */}
      <section className="relative w-full h-[240px] sm:h-[320px] md:h-[380px] bg-black overflow-hidden">
        <img
          src={orderSummary.image}
          alt={orderSummary.eventTitle}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />
      </section>

      {/* BAGIAN 2: HEADER KONSER & GRID 2 KOLOM (RINCIAN PESANAN + DATA PEMESAN) */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-10 space-y-8">
        
        {/* Info Judul, Jadwal & Lokasi Acara */}
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FF2E9A] tracking-tight leading-tight">
            {orderSummary.eventTitle}
          </h1>
          <p className="text-xs sm:text-sm md:text-base font-medium text-[#FF2E9A]/85">
            {orderSummary.dateLabel} &mdash; {orderSummary.timeLabel}
          </p>
          <p className="text-xs sm:text-sm md:text-base font-medium text-[#FF2E9A]/85">
            {orderSummary.location}
          </p>
        </div>

        {/* Grid 2 Kolom: Kiri (Rincian Pesanan) & Kanan (Data Pemesan) */}
        <form
          onSubmit={handleContinue}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          
          {/* KOLOM KIRI: RINCIAN PESANAN (ROUNDED) */}
          <div className="lg:col-span-5 bg-[#FFF0F6] border border-pink-100 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            {/* Header Rincian Pesanan */}
            <div className="flex items-center gap-2 text-[#FF2E9A] font-extrabold text-sm sm:text-base">
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

            {/* Inner White Box (ROUNDED) */}
            <div className="bg-white rounded-xl p-5 space-y-4 text-xs sm:text-sm border border-pink-100/70">
              {/* Daftar Item Tiket */}
              <div className="space-y-3">
                {orderSummary.items.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <p className="font-bold text-[#FF2E9A]">{item.name}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#FF2E9A]/70 font-medium">
                        x{item.quantity}
                      </span>
                      <span className="font-extrabold text-[#FF2E9A]">
                        {formatRupiahCompact(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal & Total Item */}
              <div className="border-t border-pink-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#FF2E9A]/75 font-medium">Subtotal</span>
                  <span className="font-bold text-[#FF2E9A]">
                    {formatRupiahCompact(orderSummary.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                  <span className="font-extrabold text-[#FF2E9A]">
                    Total {orderSummary.totalItems} Item
                  </span>
                  <span className="font-black text-[#FF2E9A]">
                    {formatRupiahCompact(orderSummary.subtotal)}
                  </span>
                </div>
              </div>

              {/* Tombol Lanjutkan (ROUNDED) */}
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#FF2E9A] text-white text-xs font-bold px-8 py-2.5 rounded-md hover:bg-pink-600 transition shadow-xs cursor-pointer"
                >
                  Lanjutkan
                </button>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: DATA PEMESAN (ROUNDED) */}
          <div className="lg:col-span-7 bg-[#FFF0F6] border border-pink-100 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            {/* Header Data Pemesan */}
            <div className="flex items-center gap-2 text-[#FF2E9A] font-extrabold text-sm sm:text-base">
              <svg
                className="w-4 h-4 fill-[#FF2E9A]"
                viewBox="0 0 24 24"
              >
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
              </svg>
              <span>Data Pemesan</span>
            </div>

            {/* Alert Validasi Jika Ada Field Belum Terisi */}
            {errorMessage && (
              <StatusAlert type="error" message={errorMessage} />
            )}

            {/* Inner White Form Box (ROUNDED) */}
            <div className="bg-white rounded-xl p-5 sm:p-6 space-y-4 border border-pink-100/70">
              
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="block text-xs font-bold text-[#FF2E9A]"
                >
                  Nama Lengkap
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  value={buyerForm.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-pink-100 bg-[#FFF9FC] text-xs sm:text-sm text-[#1C1C1C] placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A]"
                />
              </div>

              {/* Jenis Kelamin (Radio Button Custom Laki-laki / Perempuan) */}
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-[#FF2E9A]">
                  Jenis Kelamin
                </span>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {/* Pilihan Laki-laki */}
                  <button
                    type="button"
                    onClick={() =>
                      setBuyerForm((prev) => ({ ...prev, gender: 'Laki-laki' }))
                    }
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs sm:text-sm font-bold transition cursor-pointer ${
                      buyerForm.gender === 'Laki-laki'
                        ? 'border-[#FF2E9A] bg-[#FFF0F6] text-[#FF2E9A]'
                        : 'border-pink-100 bg-[#FFF9FC] text-pink-300 hover:border-pink-200 hover:text-[#FF2E9A]/80'
                    }`}
                  >
                    <svg
                      className="w-4 h-4 stroke-current"
                      fill="none"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="10" cy="14" r="5" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 5l-5.4 5.4M15 5h4v4"
                      />
                    </svg>
                    <span>Laki-laki</span>
                  </button>

                  {/* Pilihan Perempuan */}
                  <button
                    type="button"
                    onClick={() =>
                      setBuyerForm((prev) => ({ ...prev, gender: 'Perempuan' }))
                    }
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs sm:text-sm font-bold transition cursor-pointer ${
                      buyerForm.gender === 'Perempuan'
                        ? 'border-[#FF2E9A] bg-[#FFF0F6] text-[#FF2E9A]'
                        : 'border-pink-100 bg-[#FFF9FC] text-pink-300 hover:border-pink-200 hover:text-[#FF2E9A]/80'
                    }`}
                  >
                    <svg
                      className="w-4 h-4 stroke-current"
                      fill="none"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="9" r="5" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 14v7M9 18h6"
                      />
                    </svg>
                    <span>Perempuan</span>
                  </button>
                </div>
              </div>

              {/* Nomor WhatsApp */}
              <div className="space-y-1.5">
                <label
                  htmlFor="whatsapp"
                  className="block text-xs font-bold text-[#FF2E9A]"
                >
                  Nomor WhatsApp
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  required
                  placeholder="Masukkan nomor WhatsApp Anda"
                  value={buyerForm.whatsapp}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-pink-100 bg-[#FFF9FC] text-xs sm:text-sm text-[#1C1C1C] placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A]"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-[#FF2E9A]"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Masukkan email Anda"
                  value={buyerForm.email}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-pink-100 bg-[#FFF9FC] text-xs sm:text-sm text-[#1C1C1C] placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A]"
                />
              </div>

            </div>
          </div>

        </form>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="bg-[#FAF8ED] min-h-screen" />}>
      <CheckoutContent />
    </Suspense>
  );
}