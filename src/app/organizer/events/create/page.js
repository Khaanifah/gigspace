'use client';

import { useState, useRef } from 'react';
import { StatusAlert } from '@/components/shared/UIStates';

export default function CreateEventPage() {
  const posterInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [posterPreview, setPosterPreview] = useState(null);
  const [posterName, setPosterName] = useState('');

  const [ticketRows, setTicketRows] = useState([
    { id: 1, name: 'Regular', price: '', quota: '' },
  ]);
  const [submittedAlert, setSubmittedAlert] = useState('');

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPosterPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const addTicketRow = () => {
    setTicketRows((prev) => [
      ...prev,
      { id: Date.now(), name: '', price: '', quota: '' },
    ]);
  };

  const removeTicketRow = (id) => {
    if (ticketRows.length === 1) return;
    setTicketRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateTicketRow = (id, field, value) => {
    setTicketRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedAlert(
      `Acara "${title || 'Acara Baru'}" dengan ${ticketRows.length} kategori tiket berhasil diajukan ke antrean kurasi (Status: Pending).`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xs max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">
          Buat Acara Baru
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Lengkapi informasi konser, unggah poster, dan atur kategori tiket yang dijual.
        </p>
      </div>

      {submittedAlert && (
        <StatusAlert type="success" message={submittedAlert} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Acara */}
        <div className="space-y-4 border border-pink-100 bg-[#FFF9FC] rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-[#FF2E9A]">
            Informasi Acara
          </h2>

          <div className="space-y-1.5">
            <label htmlFor="event-title" className="block text-xs font-bold text-gray-700">
              Judul Acara
            </label>
            <input
              id="event-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Indie Groove Festival 2026"
              className="w-full bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35 focus:border-[#FF2E9A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="event-date" className="block text-xs font-bold text-gray-700">
                Tanggal Pelaksanaan
              </label>
              <input
                id="event-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35 focus:border-[#FF2E9A]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="event-location" className="block text-xs font-bold text-gray-700">
                Lokasi Venue
              </label>
              <input
                id="event-location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Taman Budaya Raden Saleh, Semarang"
                className="w-full bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35 focus:border-[#FF2E9A]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="event-desc" className="block text-xs font-bold text-gray-700">
              Deskripsi Singkat
            </label>
            <textarea
              id="event-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan line-up, rundown singkat, atau ketentuan acara..."
              className="w-full bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35 focus:border-[#FF2E9A]"
            />
          </div>
        </div>

        {/* Unggah Poster Acara */}
        <div className="space-y-3 border border-pink-100 bg-[#FFF9FC] rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-[#FF2E9A]">
            Unggah Poster Acara
          </h2>

          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            onChange={handlePosterChange}
            className="hidden"
          />

          <div
            onClick={() => posterInputRef.current?.click()}
            className="border-2 border-dashed border-pink-200 hover:border-[#FF2E9A] bg-white rounded-2xl p-6 text-center cursor-pointer transition space-y-3"
          >
            {posterPreview ? (
              <div className="space-y-2">
                <img
                  src={posterPreview}
                  alt="Preview Poster"
                  className="max-h-60 mx-auto rounded-xl object-contain"
                />
                <p className="text-xs font-bold text-[#FF2E9A]">{posterName}</p>
                <p className="text-[11px] text-gray-500">Klik untuk mengganti poster</p>
              </div>
            ) : (
              <div className="space-y-1.5 py-4">
                <p className="text-xs sm:text-sm font-extrabold text-[#FF2E9A]">
                  Klik untuk memilih file poster (JPG / PNG / WEBP)
                </p>
                <p className="text-[11px] text-gray-500">
                  Disarankan rasio portrait atau 16:9 dengan resolusi jelas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Kategori Tiket */}
        <div className="space-y-4 border border-pink-100 bg-[#FFF9FC] rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-[#FF2E9A]">
              Kategori Tiket
            </h2>
            <button
              type="button"
              onClick={addTicketRow}
              className="bg-[#FFF0F6] hover:bg-[#FFE4F2] text-[#FF2E9A] border border-pink-200 text-xs font-extrabold px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              + Tambah Kategori Tiket
            </button>
          </div>

          <div className="space-y-3">
            {ticketRows.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-3.5 rounded-xl border border-pink-100 items-end"
              >
                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-[11px] font-bold text-gray-600">
                    Nama Tiket #{index + 1}
                  </label>
                  <input
                    type="text"
                    required
                    value={row.name}
                    onChange={(e) => updateTicketRow(row.id, 'name', e.target.value)}
                    placeholder="VIP / Festival / Early Bird"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#FF2E9A]"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[11px] font-bold text-gray-600">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={row.price}
                    onChange={(e) => updateTicketRow(row.id, 'price', e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#FF2E9A]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-gray-600">
                    Kuota
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={row.quota}
                    onChange={(e) => updateTicketRow(row.id, 'quota', e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#FF2E9A]"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    disabled={ticketRows.length === 1}
                    onClick={() => removeTicketRow(row.id)}
                    className="w-full sm:w-auto px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-600 text-xs font-bold transition cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto bg-[#FF2E9A] hover:bg-pink-600 text-white text-xs sm:text-sm font-extrabold px-7 py-3 rounded-xl transition shadow-xs cursor-pointer"
          >
            Ajukan Acara
          </button>
        </div>
      </form>
    </div>
  );
}