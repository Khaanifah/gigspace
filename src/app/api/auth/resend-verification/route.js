import { route, ok, parseJson, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { resendSchema } from '@/server/auth/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const POST = route('auth.resend-verification', async (request, _ctx, { log }) => {
  const { email } = await parseJson(request, resendSchema);

  rateLimit(`resend:ip:${clientIp(request)}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  rateLimit(`resend:email:${email}`, { limit: 3, windowMs: 10 * 60 * 1000 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email });

  if (error) {
    log.warn({ code: error.code, status: error.status }, 'supabase resend gagal');
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      throw new AppError('RATE_LIMITED', 'Batas pengiriman email tercapai. Coba lagi beberapa saat lagi.', 429);
    }
  }

  return ok(null, 'Jika email menunggu verifikasi, kode baru telah dikirim.');
});
