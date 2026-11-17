// Membuat bucket Supabase Storage yang dibutuhkan (aman dijalankan berulang).
// Jalankan: node --env-file=.env scripts/setup-storage.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus terisi di .env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const buckets = [
  // Bukti pembayaran: PRIVAT, hanya JPG/PNG, maksimal 10 MB
  { name: 'payment-proofs', options: { public: false, fileSizeLimit: 10 * 1024 * 1024, allowedMimeTypes: ['image/jpeg', 'image/png'] } },
  // Poster/galeri event: publik agar bisa tampil di halaman
  { name: 'event-images', options: { public: true, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] } },
];

for (const { name, options } of buckets) {
  const { error } = await supabase.storage.createBucket(name, options);
  if (!error) {
    console.log(`Bucket dibuat   : ${name} (${options.public ? 'publik' : 'privat'})`);
  } else if (/already exists|duplicate/i.test(error.message)) {
    const { error: updateError } = await supabase.storage.updateBucket(name, options);
    console.log(updateError ? `Gagal memperbarui ${name}: ${updateError.message}` : `Bucket sudah ada: ${name} (pengaturan diperbarui)`);
  } else {
    console.error(`Gagal membuat ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}
