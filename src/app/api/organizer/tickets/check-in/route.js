import { route, ok, parseJson } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { rateLimit } from '@/server/rate-limit';
import { checkInSchema } from '@/server/tickets/schemas';
import { checkInTicket } from '@/server/tickets/service';

export const POST = route('organizer.checkin', async (request, _ctx, { log }) => {
  const user = await requireRole('ORGANIZER', 'ADMIN');
  rateLimit(`checkin:${user.id}`, { limit: 120, windowMs: 60 * 1000 }); // cegah tebak-tebak token
  const { token } = await parseJson(request, checkInSchema);
  return ok({ ticket: await checkInTicket(user, token, log) }, 'Check-in berhasil.');
});
