import { route, ok } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { listContactSchema } from '@/server/contact/schemas';
import { listContactMessages } from '@/server/contact/service';

export const GET = route('admin.contact.list', async (request) => {
  await requireRole('ADMIN');
  const query = listContactSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listContactMessages(query));
});
