import { route, ok, parseJson, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { registerSchema } from '@/server/auth/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const SENT_MESSAGE = 'Kode verifikasi telah dikirim ke email Anda.';
const ALREADY_REGISTERED_MESSAGE = 'Akun Anda sudah terdaftar. Silakan masuk atau gunakan Lupa Password.';

export const POST = route('auth.register', async (request, _ctx, { log }) => {
  const { fullName, email, password } = await parseJson(request, registerSchema);

  rateLimit(`register:ip:${clientIp(request)}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  rateLimit(`register:email:${email}`, { limit: 5, windowMs: 60 * 60 * 1000 });

  const supabase = await createSupabaseServerClient();
  // Password di-hash oleh Supabase Auth (bcrypt); tidak pernah disimpan di tabel kita.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    log.warn({ code: error.code, status: error.status }, 'supabase signUp gagal');
    if (error.code === 'weak_password') {
      throw new AppError('WEAK_PASSWORD', 'Password terlalu lemah. Gunakan kombinasi huruf dan angka yang lebih panjang.', 400);
    }
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      throw new AppError('RATE_LIMITED', 'Batas pengiriman email tercapai. Coba lagi beberapa saat lagi.', 429);
    }
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      throw new AppError('EMAIL_ALREADY_REGISTERED', ALREADY_REGISTERED_MESSAGE, 409);
    }
    throw new AppError('REGISTER_FAILED', 'Pendaftaran gagal. Silakan coba lagi.', 502);
  }

  // Saat konfirmasi email AKTIF, Supabase tidak mengembalikan error untuk email yang sudah
  // terverifikasi; ia memberi user samaran dengan identities kosong. Ini penanda akun sudah ada.
  // (Email yang terdaftar tapi belum diverifikasi punya identities terisi: Supabase mengirim ulang
  // kode, jadi alurnya tetap ke langkah verifikasi.)
  if (Array.isArray(data.user?.identities) && data.user.identities.length === 0) {
    throw new AppError('EMAIL_ALREADY_REGISTERED', ALREADY_REGISTERED_MESSAGE, 409);
  }

  // Bila konfirmasi email dimatikan di Supabase, sesi langsung terbentuk: arahkan ke login biasa.
  if (data.session) {
    await supabase.auth.signOut();
    return ok({ next: 'login' }, 'Akun berhasil dibuat. Silakan masuk.', 201);
  }

  return ok({ next: 'verify' }, SENT_MESSAGE, 201);
});
