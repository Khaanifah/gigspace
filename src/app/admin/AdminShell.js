'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { label: 'Antrean Kurasi', href: '/admin/curation' },
  { label: 'Verifikasi Pembayaran', href: '/admin/payments' },
  { label: 'Manajemen Pengguna', href: '/admin/users' },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { userEmail, logout } = useAuth();
  const adminEmail = userEmail;
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentPageTitle =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ||
    'Antrean Kurasi';

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E9ECEF] font-sans">
      
      {/* TOP HEADER */}
      <header className="h-16 sm:h-20 bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-4 sm:gap-8 lg:gap-16 min-w-0">
          <Link href="/admin/curation" className="flex-shrink-0">
            <img
              src="/logo.png"
              alt="Gigspace Logo"
              className="h-9 sm:h-11 lg:h-12 w-auto object-contain"
            />
          </Link>

          <h1 className="text-base sm:text-lg lg:text-xl font-extrabold text-[#FF2E9A] truncate">
            {currentPageTitle}
          </h1>
        </div>

        {/* Profil Administrator */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-label="Profil Administrator"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 hover:ring-2 hover:ring-[#FF2E9A]/50 transition flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-pink-100 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-pink-100">
                <p className="text-xs font-extrabold text-[#1C1C1C]">
                  Administrator
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {adminEmail}
                </p>
              </div>

              <div className="pt-1.5 px-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 stroke-current"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                    />
                  </svg>
                  <span>Log out Administrator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* BODY: SIDEBAR (HORIZONTAL DI MOBILE, VERTIKAL DI DESKTOP) + KONTEN */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <aside className="w-full lg:w-60 bg-white border-b lg:border-b-0 lg:border-r border-gray-200/80 px-4 sm:px-6 py-3 lg:py-6 flex flex-row lg:flex-col justify-between items-center lg:items-stretch flex-shrink-0 overflow-x-auto">
          <nav className="flex flex-row lg:flex-col gap-4 lg:gap-3 whitespace-nowrap">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`py-1.5 px-2.5 lg:px-0 rounded-lg lg:rounded-none text-xs sm:text-sm transition ${
                    isActive
                      ? 'font-extrabold text-[#FF2E9A] bg-[#FFF0F6] lg:bg-transparent'
                      : 'font-semibold text-[#FF2E9A]/70 hover:text-[#FF2E9A]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-8 mt-8 border-t border-pink-100 hidden lg:block">
            <Link
              href="/"
              className="text-xs font-bold text-[#FF2E9A]/75 hover:text-[#FF2E9A] transition"
            >
              &larr; Kembali ke Website Utama
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}