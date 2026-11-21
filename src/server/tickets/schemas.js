import { z } from 'zod';

export const listTicketsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// Check-in menerima SALAH SATU:
//  - token: isi QR, berformat "GS:<token>" (pemindai boleh mengirim dengan atau tanpa awalan)
//  - code:  kode tiket tercetak "TK-XXXXXXXX", sebagai cadangan bila QR tidak bisa dipindai
const INVALID = 'Kode atau QR tiket tidak valid.';

const qrTokenField = z
  .string({ error: INVALID })
  .trim()
  .min(8, INVALID)
  .max(100, INVALID)
  .transform((v) => (v.startsWith('GS:') ? v.slice(3) : v))
  .pipe(z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, INVALID));

const printedCodeField = z
  .string({ error: INVALID })
  .trim()
  .toUpperCase()
  .regex(/^TK-[A-Z0-9]{8}$/, INVALID);

export const checkInSchema = z
  .strictObject({ token: qrTokenField.optional(), code: printedCodeField.optional() })
  .refine((v) => (v.token === undefined) !== (v.code === undefined), {
    message: 'Kirim isi QR atau kode tiket (salah satu).',
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
