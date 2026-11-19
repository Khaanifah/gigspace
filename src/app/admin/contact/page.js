'use client';

import { useState } from 'react';
import { useApiData } from '@/lib/useApiData';
import { EmptyState, ErrorState, StatusAlert } from '@/components/shared/UIStates';

const PAGE_SIZE = 10;

const STATUS_LABEL = { NEW: 'Baru', READ: 'Dibaca', REPLIED: 'Dibalas' };
const STATUS_STYLE = {
  NEW: 'bg-[#FFE4F2] text-[#FF2E9A] border-[#FF2E9A]/40',
  READ: 'bg-gray-100 text-gray-600 border-gray-200',
  REPLIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  });
}

export default function AdminContactPage() {
  const [tab, setTab] = useState(''); // '' = semua
  const [onlyCooperation, setOnlyCooperation] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');

  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (tab) params.set('status', tab);
  if (onlyCooperation) params.set('subject', 'Kerjasama');
  if (query) params.set('q', query);

  const { data, error, isLoading, reload } = useApiData(`/api/admin/contact-messages?${params.toString()}`);
  const items = data?.items ?? [];
  const counts = data?.counts ?? { NEW: 0, READ: 0, REPLIED: 0 };
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalAll = counts.NEW + counts.READ + counts.REPLIED;

  const updateStatus = async (id, status) => {
    setBusyId(id);
    setActionError('');
    setFeedback('');
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Gagal memperbarui status.');
      setFeedback(`Pesan ditandai "${STATUS_LABEL[status]}".`);
      reload();
    } catch (err) {
      setActionError(err.message || 'Gagal memperbarui status.');
    } finally {
      setBusyId(null);
    }
  };

  const changeTab = (key) => {
    setTab(key);
    setPage(1);
    setOpenId(null);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setPage(1);
    setOpenId(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 min-h-[calc(100vh-8rem)]">
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">Pesan Kontak</h2>

      {feedback && <StatusAlert type="success" message={feedback} />}
      {actionError && <StatusAlert type="error" message={actionError} />}

      {/* Ringkasan per status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {['NEW', 'READ', 'REPLIED'].map((key) => (
          <div key={key} className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
            <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">{STATUS_LABEL[key]}</span>
            <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">{counts[key]}</span>
          </div>
        ))}
      </div>

      {/* Tab status, filter kerjasama, dan pencarian */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div className="inline-flex flex-wrap items-stretch bg-[#FFE4F2] border-b-2 border-[#FF2E9A]">
          {[
            { key: '', label: `Semua (${totalAll})` },
            { key: 'NEW', label: `Baru (${counts.NEW})` },
            { key: 'READ', label: `Dibaca (${counts.READ})` },
            { key: 'REPLIED', label: `Dibalas (${counts.REPLIED})` },
          ].map((item) => (
            <button
              key={item.key || 'all'}
              type="button"
              onClick={() => changeTab(item.key)}
              className={`px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                tab === item.key ? 'bg-[#FFB8DE] text-[#FF2E9A]' : 'text-[#FF2E9A]/85 hover:bg-[#FFD1E8]/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-[#FF2E9A] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCooperation}
              onChange={(e) => {
                setOnlyCooperation(e.target.checked);
                setPage(1);
                setOpenId(null);
              }}
              className="accent-[#FF2E9A]"
            />
            Hanya Kerjasama
          </label>
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, email, atau isi pesan"
              className="w-full lg:w-72 px-4 py-2 rounded-xl border border-pink-100 bg-[#FFF9FC] text-xs text-[#1C1C1C] placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40"
            />
            <button type="submit" className="bg-[#FF2E9A] hover:bg-pink-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition cursor-pointer">
              Cari
            </button>
          </form>
        </div>
      </div>

      {/* Daftar pesan */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Memuat pesan...</p>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada pesan" description="Pesan dari formulir Contact Us akan muncul di sini." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="border border-pink-100 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="w-full text-left px-5 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[#FFF9FC] transition cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-[#1C1C1C]">{item.name}</span>
                      {item.isCooperation && (
                        <span className="text-[10px] font-extrabold bg-[#FF2E9A] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Kerjasama
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {item.subject} · {item.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">{formatDate(item.createdAt)}</span>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${STATUS_STYLE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 space-y-4 border-t border-pink-100 bg-[#FFF9FC]">
                    <p className="text-sm text-[#1C1C1C] whitespace-pre-wrap leading-relaxed pt-3">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === item.id || item.status === 'READ'}
                        onClick={() => updateStatus(item.id, 'READ')}
                        className="text-xs font-bold px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:border-[#FF2E9A] hover:text-[#FF2E9A] disabled:opacity-50 transition cursor-pointer"
                      >
                        Tandai Dibaca
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id || item.status === 'REPLIED'}
                        onClick={() => updateStatus(item.id, 'REPLIED')}
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition cursor-pointer"
                      >
                        Tandai Dibalas
                      </button>
                      <a
                        href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`}
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-[#FF2E9A] hover:bg-pink-600 text-white transition"
                      >
                        Balas via Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-xs font-bold px-4 py-2 rounded-xl border border-pink-200 text-[#FF2E9A] disabled:opacity-40 cursor-pointer"
          >
            Sebelumnya
          </button>
          <span className="text-xs font-bold text-gray-500">
            Halaman {page} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs font-bold px-4 py-2 rounded-xl border border-pink-200 text-[#FF2E9A] disabled:opacity-40 cursor-pointer"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
