import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Klien Supabase untuk server: membaca/menulis sesi lewat cookie.
// Hanya memakai anon key; service role key TIDAK dipakai di sini.
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env');
  }

  const cookieStore = await cookies(); // async di Next.js 16

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component (tidak boleh set cookie); aman diabaikan
          // karena proxy.js yang menyegarkan sesi.
        }
      },
    },
  });
}
