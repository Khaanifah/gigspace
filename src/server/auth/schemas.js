import { z } from 'zod';
import { DOOR_KEYS } from '@/server/auth/doors';

const email = z
  .string({ error: 'Alamat email wajib diisi.' })
  .trim()
  .toLowerCase()
  .email('Format email tidak valid.')
  .max(254, 'Email terlalu panjang.');

export const sendOtpSchema = z.strictObject({ email });

export const verifyOtpSchema = z.strictObject({
  email,
  // Pintu yang dipilih di layar login; dicocokkan dengan role di database, bukan dipercaya.
  door: z.enum(DOOR_KEYS, { error: 'Pintu login tidak dikenal.' }).default('user'),
  token: z
    .string({ error: 'Kode OTP wajib diisi.' })
    .trim()
    .regex(/^\d{6}$/, 'Kode OTP harus 6 digit angka.'),
});

// strictObject: field asing (mis. "role") ditolak, bukan diabaikan diam-diam.
export const updateProfileSchema = z.strictObject({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(100, 'Nama maksimal 100 karakter.').optional(),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\+?\d{9,15}$/, 'Nomor WhatsApp tidak valid.'))
    .optional(),
});
