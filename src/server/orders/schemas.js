import { z } from 'zod';
import { MAX_TICKETS_PER_ORDER } from '@/server/config';

const buyer = z.strictObject({
  fullName: z.string({ error: 'Nama lengkap wajib diisi.' }).trim().min(2, 'Nama minimal 2 karakter.').max(100, 'Nama maksimal 100 karakter.'),
  gender: z.enum(['Laki-laki', 'Perempuan'], { error: 'Jenis kelamin tidak valid.' }),
  whatsapp: z
    .string({ error: 'Nomor WhatsApp wajib diisi.' })
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\+?\d{9,15}$/, 'Nomor WhatsApp tidak valid.')),
  email: z.string({ error: 'Email wajib diisi.' }).trim().toLowerCase().email('Format email tidak valid.').max(254),
});

const item = z.strictObject({
  ticketTypeId: z.string().uuid('ID tiket tidak valid.'),
  quantity: z.number({ error: 'Jumlah tiket harus berupa angka.' }).int('Jumlah tiket harus bilangan bulat.').min(1, 'Jumlah tiket minimal 1.').max(MAX_TICKETS_PER_ORDER, `Maksimal ${MAX_TICKETS_PER_ORDER} tiket per jenis.`),
});

// Perhatikan: tidak ada field harga/total/status. Kalau client mengirimnya, ditolak (strictObject).
export const createOrderSchema = z
  .strictObject({
    eventSlug: z.string().trim().min(1, 'Acara wajib dipilih.').max(200),
    items: z.array(item).min(1, 'Pilih minimal satu tiket.').max(MAX_TICKETS_PER_ORDER),
    buyer,
    paymentMethodCode: z.string().trim().min(1, 'Metode pembayaran wajib dipilih.').max(30),
  })
  .superRefine((value, ctx) => {
    const ids = value.items.map((i) => i.ticketTypeId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['items'], message: 'Jenis tiket tidak boleh duplikat.' });
    }
    const total = value.items.reduce((s, i) => s + i.quantity, 0);
    if (total > MAX_TICKETS_PER_ORDER) {
      ctx.addIssue({ code: 'custom', path: ['items'], message: `Maksimal ${MAX_TICKETS_PER_ORDER} tiket per pesanan.` });
    }
  });

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'EXPIRED']).optional(),
});
