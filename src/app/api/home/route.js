import { route, ok } from '@/server/http';
import { getHomeFeed } from '@/server/events/service';

export const GET = route('home.feed', async () => ok(await getHomeFeed()));
