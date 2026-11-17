import { route, parseJson, ok, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { verifyOtpSchema } from '@/server/auth/schemas';
import { getSessionUser, toPublicUser } from '@/server/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const POST = route('auth.verify-otp', async (request, _ctx, { log }) => {
  const { email, token } = await parseJson(request, verifyOtpSchema);

  rateLimit(`otp-verify:ip:${clientIp(request)}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  rateLimit(`otp-verify:email:${email}`, { limit: 10, windowMs: 10 * 60 * 1000 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

  if (error) {
    log.warn({ code: error.code, status: error.status }, 'verifikasi OTP ditolak');
    throw new AppError('OTP_INVALID', 'Kode OTP tidak valid atau sudah kedaluwarsa.', 400);
  }

  // Sesi sudah tertulis di cookie; sekarang pastikan profil di tabel `users` ada.
  const user = await getSessionUser();
  if (!user) throw new AppError('UNAUTHENTICATED', 'Akun tidak aktif atau sesi gagal dibuat.', 401);

  log.info({ userId: user.id }, 'login berhasil');
  return ok({ user: toPublicUser(user) }, 'Login berhasil.');
});
