import { route, ok } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { listCurationSchema } from '@/server/curation/schemas';
import { listCuration } from '@/server/curation/service';

export const GET = route('admin.events.list', async (request) => {
  await requireRole('ADMIN');
  const query = listCurationSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listCuration(query));
});
