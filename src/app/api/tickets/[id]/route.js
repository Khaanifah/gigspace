import { route, ok } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { orderCodeSchema } from '@/server/tickets/schemas';
import { getTicketGroup } from '@/server/tickets/service';

// [id] = kode pesanan (mis. GS-7K2M9QXA); hasilnya seluruh e-ticket dalam pesanan itu.
export const GET = route('tickets.detail', async (_request, { params }) => {
  const user = await requireUser();
  const code = orderCodeSchema.parse((await params).id);
  return ok({ order: await getTicketGroup(user, code) });
});
