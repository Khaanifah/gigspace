'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { StatusAlert } from '@/components/shared/UIStates';

const MAX_POSTER_BYTES = 5 * 1024 * 1024;
const INPUT_CLASS =
  'w-full bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E9A]/35 focus:border-[#FF2E9A]';

const emptyTicketRow = (id) => ({ id, name: '', price: '', quota: '' });

async function postPoster(eventId, file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/organizer/events/${eventId}/poster`, { method: 'POST', body: form });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.message || 'Gagal mengunggah poster.');
}

export default function CreateEventPage() {
  const posterInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [genreId, setGenreId] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [poster, setPoster] = useState(null); // File
  const [posterPreview, setPosterPreview] = useState(null);
  const [ticketRows, setTicketRows] = useState([{ ...emptyTicketRow(1), name: 'Regular' }]);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Setelah acara tercatat di server: { id, title, posterDone, posterError }
  const [created, setCreated] = useState(null);

  const { data: genreData, error: genreError } = useApiData('/api/genres');
  const { data: venueData } = useApiData('/api/venues');
  const genres = genreData?.items ?? [];
  const venues = venueData?.items ?? [];

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFormError('Poster harus berupa gambar JPG atau PNG.');
      return;
    }
    if (file.size > MAX_POSTER_BYTES) {
      setFormError('Ukuran poster maksimal 5 MB.');
      return;
    }
    setFormError('');
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPoster(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  // Memilih venue yang sudah ada mengisi kota otomatis
  const handleVenueNameChange = (value) => {
    setVenueName(value);
    const match = venues.find((v) => v.name.toLowerCase() === value.trim().toLowerCase());
    if (match && !venueCity) setVenueCity(match.city);
  };

  const addTicketRow = () => setTicketRows((prev) => [...prev, emptyTicketRow(Date.now())]);

  const removeTicketRow = (id) => {
    if (ticketRows.length === 1) return;
    setTicketRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateTicketRow = (id, field, value) => {
    setTicketRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const resetForm = () => {
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setTitle('');
    setGenreId('');
    setVenueName('');
    setVenueCity('');
    setStartsAt('');
    setEndsAt('');
    setDescription('');
    setTerms('');
    setPoster(null);
    setPosterPreview(null);
    setTicketRows([{ ...emptyTicketRow(1), name: 'Regular' }]);
    setFormError('');
    setCreated(null);
    if (posterInputRef.current) posterInputRef.current.value = '';
  };

  const retryPoster = async () => {
    if (!created || !poster) return;
    setIsSubmitting(true);
    try {
      await postPoster(created.id, poster);
      setCreated({ ...created, posterDone: true, posterError: '' });
    } catch (err) {
      setCreated({ ...created, posterError: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!poster) {
      setFormError('Poster acara wajib diunggah.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        genreId,
        venue: { name: venueName, city: venueCity },
        description,
        ...(terms.trim() ? { terms } : {}),
        startsAt: new Date(startsAt).toISOString(),
        ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
        ticketTypes: ticketRows.map((r) => ({ name: r.name, price: Number(r.price), quota: Number(r.quota) })),
      };

      const res = await fetch('/api/organizer/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Gagal mengajukan acara.');

      const event = json.data.event;
      try {
        await postPoster(event.id, poster);
        setCreated({ id: event.id, title: event.title, posterDone: true, posterError: '' });
      } catch (posterErr) {
        // Acara sudah tercatat; hanya poster yang gagal. Pengguna bisa mengulang tanpa membuat acara ganda.
        setCreated({ id: event.id, title: event.title, posterDone: false, posterError: posterErr.message });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err.message || 'Gagal mengajukan acara.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───────── Layar hasil setelah acara tercatat ─────────
  if (created) {
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xs max-w-4xl mx-auto space-y-5">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">Pengajuan Acara</h1>

        <StatusAlert
          type="success"
          message={`Acara "${created.title}" masuk antrean kurasi (status Pending). Kamu akan mendapat notifikasi setelah admin memutuskan.`}
        />

        {created.posterDone ? (
          <StatusAlert type="success" message="Poster berhasil diunggah." />
        ) : (
          <div className="space-y-3">
            <StatusAlert
              type="error"
              message={`Poster belum terunggah: ${created.posterError} Acara tanpa poster tidak bisa disetujui, jadi coba unggah lagi.`}
            />
            <button
              type="button"
              onClick={retryPoster}
              disabled={isSubmitting}
              className="bg-[#FF2E9A] hover:bg-pink-600 disabled:opacity-60 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              {isSubmitting ? 'Mengunggah...' : 'Unggah poster lagi'}
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5 pt-2">
          <Link
            href="/organizer/events"
            className="bg-[#FF2E9A] hover:bg-pink-600 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition"
          >
            Lihat Daftar Acara
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="bg-[#FFF0F6] hover:bg-[#FFE4F2] text-[#FF2E9A] border border-pink-200 text-xs font-extrabold px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Ajukan acara lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xs max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#FF2E9A]">Buat Acara Baru</h1>
        <p className="text-xs text-gray-500 mt-1">
          Lengkapi informasi konser, unggah poster, dan atur kategori tiket yang dijual.
        </p>
      </div>

      {formError && <StatusAlert type="error" message={formError} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Acara */}
        <div className="space-y-4 border border-pink-100 bg-[#FFF9FC] rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-[#FF2E9A]">Informasi Acara</h2>

          <div className="space-y-1.5">
            <label htmlFor="event-title" className="block text-xs font-bold text-gray-700">
              Judul Acara
            </label>
            <input
              id="event-title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Indie Groove Festival 2026"
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="event-genre" className="block text-xs font-bold text-gray-700">
              Genre
            </label>
            <select
              id="event-genre"
              required
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className={`${INPUT_CLASS} cursor-pointer`}
            >
              <option value="">{genreData ? 'Pilih genre' : genreError ? 'Genre gagal dimuat' : 'Memuat genre...'}</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="event-venue" className="block text-xs font-bold text-gray-700">
                Nama Venue
              </label>
              <input
                id="event-venue"
                type="text"
                required
                minLength={2}
                maxLength={120}
                list="venue-options"
                value={venueName}
                onChange={(e) => handleVenueNameChange(e.target.value)}
                placeholder="Contoh: Taman Budaya Raden Saleh"
                className={INPUT_CLASS}
              />
              <datalist id="venue-options">
                {venues.map((v) => (
                  <option key={v.id} value={v.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="event-city" className="block text-xs font-bold text-gray-700">
                Kota
              </label>
              <input
                id="event-city"
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={venueCity}
                onChange={(e) => setVenueCity(e.target.value)}
                placeholder="Contoh: Semarang"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="event-start" className="block text-xs font-bold text-gray-700">
                Waktu Mulai
              </label>
              <input
                id="event-start"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={INPUT_CLASS}
              />
              <p className="text-[11px] text-gray-500">Penjualan tiket ditutup saat acara dimulai.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="event-end" className="block text-xs font-bold text-gray-700">
                Waktu Selesai (opsional)
              </label>
              <input
                id="event-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={INPUT_CLASS}
              />
              <p className="text-[11px] text-gray-500">Kosong = tiket berlaku 6 jam setelah mulai.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="event-desc" className="block text-xs font-bold text-gray-700">
              Deskripsi Singkat
            </label>
            <textarea
              id="event-desc"
              rows={3}
              required
              minLength={10}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan line-up, rundown singkat, atau gambaran acara..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="event-terms" className="block text-xs font-bold text-gray-700">
              Syarat & Ketentuan (opsional)
            </label>
            <textarea
              id="event-terms"
              rows={3}
              maxLength={2000}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Contoh: Tiket tidak dapat diuangkan kembali. Anak di bawah 12 tahun wajib didampingi."
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Unggah Poster Acara */}
        <div className="space-y-3 border border-pink-100 bg-[#FFF9FC] rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-[#FF2E9A]">Unggah Poster Acara</h2>

          <input
            ref={posterInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handlePosterChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => posterInputRef.current?.click()}
            className="w-full border-2 border-dashed border-pink-200 hover:border-[#FF2E9A] bg-white rounded-2xl p-6 text-center cursor-pointer transition space-y-3"
          >
            {posterPreview ? (
              <span className="block space-y-2">
                <img src={posterPreview} alt="Preview Poster" className="max-h-60 mx-auto rounded-xl object-contain" />
                <span className="block text-xs font-bold text-[#FF2E9A]">{poster?.name}</span>
                <span className="block text-[11px] text-gray-500">Klik untuk mengganti poster</span>
              </span>
            ) : (
              <span className="block space-y-1.5 py-4">
                <span className="block text-xs sm:text-sm font-extrabold text-[#FF2E9A]">
                  Klik untuk memilih file poster (JPG / PNG, maks. 5 MB)
                </span>
                <span className="block text-[11px] text-gray-500">
                  Disarankan rasio portrait atau 16:9 dengan resolusi jelas
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Kategori Tiket */}
        <div className="space-y-4 border border-pink-100 bg-[#FFF9FC] rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-[#FF2E9A]">Kategori Tiket</h2>
            <button
              type="button"
              onClick={addTicketRow}
              disabled={ticketRows.length >= 10}
              className="bg-[#FFF0F6] hover:bg-[#FFE4F2] disabled:opacity-50 text-[#FF2E9A] border border-pink-200 text-xs font-extrabold px-3.5 py-2 rounded-xl transition cursor-pointer"
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
                  <label className="block text-[11px] font-bold text-gray-600">Nama Tiket #{index + 1}</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={60}
                    value={row.name}
                    onChange={(e) => updateTicketRow(row.id, 'name', e.target.value)}
                    placeholder="VIP / Festival / Early Bird"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#FF2E9A]"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[11px] font-bold text-gray-600">Harga (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={row.price}
                    onChange={(e) => updateTicketRow(row.id, 'price', e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#FF2E9A]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-gray-600">Kuota</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
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
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-[#FF2E9A] hover:bg-pink-600 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold px-7 py-3 rounded-xl transition shadow-xs cursor-pointer"
          >
            {isSubmitting ? 'Mengirim...' : 'Ajukan Acara'}
          </button>
        </div>
      </form>
    </div>
  );
}
