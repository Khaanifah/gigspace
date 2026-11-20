'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/shared/LogoutButton';

const EO_NAV_ITEMS = [
  { label: 'Ringkasan', href: '/organizer', exact: true },
  { label: 'Daftar Acara', href: '/organizer/events', exact: true },
  { label: 'Buat Acara', href: '/organizer/events/create' },
  { label: 'Data Penonton', href: '/organizer/attendees' },
  { label: 'Check-in Tiket', href: '/organizer/checkin' },
];

export default function OrganizerShell({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname?.startsWith('/organizer/checkin')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#E9ECEF] font-sans text-[#1C1C1C]">
      {/* Top Bar */}
      <header className="h-16 sm:h-20 bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Buka Menu EO"
            className="lg:hidden p-2 rounded-xl bg-[#FFF0F6] text-[#FF2E9A] font-bold cursor-pointer"
          >
            ☰
          </button>

          <Link href="/organizer" className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Gigspace Logo"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>

          <span className="hidden sm:inline-block text-xs sm:text-sm font-bold text-gray-600 truncate">
            Event Organizer Studio
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <LogoutButton className="text-xs font-bold text-gray-600 hover:text-[#FF2E9A] px-3 py-2 rounded-xl hover:bg-[#FFF0F6] transition cursor-pointer" />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Kiri (Desktop) */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200/80 p-6 flex-col justify-between flex-shrink-0">
          <nav className="space-y-2">
            {EO_NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);

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

          <div className="pt-6 border-t border-pink-100 space-y-2">
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
            {EO_NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);
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