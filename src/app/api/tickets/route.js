import { route, ok } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { listTicketsSchema } from '@/server/tickets/schemas';
import { listMyTicketGroups } from '@/server/tickets/service';

export const GET = route('tickets.list', async (request) => {
  const user = await requireUser();
  const query = listTicketsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listMyTicketGroups(user, query));
});
