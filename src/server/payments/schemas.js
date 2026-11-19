import { z } from 'zod';

const uuid = z.string().uuid('ID tidak valid.');
export const paymentIdSchema = uuid;

export const approveSchema = z.strictObject({
  note: z.string().trim().max(500, 'Catatan maksimal 500 karakter.').optional(),
});

export const rejectSchema = z.strictObject({
  note: z.string({ error: 'Alasan penolakan wajib diisi.' }).trim().min(3, 'Alasan penolakan minimal 3 karakter.').max(500, 'Alasan maksimal 500 karakter.'),
});

export const listPaymentsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  // true = hanya pembayaran yang sudah punya bukti (UNDER_REVIEW, APPROVED, REJECTED)
  submitted: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  q: z.string().trim().min(1).max(100).optional(),
});
