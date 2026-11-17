import { route, ok, parseJson } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { paymentIdSchema, rejectSchema } from '@/server/payments/schemas';
import { rejectPayment } from '@/server/payments/service';

export const POST = route('admin.payments.reject', async (request, { params }, { log }) => {
  const admin = await requireRole('ADMIN');
  const id = paymentIdSchema.parse((await params).id);
  const { note } = await parseJson(request, rejectSchema);
  const result = await rejectPayment(admin, id, note, log);
  return ok(result, 'Pembayaran ditolak.');
});
