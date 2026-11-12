'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/UIStates';
import { ticketsData, getTicketStatus } from '@/lib/ticketsData';

export default function MyTicketsPage() {
  const router = useRouter();

  return (
    <div className="bg-[#FAF8ED] min-h-screen text-[#1C1C1C] pb-20 font-sans">
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-10">
        
        {/* BAGIAN 1: HERO BANNER */}
        <section className="relative h-[220px] sm:h-[280px] md:h-[340px] w-full overflow-hidden bg-black shadow-md flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop"
            alt="My Tickets Banner Visual"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 pointer-events-none" />

          <h1 className="relative z-10 font-bebas text-5xl sm:text-7xl md:text-8xl text-white tracking-[0.08em] uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            MY TICKETS
          </h1>
        </section>

        {/* BAGIAN 2: LIST TIKET YANG DIPESAN */}
        <section className="space-y-4">
          {ticketsData.length === 0 ? (
            <EmptyState
              title="Belum ada tiket yang dipesan"
              description="Tiket konser yang kamu beli akan muncul di sini beserta kode QR untuk akses masuk ke venue."
              actionLabel="Jelajahi Konser"
              onAction={() => router.push('/discover')}
            />
          ) : (
            <div className="divide-y divide-pink-200/50">
              {ticketsData.map((ticket) => {
                const status = getTicketStatus(ticket);
                const isActive = status === 'active';

                return (
                  <div
                    key={ticket.id}
                    className="py-5 first:pt-0 flex flex-col sm:flex-row sm:items-stretch justify-between gap-4"
                  >
                    {/* KIRI & TENGAH: Poster Konser + Detail Info */}
                    <div className="flex items-start sm:items-center gap-4 md:gap-5">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-black overflow-hidden flex-shrink-0 shadow-sm">
                        <img
                          src={ticket.image}
                          alt={ticket.eventTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <h2 className="text-lg md:text-xl font-extrabold text-[#FF2E9A] leading-tight">
                          {ticket.eventTitle}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs text-[#FF2E9A]/85 font-medium">
                          <div className="flex items-start gap-2 max-w-[210px]">
                            <svg
                              className="w-4 h-4 stroke-[#FF2E9A] flex-shrink-0 mt-0.5"
                              fill="none"
                              strokeWidth="1.8"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z"
                              />
                              <circle cx="12" cy="11" r="2.2" />
                            </svg>
                            <span className="leading-snug">{ticket.location}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 stroke-[#FF2E9A] flex-shrink-0"
                              fill="none"
                              strokeWidth="1.8"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 7v5l3 2"
                              />
                            </svg>
                            <span>{ticket.dateLabel}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 stroke-[#FF2E9A] flex-shrink-0"
                              fill="none"
                              strokeWidth="1.8"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 9a2 2 0 012-2h12a2 2 0 012 2v1.5a1.5 1.5 0 000 3V15a2 2 0 01-2 2H6a2 2 0 01-2-2v-1.5a1.5 1.5 0 000-3V9z"
                              />
                            </svg>
                            <span>Tiket ({ticket.quantity})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 stroke-[#FF2E9A] flex-shrink-0"
                              fill="none"
                              strokeWidth="1.8"
                              viewBox="0 0 24 24"
                            >
                              <rect x="3" y="4" width="18" height="17" rx="2" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 2v4M8 2v4M3 10h18"
                              />
                            </svg>
                            <span>{ticket.timeLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KANAN: Indikator Status (Atas) & Tombol Kode QR (Bawah) */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4 sm:py-0.5 flex-shrink-0">
                      {isActive ? (
                        <span className="inline-flex items-center px-4 py-1 rounded-full text-[11px] font-bold bg-[#E3F9E5] text-[#2E9E5B] border border-[#9AE6B4]">
                          Tiket Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-1 rounded-full text-[11px] font-bold bg-[#FDE8E8] text-[#E05252] border border-[#F8B4B4]">
                          Tiket Kedaluwarsa
                        </span>
                      )}

                      {isActive ? (
                        <Link
                          href={`/my-tickets/${ticket.id}`}
                          className="bg-[#FF2E9A] text-white text-xs font-bold px-6 py-2 rounded-md hover:bg-pink-600 transition shadow-sm"
                        >
                          Kode QR
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="bg-[#FF2E9A]/45 text-white text-xs font-bold px-6 py-2 rounded-md cursor-not-allowed"
                        >
                          Kode QR
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}