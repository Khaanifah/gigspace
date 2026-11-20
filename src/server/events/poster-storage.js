import 'server-only';
import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/server/http';

export const EVENT_IMAGES_BUCKET = 'event-images'; // bucket PUBLIK (dibaca lewat publicImageUrl)
export const MAX_POSTER_BYTES = 5 * 1024 * 1024; // 5 MB

// Poster ditulis server (service role). Nama file dibuat server: aman & tidak bentrok.
export async function uploadEventPosterFile({ eventId, buffer, mime }) {
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const path = `posters/${eventId}/${randomUUID()}.${ext}`;
  const { error } = await createSupabaseAdminClient()
    .storage.from(EVENT_IMAGES_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false, cacheControl: '31536000' });
  if (error) throw new AppError('STORAGE_FAILED', 'Gagal menyimpan poster. Silakan coba lagi.', 502);
  return path;
}

// Hanya menghapus file milik kita (path "posters/..."); URL penuh data demo dibiarkan.
export async function removeEventPosterFile(path) {
  if (!path || !path.startsWith('posters/')) return;
  await createSupabaseAdminClient().storage.from(EVENT_IMAGES_BUCKET).remove([path]);
}
