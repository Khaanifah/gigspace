import { route, ok, parseJson, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { resetPasswordSchema } from '@/server/auth/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const POST = route('auth.reset-password', async (request, _ctx, { log }) => {
  const { email, token, password } = await parseJson(request, resetPasswordSchema);

  rateLimit(`reset:ip:${clientIp(request)}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  rateLimit(`reset:email:${email}`, { limit: 10, windowMs: 10 * 60 * 1000 });

  const supabase = await createSupabaseServerClient();
  const verified = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  if (verified.error) {
    log.warn({ code: verified.error.code }, 'kode reset ditolak');
    throw new AppError('CODE_INVALID', 'Kode tidak valid atau sudah kedaluwarsa.', 400);
  }

  // Sesi recovery hanya dipakai untuk mengganti password, lalu langsung diakhiri.
  const updated = await supabase.auth.updateUser({ password });
  await supabase.auth.signOut();

  if (updated.error) {
    log.warn({ code: updated.error.code }, 'ganti password gagal');
    if (updated.error.code === 'weak_password') {
      throw new AppError('WEAK_PASSWORD', 'Password terlalu lemah. Gunakan kombinasi huruf dan angka yang lebih panjang.', 400);
    }
    if (updated.error.code === 'same_password') {
      throw new AppError('SAME_PASSWORD', 'Password baru tidak boleh sama dengan password lama.', 400);
    }
    throw new AppError('RESET_FAILED', 'Gagal mengganti password. Silakan coba lagi.', 502);
  }

  return ok(null, 'Password berhasil diubah. Silakan masuk dengan password baru.');
});
