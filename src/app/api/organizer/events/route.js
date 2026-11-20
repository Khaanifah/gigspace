import { route, ok, parseJson } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { rateLimit } from '@/server/rate-limit';
import { createEventSchema } from '@/server/organizer/events-schemas';
import { createEvent } from '@/server/organizer/events-service';

export const POST = route('organizer.events.create', async (request, _ctx, { log }) => {
  const user = await requireRole('ORGANIZER', 'ADMIN');
  rateLimit(`event-create:${user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  const input = await parseJson(request, createEventSchema);
  const event = await createEvent(user, input, log);
  return ok({ event }, 'Acara berhasil diajukan ke antrean kurasi.', 201);
});
