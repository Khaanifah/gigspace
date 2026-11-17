import { route, parseJson, ok, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { sendOtpSchema } from '@/server/auth/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const POST = route('auth.send-otp', async (request, _ctx, { log }) => {
  const { email } = await parseJson(request, sendOtpSchema);

  rateLimit(`otp-send:ip:${clientIp(request)}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  rateLimit(`otp-send:email:${email}`, { limit: 5, windowMs: 10 * 60 * 1000 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    log.error({ code: error.code, status: error.status }, 'supabase signInWithOtp gagal');
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      throw new AppError('RATE_LIMITED', 'Batas pengiriman email tercapai. Coba lagi beberapa saat lagi.', 429);
    }
    throw new AppError('OTP_SEND_FAILED', 'Gagal mengirim kode OTP. Silakan coba lagi.', 502);
  }

  // Respons sama untuk email baru maupun lama (tidak membocorkan keberadaan akun).
  return ok(null, 'Kode OTP telah dikirim ke email Anda.');
});
