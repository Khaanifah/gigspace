import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Kode pendek yang tampil di UI, mis. TK-7K2M9QXA.
export function generateTicketCode() {
  let out = '';
  for (const b of randomBytes(8)) out += ALPHABET[b % ALPHABET.length];
  return `TK-${out}`;
}

// Token isi QR: 24 byte acak (192 bit). Tidak berhubungan dengan ID database sehingga tidak bisa ditebak.
export function generateQrToken() {
  return randomBytes(24).toString('base64url');
}
