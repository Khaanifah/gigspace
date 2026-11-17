import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Next.js 16: "middleware" kini bernama "proxy". Tugasnya di sini hanya
// menyegarkan sesi Supabase di cookie. Otorisasi TETAP dicek di tiap Route Handler.
export async function proxy(request) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser(); // memvalidasi token ke Supabase dan menyegarkannya bila perlu
  return response;
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
