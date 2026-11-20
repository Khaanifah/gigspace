import { z } from 'zod';

export const curationIdSchema = z.string().uuid('ID acara tidak valid.');

// Tab di halaman kurasi: pending = menunggu, approved = sudah tayang/selesai, rejected = ditolak.
export const listCurationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  group: z.enum(['pending', 'approved', 'rejected']).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

export const rejectCurationSchema = z.strictObject({
  reason: z
    .string({ error: 'Alasan penolakan wajib diisi.' })
    .trim()
    .min(3, 'Alasan penolakan minimal 3 karakter.')
    .max(500, 'Alasan maksimal 500 karakter.'),
});
