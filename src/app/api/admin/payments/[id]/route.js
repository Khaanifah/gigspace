import { route, ok } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { paymentIdSchema } from '@/server/payments/schemas';
import { getPaymentDetail } from '@/server/payments/service';

export const GET = route('admin.payments.detail', async (_request, { params }) => {
  await requireRole('ADMIN');
  const id = paymentIdSchema.parse((await params).id);
  return ok({ payment: await getPaymentDetail(id) });
});
