import { route, ok, parseJson, AppError } from '@/server/http';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/server/auth/session';
import { rateLimit } from '@/server/rate-limit';
import { checkInSchema } from '@/server/tickets/schemas';
import { checkInTicket } from '@/server/tickets/service';

export const POST = route('organizer.checkin', async (request, _ctx, { log }) => {
  const user = await requireRole('ORGANIZER', 'ADMIN');
  rateLimit(`checkin:${user.id}`, { limit: 120, windowMs: 60 * 1000 }); // cegah tebak-tebak token/kode
  const input = await parseJson(request, checkInSchema);

  let token = input.token;
  if (!token) {
    // Cadangan manual: petugas mengetik kode tiket yang tercetak di e-ticket. Kode diubah menjadi
    // token, lalu SEMUA pemeriksaan (kepemilikan acara, status, kedaluwarsa, penjaga atomik)
    // tetap dijalankan di checkInTicket, satu jalur yang sama dengan pemindaian QR.
    const found = await prisma.ticket.findUnique({ where: { code: input.code }, select: { qrToken: true } });
    if (!found) throw new AppError('TICKET_NOT_FOUND', 'Tiket tidak valid.', 404); // pesan sama dengan jalur QR
    token = found.qrToken;
  }

  return ok({ ticket: await checkInTicket(user, token, log) }, 'Check-in berhasil.');
});
