import Link from 'next/link';
import { getSessionUser } from '@/server/auth/session';
import { getOrganizerDashboard } from '@/server/organizer/service';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  })
    .format(Number(amount) || 0)
    .replace('IDR', 'Rp');
}

export default async function OrganizerHome() {
  const user = await getSessionUser();
  // Semua angka berasal dari database (lihat server/organizer/service.js)
  const { profile, totals, eventCount, activeEvents, chartItems } = await getOrganizerDashboard(user);
  const { revenue: totalRevenue, sold: totalSold, remaining: remainingQuota } = totals;
  const maxChartSold = Math.max(...chartItems.map((c) => c.sold), 1);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-pink-100 p-5 sm:p-8 space-y-8 shadow-2xs">
      {/* Header Ringkasan EO */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-pink-100 pb-5">
        <div>
          <p className="text-xs font-extrabold text-[#FF2E9A] uppercase tracking-wider">
            Organizer &bull; Ringkasan
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C1C1C] mt-0.5">
            {profile?.organizationName ?? user.fullName ?? user.email}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{user.email}</p>
        </div>

        <Link
          href="/organizer/events/create"
          className="bg-[#FF2E9A] hover:bg-pink-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow-xs"
        >
          + Buat Acara
        </Link>
      </div>

      {/* Navigasi Cepat Modul EO */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/organizer"
          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#FF2E9A] text-white"
        >
          Ringkasan
        </Link>
        <Link
          href="/organizer/events"
          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#FFF0F6] text-[#FF2E9A] hover:bg-[#FFE4F2] transition"
        >
          Daftar Acara ({eventCount})
        </Link>
        <Link
          href="/organizer/events/create"
          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#FFF0F6] text-[#FF2E9A] hover:bg-[#FFE4F2] transition"
        >
          Buat Acara
        </Link>
        <Link
          href="/organizer/attendees"
          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#FFF0F6] text-[#FF2E9A] hover:bg-[#FFE4F2] transition"
        >
          Data Penonton
        </Link>
      </div>

      {/* 3 KARTU METRIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="rounded-2xl bg-[#FFF9FC] border border-[#FF2E9A]/50 p-5 space-y-1.5">
          <p className="text-xs font-extrabold text-[#FF2E9A] uppercase tracking-wider">
            Total Pendapatan
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#1C1C1C]">
            {formatRupiah(totalRevenue)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFF9FC] border border-[#FF2E9A]/50 p-5 space-y-1.5">
          <p className="text-xs font-extrabold text-[#FF2E9A] uppercase tracking-wider">
            Tiket Terjual
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#1C1C1C]">
            {totalSold}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFF9FC] border border-[#FF2E9A]/50 p-5 space-y-1.5">
          <p className="text-xs font-extrabold text-[#FF2E9A] uppercase tracking-wider">
            Sisa Kuota
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#1C1C1C]">
            {remainingQuota}
          </p>
        </div>
      </div>

      {/* GRAFIK SEDERHANA PENJUALAN & DAFTAR ACARA AKTIF */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik Batang Sederhana */}
        <div className="lg:col-span-5 rounded-2xl border border-pink-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#1C1C1C]">
              Penjualan per Acara
            </h2>
            <span className="text-[11px] font-bold text-[#FF2E9A] bg-[#FFF0F6] px-2.5 py-1 rounded-full">
              Tiket Terjual
            </span>
          </div>

          {chartItems.length === 0 ? (
            <p className="text-xs text-gray-500 py-10 text-center">
              Belum ada data penjualan acara.
            </p>
          ) : (
            <div className="h-44 flex items-end justify-between gap-2 pt-4">
              {chartItems.map((bar, i) => {
                const pct = Math.max(8, Math.round((bar.sold / maxChartSold) * 100));
                return (
                  <div
                    key={i}
                    title={`${bar.fullTitle}: ${bar.sold} tiket`}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0"
                  >
                    <span className="text-[11px] font-extrabold text-[#FF2E9A]">
                      {bar.sold}
                    </span>
                    <div className="w-full max-w-[32px] bg-[#FFE4F2] rounded-t-xl overflow-hidden flex items-end h-28">
                      <div
                        style={{ height: `${pct}%` }}
                        className="w-full bg-[#FF2E9A] rounded-t-xl"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 truncate w-full text-center">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daftar Acara Aktif (3 Acara Active) */}
        <div className="lg:col-span-7 rounded-2xl border border-pink-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#1C1C1C]">
              Daftar Acara Aktif ({activeEvents.length})
            </h2>
            <Link
              href="/organizer/events"
              className="text-xs font-extrabold text-[#FF2E9A] hover:underline"
            >
              Semua Acara &rarr;
            </Link>
          </div>

          {activeEvents.length === 0 ? (
            <div className="rounded-xl bg-[#FFF9FC] border border-pink-100 p-6 text-center space-y-2">
              <p className="text-xs font-bold text-gray-600">
                Belum ada acara aktif saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl bg-[#FFF9FC] border border-pink-100 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-[#1C1C1C] truncate">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {ev.venueName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                    <p className="text-xs font-extrabold text-[#FF2E9A] mt-1">
                      {ev.sold} / {ev.quota}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}