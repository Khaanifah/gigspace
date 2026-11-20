'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const ROLES = [
  {
    id: 'user',
    label: 'User',
    redirectTo: '/',
  },
  {
    id: 'organizer',
    label: 'Organizer',
    redirectTo: '/organizer',
  },
  {
    id: 'admin',
    label: 'Admin',
    redirectTo: '/admin/curation',
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1C1C1C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A]';
const primaryButtonClass =
  'w-full bg-[#FF2E9A] hover:bg-pink-600 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl transition shadow-xs cursor-pointer';
const backButtonClass =
  'inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FF2E9A] hover:opacity-80 group transition cursor-pointer';
const linkButtonClass = 'font-extrabold text-[#FF2E9A] hover:underline cursor-pointer';

// Validasi lapis 1 (frontend); server memvalidasi ulang.
function validatePassword(value) {
  if (value.length < 8) return 'Password minimal 8 karakter.';
  if (value.length > 72) return 'Password maksimal 72 karakter.';
  if (!/[A-Za-z]/.test(value)) return 'Password harus mengandung huruf.';
  if (!/\d/.test(value)) return 'Password harus mengandung angka.';
  return '';
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

function BackButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className={backButtonClass}>
      <img
        src="/icons/back.png"
        alt="Back Icon"
        className="w-4 h-4 object-contain group-hover:-translate-x-0.5 transition-transform"
      />
      <span>{label}</span>
    </button>
  );
}

function ErrorBox({ children }) {
  return (
    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
      {children}
    </div>
  );
}

function InfoBox({ children }) {
  return (
    <div className="p-3 rounded-xl bg-[#FFF0F6] border border-pink-200 text-xs font-semibold text-[#FF2E9A]">
      {children}
    </div>
  );
}

