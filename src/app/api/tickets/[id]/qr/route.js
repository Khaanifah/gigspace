import { route } from '@/server/http';
import { requireUser } from '@/server/auth/session';
import { ticketCodeSchema } from '@/server/tickets/schemas';
import { getTicketQrSvg } from '@/server/tickets/service';

// [id] = kode tiket (mis. TK-7K2M9QXA). Mengembalikan gambar SVG, bisa langsung dipakai di <img src>.
export const GET = route('tickets.qr', async (_request, { params }) => {
  const user = await requireUser();
  const code = ticketCodeSchema.parse((await params).id);
  const svg = await getTicketQrSvg(user, code);
  return new Response(svg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'private, no-store' },
  });
});
