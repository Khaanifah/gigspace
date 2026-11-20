import { route, ok, parseJson, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { verifyEmailSchema } from '@/server/auth/schemas';
import { completeLogin } from '@/server/auth/finish-login';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const POST = route('auth.verify-email', async (request, _ctx, { log }) => {
  const { email, token, door } = await parseJson(request, verifyEmailSchema);

  rateLimit(`verify-email:ip:${clientIp(request)}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  rateLimit(`verify-email:email:${email}`, { limit: 10, windowMs: 10 * 60 * 1000 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
  if (error) {
    log.warn({ code: error.code, status: error.status }, 'verifikasi email ditolak');
    throw new AppError('CODE_INVALID', 'Kode tidak valid atau sudah kedaluwarsa.', 400);
  }

  return ok(await completeLogin({ supabase, door, log }), 'Email terverifikasi. Selamat datang!');
});
