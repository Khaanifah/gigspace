import { route, ok } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { getOrder, expireOverdueOrders } from '@/server/orders/service';

export const GET = route('orders.detail', async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params; // params async di Next.js 16
  await expireOverdueOrders();
  return ok({ order: await getOrder(user, id) });
});
