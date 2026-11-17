import { route, ok } from '@/server/http';
import { listVenues } from '@/server/events/service';

export const GET = route('venues.list', async () => ok({ items: await listVenues() }));
