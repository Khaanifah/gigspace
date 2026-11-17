import { route, ok, AppError } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { rateLimit } from '@/server/rate-limit';
import { submitPaymentProof } from '@/server/payments/service';
import { MAX_PROOF_BYTES } from '@/server/payments/files';

export const POST = route('payments.proof', async (request, { params }, { log }) => {
  const user = await requireUser();
  rateLimit(`proof:${user.id}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  const { id } = await params;

  // Tolak lebih awal bila ukuran tubuh request jelas melebihi batas (file 10 MB + overhead form).
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_PROOF_BYTES + 512 * 1024) {
    throw new AppError('FILE_TOO_LARGE', 'Ukuran file maksimal 10 MB.', 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    throw new AppError('INVALID_FORM', 'Format unggahan tidak valid.', 400);
  }
  const file = form.get('file');
  if (!(file instanceof File)) throw new AppError('FILE_REQUIRED', 'File bukti pembayaran wajib diunggah.', 400);

  const order = await submitPaymentProof(user, id, file, log);
  return ok({ order }, 'Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin.');
});
