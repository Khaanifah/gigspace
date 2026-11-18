'use client';

import { useState, useMemo } from 'react';
import { initialUsersData } from '@/lib/adminData';
import { EmptyState, StatusAlert } from '@/components/shared/UIStates';
import { exportToExcel } from '@/lib/exportExcel';

const ROLE_OPTIONS = ['Admin', 'EO', 'Pembeli', 'Petugas'];

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState(initialUsersData);
  const [activeRoleTab, setActiveRoleTab] = useState('Semua'); // 'Semua' | 'Admin' | 'EO' | 'Pembeli' | 'Petugas'
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Hitung statistik per Role secara dinamis
  const roleStats = useMemo(() => {
    return {
      admin: usersList.filter((u) => u.role === 'Admin').length,
      eo: usersList.filter((u) => u.role === 'EO').length,
      pembeli: usersList.filter((u) => u.role === 'Pembeli').length,
      petugas: usersList.filter((u) => u.role === 'Petugas').length,
    };
  }, [usersList]);

  // Filter berdasarkan Tab Role & Search
  const filteredUsers = useMemo(() => {
    return usersList.filter((user) => {
      const matchesRole =
        activeRoleTab === 'Semua' ? true : user.role === activeRoleTab;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q);

      return matchesRole && matchesSearch;
    });
  }, [usersList, activeRoleTab, searchQuery]);

  // Ubah Role User
  const handleRoleChange = (userId, newRole) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setFeedbackMessage(`Role pengguna ${userId} berhasil diperbarui menjadi ${newRole}.`);
    setTimeout(() => setFeedbackMessage(''), 3500);
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = (userId) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
          : u
      )
    );
    setFeedbackMessage(`Status akun pengguna ${userId} berhasil diubah.`);
    setTimeout(() => setFeedbackMessage(''), 3500);
  };

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
      case 'Petugas':
        return 'bg-amber-100 text-amber-800 border-amber-200';
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

      {/* 4 KARTU RINGKASAN PER ROLE (BERBINGKAI PINK) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

        <div className="border border-[#FF2E9A]/60 rounded-2xl px-6 py-5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#FF2E9A]">
            Petugas
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF2E9A]">
            {roleStats.petugas}
          </span>
        </div>
      </div>

      {/* BARIS FILTER TAB ROLE & SEARCH INPUT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div className="inline-flex flex-wrap items-stretch bg-[#FFE4F2] border-b-2 border-[#FF2E9A]">
          {[
            { key: 'Semua', label: `Semua User (${usersList.length})` },
            { key: 'Admin', label: `Admin (${roleStats.admin})` },
            { key: 'EO', label: `EO (${roleStats.eo})` },
            { key: 'Pembeli', label: `Pembeli (${roleStats.pembeli})` },
            { key: 'Petugas', label: `Petugas (${roleStats.petugas})` },
          ].map((tab) => {
            const isActive = activeRoleTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveRoleTab(tab.key)}
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
            placeholder="cari nama, email, atau ID user"
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
      {filteredUsers.length === 0 ? (
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
                      onClick={() => handleToggleStatus(user.id)}
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
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
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
    </div>
  );
}