import { route, ok, parseJson, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { loginSchema } from '@/server/auth/schemas';
import { completeLogin } from '@/server/auth/finish-login';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const POST = route('auth.login', async (request, _ctx, { log }) => {
  const { email, password, door } = await parseJson(request, loginSchema);

  // Pembatasan percobaan: menahan tebak-tebak password dan credential stuffing.
  rateLimit(`login:ip:${clientIp(request)}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  rateLimit(`login:email:${email}`, { limit: 8, windowMs: 10 * 60 * 1000 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === 'email_not_confirmed') {
      throw new AppError('EMAIL_NOT_VERIFIED', 'Email belum diverifikasi.', 403);
    }
    if (error.status === 429) {
      throw new AppError('RATE_LIMITED', 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.', 429);
    }
    log.warn({ code: error.code, status: error.status }, 'login password gagal');
    // Pesan seragam: tidak membedakan email salah atau password salah.
    throw new AppError('INVALID_CREDENTIALS', 'Email atau password salah.', 401);
  }

  return ok(await completeLogin({ supabase, door, log }), 'Login berhasil.');
});
