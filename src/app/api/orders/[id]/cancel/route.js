import { route, ok } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { cancelOrder } from '@/server/orders/service';

export const POST = route('orders.cancel', async (_request, { params }, { log }) => {
  const user = await requireUser();
  const { id } = await params;
  return ok({ order: await cancelOrder(user, id, log) }, 'Pesanan dibatalkan.');
});
