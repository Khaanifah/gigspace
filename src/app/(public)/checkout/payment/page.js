'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { eventsData } from '@/lib/eventsData';
import { EmptyState, StatusAlert } from '@/components/shared/UIStates';
import { PaymentBrandLogo } from '@/components/shared/PaymentLogo';

const SERVICE_FEE = 7000;

const EWALLET_OPTIONS = [
  { id: 'qris', name: 'QRIS' },
  { id: 'shopeepay', name: 'ShopeePay' },
  { id: 'ovo', name: 'OVO' },
  { id: 'dana', name: 'DANA' },
  { id: 'linkaja', name: 'LinkAja' },
];

const BANK_OPTIONS = [
  { id: 'bri', name: 'BRI' },
  { id: 'cimb', name: 'CIMB NIAGA' },
  { id: 'bni', name: 'BNI' },
  { id: 'bca', name: 'BCA' },
  { id: 'mandiri', name: 'Mandiri' },
  { id: 'bsi', name: 'BSI' },
  { id: 'btn', name: 'BTN' },
  { id: 'danamon', name: 'Danamon' },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get('eventId') || '1';

  const [orderSummary, setOrderSummary] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [openSection, setOpenSection] = useState('ewallet');
  const [selectedMethod, setSelectedMethod] = useState(null);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
      // Fallback jika sessionStorage kosong
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

      setOrderSummary({
        eventId: matchedEvent.id,
        eventTitle: matchedEvent.title,
        dateLabel: matchedEvent.dateLabel,
        timeLabel: matchedEvent.timeLabel,
        location: matchedEvent.location,
        image: matchedEvent.image,
        items: defaultItems,
        subtotal,
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

  const handlePayNow = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedMethod) {
      setErrorMessage(
        'Silakan pilih metode pembayaran (E-Wallet atau Transfer Bank) terlebih dahulu.'
      );
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setErrorMessage(
        'Harap centang kedua persetujuan Syarat & Ketentuan serta Kebijakan Privasi sebelum melanjutkan pembayaran.'
      );
      return;
    }

    setIsProcessing(true);

    const finalOrder = {
      ...orderSummary,
      serviceFee: SERVICE_FEE,
      totalPay: (orderSummary.subtotal || 0) + SERVICE_FEE,
      paymentMethod: selectedMethod,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem('gigspace_checkout', JSON.stringify(finalOrder));

    setTimeout(() => {
      router.push(`/checkout/instruction?eventId=${orderSummary.eventId}`);
    }, 400);
  };

  if (!isLoaded) {
    return <div className="bg-[#FAF8ED] min-h-screen" />;
  }

  if (!orderSummary) {
    return (
      <div className="bg-[#FAF8ED] min-h-screen py-16 px-4 font-sans">
        <EmptyState
          title="Belum ada pesanan tiket"
          description="Silakan pilih konser dan kategori tiket terlebih dahulu."
          actionLabel="Jelajahi Konser"
          onAction={() => router.push('/discover')}
        />
      </div>
    );
  }

  const totalPay = (orderSummary.subtotal || 0) + SERVICE_FEE;

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-20 font-sans">
      
      {/* BAGIAN 1: HERO BANNER ACARA (FULL-WIDTH, KOTAK TAJAM) */}
      <section className="relative w-full h-[240px] sm:h-[320px] md:h-[380px] bg-black overflow-hidden">
        <img
          src={orderSummary.image}
          alt={orderSummary.eventTitle}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />
      </section>

      {/* BAGIAN 2: HEADER KONSER & GRID 2 KOLOM */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-10 space-y-8">
        
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

        {errorMessage && (
          <StatusAlert type="error" message={errorMessage} />
        )}

        <form
          onSubmit={handlePayNow}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          
          {/* KOLOM KIRI: RINCIAN PESANAN */}
          <div className="lg:col-span-5 bg-[#FFF0F6] border border-pink-100 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
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

            <div className="bg-white rounded-xl p-5 space-y-4 text-xs sm:text-sm border border-pink-100/70">
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

              <div className="border-t border-pink-100 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#FF2E9A]/75 font-medium">Subtotal</span>
                  <span className="font-bold text-[#FF2E9A]">
                    {formatRupiahCompact(orderSummary.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#FF2E9A]/75 font-medium">
                    Biaya Layanan
                  </span>
                  <span className="font-bold text-[#FF2E9A]">
                    {formatRupiahCompact(SERVICE_FEE)}
                  </span>
                </div>
              </div>

              <div className="border-t border-pink-100 pt-3 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-extrabold text-[#FF2E9A]">Total Bayar</span>
                <span className="font-black text-[#FF2E9A]">
                  {formatRupiah(totalPay)}
                </span>
              </div>

              <div className="pt-1 space-y-2.5 text-[11px] leading-snug text-[#1C1C1C]/80">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 accent-[#FF2E9A] rounded border-gray-300 cursor-pointer flex-shrink-0"
                  />
                  <span>
                    Saya menyetujui{' '}
                    <span className="text-[#2563EB] font-semibold">
                      Syarat &amp; Ketentuan
                    </span>{' '}
                    yang berlaku di Gigspace
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 accent-[#FF2E9A] rounded border-gray-300 cursor-pointer flex-shrink-0"
                  />
                  <span>
                    Saya menyetujui{' '}
                    <span className="text-[#2563EB] font-semibold">
                      Kebijakan Privasi &amp; Pemrosesan Data
                    </span>{' '}
                    yang berlaku di Gigspace
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-[#FF2E9A] text-white text-xs font-bold px-7 py-2.5 rounded-md hover:bg-pink-600 disabled:opacity-60 transition shadow-xs cursor-pointer"
                >
                  {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: PILIHAN METODE PEMBAYARAN (FOTO LOGO) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. ACCORDION E-WALLET */}
            <div className="bg-[#FFF0F6] border border-pink-100 rounded-2xl p-5 sm:p-6 shadow-xs transition-all">
              <button
                type="button"
                onClick={() =>
                  setOpenSection((prev) =>
                    prev === 'ewallet' ? 'bank' : 'ewallet'
                  )
                }
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 text-[#FF2E9A] font-extrabold text-sm sm:text-base">
                  <svg
                    className="w-4 h-4 stroke-[#FF2E9A]"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 12h.01"
                    />
                  </svg>
                  <span>E-Wallet</span>
                </div>

                <svg
                  className={`w-4 h-4 stroke-[#FF2E9A] transition-transform duration-200 ${
                    openSection === 'ewallet' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openSection === 'ewallet' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-4">
                  {EWALLET_OPTIONS.map((wallet) => {
                    const isSelected = selectedMethod?.id === wallet.id;
                    return (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() =>
                          setSelectedMethod({
                            category: 'ewallet',
                            id: wallet.id,
                            name: wallet.name,
                          })
                        }
                        className={`h-16 sm:h-20 rounded-xl border flex items-center justify-center p-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFD1E8] border-[#FF2E9A] shadow-xs'
                            : 'bg-white border-pink-100/80 hover:border-[#FF2E9A]/60'
                        }`}
                      >
                        <PaymentBrandLogo
                          id={wallet.id}
                          name={wallet.name}
                          size="md"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3.5 bg-white rounded-xl px-4 py-2.5 border border-pink-100/70 flex flex-wrap items-center gap-4">
                  {EWALLET_OPTIONS.map((wallet) => (
                    <PaymentBrandLogo
                      key={wallet.id}
                      id={wallet.id}
                      name={wallet.name}
                      size="mini"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 2. ACCORDION TRANSFER BANK */}
            <div className="bg-[#FFF0F6] border border-pink-100 rounded-2xl p-5 sm:p-6 shadow-xs transition-all">
              <button
                type="button"
                onClick={() =>
                  setOpenSection((prev) =>
                    prev === 'bank' ? 'ewallet' : 'bank'
                  )
                }
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
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
                      d="M3 10l9-6 9 6M4 10h16v8H4v-8zM8 14v4M12 14v4M16 14v4M2 20h20"
                    />
                  </svg>
                  <span>Transfer Bank</span>
                </div>

                <svg
                  className={`w-4 h-4 stroke-[#FF2E9A] transition-transform duration-200 ${
                    openSection === 'bank' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openSection === 'bank' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-4">
                  {BANK_OPTIONS.map((bank) => {
                    const isSelected = selectedMethod?.id === bank.id;
                    return (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() =>
                          setSelectedMethod({
                            category: 'bank',
                            id: bank.id,
                            name: bank.name,
                          })
                        }
                        className={`h-16 sm:h-20 rounded-xl border flex items-center justify-center p-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFD1E8] border-[#FF2E9A] shadow-xs'
                            : 'bg-white border-pink-100/80 hover:border-[#FF2E9A]/60'
                        }`}
                      >
                        <PaymentBrandLogo
                          id={bank.id}
                          name={bank.name}
                          size="md"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3.5 bg-white rounded-xl px-4 py-2.5 border border-pink-100/70 flex flex-wrap items-center gap-3.5">
                  {BANK_OPTIONS.map((bank) => (
                    <PaymentBrandLogo
                      key={bank.id}
                      id={bank.id}
                      name={bank.name}
                      size="mini"
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

        </form>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="bg-[#FAF8ED] min-h-screen" />}>
      <PaymentContent />
    </Suspense>
  );
}