'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-[#1C1C1C] text-white sticky top-0 z-50 px-6 py-3 flex items-center justify-between border-b border-gray-800 gap-4">
      
      {/* 1. REVISI LOGO (MENGGUNAKAN FOTO/GAMBAR) */}
      <Link href="/" className="flex items-center flex-shrink-0">
        <img 
          src="/logo.png" 
          alt="Gigspace Logo" 
          className="h-9 md:h-10 w-auto object-contain" 
        />
      </Link>

      {/* 2. REVISI SEARCH BAR (LEBIH LEBAR DAN MENGGUNAKAN ICON GAMBAR KUSTOM) */}
      <div className="relative flex-1 max-w-xl md:max-w-2xl mx-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-[#2A2A2A] text-sm text-gray-200 placeholder-gray-400 rounded-full py-2 pl-5 pr-12 focus:outline-none focus:ring-1 focus:ring-[#FF2E9A]"
        />
        {/* Icon Kaca Pembesar (Gambar Kustom) */}
        <button className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <img 
            src="/icons/search.png" 
            alt="Search Icon" 
            className="w-4 h-4 object-contain opacity-80 hover:opacity-100 transition" 
          />
        </button>
      </div>

      {/* Menu Navigasi */}
      <nav className="hidden lg:flex items-center gap-6 text-xs tracking-wider font-semibold uppercase flex-shrink-0">
        <Link href="/discover" className="hover:text-[#FF2E9A] transition">DISCOVER</Link>
        <Link href="/my-tickets" className="hover:text-[#FF2E9A] transition">MY TICKETS</Link>
        <Link href="/about" className="hover:text-[#FF2E9A] transition">ABOUT US</Link>
        <Link href="/contact" className="hover:text-[#FF2E9A] transition">CONTACT US</Link>
        <Link 
          href="/login" 
          className="bg-[#FF2E9A] text-white px-5 py-1.5 rounded-full hover:bg-pink-600 transition font-bold"
        >
          SIGN UP
        </Link>
      </nav>
    </header>
  );
}