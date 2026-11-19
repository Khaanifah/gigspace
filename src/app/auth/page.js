'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const ROLES = [
  {
    id: 'user',
    label: 'User',
    redirectTo: '/',
    icon: (
      <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'organizer',
    label: 'Organizer',
    redirectTo: '/organizer',
    icon: (
      <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: 'admin',
    label: 'Admin',
    redirectTo: '/admin/curation',
    icon: (
      <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

export default function AuthPage() {
  const otpRefs = useRef([]);

  // Step state: 'role' | 'email' | 'otp'
  const [step, setStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer hitung mundur kirim ulang OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // STEP 2 -> KIRIM OTP KE EMAIL VIA SUPABASE
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Harap masukkan alamat email yang valid.');
      return;
    }

    setIsLoading(true);
    try {
      // Lewat backend kita (validasi Zod, pembatasan laju, log), bukan langsung ke Supabase
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setErrorMessage(json?.message || 'Gagal mengirim kode OTP. Coba lagi.');
        return;
      }

      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(60);
      setStep('otp');
      setInfoMessage(`Kode verifikasi 6 digit telah dikirim ke ${cleanEmail}.`);
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan saat mengirim OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler ketik per kotak OTP (6 digit)
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handler Backspace & Paste 6 digit OTP sekaligus
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];
    pasted.split('').forEach((char, idx) => {
      updated[idx] = char;
    });
    setOtpDigits(updated);

    const nextFocusIdx = Math.min(pasted.length, 5);
    otpRefs.current[nextFocusIdx]?.focus();
  };

  // STEP 3 -> VERIFIKASI OTP KE SUPABASE & REDIRECT PENUH
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const token = otpDigits.join('');
    if (token.length < 6) {
      setErrorMessage('Masukkan 6 digit kode OTP yang dikirim ke email Anda.');
      return;
    }

    setIsLoading(true);
    try {
      // Server memverifikasi OTP, menulis cookie sesi, lalu mencocokkan pintu dengan role di database.
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token, door: selectedRole?.id ?? 'user' }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setErrorMessage(json?.message || 'Kode OTP tidak valid atau sudah kedaluwarsa. Silakan coba lagi.');
        return;
      }

      // Redirect penuh agar cookie sesi langsung terbaca server
      window.location.href = json.data.redirectTo || selectedRole?.redirectTo || '/';
    } catch {
      setErrorMessage('Terjadi kesalahan saat memverifikasi kode OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fast Login (demo): masuk langsung sebagai salah satu role tanpa OTP; role tetap ditentukan server.
  const handleFastLogin = async (roleId) => {
    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/fast-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErrorMessage(json?.message || 'Fast login gagal.');
        return;
      }
      window.location.href = json.data.redirectTo || '/';
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan saat fast login.');
    } finally {
      setIsLoading(false);
    }
  };

  const fastLoginPanel =
    process.env.NEXT_PUBLIC_ENABLE_FAST_LOGIN === 'true' ? (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
            Fast Login (Demo)
          </span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>
        {step === 'role' && errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
            {errorMessage}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleFastLogin(role.id)}
              className="py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:border-[#FF2E9A] hover:text-[#FF2E9A] disabled:opacity-60 transition cursor-pointer"
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans">
      
      {/* SISI KIRI: BRANDING VISUAL GELAP */}
      <div className="relative bg-[#141414] flex flex-col items-center justify-center p-8 overflow-hidden min-h-[260px] lg:min-h-screen">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#FF2E9A]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#5D00FF]/25 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <Link href="/">
            <img
              src="/logo.png"
              alt="Gigspace Logo"
              className="h-14 sm:h-16 md:h-20 w-auto object-contain"
            />
          </Link>
          <p className="text-[11px] sm:text-xs font-bold text-white/90 tracking-[0.22em] uppercase">
            DISCOVER LOCAL MUSIC SCENE AROUND YOU
          </p>
        </div>
      </div>

      {/* SISI KANAN */}
      <div className="bg-white relative flex flex-col justify-center p-6 sm:p-12">
        
        {/* SATU TOMBOL BACK DINAMIS DI POJOK KIRI ATAS */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-10">
          {step === 'role' && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FF2E9A] hover:opacity-80 group transition"
            >
              <img
                src="/icons/back.png"
                alt="Back Icon"
                className="w-4 h-4 object-contain group-hover:-translate-x-0.5 transition-transform"
              />
              <span>Kembali ke Home</span>
            </Link>
          )}

          {step === 'email' && (
            <button
              type="button"
              onClick={() => {
                setStep('role');
                setSelectedRole(null);
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FF2E9A] hover:opacity-80 group transition cursor-pointer"
            >
              <img
                src="/icons/back.png"
                alt="Back Icon"
                className="w-4 h-4 object-contain group-hover:-translate-x-0.5 transition-transform"
              />
              <span>Kembali Pilih Role</span>
            </button>
          )}

          {step === 'otp' && (
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setErrorMessage('');
                setInfoMessage('');
              }}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FF2E9A] hover:opacity-80 group transition cursor-pointer"
            >
              <img
                src="/icons/back.png"
                alt="Back Icon"
                className="w-4 h-4 object-contain group-hover:-translate-x-0.5 transition-transform"
              />
              <span>Ubah Email</span>
            </button>
          )}
        </div>

        <div className="w-full max-w-md mx-auto space-y-7 pt-8 sm:pt-0">
          
          {/* STEP 1: PILIH ROLE */}
          {step === 'role' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
                  Selamat datang!
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Pilih role akun Anda terlebih dahulu untuk melanjutkan.
                </p>
              </div>

              <div className="space-y-3.5">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setErrorMessage('');
                      setStep('email');
                    }}
                    className="w-full px-5 py-4 rounded-2xl border border-pink-100 bg-[#FFF9FC] hover:bg-[#FF2E9A] hover:border-[#FF2E9A] text-[#1C1C1C] hover:text-white shadow-2xs hover:shadow-md transition-all duration-200 flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FFF0F6] text-[#FF2E9A] group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                      {role.icon}
                    </div>
                    <span className="text-sm sm:text-base font-extrabold tracking-wide">
                      {role.label}
                    </span>
                  </button>
                ))}
              </div>

              {fastLoginPanel}
            </>
          )}

          {/* STEP 2: MASUKKAN EMAIL */}
          {step === 'email' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
                  Masukkan Email Anda
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Kami akan mengirimkan kode verifikasi OTP ke email Anda.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-bold text-[#1C1C1C]"
                  >
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1C1C1C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FF2E9A] hover:bg-pink-600 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isLoading ? 'Mengirim Kode OTP...' : 'Kirim Kode OTP'}
                </button>
              </form>

              {fastLoginPanel}
            </>
          )}

          {/* STEP 3: VERIFIKASI 6-DIGIT KODE OTP */}
          {step === 'otp' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
                  Verifikasi Kode OTP
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Masukkan 6 digit kode yang telah dikirim ke{' '}
                  <span className="font-bold text-[#1C1C1C]">{email}</span>
                </p>
              </div>

              {infoMessage && (
                <div className="p-3 rounded-xl bg-[#FFF0F6] border border-pink-200 text-xs font-semibold text-[#FF2E9A]">
                  {infoMessage}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* 6 Kotak Input Digit OTP */}
                <div
                  onPaste={handleOtpPaste}
                  className="grid grid-cols-6 gap-2 sm:gap-3"
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoFocus={idx === 0}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="h-12 sm:h-14 w-full text-center text-lg sm:text-xl font-black text-[#FF2E9A] rounded-xl border border-gray-200 bg-[#FFF9FC] focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A]"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FF2E9A] hover:bg-pink-600 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isLoading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                </button>

                {/* Tombol Kirim Ulang OTP */}
                <div className="text-center text-xs text-gray-500">
                  Tidak menerima kode?{' '}
                  {resendCooldown > 0 ? (
                    <span className="font-bold text-gray-400">
                      Kirim ulang dalam {resendCooldown}d
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleSendOtp}
                      className="font-extrabold text-[#FF2E9A] hover:underline cursor-pointer"
                    >
                      Kirim Ulang OTP
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}