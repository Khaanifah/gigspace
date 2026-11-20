import { z } from 'zod';
import { DOOR_KEYS } from '@/server/auth/doors';

const email = z
  .string({ error: 'Alamat email wajib diisi.' })
  .trim()
  .toLowerCase()
  .email('Format email tidak valid.')
  .max(254, 'Email terlalu panjang.');

// Kebijakan password (lapis 2). Batas 72 karakter karena bcrypt hanya memakai 72 byte pertama.
const newPassword = z
  .string({ error: 'Password wajib diisi.' })
  .min(8, 'Password minimal 8 karakter.')
  .max(72, 'Password maksimal 72 karakter.')
  .regex(/[A-Za-z]/, 'Password harus mengandung huruf.')
  .regex(/\d/, 'Password harus mengandung angka.');

const code = z
  .string({ error: 'Kode verifikasi wajib diisi.' })
  .trim()
  .regex(/^\d{6}$/, 'Kode harus 6 digit angka.');

const door = z.enum(DOOR_KEYS, { error: 'Pintu login tidak dikenal.' }).default('user');

export const registerSchema = z.strictObject({
  fullName: z.string({ error: 'Nama wajib diisi.' }).trim().min(2, 'Nama minimal 2 karakter.').max(100, 'Nama maksimal 100 karakter.'),
  email,
  password: newPassword,
});

// Login tidak menerapkan kebijakan password: akun lama tidak boleh terkunci karena aturan baru.
export const loginSchema = z.strictObject({
  email,
  password: z.string({ error: 'Password wajib diisi.' }).min(1, 'Password wajib diisi.').max(72, 'Password tidak valid.'),
  // Pintu yang dipilih di layar login; dicocokkan dengan role di database, bukan dipercaya.
  door,
});

export const verifyEmailSchema = z.strictObject({ email, token: code, door });
export const resendSchema = z.strictObject({ email });
export const forgotPasswordSchema = z.strictObject({ email });
export const resetPasswordSchema = z.strictObject({ email, token: code, password: newPassword });

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
