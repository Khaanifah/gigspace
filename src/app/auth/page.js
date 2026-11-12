'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { StatusAlert } from '@/components/shared/UIStates';

export default function AuthPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(55);
  const [canResend, setCanResend] = useState(false);

  // State UI: Loading, Error, Success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const router = useRouter();
  const { login } = useAuth();
  const otpInputsRef = useRef([]);

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: Kirim OTP ke Email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Alamat email wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Siap diganti langsung dengan: await supabase.auth.signInWithOtp({ email })
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Gagal mengirim kode OTP ke email.');
      }

      setStep(2);
      setCountdown(55);
      setCanResend(false);
      setStatus({
        type: 'success',
        message: 'Kode OTP berhasil dikirim! Silakan cek kotak masuk atau folder spam email Anda.',
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Terjadi gangguan jaringan saat mengirim OTP.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kirim Ulang OTP
  const handleResendOtp = async () => {
    if (!canResend || isSubmitting) return;
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Gagal mengirim ulang kode OTP.');

      setCountdown(55);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
      setStatus({ type: 'success', message: 'Kode OTP baru telah dikirim ke email Anda.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2: Verifikasi OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    const token = otp.join('');
    if (token.length < 6) {
      setStatus({ type: 'error', message: 'Masukkan 6 digit kode OTP secara lengkap.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Siap diganti langsung dengan: await supabase.auth.verifyOtp({ email, token, type: 'email' })
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Kode OTP tidak valid atau sudah kedaluwarsa.');
      }

      setStatus({ type: 'success', message: 'Verifikasi berhasil! Mengalihkan ke beranda...' });
      login(email);
      setTimeout(() => router.push('/'), 800);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white font-sans">
      
      {/* SISI KIRI: Branding Visual */}
      <div className="relative hidden md:flex flex-col items-center justify-center bg-[#1C1C1C] overflow-hidden p-12">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF2E9A]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#5D00FF]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-4">
          <img
            src="/logo.png"
            alt="Gigspace"
            className="h-16 mx-auto object-contain drop-shadow-[0_0_20px_rgba(255,46,154,0.5)]"
          />
          <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
            Discover Local Music Scene Around You
          </p>
        </div>
      </div>

      {/* SISI KANAN: Form Action */}
      <div className="flex flex-col justify-center items-center px-6 md:px-16 py-12 relative">
        
        <Link
          href="/"
          className="absolute top-6 left-6 text-xs font-bold text-gray-500 hover:text-[#FF2E9A] flex items-center gap-2 group transition"
        >
          <img
            src="/icons/back.png"
            alt="Back Icon"
            className="w-4 h-4 object-contain opacity-70 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all"
          />
          <span>Kembali ke Home</span>
        </Link>

        <div className="w-full max-w-sm space-y-6">
          <div className="md:hidden text-center mb-6">
            <img src="/logo.png" alt="Gigspace" className="h-10 mx-auto object-contain" />
          </div>

          {/* ALERT SUCCESS / ERROR */}
          <StatusAlert type={status.type} message={status.message} />

          {/* STEP 1: FORM INPUT EMAIL */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-[#1C1C1C]">Selamat datang!</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Silakan masukkan email Anda untuk melanjutkan.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Email</label>
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/50 focus:border-[#FF2E9A] disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FF2E9A] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-md shadow-pink-200 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim OTP...</span>
                    </>
                  ) : (
                    <span>Lanjutkan →</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFIKASI KODE OTP */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-[#1C1C1C]">Masukkan kode OTP</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Silakan periksa email Anda. Kode OTP telah dikirim ke{' '}
                  <span className="font-bold text-[#FF2E9A]">{email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputsRef.current[index] = el)}
                      type="text"
                      maxLength={1}
                      disabled={isSubmitting}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF2E9A] focus:border-[#FF2E9A] bg-gray-50 disabled:opacity-50"
                    />
                  ))}
                </div>

                <div className="text-center">
                  {canResend ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleResendOtp}
                      className="text-xs font-bold text-[#FF2E9A] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      Kirim Ulang Kode OTP
                    </button>
                  ) : (
                    <p className="text-[11px] text-gray-400">
                      Belum menerima kode OTP?{' '}
                      <span className="font-bold text-[#FF2E9A]">{countdown} detik</span> untuk mengirim ulang
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FF2E9A] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-md shadow-pink-200 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Masuk →</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setStep(1);
                    setOtp(['', '', '', '', '', '']);
                    setStatus({ type: '', message: '' });
                  }}
                  className="w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Ubah Email
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}