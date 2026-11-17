import { route, ok } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { listPaymentsSchema } from '@/server/payments/schemas';
import { listPayments } from '@/server/payments/service';

export const GET = route('admin.payments.list', async (request) => {
  await requireRole('ADMIN');
  const query = listPaymentsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listPayments(query));
});
