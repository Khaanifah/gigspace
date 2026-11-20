import { prisma } from '@/lib/prisma';
import { AppError } from '@/server/http';
import { publicImageUrl } from '@/server/events/format';
import { createNotifications } from '@/server/notifications/outbox';

const TX_OPTIONS = { timeout: 15_000, maxWait: 5_000 };

const GROUP_STATUSES = {
  pending: ['PENDING_REVIEW'],
  approved: ['PUBLISHED', 'COMPLETED'],
  rejected: ['REJECTED'],
};
const CURATION_STATUSES = Object.values(GROUP_STATUSES).flat();

function groupOf(status) {
  return Object.keys(GROUP_STATUSES).find((g) => GROUP_STATUSES[g].includes(status));
}

function toView(ev) {
  return {
    id: ev.id,
    title: ev.title,
    genre: ev.genre.name,
    organizer: ev.organizer.organizationName,
    organizerEmail: ev.organizer.user.email,
    venue: `${ev.venue.name}, ${ev.venue.city}`,
    startsAt: ev.startsAt.toISOString(),
    submittedAt: ev.createdAt.toISOString(),
    status: ev.status,
    group: groupOf(ev.status), // pending | approved | rejected
    rejectReason: ev.rejectReason,
    image: publicImageUrl(ev.posterPath),
    description: ev.description,
    tickets: ev.ticketTypes.map((t) => ({ name: t.name, price: t.price, quota: t.quota })),
  };
}

const listInclude = {
  genre: { select: { name: true } },
  venue: { select: { name: true, city: true } },
  organizer: { select: { organizationName: true, user: { select: { email: true } } } },
  ticketTypes: { select: { name: true, price: true, quota: true }, orderBy: { price: 'asc' } },
};

// ───────────── DAFTAR ANTREAN ─────────────

export async function listCuration({ page, pageSize, group, q }) {
  const where = {
    status: { in: group ? GROUP_STATUSES[group] : CURATION_STATUSES },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { organizer: { organizationName: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, rows, grouped] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      include: listInclude,
      // antrean menunggu: yang paling lama diajukan di atas; tab lain: terbaru dulu
      orderBy: [{ createdAt: group === 'pending' ? 'asc' : 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    // jumlah per kelompok untuk kartu KPI & tab: tidak terpengaruh filter/pencarian
    prisma.event.groupBy({ by: ['status'], where: { status: { in: CURATION_STATUSES } }, _count: { _all: true } }),
  ]);

  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const g of grouped) counts[groupOf(g.status)] += g._count._all;

  return {
    items: rows.map(toView),
    counts,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

// ───────────── KEPUTUSAN ─────────────

export async function approveEvent(admin, eventId, log) {
  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { organizer: { select: { userId: true } }, ticketTypes: { select: { id: true } } },
    });
    if (!event) throw new AppError('EVENT_NOT_FOUND', 'Acara tidak ditemukan.', 404);

    // Pemeriksaan kelayakan tayang: acara tanpa poster/tiket/jadwal valid akan merusak halaman publik.
    if (event.status === 'PENDING_REVIEW') {
      if (!event.posterPath) throw new AppError('POSTER_REQUIRED', 'Acara belum memiliki poster. Tolak pengajuan agar EO melengkapinya.', 409);
      if (event.ticketTypes.length === 0) throw new AppError('TICKETS_REQUIRED', 'Acara belum memiliki kategori tiket.', 409);
      if ((event.endsAt ?? event.startsAt).getTime() <= Date.now()) {
        throw new AppError('EVENT_PAST', 'Jadwal acara sudah lewat. Tolak pengajuan ini.', 409);
      }
    }

    // Penjaga: hanya PENDING_REVIEW yang bisa diputuskan, dan hanya sekali.
    // Dua admin menekan tombol bersamaan -> satu berhasil, satu mendapat 409.
    const guard = await tx.event.updateMany({
      where: { id: eventId, status: 'PENDING_REVIEW' },
      data: { status: 'PUBLISHED', rejectReason: null },
    });
    if (guard.count === 0) throw new AppError('EVENT_NOT_REVIEWABLE', 'Pengajuan ini sudah diputuskan.', 409);

    await tx.auditLog.create({
      data: { actorId: admin.id, action: 'event.approve', entity: 'event', entityId: eventId, metadata: { title: event.title } },
    });

    await createNotifications(tx, {
      recipients: [event.organizer.userId],
      type: 'EVENT_APPROVED',
      entityId: eventId,
      title: 'Acara disetujui',
      body: `"${event.title}" sudah tayang dan tiketnya bisa dibeli.`,
      url: '/organizer/events',
    });

    return { id: eventId, title: event.title };
  }, TX_OPTIONS);

  log?.info({ eventId, adminId: admin.id }, 'acara disetujui');
  return result;
}

export async function rejectEvent(admin, eventId, reason, log) {
  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { organizer: { select: { userId: true } } },
    });
    if (!event) throw new AppError('EVENT_NOT_FOUND', 'Acara tidak ditemukan.', 404);

    const guard = await tx.event.updateMany({
      where: { id: eventId, status: 'PENDING_REVIEW' },
      data: { status: 'REJECTED', rejectReason: reason },
    });
    if (guard.count === 0) throw new AppError('EVENT_NOT_REVIEWABLE', 'Pengajuan ini sudah diputuskan.', 409);

    await tx.auditLog.create({
      data: { actorId: admin.id, action: 'event.reject', entity: 'event', entityId: eventId, metadata: { title: event.title, reason } },
    });

    await createNotifications(tx, {
      recipients: [event.organizer.userId],
      type: 'EVENT_REJECTED',
      entityId: `${eventId}:${Date.now()}`, // aman bila nanti ada pengajuan ulang
      title: 'Acara ditolak',
      body: `"${event.title}" ditolak: ${reason}`,
      url: '/organizer/events?status=REJECTED',
    });

    return { id: eventId, title: event.title };
  }, TX_OPTIONS);

  log?.info({ eventId, adminId: admin.id }, 'acara ditolak');
  return result;
}
