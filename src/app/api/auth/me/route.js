import { route, ok } from '@/server/http';
import { getSessionUser, toPublicUser } from '@/server/auth/session';

// Pemeriksaan sesi: selalu 200. `user: null` berarti belum login
// (supaya konsol browser tidak penuh error merah untuk pengunjung biasa).
export const GET = route('auth.me', async () => {
  const user = await getSessionUser();
  return ok({ user: user ? toPublicUser(user) : null });
});
