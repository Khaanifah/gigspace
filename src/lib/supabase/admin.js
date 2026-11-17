import 'server-only'; // build gagal bila file ini tak sengaja diimpor dari kode browser
import { createClient } from '@supabase/supabase-js';

// Klien dengan SERVICE ROLE KEY: melewati semua aturan akses Supabase.
// Hanya untuk kode server tepercaya. Jangan pernah diberi awalan NEXT_PUBLIC_.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
