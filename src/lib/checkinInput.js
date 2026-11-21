// Mengubah teks dari kamera / unggah gambar / input manual / pemindai USB menjadi body API check-in.
//  - "TK-7K2M9QXA", "tk7k2m9qxa", "TK-7K2M 9QXA"  -> { code: 'TK-7K2M9QXA' }  (kode tercetak di e-ticket)
//  - "GS:<token>" atau token polos                 -> { token }               (isi QR; case-sensitive!)
export function toCheckInBody(text) {
  const value = String(text ?? '').trim();
  const m = /^TK-?([A-Za-z0-9]{8})$/i.exec(value.replace(/\s+/g, ''));
  return m ? { code: `TK-${m[1].toUpperCase()}` } : { token: value };
}
