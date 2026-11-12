import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1C1C1C] text-gray-300 pt-12 pb-6 px-6 md:px-16 mt-20 border-t border-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 text-xs pb-10 border-b border-gray-800">
        
        {/* REVISI LOGO FOOTER (MENGGUNAKAN GAMBAR KUSTOM) */}
        <div className="md:col-span-1 space-y-3">
          <Link href="/" className="inline-block">
            <img 
              src="/logo.png" 
              alt="Gigspace Logo" 
              className="h-9 w-auto object-contain" 
            />
          </Link>
          <p className="text-[10px] text-gray-400 tracking-wider">
            DISCOVER LOCAL MUSIC SCENE AROUND YOU
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3">Information</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/discover" className="hover:text-white">Discover</Link></li>
            <li><Link href="/my-tickets" className="hover:text-white">My Tickets</Link></li>
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3">Company</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3">Social Media</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-white">Facebook</a></li>
            <li><a href="#" className="hover:text-white">Instagram</a></li>
            <li><a href="#" className="hover:text-white">TikTok</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3">Genre</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Indie</li>
            <li>Rock</li>
            <li>Solo</li>
            <li>Classic</li>
            <li>All Genre</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto text-center pt-6 text-[11px] text-gray-500">
        Copyright 2026 Gigspace | All rights reserved
      </div>
    </footer>
  );
}