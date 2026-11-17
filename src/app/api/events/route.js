import { route, ok } from '@/server/http';
import { listEventsSchema } from '@/server/events/schemas';
import { listPublicEvents } from '@/server/events/service';

export const GET = route('events.list', async (request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = listEventsSchema.parse(params);
  return ok(await listPublicEvents(query));
});
