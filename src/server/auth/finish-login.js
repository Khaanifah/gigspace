import { AppError } from '@/server/http';
import { getSessionUser, toPublicUser } from '@/server/auth/session';
import { DOORS, doorAllows, doorDeniedMessage } from '@/server/auth/doors';

// Dipakai setelah Supabase membuat sesi (login password atau verifikasi email).
// Role DIBACA DARI DATABASE; pintu yang dipilih di browser hanya diperiksa.
export async function completeLogin({ supabase, door, log }) {
  const user = await getSessionUser();
  if (!user) {
    await supabase.auth.signOut();
    throw new AppError('UNAUTHENTICATED', 'Akun tidak aktif atau sesi gagal dibuat.', 401);
  }

  if (!doorAllows(door, user.role)) {
    await supabase.auth.signOut(); // batalkan sesi yang baru dibuat
    log?.warn({ userId: user.id, door, role: user.role }, 'login ditolak: pintu tidak sesuai role');
    throw new AppError('DOOR_MISMATCH', doorDeniedMessage(door), 403);
  }

  log?.info({ userId: user.id, door }, 'login berhasil');
  return { user: toPublicUser(user), redirectTo: DOORS[door].redirectTo };
}
