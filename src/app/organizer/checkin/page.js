'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { initialAttendeesData } from '@/lib/organizerData';

export default function TicketCheckinPage() {
  const [attendees, setAttendees] = useState(initialAttendeesData);
  const [scanResult, setScanResult] = useState(null); // null | { status: 'valid' | 'invalid', attendee?, reason? }
  const [checkedInSuccess, setCheckedInSuccess] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const processDecodedCode = (rawText) => {
    const cleanCode = String(rawText || '').trim().toUpperCase();
    setCheckedInSuccess(false);

    if (!cleanCode) {
      setScanResult({
        status: 'invalid',
        reason: 'QR Code kosong atau tidak terbaca.',
      });
      return;
    }

    const found = attendees.find(
      (item) => item.ticketCode.toUpperCase() === cleanCode
    );

    if (!found) {
      setScanResult({
        status: 'invalid',
        reason: `QR "${cleanCode}" tidak terdaftar dalam sistem.`,
      });
      return;
    }

    if (found.checkedIn) {
      setScanResult({
        status: 'invalid',
        attendee: found,
        reason: 'Tiket ini sudah digunakan untuk check-in sebelumnya.',
      });
      return;
    }

    setScanResult({
      status: 'valid',
      attendee: found,
    });
  };

  // Nyalakan kamera & deteksi QR secara otomatis saat berada di gerbang scan
  useEffect(() => {
    const shouldRunCamera = !scanResult && isScanning;
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
          setCameraError('Kamera tidak didukung di browser ini. Gunakan unggah gambar QR atau tombol uji scan.');
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
                  setIsScanning(false);
                  processDecodedCode(barcodes[0].rawValue);
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
          setCameraError('Scanner kamera aktif. Jika perangkat tidak mendukung deteksi QR otomatis, gunakan unggah gambar QR atau tombol uji scan.');
        }
      } catch {
        setCameraError('Izin kamera belum diberikan atau tidak tersedia. Gunakan unggah gambar QR atau tombol uji scan.');
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
  }, [scanResult, isScanning]);

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
          setIsScanning(false);
          processDecodedCode(codes[0].rawValue);
          return;
        }
      }
    } catch {
      // Lanjut ke pesan gagal baca QR
    }

    setIsScanning(false);
    setScanResult({
      status: 'invalid',
      reason: 'QR Code tidak terdeteksi dari gambar yang dipilih.',
    });
  };

  const handleUseTicket = () => {
    if (!scanResult?.attendee) return;
    const targetId = scanResult.attendee.id;

    setAttendees((prev) =>
      prev.map((item) =>
        item.id === targetId ? { ...item, checkedIn: true } : item
      )
    );
    setCheckedInSuccess(true);
  };

  const handleResetGate = () => {
    setScanResult(null);
    setCheckedInSuccess(false);
    setIsScanning(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col justify-between font-sans">
      {/* Header Petugas */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <span className="text-sm sm:text-base font-black text-[#1C1C1C]">
          Gigspace Validasi Tiket
        </span>

        <Link
          href="/organizer"
          className="text-xs font-extrabold text-[#FF2E9A] bg-[#FFF0F6] px-4 py-2 rounded-xl hover:bg-[#FFE4F2] transition"
        >
          Kembali
        </Link>
      </header>

      {/* Area Utama di Tengah Layar */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {scanResult?.status === 'invalid' ? (
          /* PERINGATAN LAYAR MERAH */
          <div className="w-full max-w-xl bg-rose-600 text-white rounded-3xl p-7 sm:p-10 shadow-xl text-center space-y-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest bg-white/15 inline-block px-4 py-1 rounded-full">
                Peringatan Validasi
              </p>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                TIKET SUDAH DIPAKAI / INVALID
              </h1>
              <p className="text-sm sm:text-base font-semibold text-rose-100">
                {scanResult.reason}
              </p>
              {scanResult.attendee && (
                <p className="text-lg font-extrabold pt-1">
                  {scanResult.attendee.buyerName} &bull; {scanResult.attendee.ticketType}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetGate}
              className="w-full bg-white text-rose-600 hover:bg-rose-50 font-black text-base sm:text-lg py-4 rounded-2xl transition shadow-md cursor-pointer"
            >
              SCAN QR BERIKUTNYA
            </button>
          </div>
        ) : scanResult?.status === 'valid' ? (
          /* HASIL SCAN VALID & TOMBOL RAKSASA GUNAKAN TIKET */
          <div className="w-full max-w-xl bg-white border-2 border-[#FF2E9A] rounded-3xl p-7 sm:p-10 shadow-xl text-center space-y-6">
            {checkedInSuccess ? (
              <div className="space-y-4 py-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider">
                  Check-in Berhasil
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#1C1C1C]">
                  {scanResult.attendee.buyerName}
                </h2>
                <p className="text-sm font-bold text-emerald-700">
                  Penonton sudah tercatat masuk ke venue.
                </p>
                <button
                  type="button"
                  onClick={handleResetGate}
                  className="w-full mt-4 bg-[#1C1C1C] hover:bg-black text-white font-black text-base sm:text-lg py-4 rounded-2xl transition cursor-pointer"
                >
                  SCAN QR BERIKUTNYA
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFF0F6] text-[#FF2E9A] text-xs font-black uppercase tracking-wider">
                    Tiket Valid &bull; {scanResult.attendee.ticketType}
                  </span>
                  <p className="text-xs font-bold text-gray-500 pt-2">
                    Nama Penonton
                  </p>
                  <h1 className="text-3xl sm:text-5xl font-black text-[#1C1C1C] tracking-tight break-words">
                    {scanResult.attendee.buyerName}
                  </h1>
                  <p className="text-xs sm:text-sm font-mono font-bold text-[#FF2E9A]">
                    {scanResult.attendee.ticketCode}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleUseTicket}
                    className="w-full bg-[#FF2E9A] hover:bg-pink-600 active:scale-[0.99] text-white font-black text-lg sm:text-2xl py-5 sm:py-6 rounded-2xl transition shadow-lg cursor-pointer"
                  >
                    GUNAKAN TIKET
                  </button>

                  <button
                    type="button"
                    onClick={handleResetGate}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl transition cursor-pointer"
                  >
                    Batal / Scan Ulang
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* GERBANG SCAN QR */
          <div className="w-full max-w-xl text-center space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-4xl font-black text-[#1C1C1C]">
                Scan QR Code Tiket
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Arahkan QR Code e-ticket penonton ke kamera untuk validasi otomatis.
              </p>
            </div>

            {/* Area Kamera / Frame QR */}
            <div className="relative bg-[#141414] rounded-3xl overflow-hidden border-2 border-[#FF2E9A] aspect-square max-h-[380px] mx-auto w-full flex items-center justify-center shadow-md">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

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

            {/* Unggah Gambar QR & Simulasi Hasil Scan QR */}
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

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsScanning(false);
                    processDecodedCode('GIG-2026-VIP01');
                  }}
                  className="bg-white hover:bg-[#FFF9FC] border border-pink-200 text-[#FF2E9A] font-extrabold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  Simulasi Scan QR Valid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsScanning(false);
                    processDecodedCode('GIG-2026-USED99');
                  }}
                  className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-extrabold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  Simulasi Scan QR Terpakai
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}