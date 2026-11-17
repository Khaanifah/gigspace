import { route, parseJson, ok } from '@/server/http';
import { prisma } from '@/lib/prisma';
import { requireUser, toPublicUser } from '@/server/auth/session';
import { updateProfileSchema } from '@/server/auth/schemas';

export const GET = route('users.me', async () => {
  const user = await requireUser();
  return ok({ user: toPublicUser(user) });
});

export const PATCH = route('users.me.update', async (request, _ctx, { log }) => {
  const user = await requireUser();
  const data = await parseJson(request, updateProfileSchema);

  // Hanya dua kolom ini yang bisa diubah sendiri; role/email/isActive mustahil lewat jalur ini.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { fullName: data.fullName, whatsapp: data.whatsapp },
  });

  log.info({ userId: user.id }, 'profil diperbarui');
  return ok({ user: toPublicUser(updated) }, 'Profil berhasil diperbarui.');
});
