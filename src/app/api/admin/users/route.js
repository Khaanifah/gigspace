import { route, ok } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { listUsersSchema } from '@/server/users/schemas';
import { listUsers } from '@/server/users/service';

export const GET = route('admin.users.list', async (request) => {
  await requireRole('ADMIN');
  const query = listUsersSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listUsers(query));
});
