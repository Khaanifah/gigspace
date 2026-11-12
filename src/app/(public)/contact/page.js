'use client';

import { useState } from 'react';
import { StatusAlert } from '@/components/shared/UIStates';

const SUBJECT_OPTIONS = [
  'Kerjasama',
  'Kritik dan Saran',
  'Aduan Kendala',
  'Lainnya',
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject ||
      !formData.message.trim()
    ) {
      setStatus({
        type: 'error',
        message: 'Harap lengkapi seluruh kolom formulir sebelum mengirim pesan.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Endpoint API untuk meneruskan pesan ke email contact@gigspace.co.id
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Gagal mengirim pesan. Silakan coba beberapa saat lagi.');
      }

      setStatus({
        type: 'success',
        message: 'Pesan Anda berhasil dikirim! Tim Gigspace akan segera menghubungi Anda melalui email.',
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus({
        type: 'error',
        message: 'Terjadi kesalahan saat mengirim pesan. Silakan periksa koneksi Anda dan coba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-20 font-sans">
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-12">
        
        {/* BAGIAN 1: HERO BANNER (IDENTIK DENGAN ABOUT US & DISCOVER - KOTAK TAJAM) */}
        <section className="relative h-[220px] sm:h-[280px] md:h-[340px] w-full overflow-hidden bg-black shadow-md flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop"
            alt="Contact Us Banner Visual"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 pointer-events-none" />

          <h1 className="relative z-10 font-bebas text-5xl sm:text-7xl md:text-8xl text-white tracking-[0.08em] uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            CONTACT US
          </h1>
        </section>

        {/* BAGIAN 2 & 3: GRID 2 KOLOM (INFORMASI GIGSPACE & FORMULIR KONTAK) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* BAGIAN 2 (KIRI): STAY CONNECTED & INFORMASI KONTAK */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            {/* Badge Fuchsia (Persegi Tajam) */}
            <div className="inline-block bg-[#FF2E9A] text-white px-5 py-2">
              <h2 className="font-bebas text-3xl md:text-4xl tracking-wide uppercase leading-none">
                STAY CONNECTED
              </h2>
            </div>

            <p className="text-sm md:text-base text-[#FF2E9A] leading-relaxed font-medium text-justify">
              Punya pertanyaan seputar pemesanan tiket, ingin mengajukan proposal kerjasama konser, atau butuh bantuan terkait layanan Gigspace? Tim kami siap membantu Anda.
            </p>

            {/* Daftar Alamat, Nomor HP, dan Email */}
            <ul className="space-y-4 pt-1 text-sm md:text-base text-[#FF2E9A] font-medium">
              {/* Alamat */}
              <li className="flex items-start gap-3.5">
                <svg
                  className="w-5 h-5 stroke-[#FF2E9A] flex-shrink-0 mt-0.5"
                  fill="none"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5.5v-6h-5v6H4a1 1 0 01-1-1v-9.5z"
                  />
                </svg>
                <span className="leading-snug">
                  Jl. Pandanaran No. 102, Mugassari, Kec. Semarang Selatan, Kota Semarang, Jawa Tengah
                </span>
              </li>

              {/* Nomor HP / WhatsApp */}
              <li className="flex items-center gap-3.5">
                <svg
                  className="w-5 h-5 stroke-[#FF2E9A] flex-shrink-0"
                  fill="none"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>+62 812 3456 7890</span>
              </li>

              {/* Email */}
              <li className="flex items-center gap-3.5">
                <svg
                  className="w-5 h-5 stroke-[#FF2E9A] flex-shrink-0"
                  fill="none"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>contact@gigspace.co.id</span>
              </li>
            </ul>
          </div>

          {/* BAGIAN 3 (KANAN): CARD FORMULIR CONTACT US */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-pink-100/80 space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#FF2E9A]">
                Contact Us
              </h2>
              <p className="text-xs md:text-sm text-[#FF2E9A]/85 mt-1">
                Hubungi kami terkait kerjasama, pengaduan, ataupun saran dan kritik bagi layanan kami.
              </p>
            </div>

            {/* Alert Success / Error */}
            <StatusAlert type={status.type} message={status.message} />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-bold text-[#FF2E9A]">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Masukkan nama lengkap Anda"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-pink-100 bg-[#FFF9FC] text-sm text-[#1C1C1C] placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A] disabled:opacity-60"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-[#FF2E9A]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  placeholder="Masukkan email Anda"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-pink-100 bg-[#FFF9FC] text-sm text-[#1C1C1C] placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A] disabled:opacity-60"
                />
              </div>

              {/* Subjek (4 Pilihan) */}
              <div className="space-y-1.5">
                <label htmlFor="subject" className="block text-xs font-bold text-[#FF2E9A]">
                  Subjek
                </label>
                <div className="relative">
                  <select
                    id="subject"
                    name="subject"
                    required
                    disabled={isSubmitting}
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full appearance-none px-4 py-2.5 pr-10 rounded-lg border border-pink-100 bg-[#FFF9FC] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A] disabled:opacity-60 cursor-pointer ${
                      formData.subject ? 'text-[#1C1C1C]' : 'text-pink-300'
                    }`}
                  >
                    <option value="" disabled>
                      Pilih subjek
                    </option>
                    {SUBJECT_OPTIONS.map((item) => (
                      <option key={item} value={item} className="text-[#1C1C1C]">
                        {item}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="w-4 h-4 stroke-pink-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Pesan */}
              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-xs font-bold text-[#FF2E9A]">
                  Pesan
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  required
                  disabled={isSubmitting}
                  placeholder="Masukkan pesan Anda"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-pink-100 bg-[#FFF9FC] text-sm text-[#1C1C1C] placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 focus:border-[#FF2E9A] disabled:opacity-60 resize-y"
                />
              </div>

              {/* Tombol Kirim Pesan */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FF2E9A] text-white py-3 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-md shadow-pink-200 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim Pesan...</span>
                    </>
                  ) : (
                    <span>Kirim Pesan</span>
                  )}
                </button>
              </div>
            </form>
          </div>

        </section>
      </main>
    </div>
  );
}