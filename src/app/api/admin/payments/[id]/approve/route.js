import { route, ok } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { paymentIdSchema, approveSchema } from '@/server/payments/schemas';
import { approvePayment } from '@/server/payments/service';

export const POST = route('admin.payments.approve', async (request, { params }, { log }) => {
  const admin = await requireRole('ADMIN');
  const id = paymentIdSchema.parse((await params).id);
  const body = await request.json().catch(() => ({})); // body kosong diperbolehkan
  const { note } = approveSchema.parse(body);
  const result = await approvePayment(admin, id, note, log);
  return ok(result, 'Pembayaran disetujui dan e-ticket diterbitkan.');
});
