import { route, ok, parseJson } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { contactIdSchema, updateContactSchema } from '@/server/contact/schemas';
import { updateContactStatus } from '@/server/contact/service';

export const PATCH = route('admin.contact.update', async (request, { params }, { log }) => {
  const admin = await requireRole('ADMIN');
  const id = contactIdSchema.parse((await params).id);
  const { status } = await parseJson(request, updateContactSchema);
  return ok({ message: await updateContactStatus(admin, id, status, log) }, 'Status pesan diperbarui.');
});
