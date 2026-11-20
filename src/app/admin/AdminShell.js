'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const ADMIN_NAV_ITEMS = [
  { label: 'Antrean Kurasi', href: '/admin/curation' },
  { label: 'Verifikasi Pembayaran', href: '/admin/payments' },
  { label: 'Manajemen Pengguna', href: '/admin/users' },
  { label: 'Pesan Kontak', href: '/admin/contact' },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { userEmail, logout } = useAuth(); // status login dari server
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

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E9ECEF] font-sans text-[#1C1C1C]">
      {/* Top Bar */}
      <header className="h-16 sm:h-20 bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Buka Menu Admin"
            className="lg:hidden p-2 rounded-xl bg-[#FFF0F6] text-[#FF2E9A] font-bold cursor-pointer"
          >
            ☰
          </button>

          <Link href="/admin/curation" className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Gigspace Logo"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>

          <span className="hidden sm:inline-block text-xs sm:text-sm font-bold text-gray-600 truncate">
            Admin Panel
          </span>
        </div>

        {/* Profil & Keluar */}
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
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Kiri (Desktop) */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200/80 p-6 flex-col justify-between flex-shrink-0">
          <nav className="space-y-2">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-xl text-sm transition ${
                    isActive
                      ? 'bg-[#FFF0F6] text-[#FF2E9A] font-extrabold border border-pink-200'
                      : 'text-gray-600 hover:bg-[#FFF9FC] hover:text-[#FF2E9A] font-semibold'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-pink-100">
            <Link
              href="/"
              className="block text-xs font-bold text-[#FF2E9A]/80 hover:text-[#FF2E9A] transition"
            >
              &larr; Kembali ke Beranda Publik
            </Link>
          </div>
        </aside>

        {/* Drawer Navigasi Mobile */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-b border-pink-100 px-4 py-3 flex flex-wrap gap-2">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                    isActive
                      ? 'bg-[#FF2E9A] text-white'
                      : 'bg-[#FFF0F6] text-[#FF2E9A]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Konten Utama */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}