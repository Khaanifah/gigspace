'use client';

import { useState, useMemo } from 'react';
import { initialCurationData } from '@/lib/adminData';
import { EmptyState, StatusAlert } from '@/components/shared/UIStates';
import { exportToExcel } from '@/lib/exportExcel';

export default function AdminCurationPage() {
  const [curationList, setCurationList] = useState(initialCurationData);
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua' | 'Pending' | 'Disetujui' | 'Ditolak'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Hitung statistik KPI secara dinamis
  const stats = useMemo(() => {
    return {
      pending: curationList.filter((item) => item.status === 'Pending').length,
      approved: curationList.filter((item) => item.status === 'Disetujui').length,
      rejected: curationList.filter((item) => item.status === 'Ditolak').length,
    };
  }, [curationList]);

  // Filter berdasarkan Tab & Search
  const filteredList = useMemo(() => {
    return curationList.filter((item) => {
      const matchesTab =
        activeTab === 'Semua' ? true : item.status === activeTab;

      const matchesSearch =
        item.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.organizer.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [curationList, activeTab, searchQuery]);

  // Aksi Approve (Hijau) & Reject (Merah)
  const handleDecision = (eventId, decision) => {
    setCurationList((prev) =>
      prev.map((item) =>
        item.id === eventId ? { ...item, status: decision } : item
      )
    );
    setSelectedEvent(null);
    setFeedbackMessage(
      decision === 'Disetujui'
        ? 'Pengajuan konser berhasil disetujui (Approved) dan siap dipublikasikan.'
        : 'Pengajuan konser telah ditolak (Rejected).'
    );
    setTimeout(() => setFeedbackMessage(''), 4000);
  };

  // Export ke Excel
  const handleExportExcel = () => {
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

    const rows = filteredList.map((item) => [
      item.id,
      item.eventTitle,
      item.genre,
      item.organizer,
      item.organizerEmail,
      item.location,
      item.submissionDate,
      item.eventDate,
      item.eventTime,
      item.status,
    ]);

    exportToExcel('Gigspace_Antrean_Kurasi', headers, rows);
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    })
      .format(amount || 0)
      .replace('IDR', 'Rp');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 min-h-[calc(100vh-8rem)]">
      
      {/* Judul Section & Tombol Export Excel */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">
          Antrean Kurasi
        </h2>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={filteredList.length === 0}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span>Export Excel</span>
        </button>
      </div>

      {/* Alert Konfirmasi Aksi */}
      {feedbackMessage && (
        <StatusAlert type="success" message={feedbackMessage} />
      )}

      {/* 3 KARTU RINGKASAN KPI (BERBINGKAI PINK) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">
            Pending
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {stats.pending}
          </span>
        </div>

        <div className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">
            Disetujui
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {stats.approved}
          </span>
        </div>

        <div className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">
            Ditolak
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {stats.rejected}
          </span>
        </div>
      </div>

      {/* BARIS FILTER TAB & SEARCH INPUT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div className="inline-flex flex-wrap items-stretch bg-[#FFE4F2] border-b-2 border-[#FF2E9A]">
          {[
            { key: 'Semua', label: `Semua Antrean (${curationList.length})` },
            { key: 'Pending', label: `Pending (${stats.pending})` },
            { key: 'Disetujui', label: `Disetujui (${stats.approved})` },
            { key: 'Ditolak', label: `Ditolak (${stats.rejected})` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#FFB8DE] text-[#FF2E9A]'
                    : 'text-[#FF2E9A]/85 hover:bg-[#FFD1E8]/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-64">
          <input
            type="text"
            placeholder="cari nama antrean"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 20l-3.5-3.5"
            />
          </svg>
        </div>
      </div>

      {/* TABEL PENGAJUAN ACARA BARU */}
      {filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada antrean kurasi"
          description="Belum ada pengajuan konser yang sesuai dengan filter atau pencarian saat ini."
        />
      ) : (
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
              {filteredList.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedEvent(item)}
                  title="Klik untuk meninjau detail acara & kurasi"
                  className="hover:bg-[#FFF0F6]/75 transition cursor-pointer group"
                >
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-12 rounded-md overflow-hidden bg-black flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.eventTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="font-extrabold text-[#FF2E9A] group-hover:underline">
                        {item.eventTitle}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-3">{item.organizer}</td>
                  <td className="py-4 px-3">{item.submissionDate}</td>
                  <td className="py-4 px-3">{item.eventDate}</td>
                  <td className="py-4 px-3 text-right font-extrabold">
                    <span
                      className={
                        item.status === 'Disetujui'
                          ? 'text-emerald-600'
                          : item.status === 'Ditolak'
                          ? 'text-rose-600'
                          : 'text-[#FF2E9A]'
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL / POP-UP DETAIL ACARA */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-pink-100"
          >
            <div className="relative h-44 w-full bg-black">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.eventTitle}
                className="w-full h-full object-cover opacity-85"
              />
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
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
                    {selectedEvent.id} &bull; Genre {selectedEvent.genre}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#FF2E9A] mt-0.5">
                    {selectedEvent.eventTitle}
                  </h3>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">
                    Penyelenggara: {selectedEvent.organizer} ({selectedEvent.organizerEmail})
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFF0F6] text-[#FF2E9A] border border-pink-200">
                  Status: {selectedEvent.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FFF9FC] p-4 rounded-xl border border-pink-100">
                <div>
                  <p className="text-gray-400 font-semibold">Lokasi Venue</p>
                  <p className="font-bold text-[#1C1C1C] mt-0.5">
                    {selectedEvent.location}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold">Jadwal Pelaksanaan</p>
                  <p className="font-bold text-[#1C1C1C] mt-0.5">
                    {selectedEvent.eventDate} &bull; {selectedEvent.eventTime}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-extrabold text-[#FF2E9A]">
                  Deskripsi Konser
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-extrabold text-[#FF2E9A]">
                  Kategori Tiket Diajukan
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {selectedEvent.tickets.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FFF0F6] border border-pink-100 text-xs"
                    >
                      <p className="font-extrabold text-[#FF2E9A]">{t.name}</p>
                      <p className="font-black text-[#1C1C1C] mt-0.5">
                        {formatRupiah(t.price)}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Kuota: {t.quota} tiket
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-pink-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision(selectedEvent.id, 'Ditolak')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(selectedEvent.id, 'Disetujui')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}