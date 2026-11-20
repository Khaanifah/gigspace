import { z } from 'zod';

const MIN_LEAD_MS = 60 * 60 * 1000; // acara minimal mulai 1 jam dari sekarang

const ticketTypeSchema = z.strictObject({
  name: z.string({ error: 'Nama tiket wajib diisi.' }).trim().min(2, 'Nama tiket minimal 2 karakter.').max(60, 'Nama tiket maksimal 60 karakter.'),
  price: z.number({ error: 'Harga tiket tidak valid.' }).int('Harga harus bilangan bulat.').min(0, 'Harga tidak boleh negatif.').max(100_000_000, 'Harga terlalu besar.'),
  quota: z.number({ error: 'Kuota tiket tidak valid.' }).int('Kuota harus bilangan bulat.').min(1, 'Kuota minimal 1 tiket.').max(100_000, 'Kuota terlalu besar.'),
});

export const createEventSchema = z
  .strictObject({
    title: z.string({ error: 'Judul acara wajib diisi.' }).trim().min(3, 'Judul minimal 3 karakter.').max(120, 'Judul maksimal 120 karakter.'),
    genreId: z.string({ error: 'Genre wajib dipilih.' }).uuid('Genre tidak valid.'),
    venue: z.strictObject({
      name: z.string({ error: 'Nama venue wajib diisi.' }).trim().min(2, 'Nama venue minimal 2 karakter.').max(120, 'Nama venue maksimal 120 karakter.'),
      city: z.string({ error: 'Kota wajib diisi.' }).trim().min(2, 'Kota minimal 2 karakter.').max(60, 'Kota maksimal 60 karakter.'),
    }),
    description: z.string({ error: 'Deskripsi wajib diisi.' }).trim().min(10, 'Deskripsi minimal 10 karakter.').max(2000, 'Deskripsi maksimal 2000 karakter.'),
    terms: z.string().trim().max(2000, 'Syarat & ketentuan maksimal 2000 karakter.').optional(),
    startsAt: z.coerce.date({ error: 'Waktu mulai tidak valid.' }),
    endsAt: z.coerce.date({ error: 'Waktu selesai tidak valid.' }).nullish(),
    ticketTypes: z
      .array(ticketTypeSchema, { error: 'Kategori tiket wajib diisi.' })
      .min(1, 'Minimal satu kategori tiket.')
      .max(10, 'Maksimal 10 kategori tiket.'),
  })
  .superRefine((v, ctx) => {
    if (v.startsAt.getTime() < Date.now() + MIN_LEAD_MS) {
      ctx.addIssue({ code: 'custom', path: ['startsAt'], message: 'Waktu mulai minimal 1 jam dari sekarang.' });
    }
    if (v.endsAt && v.endsAt.getTime() < v.startsAt.getTime()) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Waktu selesai tidak boleh sebelum waktu mulai.' });
    }
    const names = v.ticketTypes.map((t) => t.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: 'custom', path: ['ticketTypes'], message: 'Nama kategori tiket tidak boleh sama.' });
    }
  });

export const eventIdSchema = z.string().uuid('ID acara tidak valid.');
