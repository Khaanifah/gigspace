'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { eventsData } from '@/lib/eventsData';
import { EmptyState, StatusAlert } from '@/components/shared/UIStates';

// Mapping Nomor Virtual Account / Nomor E-Wallet Tujuan berdasarkan metode yang dipilih
const PAYMENT_DESTINATIONS = {
  bri: { accountNumber: 'VABRI1234567' },
  cimb: { accountNumber: 'VACIMB8890123' },
  bni: { accountNumber: 'VABNI98812345' },
  bca: { accountNumber: 'VABCA39012345' },
  mandiri: { accountNumber: 'VAMDR88901234' },
  bsi: { accountNumber: 'VABSI90012345' },
  btn: { accountNumber: 'VABTN20012345' },
  danamon: { accountNumber: 'VADMN77012345' },
  qris: { accountNumber: 'ID102026GIGSPACE' },
  shopeepay: { accountNumber: '0812-3456-7890' },
  ovo: { accountNumber: '0812-3456-7890' },
  dana: { accountNumber: '0812-3456-7890' },
  linkaja: { accountNumber: '0812-3456-7890' },
};

function PaymentBrandLogo({ id }) {
  switch (id) {
    case 'qris':
      return (
        <span className="font-black tracking-tighter text-[#1C1C1C] text-lg">
          QRIS
        </span>
      );
    case 'shopeepay':
      return (
        <span className="inline-flex items-center gap-1 font-extrabold text-[#EE4D2D] text-base">
          <span className="inline-flex items-center justify-center rounded bg-[#EE4D2D] text-white font-black w-5 h-5 text-xs">
            S
          </span>
          <span>Pay</span>
        </span>
      );
    case 'ovo':
      return (
        <span className="font-black tracking-wide text-[#4C3494] text-lg">
          OVO
        </span>
      );
    case 'dana':
      return (
        <span className="inline-flex items-center gap-1.5 font-extrabold text-[#118EEA] text-base">
          <span className="inline-block rounded-full border-2 border-[#118EEA] w-4 h-4" />
          <span>DANA</span>
        </span>
      );
    case 'linkaja':
      return (
        <span className="inline-flex flex-col leading-none font-black text-[#E82529] text-xs">
          <span>Link</span>
          <span>Aja!</span>
        </span>
      );
    case 'bri':
      return (
        <span className="inline-flex items-center gap-1 font-black text-[#00529C] text-base">
          <span className="inline-flex items-center justify-center border border-[#00529C] font-extrabold px-1 text-xs">
            B
          </span>
          <span>BRI</span>
        </span>
      );
    case 'cimb':
      return (
        <span className="inline-flex items-center gap-1 font-extrabold text-[#790008] text-xs">
          <span className="inline-block bg-[#EC1C24] w-3.5 h-3.5" />
          <span>CIMB NIAGA</span>
        </span>
      );
    case 'bni':
      return (
        <span className="inline-flex items-center gap-1 font-black text-[#005E6A] text-base">
          <span className="text-[#F15A23]">❖</span>
          <span>BNI</span>
        </span>
      );
    case 'bca':
      return (
        <span className="font-black italic text-[#0060AF] text-base">
          BCA
        </span>
      );
    case 'mandiri':
      return (
        <span className="font-extrabold lowercase tracking-tight text-[#003D79] text-base">
          mandiri
        </span>
      );
    case 'bsi':
      return (
        <span className="font-black text-[#00A39D] text-base">
          BSI
        </span>
      );
    case 'btn':
      return (
        <span className="font-black lowercase tracking-tight text-[#00529C] text-lg">
          bt<span className="text-[#F7941D]">n</span>
        </span>
      );
    case 'danamon':
      return (
        <span className="inline-flex flex-col items-start leading-none font-extrabold text-[#004B8D] text-xs">
          <span className="w-full h-1 bg-gradient-to-r from-[#F7941D] to-[#7AC143] mb-0.5" />
          <span>Danamon</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 font-black text-[#00529C] text-base">
          <span className="inline-flex items-center justify-center border border-[#00529C] font-extrabold px-1 text-xs">
            B
          </span>
          <span>BRI</span>
        </span>
      );
  }
}

function InstructionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get('eventId') || '1';
  const fileInputRef = useRef(null);

  const [orderSummary, setOrderSummary] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // State Upload Bukti Pembayaran
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidProof, setIsValidProof] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const matchedEvent = eventsData.find((ev) => ev.id === eventIdParam);

    try {
      const savedRaw = sessionStorage.getItem('gigspace_checkout');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed) {
          setOrderSummary({
            ...parsed,
            dateLabel: matchedEvent?.dateLabel || 'Kamis, 12 November 2026',
            timeLabel: matchedEvent?.timeLabel || '16:30 WIB',
            location: matchedEvent?.location || 'JIExpo Kemayoran, Jakarta Pusat',
            image:
              matchedEvent?.image ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop',
            paymentMethod: parsed.paymentMethod || {
              category: 'bank',
              id: 'bri',
              name: 'BRI',
            },
          });
          setIsLoaded(true);
          return;
        }
      }
    } catch {
      // Fallback jika sessionStorage kosong
    }

    if (matchedEvent) {
      setOrderSummary({
        eventId: matchedEvent.id,
        eventTitle: matchedEvent.title,
        dateLabel: matchedEvent.dateLabel,
        timeLabel: matchedEvent.timeLabel,
        location: matchedEvent.location,
        image: matchedEvent.image,
        totalPay: matchedEvent.price + 7000,
        paymentMethod: {
          category: 'bank',
          id: 'bri',
          name: 'BRI',
        },
      });
    }

    setIsLoaded(true);
  }, [eventIdParam]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    })
      .format(amount || 0)
      .replace('IDR', 'Rp');
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    setErrorMessage('');

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        'Format file tidak didukung. Harap unggah gambar dengan format JPG, JPEG, atau PNG.'
      );
      return;
    }

    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      setErrorMessage(
        'Ukuran file terlalu besar. Maksimal ukuran file bukti pembayaran adalah 10 MB.'
      );
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsValidProof(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleCopyAccount = (accountNumber) => {
    navigator.clipboard?.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyProof = () => {
    setErrorMessage('');

    if (!uploadedFile) {
      setErrorMessage(
        'Silakan unggah foto bukti pembayaran terlebih dahulu sebelum melanjutkan.'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsValidProof(true);
    }, 500);
  };

  if (!isLoaded) {
    return <div className="bg-[#FAF8ED] min-h-screen" />;
  }

  if (!orderSummary) {
    return (
      <div className="bg-[#FAF8ED] min-h-screen py-16 px-4 font-sans">
        <EmptyState
          title="Transaksi tidak ditemukan"
          description="Silakan pilih konser dan metode pembayaran terlebih dahulu."
          actionLabel="Jelajahi Konser"
          onAction={() => router.push('/discover')}
        />
      </div>
    );
  }

  const method = orderSummary.paymentMethod || {
    category: 'bank',
    id: 'bri',
    name: 'BRI',
  };
  const isBank = method.category === 'bank';
  const isQris = method.id === 'qris';
  const destinationNumber =
    PAYMENT_DESTINATIONS[method.id]?.accountNumber || 'VABRI1234567';

  // Payload dinamis untuk Kode QR QRIS
  const qrisPayload = `GIGSPACE-QRIS|${orderSummary.eventTitle}|${destinationNumber}|TOTAL:${orderSummary.totalPay || 0}`;

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

      {/* BAGIAN 2: HEADER KONSER & GRID 2 KOLOM (NOMOR TUJUAN / QRIS + UPLOAD BUKTI) */}
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

        {/* Grid 2 Kolom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI: KODE QR (JIKA QRIS) ATAU NOMOR REKENING / NOMOR E-WALLET */}
          <div className="lg:col-span-5 bg-[#FFF0F6] border border-pink-100 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#FF2E9A] font-extrabold text-sm sm:text-base">
              {isBank ? (
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
              ) : (
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
              )}
              <span>{isBank ? 'Transfer Bank' : 'E-Wallet'}</span>
            </div>

            {isQris ? (
              /* Tampilan Khusus Jika Memilih Metode QRIS */
              <div className="bg-white rounded-xl p-5 border border-pink-100/80 flex flex-col items-center text-center space-y-4">
                <div className="w-full flex items-center justify-between border-b border-pink-100 pb-3">
                  <PaymentBrandLogo id="qris" name="QRIS" size="sm" />
                  <span className="text-[11px] font-bold text-[#FF2E9A] bg-[#FFF0F6] px-2.5 py-1 rounded-md">
                    NMID: {destinationNumber}
                  </span>
                </div>

                {/* Gambar Kode QR Pembayaran */}
                <div className="p-3 bg-[#FFF9FC] border-2 border-[#FF2E9A] rounded-xl inline-flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      qrisPayload
                    )}`}
                    alt="QRIS Payment Code"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                </div>

                {orderSummary.totalPay && (
                  <div className="w-full pt-1 border-t border-pink-100 flex items-center justify-between text-xs">
                    <span className="font-medium text-[#FF2E9A]/80">Total Pembayaran</span>
                    <span className="font-black text-sm text-[#FF2E9A]">
                      {formatRupiah(orderSummary.totalPay)}
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Scan kode QR di atas menggunakan aplikasi e-wallet atau mobile banking berlogo QRIS, lalu unggah bukti pembayarannya di samping.
                </p>
              </div>
            ) : (
              /* Tampilan Nomor Virtual Account / Nomor E-Wallet Tujuan */
              <div className="bg-white rounded-xl px-4 py-3.5 border border-pink-100/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex-shrink-0">
                    <PaymentBrandLogo id={method.id} name={method.name} size="sm" />
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-[#FF2E9A] tracking-wide truncate">
                    {destinationNumber}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyAccount(destinationNumber)}
                  title="Salin nomor"
                  className="text-[11px] font-bold text-[#FF2E9A] bg-[#FFF0F6] hover:bg-[#FFD1E8] px-2.5 py-1 rounded-md transition flex-shrink-0 cursor-pointer"
                >
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            )}
          </div>

          {/* KOLOM KANAN: UPLOAD BUKTI PEMBAYARAN */}
          <div className="lg:col-span-7 bg-[#FFF0F6] border border-pink-100 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            {/* Header Upload Bukti */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#FF2E9A] font-extrabold text-sm sm:text-base">
                <svg
                  className="w-4 h-4 stroke-[#FF2E9A]"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h8M8 11h8M8 15h5"
                  />
                </svg>
                <span>
                  {isBank ? 'Upload Bukti Transfer' : 'Upload Bukti Pembayaran'}
                </span>
              </div>

              {/* Indikator Bukti Valid setelah berhasil dikonfirmasi */}
              {isValidProof && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#E3F9E5] text-[#2E9E5B] border border-[#9AE6B4]">
                  <span>✓</span>
                  <span>Bukti Valid</span>
                </span>
              )}
            </div>

            {/* Alert Error jika format salah / belum upload */}
            {errorMessage && (
              <StatusAlert type="error" message={errorMessage} />
            )}

            {/* Inner White Dropzone Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`bg-white rounded-xl p-6 sm:p-8 border-2 border-dashed transition text-center flex flex-col items-center justify-center min-h-[250px] space-y-3 ${
                isDragging
                  ? 'border-[#FF2E9A] bg-[#FFF9FC]'
                  : 'border-pink-100'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                /* Preview File Bukti Pembayaran yang Sudah Diunggah */
                <div className="space-y-3 w-full flex flex-col items-center">
                  <div className="relative w-44 h-44 rounded-xl overflow-hidden border border-pink-200 bg-[#FFF9FC] shadow-xs">
                    <img
                      src={previewUrl}
                      alt="Preview Bukti Pembayaran"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-bold text-[#1C1C1C] truncate max-w-xs">
                    {uploadedFile?.name}
                  </p>
                  {!isValidProof && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-[#FF2E9A] hover:underline cursor-pointer"
                    >
                      Ganti File Bukti Pembayaran
                    </button>
                  )}
                </div>
              ) : (
                /* Tampilan Awal Drag and Drop */
                <>
                  {/* Cloud Upload Icon */}
                  <svg
                    className="w-11 h-11 stroke-[#1C1C1C]"
                    fill="none"
                    strokeWidth="1.6"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3"
                    />
                  </svg>

                  <p className="text-sm sm:text-base font-medium text-[#1C1C1C]">
                    Drag and drop files here
                  </p>

                  <p className="text-xs font-bold text-gray-400 uppercase">
                    OR
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-1.5 rounded-md border border-pink-200 bg-white text-xs font-bold text-[#FF2E9A] hover:bg-[#FFF0F6] transition cursor-pointer"
                  >
                    Click here to upload
                  </button>

                  <div className="pt-2 text-[10px] text-gray-400 leading-relaxed">
                    <p>File type supported: JPG, JPEG, PNG</p>
                    <p>File size should be maximum 10mb</p>
                  </div>
                </>
              )}
            </div>

            {/* Baris Bawah: Teks Status "Bukti Valid" + Button Aksi */}
            <div className="pt-1 flex items-center justify-between gap-4">
              <div>
                {isValidProof && (
                  <p className="text-xs sm:text-sm font-extrabold text-[#2E9E5B]">
                    Bukti Valid
                  </p>
                )}
              </div>

              {isValidProof ? (
                /* Setelah Valid -> Tombol berubah menjadi "Cek Tiket Saya" dan mengarah ke /my-tickets */
                <button
                  type="button"
                  onClick={() => router.push('/my-tickets')}
                  className="bg-[#FF2E9A] text-white text-xs font-bold px-7 py-2.5 rounded-md hover:bg-pink-600 transition shadow-xs cursor-pointer"
                >
                  Cek Tiket Saya
                </button>
              ) : (
                /* Sebelum Valid -> Tombol Konfirmasi Bukti Pembayaran */
                <button
                  type="button"
                  disabled={!uploadedFile || isSubmitting}
                  onClick={handleVerifyProof}
                  className="bg-[#FF2E9A] text-white text-xs font-bold px-7 py-2.5 rounded-md hover:bg-pink-600 disabled:opacity-45 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Memverifikasi...' : 'Konfirmasi Pembayaran'}
                </button>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function PaymentInstructionPage() {
  return (
    <Suspense fallback={<div className="bg-[#FAF8ED] min-h-screen" />}>
      <InstructionContent />
    </Suspense>
  );
}