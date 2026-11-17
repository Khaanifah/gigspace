import { randomBytes } from 'node:crypto';

// 32 karakter tanpa yang mudah tertukar (0/O, 1/I). 32^8 ≈ 1,1 triliun kemungkinan.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateOrderCode() {
  const bytes = randomBytes(8);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `GS-${out}`;
}
