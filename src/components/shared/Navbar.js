'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, isLoggedIn, userEmail } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Status login berasal dari server (cookie sesi), bukan sessionStorage atau role dari browser
  const activeLoggedIn = Boolean(isLoggedIn);
  const activeEmail = userEmail || '';
  const activeName = user?.fullName || activeEmail;
  const activeAvatar = null;

  return (
    <header className="bg-[#1C1C1C] text-white sticky top-0 z-50 border-b border-gray-800">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <img
            src="/logo.png"
            alt="Gigspace Logo"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain"
          />
        </Link>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xl md:max-w-2xl mx-1 sm:mx-4">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#2A2A2A] text-xs sm:text-sm text-gray-200 placeholder-gray-400 rounded-full py-1.5 sm:py-2 pl-4 sm:pl-5 pr-10 sm:pr-12 focus:outline-none focus:ring-1 focus:ring-[#FF2E9A]"
          />
          <button
            type="button"
            aria-label="Search"
            className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <img
              src="/icons/search.png"
              alt="Search Icon"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain opacity-80 hover:opacity-100 transition"
            />
          </button>
        </div>

        {/* Grup Kanan: Menu Navigasi (Desktop) + Auth (Semua Layar) + Hamburger (Mobile) */}
        <div className="flex items-center gap-2.5 lg:gap-6 flex-shrink-0">
          <nav className="hidden lg:flex items-center gap-6 text-xs tracking-wider font-semibold uppercase">
            <Link href="/discover" className="hover:text-[#FF2E9A] transition">DISCOVER</Link>
            <Link href="/my-tickets" className="hover:text-[#FF2E9A] transition">MY TICKETS</Link>
            <Link href="/about" className="hover:text-[#FF2E9A] transition">ABOUT US</Link>
            <Link href="/contact" className="hover:text-[#FF2E9A] transition">CONTACT US</Link>
          </nav>

          {/* Avatar Profil / Tombol SIGN UP menyatu dengan gap-6 di desktop */}
          {activeLoggedIn ? (
            <Link
              href="/profile"
              title={`Profil Akun (${activeEmail})`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FF2E9A] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md hover:opacity-90 transition border-2 border-white/25 overflow-hidden flex-shrink-0"
            >
              {activeAvatar ? (
                <img
                  src={activeAvatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : activeName ? (
                activeName.charAt(0).toUpperCase()
              ) : (
                '👤'
              )}
            </Link>
          ) : (
            <Link
              href="/auth"
              className="bg-[#FF2E9A] text-white text-[11px] sm:text-xs px-4 sm:px-5 py-1.5 rounded-full hover:bg-pink-600 transition font-bold uppercase tracking-wider whitespace-nowrap"
            >
              SIGN UP
            </Link>
          )}

          {/* Hamburger Button khusus Mobile/Tablet (< lg) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className="lg:hidden p-1.5 rounded-lg text-gray-300 hover:text-[#FF2E9A] hover:bg-white/5 transition cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Dropdown Navigasi Mobile */}
      {isMobileMenuOpen && (
        <nav className="lg:hidden bg-[#161616] border-t border-gray-800 px-5 py-3.5 flex flex-col gap-3 text-xs tracking-wider font-semibold uppercase">
          <Link
            href="/discover"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-1.5 hover:text-[#FF2E9A] transition"
          >
            DISCOVER
          </Link>
          <Link
            href="/my-tickets"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-1.5 hover:text-[#FF2E9A] transition"
          >
            MY TICKETS
          </Link>
          <Link
            href="/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-1.5 hover:text-[#FF2E9A] transition"
          >
            ABOUT US
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-1.5 hover:text-[#FF2E9A] transition"
          >
            CONTACT US
          </Link>
        </nav>
      )}
    </header>
  );
}