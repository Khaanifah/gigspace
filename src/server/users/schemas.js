import { z } from 'zod';

export const USER_ROLES = ['USER', 'ORGANIZER', 'ADMIN'];

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

export const userIdSchema = z.string().uuid('ID tidak valid.');

// strictObject: hanya role dan isActive yang boleh diubah lewat jalur ini (email, id, dsb. ditolak).
export const updateUserSchema = z
  .strictObject({
    role: z.enum(USER_ROLES, { error: 'Role tidak valid.' }).optional(),
    isActive: z.boolean({ error: 'Status akun tidak valid.' }).optional(),
  })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, { message: 'Tidak ada perubahan yang dikirim.' });
