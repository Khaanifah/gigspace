'use client';

import { useState, useMemo } from 'react';
import { initialPaymentsData } from '@/lib/adminData';
import { EmptyState, StatusAlert } from '@/components/shared/UIStates';
import { exportToExcel } from '@/lib/exportExcel';

export default function AdminPaymentsPage() {
  const [paymentsList, setPaymentsList] = useState(initialPaymentsData);
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua' | 'Menunggu Verifikasi' | 'Lunas' | 'Ditolak'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Hitung statistik KPI secara dinamis
  const stats = useMemo(() => {
    return {
      pending: paymentsList.filter((item) => item.status === 'Menunggu Verifikasi').length,
      paid: paymentsList.filter((item) => item.status === 'Lunas').length,
      rejected: paymentsList.filter((item) => item.status === 'Ditolak').length,
    };
  }, [paymentsList]);

  // Filter berdasarkan Tab & Search
  const filteredList = useMemo(() => {
    return paymentsList.filter((item) => {
      const matchesTab =
        activeTab === 'Semua' ? true : item.status === activeTab;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.id.toLowerCase().includes(q) ||
        item.buyerName.toLowerCase().includes(q) ||
        item.eventTitle.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [paymentsList, activeTab, searchQuery]);

  // Aksi Konfirmasi Lunas & Tolak Bukti
  const handleVerifyPayment = (trxId, newStatus) => {
    setPaymentsList((prev) =>
      prev.map((item) =>
        item.id === trxId ? { ...item, status: newStatus } : item
      )
    );
    setSelectedTrx(null);
    setIsZoomed(false);
    setFeedbackMessage(
      newStatus === 'Lunas'
        ? `Transaksi ${trxId} berhasil dikonfirmasi Lunas. E-Ticket otomatis diterbitkan ke pembeli.`
        : `Bukti pembayaran untuk transaksi ${trxId} telah ditolak.`
    );
    setTimeout(() => setFeedbackMessage(''), 4000);
  };

  // Export ke Excel
  const handleExportExcel = () => {
    const headers = [
      'ID Transaksi',
      'Waktu Pengajuan',
      'Nama Pembeli',
      'Email Pembeli',
      'Judul Konser',
      'Rincian Tiket',
      'Metode Pembayaran',
      'Total Tagihan (IDR)',
      'Status',
    ];

    const rows = filteredList.map((trx) => [
      trx.id,
      trx.submittedAt,
      trx.buyerName,
      trx.buyerEmail,
      trx.eventTitle,
      trx.ticketSummary,
      trx.paymentMethod,
      trx.totalAmount,
      trx.status,
    ]);

    exportToExcel('Gigspace_Verifikasi_Pembayaran', headers, rows);
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
          Verifikasi Pembayaran
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
            Menunggu Verifikasi
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {stats.pending}
          </span>
        </div>

        <div className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">
            Lunas
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {stats.paid}
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
            { key: 'Semua', label: `Semua Transaksi (${paymentsList.length})` },
            { key: 'Menunggu Verifikasi', label: `Tertunda (${stats.pending})` },
            { key: 'Lunas', label: `Lunas (${stats.paid})` },
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

        <div className="relative w-full lg:w-72">
          <input
            type="text"
            placeholder="cari ID transaksi, pembeli, konser"
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

      {/* TABEL TRANSAKSI TERTUNDA */}
      {filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi ditemukan"
          description="Belum ada transaksi pembayaran yang sesuai dengan filter atau pencarian saat ini."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="text-xs font-extrabold text-[#FF2E9A]">
                <th className="py-3 px-3">ID &amp; Waktu</th>
                <th className="py-3 px-3">Pembeli</th>
                <th className="py-3 px-3">Acara &amp; Tiket</th>
                <th className="py-3 px-3">Metode &amp; Total</th>
                <th className="py-3 px-3 text-right">Status &amp; Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF2E9A]/35 text-xs font-semibold text-[#FF2E9A]">
              {filteredList.map((trx) => (
                <tr
                  key={trx.id}
                  onClick={() => {
                    setSelectedTrx(trx);
                    setIsZoomed(false);
                  }}
                  title="Klik untuk mengecek foto bukti transfer"
                  className="hover:bg-[#FFF0F6]/75 transition cursor-pointer group"
                >
                  <td className="py-4 px-3">
                    <p className="font-extrabold text-[#FF2E9A] group-hover:underline">
                      {trx.id}
                    </p>
                    <p className="text-[11px] font-medium text-[#FF2E9A]/70 mt-0.5">
                      {trx.submittedAt}
                    </p>
                  </td>
                  <td className="py-4 px-3">
                    <p className="font-bold text-[#1C1C1C]">{trx.buyerName}</p>
                    <p className="text-[11px] font-medium text-gray-500">
                      {trx.buyerEmail}
                    </p>
                  </td>
                  <td className="py-4 px-3">
                    <p className="font-extrabold text-[#FF2E9A]">
                      {trx.eventTitle}
                    </p>
                    <p className="text-[11px] font-medium text-[#FF2E9A]/75">
                      {trx.ticketSummary}
                    </p>
                  </td>
                  <td className="py-4 px-3">
                    <p className="font-black text-[#1C1C1C]">
                      {formatRupiah(trx.totalAmount)}
                    </p>
                    <p className="text-[11px] font-medium text-gray-500">
                      {trx.paymentMethod}
                    </p>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="inline-flex flex-col items-end gap-1">
                      <span
                        className={`font-extrabold ${
                          trx.status === 'Lunas'
                            ? 'text-emerald-600'
                            : trx.status === 'Ditolak'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {trx.status}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF0F6] text-[#FF2E9A] border border-pink-200 group-hover:bg-[#FF2E9A] group-hover:text-white transition">
                        Cek Bukti Transfer
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL PRATINJAU BUKTI TRANSFER */}
      {selectedTrx && (
        <div
          onClick={() => setSelectedTrx(null)}
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-pink-100 grid grid-cols-1 md:grid-cols-12"
          >
            <div className="md:col-span-6 bg-[#141414] p-4 flex flex-col justify-between relative min-h-[280px]">
              <div className="flex items-center justify-between text-white/80 text-[11px] font-bold pb-2">
                <span>Pratinjau Bukti Transfer</span>
                <button
                  type="button"
                  onClick={() => setIsZoomed((prev) => !prev)}
                  className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-[#FF2E9A] text-white transition cursor-pointer"
                >
                  {isZoomed ? 'Perkecil (-)' : 'Perbesar (+)'}
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center overflow-auto rounded-xl bg-black/50 p-2">
                <img
                  src={selectedTrx.proofImage}
                  alt={`Bukti Transfer ${selectedTrx.id}`}
                  onClick={() => setIsZoomed((prev) => !prev)}
                  className={`rounded-lg transition-transform duration-200 cursor-zoom-in ${
                    isZoomed
                      ? 'scale-150 cursor-zoom-out'
                      : 'max-h-72 w-auto object-contain'
                  }`}
                />
              </div>

              <p className="text-[10px] text-white/60 text-center pt-2">
                Klik gambar untuk memperbesar / memperkecil
              </p>
            </div>

            <div className="md:col-span-6 p-6 flex flex-col justify-between space-y-5 text-xs">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-pink-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#FF2E9A]/70">
                      {selectedTrx.id}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#FF2E9A]">
                      {selectedTrx.eventTitle}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {selectedTrx.submittedAt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTrx(null)}
                    aria-label="Tutup modal"
                    className="w-7 h-7 rounded-full bg-[#FFF0F6] text-[#FF2E9A] font-bold flex items-center justify-center hover:bg-[#FF2E9A] hover:text-white transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 bg-[#FFF9FC] p-4 rounded-xl border border-pink-100">
                  <div>
                    <p className="text-gray-400 font-semibold">Nama Pembeli</p>
                    <p className="font-bold text-[#1C1C1C]">
                      {selectedTrx.buyerName} ({selectedTrx.buyerEmail})
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-semibold">Kategori Tiket</p>
                    <p className="font-bold text-[#1C1C1C]">
                      {selectedTrx.ticketSummary}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-semibold">Metode Pembayaran</p>
                    <p className="font-bold text-[#1C1C1C]">
                      {selectedTrx.paymentMethod}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-pink-100 flex items-center justify-between">
                    <span className="font-extrabold text-[#FF2E9A]">
                      Total Tagihan
                    </span>
                    <span className="text-base font-black text-[#FF2E9A]">
                      {formatRupiah(selectedTrx.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-pink-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleVerifyPayment(selectedTrx.id, 'Ditolak')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                >
                  Tolak Bukti
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyPayment(selectedTrx.id, 'Lunas')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                >
                  Konfirmasi Lunas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}