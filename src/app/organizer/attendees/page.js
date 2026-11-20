'use client';

import { useState, useMemo } from 'react';
import { initialAttendeesData } from '@/lib/organizerData';

export default function AttendeeListPage() {
  const [attendees, setAttendees] = useState(initialAttendeesData);
  const [filterStatus, setFilterStatus] = useState('Semua'); // 'Semua' | 'Sudah Masuk' | 'Belum'
  const [search, setSearch] = useState('');

  const filteredAttendees = useMemo(() => {
    return attendees.filter((att) => {
      const statusLabel = att.checkedIn ? 'Sudah Masuk' : 'Belum';
      const matchesStatus =
        filterStatus === 'Semua' ? true : statusLabel === filterStatus;
      const q = search.toLowerCase();
      const matchesSearch =
        att.buyerName.toLowerCase().includes(q) ||
        att.ticketCode.toLowerCase().includes(q) ||
        att.ticketType.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [attendees, filterStatus, search]);

  const toggleCheckIn = (id) => {
    setAttendees((prev) =>
      prev.map((att) =>
        att.id === id ? { ...att, checkedIn: !att.checkedIn } : att
      )
    );
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">
            Data Penonton
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Daftar pembeli tiket, kategori tiket, dan status masuk di pintu venue.
          </p>
        </div>

        <div className="text-xs font-extrabold text-[#FF2E9A] bg-[#FFF0F6] border border-pink-200 px-4 py-2 rounded-xl">
          Masuk: {attendees.filter((a) => a.checkedIn).length} / {attendees.length}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap bg-[#FFE4F2] rounded-xl p-1 gap-1">
          {['Semua', 'Sudah Masuk', 'Belum'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#FF2E9A] text-white'
                  : 'text-[#FF2E9A] hover:bg-[#FFD1E8]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama penonton atau kode tiket..."
          className="w-full sm:w-64 bg-[#FFF9FC] border border-pink-200 text-xs px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35"
        />
      </div>

      {/* Tabel Penonton */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-pink-100 text-xs font-extrabold text-[#FF2E9A]">
              <th className="py-3 px-3">Nama Pembeli</th>
              <th className="py-3 px-3">Kode Tiket</th>
              <th className="py-3 px-3">Jenis Tiket</th>
              <th className="py-3 px-3">Status Check-in</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100/80 text-xs">
            {filteredAttendees.map((att) => (
              <tr key={att.id} className="hover:bg-[#FFF9FC] transition">
                <td className="py-4 px-3 font-extrabold text-[#1C1C1C]">
                  {att.buyerName}
                </td>
                <td className="py-4 px-3 font-mono font-bold text-[#FF2E9A]">
                  {att.ticketCode}
                </td>
                <td className="py-4 px-3 font-semibold text-gray-700">
                  {att.ticketType}
                </td>
                <td className="py-4 px-3">
                  {att.checkedIn ? (
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Sudah Masuk
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      Belum
                    </span>
                  )}
                </td>
                <td className="py-4 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleCheckIn(att.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#FFF0F6] hover:bg-[#FFE4F2] text-[#FF2E9A] text-[11px] font-extrabold transition cursor-pointer"
                  >
                    {att.checkedIn ? 'Batalkan Masuk' : 'Tandai Masuk'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}