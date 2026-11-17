import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppError } from '@/server/http';

// Kolom yang boleh dikirim ke client (tanpa authUserId dsb).
export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    whatsapp: user.whatsapp,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// Memastikan baris profil di tabel `users` ada untuk identitas Supabase ini.
async function ensureProfile(authUser) {
  const email = authUser.email?.toLowerCase();
  if (!email) throw new AppError('UNAUTHENTICATED', 'Sesi tidak valid.', 401);

  const existing = await prisma.user.findUnique({ where: { authUserId: authUser.id } });
  if (existing) return existing;

  try {
    return await prisma.user.create({ data: { authUserId: authUser.id, email } });
  } catch (err) {
    if (err?.code !== 'P2002') throw err; // bukan bentrok unique
    // Dua kemungkinan: request paralel membuat baris yang sama, atau email sudah ada
    // dengan authUserId lama (akun Auth dibuat ulang). Email ini sudah terbukti lewat OTP.
    const byAuth = await prisma.user.findUnique({ where: { authUserId: authUser.id } });
    if (byAuth) return byAuth;
    return prisma.user.update({ where: { email }, data: { authUserId: authUser.id } });
  }
}

// Pengguna saat ini, atau null. Token divalidasi ke Supabase (getUser), bukan hanya dibaca dari cookie.
export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const user = await ensureProfile(data.user);
  if (!user.isActive) return null;
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError('UNAUTHENTICATED', 'Silakan login terlebih dahulu.', 401);
  return user;
}

// Role selalu dibaca dari database, tidak pernah dari request client.
export async function requireRole(...roles) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AppError('FORBIDDEN', 'Anda tidak memiliki akses ke sumber daya ini.', 403);
  }
  return user;
}
