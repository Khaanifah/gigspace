'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ticketsData } from '@/lib/ticketsData';
import { EmptyState } from '@/components/shared/UIStates';

export default function TicketDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [activeQrItem, setActiveQrItem] = useState(null);

  const order = ticketsData.find((item) => item.id === resolvedParams.id);

  if (!order) {
    return (
      <div className="bg-[#FAF8ED] min-h-screen py-16 px-4 font-sans">
        <EmptyState
          title="Detail tiket tidak ditemukan"
          description="Pesanan tiket yang Anda cari tidak tersedia."
          actionLabel="Kembali ke My Tickets"
          onAction={() => router.push('/my-tickets')}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-20 font-sans">
      
      {/* DAFTAR KARTU E-TICKET SESUAI JUMLAH PEMBELIAN */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8 space-y-6">
        
        {/* TOMBOL BACK TO MY TICKETS */}
        <div>
          <Link
            href="/my-tickets"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#FF2E9A] hover:opacity-80 group transition"
          >
            <img
              src="/icons/back.png"
              alt="Back Icon"
              className="w-4 h-4 object-contain group-hover:-translate-x-0.5 transition-transform"
            />
            <span>Kembali ke My Tickets</span>
          </Link>
        </div>

        {order.items.map((ticketItem) => (
          <div
            key={ticketItem.ticketCode}
            className="relative bg-[#FFF0F6] rounded-2xl shadow-sm border border-pink-100/80 flex flex-col md:flex-row items-stretch overflow-hidden"
          >
            {/* SISI KIRI & TENGAH: Thumbnail Poster + Detail Tiket */}
            <div className="flex-1 p-5 sm:p-6 md:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-7">
              {/* Kotak Poster Konser */}
              <div className="w-full sm:w-40 md:w-44 h-44 sm:h-48 rounded-xl bg-white/80 overflow-hidden flex-shrink-0 shadow-xs">
                <img
                  src={order.image}
                  alt={order.eventTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Informasi Konser & Kode Tiket */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl md:text-[26px] font-extrabold text-[#FF2E9A] leading-tight">
                    {order.eventTitle}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-[#FF2E9A]/85 leading-snug">
                    {order.location}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-[#FF2E9A]/85">
                    {order.dateLabel}
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-[#FF2E9A] pt-1.5">
                    {order.timeLabel}
                  </p>
                </div>

                {/* Baris Kode Tiket Individual */}
                <div className="pt-2 flex items-baseline gap-5">
                  <span className="text-xs sm:text-sm font-medium text-[#FF2E9A]/85">
                    Kode Tiket
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#FF2E9A] tracking-wide">
                    {ticketItem.ticketCode}
                  </span>
                </div>
              </div>
            </div>

            {/* PEMISAH TIKET DENGAN EFEK SOBEKAN SETENGAH LINGKARAN */}
            <div className="relative hidden md:flex flex-col items-center justify-between w-6 my-2">
              <div className="w-6 h-6 rounded-full bg-[#FAF8ED] -mt-5 border-b border-pink-100/80" />
              <div className="flex-1 border-l-2 border-dashed border-[#FF2E9A]/25 my-2" />
              <div className="w-6 h-6 rounded-full bg-[#FAF8ED] -mb-5 border-t border-pink-100/80" />
            </div>

            {/* SISI KANAN (TICKET STUB): Kode Transaksi & Kode QR Clickable */}
            <div className="md:w-52 p-5 sm:p-6 border-t md:border-t-0 border-dashed border-[#FF2E9A]/25 flex flex-row md:flex-col items-center justify-between md:justify-center text-center gap-4">
              <div>
                <p className="text-[10px] font-medium text-[#FF2E9A]/75">
                  Kode Transaksi
                </p>
                <p className="text-sm sm:text-base font-black text-[#FF2E9A] tracking-wide">
                  {order.transactionCode}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-[#FF2E9A]/75">
                  Kode QR
                </span>
                <button
                  type="button"
                  onClick={() => setActiveQrItem(ticketItem)}
                  title="Klik untuk memperbesar Kode QR"
                  className="bg-white p-2 rounded-lg border border-pink-200 hover:border-[#FF2E9A] hover:scale-105 transition shadow-xs cursor-pointer"
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      ticketItem.ticketCode
                    )}`}
                    alt={`QR ${ticketItem.ticketCode}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* MODAL PREVIEW E-TICKET QR CODE (SAAT QR CODE DIKLIK) */}
      {activeQrItem && (
        <div
          onClick={() => setActiveQrItem(null)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-pink-100 text-center space-y-5"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <h3 className="text-base sm:text-lg font-extrabold text-[#FF2E9A]">
                E-Ticket QR Code
              </h3>
              <button
                type="button"
                onClick={() => setActiveQrItem(null)}
                aria-label="Tutup modal"
                className="text-gray-400 hover:text-[#1C1C1C] font-bold text-base leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Nama Konser & Jadwal */}
            <div className="space-y-1">
              <p className="text-base font-extrabold text-[#1C1C1C]">
                {order.eventTitle}
              </p>
              <p className="text-xs text-gray-500">
                {order.dateLabel} • {order.timeLabel}
              </p>
            </div>

            {/* Kotak QR Code Berbingkai Pink */}
            <div className="bg-[#FFF0F6] border-2 border-[#FF2E9A] p-5 inline-flex flex-col items-center justify-center mx-auto">
              <div className="bg-white p-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    activeQrItem.ticketCode
                  )}`}
                  alt={`QR Code ${activeQrItem.ticketCode}`}
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                />
              </div>
              <span className="mt-3 text-xs font-extrabold tracking-wider text-[#FF2E9A]">
                {activeQrItem.ticketCode}
              </span>
            </div>

            {/* Instruksi Scanner */}
            <p className="text-xs text-gray-500 leading-relaxed px-2">
              Tunjukkan kode QR ini kepada petugas scanner di pintu masuk venue konser.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}