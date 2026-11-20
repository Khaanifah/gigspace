'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Judul layar merah menurut kode error dari API check-in.
const FAIL_TITLE = {
  TICKET_ALREADY_USED: 'TIKET SUDAH DIPAKAI',
  TICKET_EXPIRED: 'TIKET KEDALUWARSA',
  TICKET_CANCELLED: 'TIKET DIBATALKAN',
  EVENT_CANCELLED: 'ACARA DIBATALKAN',
  FORBIDDEN: 'BUKAN ACARA ANDA',
  TICKET_NOT_FOUND: 'TIKET TIDAK VALID',
  VALIDATION_ERROR: 'QR TIDAK VALID',
  RATE_LIMITED: 'TERLALU CEPAT',
  UNAUTHENTICATED: 'SESI BERAKHIR',
};

function formatCheckedInAt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

export default function TicketCheckinPage() {
  // null | { status: 'success', ticket } | { status: 'invalid', code, reason }
  const [scanResult, setScanResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [manualToken, setManualToken] = useState('');

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const busyRef = useRef(false); // cegah dua permintaan check-in untuk satu pemindaian

  // Kirim isi QR ke API. Server yang memutuskan valid atau tidaknya (kepemilikan acara,
  // status tiket, kedaluwarsa), dan mencatat check-in secara atomik.
  // Token TIDAK boleh diubah huruf besar/kecilnya: qrToken bersifat case-sensitive.
  const submitToken = async (rawText) => {
    if (busyRef.current) return;
    const token = String(rawText || '').trim();
    setIsScanning(false);

    if (!token) {
      setScanResult({ status: 'invalid', code: 'EMPTY', reason: 'QR Code kosong atau tidak terbaca.' });
      return;
    }

    busyRef.current = true;
    setIsChecking(true);
    try {
      const res = await fetch('/api/organizer/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        setScanResult({ status: 'success', ticket: json.data.ticket });
      } else {
        setScanResult({
          status: 'invalid',
          code: json?.error?.code ?? 'UNKNOWN',
          reason: json?.message || 'Check-in gagal. Silakan coba lagi.',
        });
      }
    } catch {
      setScanResult({
        status: 'invalid',
        code: 'NETWORK',
        reason:
          'Koneksi ke server terputus. Scan ulang tiket ini; jika muncul "sudah dipakai", berarti check-in sebelumnya sudah tercatat.',
      });
    } finally {
      busyRef.current = false;
      setIsChecking(false);
    }
  };

  // Nyalakan kamera & deteksi QR secara otomatis saat berada di gerbang scan
  useEffect(() => {
    const shouldRunCamera = !scanResult && !isChecking && isScanning;
    if (!shouldRunCamera) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setCameraError('');
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('Kamera tidak didukung di browser ini. Gunakan unggah gambar QR atau input manual.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

          const detectLoop = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              if (videoRef.current.readyState === 4) {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  submitToken(barcodes[0].rawValue);
                  return;
                }
              }
            } catch {
              // Abaikan frame yang gagal terdeteksi
            }
            animFrameRef.current = requestAnimationFrame(detectLoop);
          };

          animFrameRef.current = requestAnimationFrame(detectLoop);
        } else {
          setCameraError(
            'Browser ini belum mendukung deteksi QR otomatis. Gunakan Chrome di Android, atau input manual (mis. pemindai USB).'
          );
        }
      } catch {
        setCameraError('Izin kamera belum diberikan atau tidak tersedia. Gunakan unggah gambar QR atau input manual.');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [scanResult, isChecking, isScanning]);

  // Fallback scan dari file gambar QR
  const handleImageFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if ('BarcodeDetector' in window) {
        const bitmap = await createImageBitmap(file);
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const codes = await detector.detect(bitmap);
        if (codes?.length > 0 && codes[0].rawValue) {
          submitToken(codes[0].rawValue);
          return;
        }
      }
    } catch {
      // Lanjut ke pesan gagal baca QR
    }

    setIsScanning(false);
    setScanResult({
      status: 'invalid',
      code: 'NO_QR',
      reason: 'QR Code tidak terdeteksi dari gambar yang dipilih.',
    });
  };

  // Input manual: juga menampung pemindai USB/Bluetooth yang mengetik isi QR lalu menekan Enter.
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const value = manualToken;
    setManualToken('');
    submitToken(value);
  };

  const handleResetGate = () => {
    setScanResult(null);
    setIsScanning(true);
    setManualToken('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col justify-between font-sans">
      {/* Header Petugas */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <span className="text-sm sm:text-base font-black text-[#1C1C1C]">Gigspace Validasi Tiket</span>

        <Link
          href="/organizer"
          className="text-xs font-extrabold text-[#FF2E9A] bg-[#FFF0F6] px-4 py-2 rounded-xl hover:bg-[#FFE4F2] transition"
        >
          Kembali
        </Link>
      </header>

      {/* Area Utama di Tengah Layar */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {isChecking ? (
          /* MEMERIKSA TIKET */
          <div
            className="w-full max-w-xl bg-white border-2 border-[#FF2E9A] rounded-3xl p-10 shadow-xl text-center space-y-4"
            aria-live="polite"
          >
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-[#FFE4F2] border-t-[#FF2E9A] animate-spin" />
            <p className="text-lg font-black text-[#1C1C1C]">Memeriksa tiket...</p>
          </div>
        ) : scanResult?.status === 'invalid' ? (
          /* PERINGATAN LAYAR MERAH */
          <div className="w-full max-w-xl bg-rose-600 text-white rounded-3xl p-7 sm:p-10 shadow-xl text-center space-y-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest bg-white/15 inline-block px-4 py-1 rounded-full">
                Peringatan Validasi
              </p>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {FAIL_TITLE[scanResult.code] ?? 'CHECK-IN GAGAL'}
              </h1>
              <p className="text-sm sm:text-base font-semibold text-rose-100">{scanResult.reason}</p>
            </div>

            <button
              type="button"
              onClick={handleResetGate}
              className="w-full bg-white text-rose-600 hover:bg-rose-50 font-black text-base sm:text-lg py-4 rounded-2xl transition shadow-md cursor-pointer"
            >
              SCAN QR BERIKUTNYA
            </button>
          </div>
        ) : scanResult?.status === 'success' ? (
          /* CHECK-IN BERHASIL (sudah tercatat di server) */
          <div className="w-full max-w-xl bg-white border-2 border-emerald-500 rounded-3xl p-7 sm:p-10 shadow-xl text-center space-y-5">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider">
              Check-in Berhasil &bull; {scanResult.ticket.category}
            </span>
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-gray-500">Nama Penonton</p>
              <h2 className="text-3xl sm:text-5xl font-black text-[#1C1C1C] tracking-tight break-words">
                {scanResult.ticket.holderName}
              </h2>
              <p className="text-xs sm:text-sm font-mono font-bold text-[#FF2E9A]">{scanResult.ticket.ticketCode}</p>
              <p className="text-xs font-semibold text-gray-500 pt-1">
                {scanResult.ticket.eventTitle} &bull; {formatCheckedInAt(scanResult.ticket.checkedInAt)} WIB
              </p>
            </div>
            <p className="text-sm font-bold text-emerald-700">Penonton sudah tercatat masuk ke venue.</p>
            <button
              type="button"
              onClick={handleResetGate}
              className="w-full bg-[#1C1C1C] hover:bg-black text-white font-black text-base sm:text-lg py-4 rounded-2xl transition cursor-pointer"
            >
              SCAN QR BERIKUTNYA
            </button>
          </div>
        ) : (
          /* GERBANG SCAN QR */
          <div className="w-full max-w-xl text-center space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-4xl font-black text-[#1C1C1C]">Scan QR Code Tiket</h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Arahkan QR Code e-ticket penonton ke kamera. Tiket langsung dicek dan dicatat masuk.
              </p>
            </div>

            {/* Area Kamera / Frame QR */}
            <div className="relative bg-[#141414] rounded-3xl overflow-hidden border-2 border-[#FF2E9A] aspect-square max-h-[380px] mx-auto w-full flex items-center justify-center shadow-md">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

              {/* Bingkai Panduan QR di Tengah */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-[#FF2E9A] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
            </div>

            {cameraError && (
              <p className="text-xs font-semibold text-gray-600 bg-white border border-pink-100 rounded-2xl px-4 py-3">
                {cameraError}
              </p>
            )}

            {/* Unggah Gambar QR & Input Manual */}
            <div className="space-y-3 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileScan}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#FF2E9A] hover:bg-pink-600 text-white font-black text-sm sm:text-base py-3.5 rounded-2xl transition shadow-sm cursor-pointer"
              >
                UNGGAH GAMBAR QR
              </button>

              <form onSubmit={handleManualSubmit} className="flex gap-2.5">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Input manual / pemindai USB (isi QR)"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label="Isi QR tiket"
                  className="flex-1 min-w-0 bg-white border border-pink-200 text-xs font-mono px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35"
                />
                <button
                  type="submit"
                  disabled={!manualToken.trim()}
                  className="bg-white hover:bg-[#FFF9FC] disabled:opacity-50 border border-pink-200 text-[#FF2E9A] font-extrabold text-xs px-5 rounded-xl transition cursor-pointer"
                >
                  Cek
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
