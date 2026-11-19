import { route, ok, parseJson } from '@/server/http';
import { rateLimit, clientIp } from '@/server/rate-limit';
import { createContactSchema } from '@/server/contact/schemas';
import { createContactMessage } from '@/server/contact/service';

// Publik (tanpa login), jadi dibatasi lajunya supaya tidak dipakai spam.
export const POST = route('contact.create', async (request, _ctx, { log }) => {
  rateLimit(`contact:ip:${clientIp(request)}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  const input = await parseJson(request, createContactSchema);
  rateLimit(`contact:email:${input.email}`, { limit: 3, windowMs: 60 * 60 * 1000 });

  await createContactMessage(input, log);
  return ok(null, 'Pesan Anda berhasil dikirim.', 201);
});
