import { route, ok } from '@/server/http';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const POST = route('auth.logout', async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return ok(null, 'Anda telah keluar.');
});
