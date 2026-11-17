import { route, ok } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { getOrderPayment } from '@/server/payments/service';

export const GET = route('payments.status', async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return ok({ payment: await getOrderPayment(user, id) });
});
