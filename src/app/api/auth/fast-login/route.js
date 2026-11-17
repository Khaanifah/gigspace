import { z } from 'zod';
import { route, parseJson, ok, AppError } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { prisma } from '@/lib/prisma';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionUser, toPublicUser } from '@/server/auth/session';
import { FAST_LOGIN_ACCOUNTS, FAST_LOGIN_KEYS } from '@/server/auth/fast-login';

const schema = z.strictObject({
  role: z.enum(FAST_LOGIN_KEYS, { error: 'Peran tidak dikenal.' }),
});

// FAST LOGIN: khusus demo/pengujian. Mati secara default dan hanya hidup bila
// ENABLE_FAST_LOGIN=true di .env. JANGAN diaktifkan di lingkungan produksi yang nyata:
// siapa pun yang bisa membuka endpoint ini bisa masuk sebagai admin.
export const POST = route('auth.fast-login', async (request, _ctx, { log }) => {
  if (process.env.ENABLE_FAST_LOGIN !== 'true') {
    throw new AppError('NOT_FOUND', 'Tidak ditemukan.', 404); // pura-pura tidak ada
  }

  rateLimit(`fast-login:ip:${clientIp(request)}`, { limit: 20, windowMs: 10 * 60 * 1000 });

  const { role } = await parseJson(request, schema);
  const target = FAST_LOGIN_ACCOUNTS[role];
  const admin = createSupabaseAdminClient();

  // 1) Pastikan identitas di Supabase Auth ada (email dianggap terverifikasi, tanpa mengirim email).
  const created = await admin.auth.admin.createUser({ email: target.email, email_confirm: true });
  if (created.error && !/already|exists|registered/i.test(`${created.error.code} ${created.error.message}`)) {
    log.error({ code: created.error.code }, 'fast login: gagal menyiapkan akun auth');
    throw new AppError('FAST_LOGIN_FAILED', 'Fast login gagal menyiapkan akun demo.', 502);
  }

  // 2) Token sekali pakai (tanpa password dan tanpa email).
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: target.email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) {
    log.error({ code: link.error?.code }, 'fast login: gagal membuat token');
    throw new AppError('FAST_LOGIN_FAILED', 'Fast login gagal membuat sesi.', 502);
  }

  // 3) Tukar token jadi sesi: cookie ditulis oleh klien server yang biasa.
  const supabase = await createSupabaseServerClient();
  const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
  if (verified.error) {
    log.error({ code: verified.error.code }, 'fast login: token ditolak');
    throw new AppError('FAST_LOGIN_FAILED', 'Fast login gagal membuat sesi.', 502);
  }

  // 4) Profil aplikasi + role. Role ditetapkan dari pemetaan server di atas.
  const base = await getSessionUser();
  if (!base) throw new AppError('FAST_LOGIN_FAILED', 'Akun demo tidak aktif.', 401);

  const user = await prisma.user.update({
    where: { id: base.id },
    data: { role: target.role, fullName: base.fullName ?? target.fullName, isActive: true },
  });

  if (target.role === 'ORGANIZER') {
    const profile = await prisma.organizerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      await prisma.organizerProfile.create({
        data: { userId: user.id, organizationName: 'Organizer Demo', description: 'Akun demo fast login' },
      });
    }
  }

  log.warn({ role: target.role, userId: user.id }, 'FAST LOGIN dipakai');
  return ok({ user: toPublicUser(user) }, `Masuk sebagai ${target.role}.`);
});
