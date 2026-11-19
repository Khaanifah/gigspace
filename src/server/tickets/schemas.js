import { z } from 'zod';

export const listTicketsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// Isi QR berformat "GS:<token>"; pemindai boleh mengirim dengan atau tanpa awalan.
export const checkInSchema = z.strictObject({
  token: z
    .string({ error: 'Token tiket wajib diisi.' })
    .trim()
    .min(8, 'Token tiket tidak valid.')
    .max(100, 'Token tiket tidak valid.')
    .transform((v) => (v.startsWith('GS:') ? v.slice(3) : v))
    .pipe(z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, 'Token tiket tidak valid.')),
});

export const ticketCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^TK-[A-Z0-9]{8}$/, 'Kode tiket tidak valid.');

export const orderCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^GS-[A-Z0-9]{8}$/, 'Kode pesanan tidak valid.');
