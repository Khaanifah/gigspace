import { route, ok } from '@/server/http';
import { getPublicEvent } from '@/server/events/service';

export const GET = route('events.detail', async (_request, { params }) => {
  const { slug } = await params; // params bersifat async di Next.js 16
  return ok({ event: await getPublicEvent(slug) });
});
