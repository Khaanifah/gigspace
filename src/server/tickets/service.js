import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/server/http';
import { dateLabel, timeLabel, publicImageUrl } from '@/server/events/format';

const SIX_HOURS = 6 * 60 * 60 * 1000;

// Batas akhir acara: endsAt, atau 6 jam setelah mulai bila endsAt tidak diisi.
export function eventEndsAt(event) {
  return event.endsAt ?? new Date(event.startsAt.getTime() + SIX_HOURS);
}

const groupInclude = {
  items: {
    orderBy: { ticketNameSnapshot: 'asc' },
    include: {
      tickets: { orderBy: { code: 'asc' } },
      ticketType: { include: { event: { include: { venue: true } } } },
    },
  },
};

// Bentuk respons mengikuti model yang dipakai halaman My Tickets (pesanan = kumpulan tiket).
function toGroupView(order) {
  const event = order.items[0]?.ticketType.event;
  const tickets = order.items.flatMap((item) =>
    item.tickets.map((t) => ({
      ticketCode: t.code,
      category: item.ticketNameSnapshot,
      isScanned: t.status === 'USED',
      status: t.status,
    }))
  );
  return {
    id: order.code,
    transactionCode: order.code,
    eventTitle: event?.title ?? '',
    location: event ? `${event.venue.name}, ${event.venue.city}` : '',
    dateLabel: event ? dateLabel(event.startsAt) : '',
    timeLabel: event ? timeLabel(event.startsAt) : '',
    image: event ? publicImageUrl(event.posterPath) : null,
    quantity: tickets.length,
    isScanned: tickets.length > 0 && tickets.every((t) => t.isScanned),
    eventTimestamp: event ? eventEndsAt(event).toISOString() : null, // tiket kedaluwarsa setelah acara berakhir
    items: tickets,
  };
}

export async function listMyTicketGroups(user, { page, pageSize }) {
  const where = { userId: user.id, status: 'PAID' };
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: groupInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return {
    items: rows.map(toGroupView),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

// Hanya pemilik pesanan; milik orang lain dijawab 404 (cegah IDOR).
export async function getTicketGroup(user, orderCode) {
  const order = await prisma.order.findFirst({
    where: { code: orderCode, userId: user.id, status: 'PAID' },
    include: groupInclude,
  });
  if (!order) throw new AppError('TICKET_NOT_FOUND', 'Tiket tidak ditemukan.', 404);
  return toGroupView(order);
}

// QR dibuat di server. Isinya token acak (bukan ID database), jadi tidak bisa ditebak.
export async function getTicketQrSvg(user, ticketCode) {
  const ticket = await prisma.ticket.findFirst({ where: { code: ticketCode, ownerId: user.id } });
  if (!ticket || ticket.status === 'CANCELLED') throw new AppError('TICKET_NOT_FOUND', 'Tiket tidak ditemukan.', 404);
  return QRCode.toString(`GS:${ticket.qrToken}`, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}

// Check-in: hanya organizer pemilik event (atau admin). Atomik: dua pemindaian bersamaan, satu berhasil.
export async function checkInTicket(user, qrToken, log) {
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken },
    include: {
      event: { include: { organizer: true } },
      checkin: true,
      orderItem: { include: { order: true } },
    },
  });
  if (!ticket) throw new AppError('TICKET_NOT_FOUND', 'Tiket tidak valid.', 404);

  const isOwner = ticket.event.organizer.userId === user.id;
  if (user.role !== 'ADMIN' && !isOwner) {
    throw new AppError('FORBIDDEN', 'Anda tidak berwenang melakukan check-in untuk acara ini.', 403);
  }

  if (ticket.status === 'CANCELLED') throw new AppError('TICKET_CANCELLED', 'Tiket ini sudah dibatalkan.', 409);
  if (ticket.status === 'USED') {
    throw new AppError('TICKET_ALREADY_USED', 'Tiket ini sudah digunakan.', 409);
  }
  if (ticket.event.status === 'CANCELLED') throw new AppError('EVENT_CANCELLED', 'Acara ini dibatalkan.', 409);
  if (Date.now() > eventEndsAt(ticket.event).getTime()) {
    throw new AppError('TICKET_EXPIRED', 'Acara sudah berakhir, tiket tidak berlaku.', 409);
  }

  let checkedInAt;
  try {
    checkedInAt = await prisma.$transaction(async (tx) => {
      // Penjaga atomik: hanya satu pemindaian yang bisa memindahkan ACTIVE -> USED.
      const guard = await tx.ticket.updateMany({ where: { id: ticket.id, status: 'ACTIVE' }, data: { status: 'USED' } });
      if (guard.count === 0) throw new AppError('TICKET_ALREADY_USED', 'Tiket ini sudah digunakan.', 409);

      const record = await tx.ticketCheckin.create({ data: { ticketId: ticket.id, checkedBy: user.id } });
      await tx.auditLog.create({
        data: { actorId: user.id, action: 'ticket.checkin', entity: 'ticket', entityId: ticket.id, metadata: { code: ticket.code } },
      });
      return record.checkedInAt;
    });
  } catch (err) {
    if (err?.code === 'P2002') throw new AppError('TICKET_ALREADY_USED', 'Tiket ini sudah digunakan.', 409);
    throw err;
  }

  log?.info({ ticketId: ticket.id, by: user.id }, 'check-in berhasil');
  return {
    ticketCode: ticket.code,
    category: ticket.orderItem.ticketNameSnapshot,
    holderName: ticket.orderItem.order.buyerName,
    eventTitle: ticket.event.title,
    checkedInAt: checkedInAt.toISOString(),
  };
}
