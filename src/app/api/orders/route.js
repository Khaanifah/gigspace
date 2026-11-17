import { route, ok, parseJson } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { rateLimit } from '@/server/rate-limit';
import { createOrderSchema, listOrdersSchema } from '@/server/orders/schemas';
import { createOrder, listOrders } from '@/server/orders/service';

export const POST = route('orders.create', async (request, _ctx, { log }) => {
  const user = await requireUser();
  rateLimit(`orders:create:${user.id}`, { limit: 10, windowMs: 10 * 60 * 1000 });

  const input = await parseJson(request, createOrderSchema);
  const { order, duplicate } = await createOrder(user, input, log);
  return ok({ order }, 'Pesanan berhasil dibuat.', duplicate ? 200 : 201);
});

export const GET = route('orders.list', async (request) => {
  const user = await requireUser();
  const query = listOrdersSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listOrders(user, query));
});
