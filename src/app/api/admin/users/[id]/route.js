import { route, ok, parseJson } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { userIdSchema, updateUserSchema } from '@/server/users/schemas';
import { getUserDetail, updateUser } from '@/server/users/service';

export const GET = route('admin.users.detail', async (_request, { params }) => {
  await requireRole('ADMIN');
  const id = userIdSchema.parse((await params).id);
  return ok({ user: await getUserDetail(id) });
});

export const PATCH = route('admin.users.update', async (request, { params }, { log }) => {
  const admin = await requireRole('ADMIN');
  const id = userIdSchema.parse((await params).id);
  const changes = await parseJson(request, updateUserSchema);
  return ok({ user: await updateUser(admin, id, changes, log) }, 'Pengguna berhasil diperbarui.');
});
