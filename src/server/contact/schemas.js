import { z } from 'zod';

// Harus sama dengan pilihan di <select> halaman Contact.
export const CONTACT_SUBJECTS = ['Kerjasama', 'Kritik dan Saran', 'Aduan Kendala', 'Lainnya'];
export const COOPERATION_SUBJECT = 'Kerjasama';

export const createContactSchema = z.strictObject({
  name: z.string({ error: 'Nama wajib diisi.' }).trim().min(2, 'Nama minimal 2 karakter.').max(100, 'Nama maksimal 100 karakter.'),
  email: z.string({ error: 'Email wajib diisi.' }).trim().toLowerCase().email('Format email tidak valid.').max(254, 'Email terlalu panjang.'),
  subject: z.enum(CONTACT_SUBJECTS, { error: 'Subjek tidak valid.' }),
  message: z.string({ error: 'Pesan wajib diisi.' }).trim().min(10, 'Pesan minimal 10 karakter.').max(2000, 'Pesan maksimal 2000 karakter.'),
});

export const listContactSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['NEW', 'READ', 'REPLIED']).optional(),
  subject: z.enum(CONTACT_SUBJECTS).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

export const updateContactSchema = z.strictObject({
  status: z.enum(['NEW', 'READ', 'REPLIED'], { error: 'Status tidak valid.' }),
});

export const contactIdSchema = z.string().uuid('ID tidak valid.');
