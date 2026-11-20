'use client';

import { useState, useEffect } from 'react';
import { useApiData } from '@/lib/useApiData';
import { EmptyState, ErrorState } from '@/components/shared/UIStates';

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { label: 'Semua', value: '' },
  { label: 'Sudah Masuk', value: 'checked_in' },
  { label: 'Belum', value: 'not_checked_in' },
];

const STATUS_BADGE = {
  USED: { label: 'Sudah Masuk', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ACTIVE: { label: 'Belum', style: 'bg-amber-100 text-amber-800 border-amber-200' },
  CANCELLED: { label: 'Dibatalkan', style: 'bg-rose-100 text-rose-700 border-rose-200' },
  EXPIRED: { label: 'Kedaluwarsa', style: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function formatTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  });
}

export default function AttendeeListPage() {
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'checked_in' | 'not_checked_in'
  const [eventId, setEventId] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Pencarian dikirim ke server setelah pengguna berhenti mengetik
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (filterStatus) params.set('status', filterStatus);
  if (eventId) params.set('eventId', eventId);
  if (debouncedSearch) params.set('q', debouncedSearch);

  const { data, error, isLoading, reload } = useApiData(`/api/organizer/attendees?${params.toString()}`);

  const attendees = data?.items ?? [];
  const events = data?.events ?? [];
  const pagination = data?.pagination;
  const counts = data?.counts ?? { total: 0, checkedIn: 0 };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">Data Penonton</h1>
          <p className="text-xs text-gray-500 mt-1">
            Daftar pembeli tiket, kategori tiket, dan status masuk di pintu venue.
          </p>
        </div>

        <div className="text-xs font-extrabold text-[#FF2E9A] bg-[#FFF0F6] border border-pink-200 px-4 py-2 rounded-xl">
          Masuk: {counts.checkedIn} / {counts.total}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap bg-[#FFE4F2] rounded-xl p-1 gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setFilterStatus(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                filterStatus === tab.value ? 'bg-[#FF2E9A] text-white' : 'text-[#FF2E9A] hover:bg-[#FFD1E8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter acara"
            className="w-full sm:w-56 bg-[#FFF9FC] border border-pink-200 text-xs font-semibold text-[#FF2E9A] px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35 cursor-pointer"
          >
            <option value="">Semua acara</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama penonton atau kode tiket..."
            className="w-full sm:w-64 bg-[#FFF9FC] border border-pink-200 text-xs px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35"
          />
        </div>
      </div>

      {/* Tabel Penonton */}
      {isLoading ? (
        <div className="space-y-2.5 animate-pulse" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-pink-100/60 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : attendees.length === 0 ? (
        <EmptyState
          title="Penonton tidak ditemukan"
          description="Belum ada tiket terbit atau tidak ada yang cocok dengan filter dan kata kunci pencarian."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-pink-100 text-xs font-extrabold text-[#FF2E9A]">
                  <th className="py-3 px-3">Nama Pembeli</th>
                  <th className="py-3 px-3">Kode Tiket</th>
                  <th className="py-3 px-3">Jenis Tiket</th>
                  <th className="py-3 px-3">Acara</th>
                  <th className="py-3 px-3">Status Check-in</th>
                  <th className="py-3 px-3">Waktu Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100/80 text-xs">
                {attendees.map((att) => {
                  const badge = STATUS_BADGE[att.status] ?? STATUS_BADGE.ACTIVE;
                  return (
                    <tr key={att.id} className="hover:bg-[#FFF9FC] transition">
                      <td className="py-4 px-3 font-extrabold text-[#1C1C1C]">{att.buyerName}</td>
                      <td className="py-4 px-3 font-mono font-bold text-[#FF2E9A]">{att.ticketCode}</td>
                      <td className="py-4 px-3 font-semibold text-gray-700">{att.ticketType}</td>
                      <td className="py-4 px-3 font-semibold text-gray-700">{att.eventTitle}</td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-gray-600">{formatTime(att.checkedInAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs font-semibold text-gray-500">
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} tiket)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FFF0F6] hover:bg-[#FFE4F2] disabled:opacity-40 disabled:cursor-not-allowed text-[#FF2E9A] text-xs font-extrabold transition cursor-pointer"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FFF0F6] hover:bg-[#FFE4F2] disabled:opacity-40 disabled:cursor-not-allowed text-[#FF2E9A] text-xs font-extrabold transition cursor-pointer"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
