import { prisma } from '@/lib/prisma';

// ORGANIZER hanya melihat acara miliknya; ADMIN boleh meninjau semua (sama seperti aturan check-in).
function eventScope(user) {
  return user.role === 'ADMIN' ? {} : { organizer: { userId: user.id } };
}

const toNumber = (v) => Number(v) || 0;

// Terjual & pendapatan per acara milik satu organizer (Map<eventId, { sold, revenue }>).
// Dipakai bersama oleh dashboard dan daftar acara supaya angkanya selalu sama.
export async function getSalesByEvent(organizerProfileId) {
  const rows = await prisma.$queryRaw`
    SELECT tt.event_id AS "eventId",
           SUM(oi.quantity)::int AS sold,
           SUM(oi.quantity::bigint * oi.unit_price_snapshot)::bigint AS revenue
    FROM order_items oi
    JOIN orders o        ON o.id = oi.order_id
    JOIN ticket_types tt ON tt.id = oi.ticket_type_id
    JOIN events e        ON e.id = tt.event_id
    WHERE o.status = 'PAID' AND e.organizer_id = ${organizerProfileId}::uuid
    GROUP BY tt.event_id`;
  return new Map(rows.map((r) => [r.eventId, { sold: toNumber(r.sold), revenue: toNumber(r.revenue) }]));
}

// ───────────── DASHBOARD ─────────────

// Semua angka dihitung dari data nyata:
// - terjual & pendapatan: item pesanan berstatus PAID, memakai HARGA SAAT TRANSAKSI (snapshot),
//   bukan harga tiket sekarang, dan tanpa biaya layanan (itu bukan hak EO).
// - sisa kuota: hanya acara PUBLISHED (yang masih bisa dibeli), setelah dikurangi stok yang sedang dipesan.
export async function getOrganizerDashboard(user) {
  const empty = {
    profile: null,
    totals: { revenue: 0, sold: 0, remaining: 0 },
    eventCount: 0,
    activeEvents: [],
    chartItems: [],
  };

  const profile = await prisma.organizerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return empty;

  const [events, sales] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: profile.id },
      orderBy: { startsAt: 'desc' },
      include: {
        venue: { select: { name: true, city: true } },
        ticketTypes: { select: { quota: true, reserved: true, sold: true } },
      },
    }),
    getSalesByEvent(profile.id),
  ]);

  const salesByEvent = sales;

  const rows = events.map((ev) => {
    const s = salesByEvent.get(ev.id) ?? { sold: 0, revenue: 0 };
    return {
      id: ev.id,
      title: ev.title,
      status: ev.status,
      startsAt: ev.startsAt,
      venueName: ev.venue ? `${ev.venue.name}, ${ev.venue.city}` : 'Lokasi menyusul',
      sold: s.sold,
      revenue: s.revenue,
      quota: ev.ticketTypes.reduce((sum, t) => sum + t.quota, 0),
      remaining: ev.ticketTypes.reduce((sum, t) => sum + Math.max(0, t.quota - t.reserved - t.sold), 0),
    };
  });

  const published = rows.filter((r) => r.status === 'PUBLISHED');

  return {
    profile,
    totals: {
      revenue: rows.reduce((sum, r) => sum + r.revenue, 0),
      sold: rows.reduce((sum, r) => sum + r.sold, 0),
      remaining: published.reduce((sum, r) => sum + r.remaining, 0),
    },
    eventCount: rows.length,
    activeEvents: [...published].sort((a, b) => a.startsAt - b.startsAt), // yang paling dekat dulu
    chartItems: rows
      .filter((r) => r.status === 'PUBLISHED' || r.status === 'COMPLETED')
      .slice(0, 6)
      .map((r) => ({ label: r.title.slice(0, 8), fullTitle: r.title, sold: r.sold })),
  };
}

// ───────────── DATA PENONTON ─────────────

const STATUS_FILTER = { checked_in: 'USED', not_checked_in: 'ACTIVE' };

function toAttendeeView(t) {
  return {
    id: t.id,
    ticketCode: t.code,
    buyerName: t.orderItem.order.buyerName,
    ticketType: t.orderItem.ticketNameSnapshot,
    eventId: t.event.id,
    eventTitle: t.event.title,
    status: t.status, // ACTIVE | USED | CANCELLED | EXPIRED
    checkedIn: t.status === 'USED',
    checkedInAt: t.checkin?.checkedInAt?.toISOString() ?? null,
  };
}

// Tiket hanya ada setelah pembayaran disetujui, jadi setiap baris = penonton yang sah.
export async function listAttendees(user, { page, pageSize, eventId, status, q }) {
  const baseWhere = { event: eventScope(user), ...(eventId ? { eventId } : {}) };

  const where = {
    ...baseWhere,
    ...(status ? { status: STATUS_FILTER[status] } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { orderItem: { ticketNameSnapshot: { contains: q, mode: 'insensitive' } } },
            { orderItem: { order: { buyerName: { contains: q, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  const [total, rows, grouped, events] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { code: 'asc' }], // urutan stabil agar paginasi tidak melompat
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        status: true,
        event: { select: { id: true, title: true } },
        checkin: { select: { checkedInAt: true } },
        orderItem: { select: { ticketNameSnapshot: true, order: { select: { buyerName: true } } } },
      },
    }),
    // jumlah untuk kartu "Masuk x / y": tidak terpengaruh filter status & pencarian
    prisma.ticket.groupBy({ by: ['status'], where: baseWhere, _count: { _all: true } }),
    prisma.event.findMany({
      where: { ...eventScope(user), status: { in: ['PUBLISHED', 'COMPLETED', 'CANCELLED'] } },
      orderBy: { startsAt: 'desc' },
      take: 100,
      select: { id: true, title: true },
    }),
  ]);

  const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

  return {
    items: rows.map(toAttendeeView),
    counts: {
      total: grouped.reduce((sum, g) => sum + g._count._all, 0),
      checkedIn: byStatus.USED ?? 0,
    },
    events,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}
