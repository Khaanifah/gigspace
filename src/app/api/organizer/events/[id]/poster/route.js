import { route, ok, AppError } from '@/server/http';
import { requireRole } from '@/server/auth/session';
import { rateLimit } from '@/server/rate-limit';
import { eventIdSchema } from '@/server/organizer/events-schemas';
import { uploadEventPoster } from '@/server/organizer/events-service';
import { MAX_POSTER_BYTES } from '@/server/events/poster-storage';

export const POST = route('organizer.events.poster', async (request, { params }, { log }) => {
  const user = await requireRole('ORGANIZER', 'ADMIN');
  rateLimit(`event-poster:${user.id}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  const eventId = eventIdSchema.parse((await params).id);

  // Tolak lebih awal bila ukuran tubuh request jelas melebihi batas (file + overhead form).
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_POSTER_BYTES + 512 * 1024) {
    throw new AppError('FILE_TOO_LARGE', 'Ukuran poster maksimal 5 MB.', 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    throw new AppError('INVALID_FORM', 'Format unggahan tidak valid.', 400);
  }
  const file = form.get('file');
  if (!(file instanceof File)) throw new AppError('FILE_REQUIRED', 'File poster wajib diunggah.', 400);

  return ok(await uploadEventPoster(user, eventId, file, log), 'Poster berhasil diunggah.');
});
