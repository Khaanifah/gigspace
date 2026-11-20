import { route, ok, parseJson } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { curationIdSchema, rejectCurationSchema } from '@/server/curation/schemas';
import { rejectEvent } from '@/server/curation/service';

export const POST = route('admin.events.reject', async (request, { params }, { log }) => {
  const admin = await requireRole('ADMIN');
  const id = curationIdSchema.parse((await params).id);
  const { reason } = await parseJson(request, rejectCurationSchema);
  return ok({ event: await rejectEvent(admin, id, reason, log) }, 'Pengajuan acara ditolak.');
});
