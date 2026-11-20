'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApiData } from '@/lib/useApiData';
import { EmptyState, ErrorState, StatusAlert } from '@/components/shared/UIStates';
import { exportToExcel } from '@/lib/exportExcel';

// Peran yang didukung backend: ADMIN, ORGANIZER (EO), USER (Pembeli).
const ROLE_OPTIONS = ['Admin', 'EO', 'Pembeli'];
const ROLE_TO_API = { Admin: 'ADMIN', EO: 'ORGANIZER', Pembeli: 'USER' };
const ROLE_LABEL = { ADMIN: 'Admin', ORGANIZER: 'EO', USER: 'Pembeli' };
const PAGE_SIZE = 20;

// Mengubah data API ke bentuk yang dipakai tabel di halaman ini.
function toRow(u) {
  return {
    id: u.id.slice(0, 8).toUpperCase(), // tampilan singkat; ID penuh ada di `uuid`
    uuid: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: ROLE_LABEL[u.role] ?? u.role,
    joinedAt: new Date(u.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }),
    status: u.isActive ? 'Aktif' : 'Nonaktif',
  };
}

export default function AdminUsersPage() {
  const [activeRoleTab, setActiveRoleTab] = useState('Semua'); // 'Semua' | 'Admin' | 'EO' | 'Pembeli'
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Pencarian ditunda 350 ms supaya server tidak dipanggil di setiap ketukan
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedQuery(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Daftar pengguna dari database; filter role, pencarian, dan halaman diproses di server
  const listParams = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (activeRoleTab !== 'Semua') listParams.set('role', ROLE_TO_API[activeRoleTab]);
  if (appliedQuery) listParams.set('q', appliedQuery);
  const { data, error, isLoading, reload } = useApiData(`/api/admin/users?${listParams.toString()}`);

  const usersList = useMemo(() => (data?.items ?? []).map(toRow), [data]);
  const filteredUsers = usersList;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const counts = data?.counts ?? { USER: 0, ORGANIZER: 0, ADMIN: 0 };
  const totalUsers = counts.USER + counts.ORGANIZER + counts.ADMIN;
  const roleStats = { admin: counts.ADMIN, eo: counts.ORGANIZER, pembeli: counts.USER };

  // Ubah role / status akun: server yang memutuskan (aturan admin terakhir, tidak boleh mengubah diri sendiri)
  const patchUser = async (user, body, successMessage) => {
    setBusyId(user.uuid);
    setActionError('');
    setFeedbackMessage('');
    try {
      const res = await fetch(`/api/admin/users/${user.uuid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Gagal memperbarui pengguna.');
      }
      setFeedbackMessage(successMessage);
      setTimeout(() => setFeedbackMessage(''), 3500);
      reload();
    } catch (err) {
      setActionError(err.message || 'Gagal memperbarui pengguna.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = (user, newRole) =>
    patchUser(user, { role: ROLE_TO_API[newRole] }, `Role ${user.name} berhasil diperbarui menjadi ${newRole}.`);

  const handleToggleStatus = (user) =>
    patchUser(user, { isActive: user.status !== 'Aktif' }, `Status akun ${user.name} berhasil diubah.`);

  // Export ke Excel
  const handleExportExcel = () => {
    const headers = [
      'ID User',
      'Nama Lengkap',
      'Email',
      'Nomor Telepon',
      'Role',
      'Tanggal Bergabung',
      'Status Akun',
    ];

    const rows = filteredUsers.map((u) => [
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,
      u.joinedAt,
      u.status,
    ]);

    exportToExcel('Gigspace_Manajemen_Pengguna', headers, rows);
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-[#FF2E9A] text-white border-[#FF2E9A]';
      case 'EO':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-[#FFF0F6] text-[#FF2E9A] border-pink-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 min-h-[calc(100vh-8rem)]">
      
      {/* Judul Section & Tombol Export Excel */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">
          Manajemen Pengguna
        </h2>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={filteredUsers.length === 0}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span>Export Excel</span>
        </button>
      </div>

      {/* Alert Konfirmasi Perubahan */}
      {feedbackMessage && (
        <StatusAlert type="success" message={feedbackMessage} />
      )}
      {actionError && <StatusAlert type="error" message={actionError} />}

      {/* KARTU RINGKASAN PER ROLE (BERBINGKAI PINK) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">
            Admin
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {roleStats.admin}
          </span>
        </div>

        <div className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">
            EO
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {roleStats.eo}
          </span>
        </div>

        <div className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">
            Pembeli
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {roleStats.pembeli}
          </span>
        </div>

      </div>

      {/* BARIS FILTER TAB ROLE & SEARCH INPUT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div className="inline-flex flex-wrap items-stretch bg-[#FFE4F2] border-b-2 border-[#FF2E9A]">
          {[
            { key: 'Semua', label: `Semua User (${totalUsers})` },
            { key: 'Admin', label: `Admin (${roleStats.admin})` },
            { key: 'EO', label: `EO (${roleStats.eo})` },
            { key: 'Pembeli', label: `Pembeli (${roleStats.pembeli})` },
          ].map((tab) => {
            const isActive = activeRoleTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveRoleTab(tab.key);
                  setPage(1);
                }}
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
            placeholder="cari nama atau email"
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

      {/* TABEL DAFTAR USER */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Memuat pengguna...</p>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title="Pengguna tidak ditemukan"
          description="Tidak ada akun pengguna yang cocok dengan filter role atau kata kunci pencarian."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="text-xs font-extrabold text-[#FF2E9A]">
                <th className="py-3 px-3">Pengguna</th>
                <th className="py-3 px-3">Kontak</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Tanggal Bergabung</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Ubah Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF2E9A]/35 text-xs font-semibold text-[#FF2E9A]">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#FFF0F6]/75 transition"
                >
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#FFE4F2] text-[#FF2E9A] font-black flex items-center justify-center flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#1C1C1C]">
                          {user.name}
                        </p>
                        <p className="text-[11px] font-medium text-[#FF2E9A]/70">
                          {user.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <p className="font-bold text-[#1C1C1C]">{user.email}</p>
                    <p className="text-[11px] font-medium text-gray-500">
                      {user.phone}
                    </p>
                  </td>
                  <td className="py-4 px-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border ${getRoleBadgeStyle(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-[#FF2E9A]">{user.joinedAt}</td>
                  <td className="py-4 px-3">
                    <button
                      type="button"
                      disabled={busyId === user.uuid}
                      onClick={() => handleToggleStatus(user)}
                      title="Klik untuk mengaktifkan / menonaktifkan akun"
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition ${
                        user.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <select
                      value={user.role}
                      disabled={busyId === user.uuid}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      aria-label={`Ubah role ${user.name}`}
                      className="bg-[#FFF0F6] border border-pink-200 text-[#FF2E9A] text-xs font-extrabold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/40 cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((roleOpt) => (
                        <option key={roleOpt} value={roleOpt}>
                          {roleOpt}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Halaman */}
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