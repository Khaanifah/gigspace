import { route, ok, parseJson, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { forgotPasswordSchema } from '@/server/auth/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const POST = route('auth.forgot-password', async (request, _ctx, { log }) => {
  const { email } = await parseJson(request, forgotPasswordSchema);

  rateLimit(`forgot:ip:${clientIp(request)}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  rateLimit(`forgot:email:${email}`, { limit: 5, windowMs: 10 * 60 * 1000 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    log.warn({ code: error.code, status: error.status }, 'supabase resetPasswordForEmail gagal');
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      throw new AppError('RATE_LIMITED', 'Batas pengiriman email tercapai. Coba lagi beberapa saat lagi.', 429);
    }
  }

  // Respons selalu sama, baik email terdaftar maupun tidak.
  return ok(null, 'Jika email terdaftar, kode untuk membuat password baru telah dikirim.');
});
