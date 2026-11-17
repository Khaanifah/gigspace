import { route, ok } from '@/server/http';
import { listGenres } from '@/server/events/service';

export const GET = route('genres.list', async () => ok({ items: await listGenres() }));
