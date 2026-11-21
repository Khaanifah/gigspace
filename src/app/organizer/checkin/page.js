'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { decodeQr, DecoderLoadError } from '@/lib/qrDecoder';
import { toCheckInBody } from '@/lib/checkinInput';

const SCAN_INTERVAL_MS = 120; // ~8 pemindaian per detik: cukup cepat, tidak membebani HP

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

const FALLBACK_LOAD_FAILED =
  'Pemindai cadangan gagal dimuat. Muat ulang halaman, atau gunakan input manual.';

function formatCheckedInAt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

// Pesan yang bisa ditindaklanjuti untuk tiap penyebab kamera gagal
function cameraErrorMessage(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Izin kamera ditolak. Izinkan akses kamera untuk situs ini di pengaturan browser, lalu coba lagi.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Kamera tidak ditemukan di perangkat ini. Gunakan unggah gambar QR atau input manual.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu, lalu coba lagi.';
    default:
      return 'Kamera tidak bisa dibuka. Coba lagi, atau gunakan unggah gambar QR atau input manual.';
  }
}

// Kamera belakang bila ada; bila batasan tak terpenuhi (mis. laptop), pakai kamera apa pun.
async function openCameraStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch (err) {
    if (err?.name === 'OverconstrainedError' || err?.name === 'ConstraintNotSatisfiedError') {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    throw err;
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('IMAGE_LOAD_FAILED'));
    };
    img.src = url;
  });
}

const vibrate = (pattern) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // tidak didukung: abaikan
  }
};

export default function TicketCheckinPage() {
  // null | { status: 'success', ticket } | { status: 'invalid', code, reason }
  const [scanResult, setScanResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [cameraKey, setCameraKey] = useState(0); // naikkan untuk membuka kamera ulang
  const [manualToken, setManualToken] = useState('');

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const busyRef = useRef(false); // cegah dua permintaan check-in untuk satu pemindaian

  // Kirim hasil scan ke API: isi QR (token) ATAU kode tiket tercetak (TK-XXXXXXXX) dari input manual.
  // Server yang memutuskan valid atau tidaknya (kepemilikan acara, status tiket, kedaluwarsa),
  // dan mencatat check-in secara atomik. Token TIDAK boleh diubah huruf besar/kecilnya: case-sensitive.
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
        body: JSON.stringify(toCheckInBody(token)),
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        vibrate(120);
        setScanResult({ status: 'success', ticket: json.data.ticket });
      } else {
        vibrate([120, 70, 120]);
        setScanResult({
          status: 'invalid',
          code: json?.error?.code ?? 'UNKNOWN',
          reason: json?.message || 'Check-in gagal. Silakan coba lagi.',
        });
      }
    } catch {
      vibrate([120, 70, 120]);
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

  // Nyalakan kamera & pindai QR terus-menerus selama berada di gerbang scan
  useEffect(() => {
    const stopAll = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const shouldRunCamera = !scanResult && !isChecking && isScanning;
    if (!shouldRunCamera) {
      stopAll();
      return undefined;
    }

    let cancelled = false;

    const start = async () => {
      setCameraError('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          window.isSecureContext
            ? 'Browser ini tidak mendukung akses kamera. Gunakan unggah gambar QR atau input manual.'
            : 'Kamera hanya bisa dipakai lewat HTTPS (atau localhost). Buka halaman ini lewat alamat https://, atau gunakan unggah gambar QR dan input manual.'
        );
        return;
      }

      let stream;
      try {
        stream = await openCameraStream();
      } catch (err) {
        if (!cancelled) setCameraError(cameraErrorMessage(err));
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // play() dibatalkan karena tampilan berganti: tidak apa-apa
      }

      let lastRun = 0;
      let working = false;

      const tick = async (ts) => {
        if (cancelled) return;

        if (!working && ts - lastRun >= SCAN_INTERVAL_MS && video.readyState >= 2 && video.videoWidth > 0) {
          lastRun = ts;
          working = true;
          try {
            const raw = await decodeQr(video);
            if (raw && !cancelled) {
              submitToken(raw);
              return; // berhenti: kamera dimatikan oleh efek ini setelah state berubah
            }
          } catch (err) {
            if (err instanceof DecoderLoadError) {
              if (!cancelled) setCameraError(FALLBACK_LOAD_FAILED);
              return;
            }
            // kesalahan frame lain: abaikan, coba frame berikutnya
          } finally {
            working = false;
          }
        }

        if (!cancelled) animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    };

    start();

    return () => {
      cancelled = true;
      stopAll();
    };
    // submitToken hanya memakai ref dan setter state (stabil), jadi sengaja tidak jadi dependensi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanResult, isChecking, isScanning, cameraKey]);

  // Scan dari file gambar QR (foto atau screenshot)
  const handleImageFileScan = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // izinkan memilih file yang sama lagi
    if (!file) return;

    let reason = 'QR Code tidak terdeteksi dari gambar yang dipilih. Pastikan QR terlihat jelas dan tidak terpotong.';
    try {
      const img = await loadImageFromFile(file);
      const raw = await decodeQr(img, { still: true });
      if (raw) {
        submitToken(raw);
        return;
      }
    } catch (err) {
      if (err instanceof DecoderLoadError) reason = FALLBACK_LOAD_FAILED;
      else if (err?.message === 'IMAGE_LOAD_FAILED') reason = 'File yang dipilih bukan gambar yang valid.';
    }

    setIsScanning(false);
    setScanResult({ status: 'invalid', code: 'NO_QR', reason });
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
              <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />

              {/* Bingkai Panduan QR di Tengah */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-[#FF2E9A] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
            </div>

            {cameraError ? (
              <div className="text-xs font-semibold text-gray-600 bg-white border border-pink-100 rounded-2xl px-4 py-3 space-y-2.5">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setCameraKey((k) => k + 1)}
                  className="bg-[#FFF0F6] hover:bg-[#FFE4F2] text-[#FF2E9A] border border-pink-200 text-xs font-extrabold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Coba buka kamera lagi
                </button>
              </div>
            ) : (
              <p className="text-xs font-semibold text-gray-500">
                Dekatkan QR hingga memenuhi bingkai dan pastikan cukup terang.
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

              <form onSubmit={handleManualSubmit} className="space-y-1.5 text-left">
                <label htmlFor="manual-code" className="block text-xs font-bold text-gray-600">
                  Tidak bisa scan? Ketik kode tiket
                </label>
                <div className="flex gap-2.5">
                  <input
                    id="manual-code"
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Contoh: TK-7K2M9QXA"
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="flex-1 min-w-0 bg-white border border-pink-200 text-sm font-mono px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35"
                  />
                  <button
                    type="submit"
                    disabled={!manualToken.trim()}
                    className="bg-[#1C1C1C] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs px-6 rounded-xl transition cursor-pointer"
                  >
                    Cek
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Kode ada di bawah QR pada e-ticket penonton. Pemindai USB juga bisa mengisi kolom ini.
                </p>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
