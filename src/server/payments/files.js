// Deteksi tipe file dari isinya (magic bytes), bukan dari nama atau Content-Type kiriman klien.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function sniffImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG)) return 'image/png';
  return null;
}

export const MAX_PROOF_BYTES = 10 * 1024 * 1024; // 10 MB (sama dengan CHECK di database)
