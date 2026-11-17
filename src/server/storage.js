import 'server-only';
import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/server/http';

export const PROOF_BUCKET = 'payment-proofs'; // bucket PRIVAT

// Bukti pembayaran hanya ditulis/dibaca oleh server (service role). Browser tidak pernah
// memegang kredensial storage; admin melihat file lewat signed URL berumur pendek.
export async function uploadPaymentProof({ orderId, buffer, mime }) {
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const path = `orders/${orderId}/${randomUUID()}.${ext}`; // nama dibuat server: aman & tidak bentrok
  const { error } = await createSupabaseAdminClient()
    .storage.from(PROOF_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (error) throw new AppError('STORAGE_FAILED', 'Gagal menyimpan bukti pembayaran. Silakan coba lagi.', 502);
  return path;
}

export async function createProofSignedUrl(path, seconds = 120) {
  const { data, error } = await createSupabaseAdminClient().storage.from(PROOF_BUCKET).createSignedUrl(path, seconds);
  if (error) return null;
  return data.signedUrl;
}

export async function removeObject(bucket, path) {
  await createSupabaseAdminClient().storage.from(bucket).remove([path]);
}
