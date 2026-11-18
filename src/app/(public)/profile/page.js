'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function UserProfilePage() {
  const fileInputRef = useRef(null);
  const [isSavedToast, setIsSavedToast] = useState(false);

  const [fullName, setFullName] = useState('Honey');
  const [email, setEmail] = useState('itsnaankhaanifaah@gmail.com');
  const [phone, setPhone] = useState('823 2951 7662');
  const [avatarPreview, setAvatarPreview] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Sinkronkan data email & nama dari sesi login aktif
  useEffect(() => {
    const syncUser = async () => {
      try {
        const saved = sessionStorage.getItem('gigspace_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.email) {
            setEmail(parsed.email);
            if (parsed?.name) setFullName(parsed.name);
          }
        }
      } catch {
        // Abaikan
      }

      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        if (data.user.email) setEmail(data.user.email);
        if (data.user.user_metadata?.full_name) {
          setFullName(data.user.user_metadata.full_name);
        }
        if (data.user.user_metadata?.phone) {
          setPhone(data.user.user_metadata.phone);
        }
      }
    };

    syncUser();
  }, [supabase]);

  // Ganti Foto Profil (Preview Lokal)
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Simpan Perubahan Profil ke Supabase Metadata
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
        },
      });
    } catch {
      // Tetap lanjutkan pembaruan lokal
    }

    try {
      const saved = JSON.parse(sessionStorage.getItem('gigspace_session') || '{}');
      sessionStorage.setItem(
        'gigspace_session',
        JSON.stringify({ ...saved, name: fullName, email })
      );
    } catch {
      // Abaikan
    }

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Logout User
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Abaikan
    }
    document.cookie = 'gigspace_role=; path=/; max-age=0; SameSite=Lax';
    sessionStorage.removeItem('gigspace_session');
    window.location.href = '/';
  };

  const initialLetter = fullName?.trim().charAt(0).toUpperCase() || 'H';

  return (
    <main className="min-h-screen bg-[#F5F6F8] py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* KOLOM KIRI: KARTU PROFIL & RINGKASAN AKUN */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          
          {/* Kartu Identitas User */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xs border border-pink-100/80 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFF0F6] border-2 border-[#FF2E9A]/30 text-[#FF2E9A] font-black text-xl flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initialLetter
              )}
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] mt-3">
              {fullName}
            </h2>
            <p className="text-xs text-[#FF2E9A] font-medium mt-0.5 break-all">
              {email}
            </p>

            {/* Tombol Edit Profil & Keluar */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-5">
              <button
                type="button"
                onClick={() => document.getElementById('profile-name')?.focus()}
                className="py-2.5 px-3 rounded-xl bg-[#FFF0F6] hover:bg-[#FFE4F2] text-[#FF2E9A] text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 stroke-current flex-shrink-0" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Profil</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 stroke-current flex-shrink-0" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* Kartu Ringkasan Akun (2 kolom di mobile, 1 kolom di desktop) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-pink-100/80 space-y-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#1C1C1C] px-1">
              Ringkasan Akun
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
              {[
                { label: 'Event', value: '-' },
                { label: 'Transaksi Berhasil', value: '-' },
                { label: 'Tiket Event', value: '-' },
                { label: 'Tiket Undangan', value: '-' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-[#FFF9FC] border border-pink-100 rounded-xl p-3 sm:p-3.5 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500 truncate">
                      {stat.label}
                    </p>
                    <p className="text-sm font-extrabold text-[#1C1C1C] mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <span className="w-6 h-6 rounded-md bg-[#FFF0F6] text-[#FF2E9A] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    &bull;
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: FORM PROFIL */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-2xs border border-pink-100/80 space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#1C1C1C]">
                Profil
              </h2>
              {isSavedToast && (
                <span className="text-[11px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Perubahan berhasil disimpan!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-5">
              {/* Baris Gambar Profil */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2.5 sm:gap-3">
                <label className="sm:col-span-3 text-xs font-bold text-gray-600">
                  Gambar Profil
                </label>
                <div className="sm:col-span-9 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#FFF0F6] border border-pink-200 text-[#FF2E9A] font-black text-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initialLetter
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-full border border-pink-200 bg-[#FFF9FC] hover:bg-[#FFF0F6] text-xs font-bold text-[#FF2E9A] transition cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                </div>
              </div>

              {/* Baris Nama Lengkap */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2 sm:gap-3">
                <label
                  htmlFor="profile-name"
                  className="sm:col-span-3 text-xs font-bold text-gray-600"
                >
                  Nama Lengkap
                </label>
                <div className="sm:col-span-9 w-full">
                  <input
                    id="profile-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35 focus:border-[#FF2E9A]"
                  />
                </div>
              </div>

              {/* Baris Email */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2 sm:gap-3">
                <label
                  htmlFor="profile-email"
                  className="sm:col-span-3 text-xs font-bold text-gray-600"
                >
                  Email
                </label>
                <div className="sm:col-span-9 w-full">
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs sm:text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Baris Nomor Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2 sm:gap-3">
                <label
                  htmlFor="profile-phone"
                  className="sm:col-span-3 text-xs font-bold text-gray-600"
                >
                  Nomor Telepon
                </label>
                <div className="sm:col-span-9 w-full flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#FF2E9A]/35 focus-within:border-[#FF2E9A]">
                  <span className="px-3.5 py-2.5 bg-[#FFF9FC] border-r border-gray-200 text-xs font-extrabold text-[#FF2E9A] select-none whitespace-nowrap flex-shrink-0">
                    ID +62
                  </span>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm text-[#1C1C1C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Garis Pemisah & Tombol Simpan Perubahan */}
              <div className="pt-4 sm:pt-5 border-t border-pink-100 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#FF2E9A] hover:bg-pink-600 text-white text-xs font-extrabold px-6 py-3 sm:py-2.5 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}