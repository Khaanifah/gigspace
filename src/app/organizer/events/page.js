import Link from 'next/link';
import { getSessionUser } from '@/server/auth/session';
import { listOrganizerEvents } from '@/server/organizer/events-service';

// Status database -> kunci tampilan (DRAFT dianggap Pending; Selesai/Dibatalkan hanya tampil di "Semua").
const STATUS_KEY = { PUBLISHED: 'ACTIVE', PENDING_REVIEW: 'PENDING', DRAFT: 'PENDING' };

const STATUS_BADGE = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  COMPLETED: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_LABEL = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })
    .format(date)
    .replace('.', ':') + ' WIB';
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  })
    .format(Number(amount) || 0)
    .replace('IDR', 'Rp');
}

export default async function OrganizerEventsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const activeFilter = String(resolvedParams?.status || 'ALL').toUpperCase();

  const user = await getSessionUser();
  const { profile, events } = await listOrganizerEvents(user);

  // Status asli dari database, dipetakan ke kunci tampilan
  const allEvents = events.map((ev) => ({ ...ev, key: STATUS_KEY[ev.status] ?? ev.status }));

  const counts = {
    ALL: allEvents.length,
    ACTIVE: allEvents.filter((e) => e.key === 'ACTIVE').length,
    PENDING: allEvents.filter((e) => e.key === 'PENDING').length,
    REJECTED: allEvents.filter((e) => e.key === 'REJECTED').length,
  };

  const filteredEvents =
    activeFilter === 'ALL' ? allEvents : allEvents.filter((ev) => ev.key === activeFilter);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-pink-100 p-5 sm:p-8 space-y-6 shadow-2xs">
      {/* Header Daftar Acara */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-100 pb-5">
        <div>
          <p className="text-xs font-extrabold text-[#FF2E9A] uppercase tracking-wider">
            Organizer &bull; Daftar Acara
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C1C1C] mt-0.5">
            Daftar Acara Saya
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Seluruh acara milik {profile?.organizationName ?? user.fullName ?? user.email}.
          </p>
        </div>

        <Link
          href="/organizer/events/create"
          className="bg-[#FF2E9A] hover:bg-pink-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow-xs"
        >
          + Buat Acara Baru
        </Link>
      </div>

      {/* Filter Status (Hijau: Active, Kuning: Pending, Merah: Rejected) */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: `Semua (${counts.ALL})` },
          { key: 'ACTIVE', label: `Active (${counts.ACTIVE})` },
          { key: 'PENDING', label: `Pending (${counts.PENDING})` },
          { key: 'REJECTED', label: `Rejected (${counts.REJECTED})` },
        ].map((tab) => {
          const isSelected = activeFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === 'ALL'
                  ? '/organizer/events'
                  : `/organizer/events?status=${tab.key}`
              }
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                isSelected
                  ? 'bg-[#FF2E9A] text-white'
                  : 'bg-[#FFF0F6] text-[#FF2E9A] hover:bg-[#FFE4F2]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tabel Daftar Acara */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl bg-[#FFF9FC] border border-pink-100 p-8 text-center space-y-2">
          <p className="text-sm font-extrabold text-[#1C1C1C]">
            Belum ada acara pada status ini
          </p>
          <p className="text-xs text-gray-500">
            Klik tombol &ldquo;+ Buat Acara Baru&rdquo; untuk mengajukan konser baru.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-pink-100 text-xs font-extrabold text-[#FF2E9A]">
                <th className="py-3 px-3">Judul Acara</th>
                <th className="py-3 px-3">Lokasi</th>
                <th className="py-3 px-3">Tiket Terjual / Kuota</th>
                <th className="py-3 px-3">Pendapatan</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100/80 text-xs">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#FFF9FC] transition">
                  <td className="py-4 px-3">
                    <p className="font-extrabold text-[#1C1C1C]">{ev.title}</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                      {formatDate(ev.startsAt)}
                    </p>
                    {ev.rejectReason && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1">
                        Alasan ditolak: {ev.rejectReason}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-3 text-gray-600">
                    {ev.venueName}
                  </td>
                  <td className="py-4 px-3 font-bold text-[#FF2E9A]">
                    {ev.sold} / {ev.quota}
                  </td>
                  <td className="py-4 px-3 font-extrabold text-[#1C1C1C]">
                    {formatRupiah(ev.revenue)}
                  </td>
                  <td className="py-4 px-3 text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                        STATUS_BADGE[ev.key]
                      }`}
                    >
                      {STATUS_LABEL[ev.key]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}