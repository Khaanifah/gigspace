import { route, ok } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { curationIdSchema } from '@/server/curation/schemas';
import { approveEvent } from '@/server/curation/service';

export const POST = route('admin.events.approve', async (_request, { params }, { log }) => {
  const admin = await requireRole('ADMIN');
  const id = curationIdSchema.parse((await params).id);
  return ok({ event: await approveEvent(admin, id, log) }, 'Acara disetujui dan sudah tayang.');
});