function TextField({ id, label, type = 'text', value, onChange, placeholder, autoComplete, autoFocus, hint }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-[#1C1C1C]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, placeholder, hint, autoFocus }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-[#1C1C1C]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-24`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#FF2E9A] hover:underline cursor-pointer"
        >
          {visible ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      </div>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export default function AuthPage() {
  const codeRefs = useRef([]);

  // Langkah: 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [step, setStep] = useState('login');
  const [selectedRoleId, setSelectedRoleId] = useState('user');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const selectedRole = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0];

  // Timer hitung mundur kirim ulang kode
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const goTo = (next, info = '') => {
    setStep(next);
    setErrorMessage('');
    setInfoMessage(info);
  };

  const openCodeStep = (next, info) => {
    setCodeDigits(['', '', '', '', '', '']);
    setResendCooldown(60);
    goTo(next, info);
  };

  // ───── Input kode 6 digit ─────
  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...codeDigits];
    updated[index] = digit;
    setCodeDigits(updated);
    if (digit && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => {
      updated[i] = d;
    });
    setCodeDigits(updated);
    codeRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ───── Login dengan password ─────
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setErrorMessage('Harap masukkan alamat email yang valid.');
      return;
    }
    if (!password) {
      setErrorMessage('Password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      // Lewat backend kita; role dicek server terhadap database
      const { json } = await postJson('/api/auth/login', {
        email: cleanEmail,
        password,
        door: selectedRole.id,
      });

      if (json?.success) {
        window.location.href = json.data.redirectTo || selectedRole.redirectTo || '/';
        return;
      }

      if (json?.error?.code === 'EMAIL_NOT_VERIFIED') {
        await postJson('/api/auth/resend-verification', { email: cleanEmail }).catch(() => null);
        openCodeStep('verify', 'Email Anda belum diverifikasi. Kami mengirim kode verifikasi baru ke email tersebut.');
        return;
      }

      setErrorMessage(json?.message || 'Login gagal. Silakan coba lagi.');
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // ───── Daftar akun baru (khusus role User) ─────
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim();
    if (fullName.trim().length < 2) {
      setErrorMessage('Nama minimal 2 karakter.');
      return;
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      setErrorMessage('Harap masukkan alamat email yang valid.');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);
    try {
      const { json } = await postJson('/api/auth/register', {
        fullName: fullName.trim(),
        email: cleanEmail,
        password,
      });

      if (!json?.success) {
        setErrorMessage(json?.message || 'Pendaftaran gagal. Silakan coba lagi.');
        return;
      }

      if (json.data?.next === 'login') {
        setPassword('');
        setConfirmPassword('');
        goTo('login', json.message);
        return;
      }

      openCodeStep('verify', json.message);
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // ───── Verifikasi email dengan kode 6 digit ─────
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const token = codeDigits.join('');
    if (token.length < 6) {
      setErrorMessage('Masukkan 6 digit kode yang dikirim ke email Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const { json } = await postJson('/api/auth/verify-email', {
        email: email.trim(),
        token,
        door: selectedRole.id,
      });

      if (!json?.success) {
        setErrorMessage(json?.message || 'Kode tidak valid atau sudah kedaluwarsa.');
        return;
      }
      window.location.href = json.data.redirectTo || '/';
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const { json } = await postJson('/api/auth/resend-verification', { email: email.trim() });
      if (!json?.success) {
        setErrorMessage(json?.message || 'Gagal mengirim ulang kode.');
        return;
      }
      setCodeDigits(['', '', '', '', '', '']);
      setResendCooldown(60);
      setInfoMessage(json.message);
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // ───── Lupa password: kirim kode, lalu buat password baru ─────
  const handleForgot = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setErrorMessage('Harap masukkan alamat email yang valid.');
      return;
    }

    setIsLoading(true);
    try {
      const { json } = await postJson('/api/auth/forgot-password', { email: cleanEmail });
      if (!json?.success) {
        setErrorMessage(json?.message || 'Gagal mengirim kode. Silakan coba lagi.');
        return;
      }
      setPassword('');
      setConfirmPassword('');
      openCodeStep('reset', json.message);
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const token = codeDigits.join('');
    if (token.length < 6) {
      setErrorMessage('Masukkan 6 digit kode yang dikirim ke email Anda.');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);
    try {
      const { json } = await postJson('/api/auth/reset-password', {
        email: email.trim(),
        token,
        password,
      });
      if (!json?.success) {
        setErrorMessage(json?.message || 'Gagal mengganti password.');
        return;
      }
      setPassword('');
      setConfirmPassword('');
      goTo('login', json.message);
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // ───── Fast Login (demo): tanpa password; role tetap ditentukan server ─────
  const handleFastLogin = async (roleId) => {
    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);
    try {
      const { json } = await postJson('/api/auth/fast-login', { role: roleId });
      if (!json?.success) {
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
        {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}
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

  const codeBoxes = (
    <div onPaste={handleCodePaste} className="grid grid-cols-6 gap-2 sm:gap-3">
      {codeDigits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (codeRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoFocus={idx === 0}
          value={digit}
          onChange={(e) => handleCodeChange(idx, e.target.value)}
          onKeyDown={(e) => handleCodeKeyDown(idx, e)}
          className="h-12 sm:h-14 w-full text-center text-lg sm:text-xl font-black text-[#FF2E9A] rounded-xl border border-gray-200 bg-[#FFF9FC] focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A]"
        />
      ))}
    </div>
  );

  const resendBlock = (onResend) => (
    <div className="text-center text-xs text-gray-500">
      Tidak menerima kode?{' '}
      {resendCooldown > 0 ? (
        <span className="font-bold text-gray-400">Kirim ulang dalam {resendCooldown}d</span>
      ) : (
        <button type="button" disabled={isLoading} onClick={onResend} className={linkButtonClass}>
          Kirim Ulang Kode
        </button>
      )}
    </div>
  );

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
        {/* TOMBOL BACK DINAMIS DI POJOK KIRI ATAS */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-10">
          {step === 'login' && (
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
          {(step === 'register' || step === 'verify' || step === 'forgot') && (
            <BackButton label="Kembali ke Login" onClick={() => goTo('login')} />
          )}
          {step === 'reset' && <BackButton label="Ubah Email" onClick={() => goTo('forgot')} />}
        </div>

        <div className="w-full max-w-md mx-auto space-y-7 pt-8 sm:pt-0">
          {/* LOGIN EMAIL + PASSWORD + DROPDOWN ROLE */}
          {step === 'login' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
                  Masuk sebagai {selectedRole.label}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Masukkan email, password, dan role akun Anda.
                </p>
              </div>

              {infoMessage && <InfoBox>{infoMessage}</InfoBox>}
              {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}

              <form onSubmit={handleLogin} className="space-y-4">
                <TextField
                  id="auth-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="Masukkan email"
                  value={email}
                  onChange={setEmail}
                />
                <PasswordField
                  id="auth-password"
                  label="Password"
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={setPassword}
                />

                <div className="space-y-1.5">
                  <label htmlFor="auth-role" className="block text-xs font-bold text-[#1C1C1C]">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="auth-role"
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      className={`${inputClass} appearance-none pr-10 bg-white cursor-pointer`}
                    >
                      {ROLES.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="w-4 h-4 text-gray-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => goTo('forgot')}
                    className="text-xs font-bold text-[#FF2E9A] hover:underline cursor-pointer"
                  >
                    Lupa password?
                  </button>
                </div>

                <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                  {isLoading ? 'Memproses...' : 'Masuk'}
                </button>
              </form>

              {selectedRole.id === 'user' ? (
                <p className="text-center text-xs text-gray-500">
                  Belum punya akun?{' '}
                  <button type="button" onClick={() => goTo('register')} className={linkButtonClass}>
                    Daftar
                  </button>
                </p>
              ) : (
                <p className="text-center text-xs text-gray-400">
                  Akun {selectedRole.label} dibuat oleh pengelola Gigspace.
                </p>
              )}

              {fastLoginPanel}
            </>
          )}

          {/* DAFTAR (ROLE USER) */}
          {step === 'register' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
                  Buat Akun
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Kami akan mengirim kode verifikasi ke email Anda.
                </p>
              </div>

              {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}

              <form onSubmit={handleRegister} className="space-y-4">
                <TextField
                  id="reg-name"
                  label="Nama Lengkap"
                  autoComplete="name"
                  autoFocus
                  placeholder="Nama Anda"
                  value={fullName}
                  onChange={setFullName}
                />
                <TextField
                  id="reg-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                    placeholder="Masukkan email"
                  value={email}
                  onChange={setEmail}
                />
                <PasswordField
                  id="reg-password"
                  label="Password"
                  autoComplete="new-password"
                  placeholder="Buat password"
                  hint="Minimal 8 karakter, kombinasi huruf dan angka."
                  value={password}
                  onChange={setPassword}
                />
                <PasswordField
                  id="reg-confirm"
                  label="Konfirmasi Password"
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />

                <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                  {isLoading ? 'Mendaftarkan...' : 'Daftar'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500">
                Sudah punya akun?{' '}
                <button type="button" onClick={() => goTo('login')} className={linkButtonClass}>
                  Masuk
                </button>
              </p>
            </>
          )}

          {/* VERIFIKASI EMAIL (KODE 6 DIGIT) */}
          {step === 'verify' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
                  Verifikasi Email
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Masukkan 6 digit kode yang dikirim ke{' '}
                  <span className="font-bold text-[#1C1C1C]">{email}</span>
                </p>
              </div>

              {infoMessage && <InfoBox>{infoMessage}</InfoBox>}
              {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}

              <form onSubmit={handleVerifyEmail} className="space-y-5">
                {codeBoxes}
                <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                  {isLoading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                </button>
                {resendBlock(handleResendVerification)}
              </form>
            </>
          )}

          {/* LUPA PASSWORD */}
          {step === 'forgot' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
                  Lupa Password
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Masukkan email akun Anda. Kami akan mengirim kode untuk membuat password baru.
                </p>
              </div>

              {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}

              <form onSubmit={handleForgot} className="space-y-4">
                <TextField
                  id="forgot-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="Masukkan email"
                  value={email}
                  onChange={setEmail}
                />
                <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                  {isLoading ? 'Mengirim Kode...' : 'Kirim Kode'}
                </button>
              </form>
            </>
          )}

          {/* BUAT PASSWORD BARU */}
          {step === 'reset' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
                  Buat Password Baru
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Masukkan kode yang dikirim ke{' '}
                  <span className="font-bold text-[#1C1C1C]">{email}</span> lalu password baru Anda.
                </p>
              </div>

              {infoMessage && <InfoBox>{infoMessage}</InfoBox>}
              {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}

              <form onSubmit={handleReset} className="space-y-4">
                {codeBoxes}
                <PasswordField
                  id="reset-password"
                  label="Password Baru"
                  autoComplete="new-password"
                  placeholder="Password baru"
                  hint="Minimal 8 karakter, kombinasi huruf dan angka."
                  value={password}
                  onChange={setPassword}
                />
                <PasswordField
                  id="reset-confirm"
                  label="Konfirmasi Password Baru"
                  autoComplete="new-password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
                <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
                {resendBlock(handleForgot)}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}