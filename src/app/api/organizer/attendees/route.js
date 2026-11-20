import { route, ok } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { listAttendeesSchema } from '@/server/organizer/schemas';
import { listAttendees } from '@/server/organizer/service';

export const GET = route('organizer.attendees.list', async (request) => {
  const user = await requireRole('ORGANIZER', 'ADMIN');
  const query = listAttendeesSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listAttendees(user, query));
});
