'use client';

import { useState, useEffect } from 'react';
import { useApiData } from '@/lib/useApiData';
import { EmptyState, ErrorState, StatusAlert } from '@/components/shared/UIStates';
import { exportToExcel } from '@/lib/exportExcel';

const PAGE_SIZE = 20;

const TABS = [
  { key: 'Semua', group: '', label: 'Semua Antrean' },
  { key: 'Pending', group: 'pending', label: 'Pending' },
  { key: 'Disetujui', group: 'approved', label: 'Disetujui' },
  { key: 'Ditolak', group: 'rejected', label: 'Ditolak' },
];

const GROUP_LABEL = { pending: 'Pending', approved: 'Disetujui', rejected: 'Ditolak' };

const TZ = 'Asia/Jakarta';
const dateLabel = (iso) => new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long', timeZone: TZ });
const timeLabel = (iso) =>
  `${new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).replace('.', ':')} WIB`;

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
    .format(amount || 0)
    .replace('IDR', 'Rp');

function Poster({ src, alt, className }) {
  if (!src) {
    return (
      <div className={`${className} bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center`}>
        Tanpa poster
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} />;
}

export default function AdminCurationPage() {
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isRejecting, setIsRejecting] = useState(false); // mode isi alasan penolakan di modal
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pencarian dikirim ke server setelah pengguna berhenti mengetik
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const group = TABS.find((t) => t.key === activeTab)?.group ?? '';

  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (group) params.set('group', group);
  if (debouncedSearch) params.set('q', debouncedSearch);
  const { data, error, isLoading, reload } = useApiData(`/api/admin/events?${params.toString()}`);

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const counts = data?.counts ?? { pending: 0, approved: 0, rejected: 0 };
  const totalAll = counts.pending + counts.approved + counts.rejected;

  const closeModal = () => {
    setSelectedEvent(null);
    setActionError('');
    setIsRejecting(false);
    setRejectReason('');
  };

  // Approve / Reject: memanggil API; semua perubahan data & notifikasi ke EO dilakukan server
  const handleDecision = async (event, decision) => {
    setActionError('');
    if (decision === 'reject' && rejectReason.trim().length < 3) {
      setActionError('Isi alasan penolakan (minimal 3 karakter).');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/${decision}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision === 'reject' ? { reason: rejectReason.trim() } : {}),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Gagal memproses pengajuan.');

      closeModal();
      setFeedbackMessage(
        decision === 'approve'
          ? `"${event.title}" disetujui dan sudah tayang. EO mendapat notifikasi.`
          : `"${event.title}" ditolak. Alasan dikirim ke EO.`
      );
      setTimeout(() => setFeedbackMessage(''), 4000);
      reload();
    } catch (err) {
      setActionError(err.message || 'Gagal memproses pengajuan.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export semua halaman sesuai filter & pencarian aktif (bukan hanya halaman yang tampil)
  const handleExportExcel = async () => {
    setIsExporting(true);
    setActionError('');
    try {
      const all = [];
      let p = 1;
      let totalPages = 1;
      do {
        const qs = new URLSearchParams({ page: String(p), pageSize: '50' });
        if (group) qs.set('group', group);
        if (debouncedSearch) qs.set('q', debouncedSearch);
        const res = await fetch(`/api/admin/events?${qs.toString()}`, { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) throw new Error(json?.message || 'Gagal mengekspor data.');
        all.push(...json.data.items);
        totalPages = json.data.pagination.totalPages;
        p += 1;
      } while (p <= totalPages && p <= 100);

      const headers = [
        'ID Pengajuan',
        'Judul Acara',
        'Genre',
        'Penyelenggara',
        'Email Penyelenggara',
        'Lokasi Venue',
        'Tanggal Pengajuan',
        'Tanggal Pelaksanaan',
        'Waktu',
        'Status',
      ];
      const rows = all.map((item) => [
        item.id,
        item.title,
        item.genre,
        item.organizer,
        item.organizerEmail,
        item.venue,
        dateLabel(item.submittedAt),
        dateLabel(item.startsAt),
        timeLabel(item.startsAt),
        GROUP_LABEL[item.group] ?? item.status,
      ]);
      exportToExcel('Gigspace_Antrean_Kurasi', headers, rows);
    } catch (err) {
      setActionError(err.message || 'Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 min-h-[calc(100vh-8rem)]">
      {/* Judul Section & Tombol Export Excel */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">Antrean Kurasi</h2>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isExporting || items.length === 0}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span>{isExporting ? 'Menyiapkan...' : 'Export Excel'}</span>
        </button>
      </div>

      {/* Alert Konfirmasi Aksi */}
      {feedbackMessage && <StatusAlert type="success" message={feedbackMessage} />}
      {!selectedEvent && actionError && <StatusAlert type="error" message={actionError} />}

      {/* 3 KARTU RINGKASAN KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Pending', value: counts.pending },
          { label: 'Disetujui', value: counts.approved },
          { label: 'Ditolak', value: counts.rejected },
        ].map((card) => (
          <div
            key={card.label}
            className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between"
          >
            <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">{card.label}</span>
            <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">{card.value}</span>
          </div>
        ))}
      </div>

      {/* BARIS FILTER TAB & SEARCH INPUT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div className="inline-flex flex-wrap items-stretch bg-[#FFE4F2] border-b-2 border-[#FF2E9A]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === 'Semua' ? totalAll : counts[tab.group];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                  isActive ? 'bg-[#FFB8DE] text-[#FF2E9A]' : 'text-[#FF2E9A]/85 hover:bg-[#FFD1E8]/60'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-64">
          <input
            type="text"
            placeholder="cari judul acara atau penyelenggara"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFE4F2] text-xs font-medium text-[#FF2E9A] placeholder-[#FF2E9A]/50 rounded-full pl-4 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40"
          />
          <svg
            className="w-4 h-4 stroke-[#FF2E9A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 20l-3.5-3.5" />
          </svg>
        </div>
      </div>

      {/* TABEL PENGAJUAN ACARA BARU */}
      {isLoading ? (
        <div className="space-y-2.5 animate-pulse" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-pink-100/60 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Tidak ada antrean kurasi"
          description="Belum ada pengajuan konser yang sesuai dengan filter atau pencarian saat ini."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-xs font-extrabold text-[#FF2E9A]">
                  <th className="py-3 px-3">Detail Acara</th>
                  <th className="py-3 px-3">Penyelenggara</th>
                  <th className="py-3 px-3">Tanggal Pengajuan</th>
                  <th className="py-3 px-3">Pelaksanaan</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF2E9A]/35 text-xs font-semibold text-[#FF2E9A]">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedEvent(item)}
                    title="Klik untuk meninjau detail acara & kurasi"
                    className="hover:bg-[#FFF0F6]/75 transition cursor-pointer group"
                  >
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-12 rounded-md overflow-hidden bg-black flex-shrink-0">
                          <Poster
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="font-extrabold text-[#FF2E9A] group-hover:underline">{item.title}</p>
                      </div>
                    </td>
                    <td className="py-4 px-3">{item.organizer}</td>
                    <td className="py-4 px-3">{dateLabel(item.submittedAt)}</td>
                    <td className="py-4 px-3">{dateLabel(item.startsAt)}</td>
                    <td className="py-4 px-3 text-right font-extrabold">
                      <span
                        className={
                          item.group === 'approved'
                            ? 'text-emerald-600'
                            : item.group === 'rejected'
                            ? 'text-rose-600'
                            : 'text-[#FF2E9A]'
                        }
                      >
                        {GROUP_LABEL[item.group] ?? item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs font-semibold text-gray-500">
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} acara)
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

      {/* MODAL / POP-UP DETAIL ACARA */}
      {selectedEvent && (
        <div onClick={closeModal} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-pink-100"
          >
            <div className="relative h-44 w-full bg-black">
              <Poster src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover opacity-85" />
              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup modal"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white font-bold text-sm flex items-center justify-center hover:bg-[#FF2E9A] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs sm:text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-pink-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF2E9A]/70">
                    {selectedEvent.id.slice(0, 8)} &bull; Genre {selectedEvent.genre}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#FF2E9A] mt-0.5">{selectedEvent.title}</h3>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">
                    Penyelenggara: {selectedEvent.organizer} ({selectedEvent.organizerEmail})
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFF0F6] text-[#FF2E9A] border border-pink-200">
                  Status: {GROUP_LABEL[selectedEvent.group] ?? selectedEvent.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FFF9FC] p-4 rounded-xl border border-pink-100">
                <div>
                  <p className="text-gray-400 font-semibold">Lokasi Venue</p>
                  <p className="font-bold text-[#1C1C1C] mt-0.5">{selectedEvent.venue}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold">Jadwal Pelaksanaan</p>
                  <p className="font-bold text-[#1C1C1C] mt-0.5">
                    {dateLabel(selectedEvent.startsAt)} &bull; {timeLabel(selectedEvent.startsAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-extrabold text-[#FF2E9A]">Deskripsi Konser</p>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{selectedEvent.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-extrabold text-[#FF2E9A]">Kategori Tiket Diajukan</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {selectedEvent.tickets.map((t, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#FFF0F6] border border-pink-100 text-xs">
                      <p className="font-extrabold text-[#FF2E9A]">{t.name}</p>
                      <p className="font-black text-[#1C1C1C] mt-0.5">{formatRupiah(t.price)}</p>
                      <p className="text-[11px] text-gray-500">Kuota: {t.quota} tiket</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEvent.group === 'rejected' && selectedEvent.rejectReason && (
                <div className="space-y-1.5">
                  <p className="text-xs font-extrabold text-rose-600">Alasan Penolakan</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{selectedEvent.rejectReason}</p>
                </div>
              )}

              {/* Keputusan hanya untuk pengajuan yang masih menunggu */}
              {selectedEvent.group === 'pending' && (
                <div className="pt-3 border-t border-pink-100 space-y-3">
                  {actionError && <StatusAlert type="error" message={actionError} />}

                  {!selectedEvent.image && (
                    <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Acara ini belum punya poster, jadi belum bisa disetujui. Tolak pengajuan agar EO melengkapinya.
                    </p>
                  )}

                  {isRejecting && (
                    <div className="space-y-1.5">
                      <label htmlFor="reject-reason" className="block text-xs font-bold text-gray-700">
                        Alasan penolakan (dikirim ke EO)
                      </label>
                      <textarea
                        id="reject-reason"
                        rows={3}
                        maxLength={500}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Contoh: Poster tidak jelas, mohon unggah ulang dengan resolusi lebih tinggi."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    {isRejecting ? (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            setIsRejecting(false);
                            setRejectReason('');
                            setActionError('');
                          }}
                          className="bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 text-xs font-bold px-5 py-2.5 rounded-lg transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDecision(selectedEvent, 'reject')}
                          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          {isProcessing ? 'Memproses...' : 'Kirim Penolakan'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            setIsRejecting(true);
                            setActionError('');
                          }}
                          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing || !selectedEvent.image}
                          onClick={() => handleDecision(selectedEvent, 'approve')}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          {isProcessing ? 'Memproses...' : 'Approve'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
