import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/server/http';
import { dateLabel, timeLabel, periodLabel, dayBadge, publicImageUrl } from '@/server/events/format';

// Whitelist urutan: input user hanya memilih kunci, tidak pernah disisipkan ke SQL.
const ORDERS = {
  newest: Prisma.sql`e.created_at DESC`,
  date: Prisma.sql`e.starts_at ASC`,
  'price-asc': Prisma.sql`min_price ASC NULLS LAST`,
  'price-desc': Prisma.sql`min_price DESC NULLS LAST`,
  popular: Prisma.sql`total_sold DESC, e.created_at DESC`,
};

const eventInclude = {
  genre: true,
  venue: true,
  organizer: true,
};

// Catatan: `id` berisi slug karena halaman frontend memakai /events/[id] dan kartu membuat link dari `id`.
// ID database asli ada di `uuid`.
function toCard(event, minPrice) {
  return {
    id: event.slug,
    uuid: event.id,
    slug: event.slug,
    title: event.title,
    organizer: event.organizer.organizationName,
    location: `${event.venue.name}, ${event.venue.city}`,
    genre: event.genre.name,
    price: minPrice ?? 0,
    image: publicImageUrl(event.posterPath),
    startsAt: event.startsAt.toISOString(),
    dateLabel: dateLabel(event.startsAt),
    timeLabel: timeLabel(event.startsAt),
  };
}

// Daftar event publik: hanya PUBLISHED dan belum lewat. Filter/sort/pagination dilakukan di database.
export async function listPublicEvents({ page, pageSize, genre, q, sort, days }) {
  const conditions = [
    Prisma.sql`e.status = 'PUBLISHED'::"EventStatus"`,
    Prisma.sql`COALESCE(e.ends_at, e.starts_at) >= now()`,
  ];
  if (genre) conditions.push(Prisma.sql`lower(g.name) = ${genre.toLowerCase()}`);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    conditions.push(Prisma.sql`(e.title ILIKE ${like} OR v.name ILIKE ${like} OR o.organization_name ILIKE ${like})`);
  }
  if (days) {
    conditions.push(Prisma.sql`e.starts_at BETWEEN now() AND now() + (${days}::int * interval '1 day')`);
  }
  const where = Prisma.join(conditions, ' AND ');
  const offset = (page - 1) * pageSize;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT e.id,
             MIN(t.price)::int AS min_price,
             COALESCE(SUM(t.sold), 0)::int AS total_sold
      FROM events e
      JOIN genres g ON g.id = e.genre_id
      JOIN venues v ON v.id = e.venue_id
      JOIN organizer_profiles o ON o.id = e.organizer_id
      LEFT JOIN ticket_types t ON t.event_id = e.id AND t.is_active
      WHERE ${where}
      GROUP BY e.id
      ORDER BY ${ORDERS[sort]}, e.id
      LIMIT ${pageSize} OFFSET ${offset}`,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM events e
      JOIN genres g ON g.id = e.genre_id
      JOIN venues v ON v.id = e.venue_id
      JOIN organizer_profiles o ON o.id = e.organizer_id
      WHERE ${where}`,
  ]);

  const total = countRows[0]?.total ?? 0;
  const ids = rows.map((r) => r.id);
  const priceById = new Map(rows.map((r) => [r.id, r.min_price]));

  // Satu query untuk semua relasi (hindari N+1), lalu urutkan sesuai hasil SQL.
  const events = ids.length
    ? await prisma.event.findMany({ where: { id: { in: ids } }, include: eventInclude })
    : [];
  const byId = new Map(events.map((e) => [e.id, e]));
  const items = ids.map((id) => toCard(byId.get(id), priceById.get(id))).filter(Boolean);

  return {
    items,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

function ticketStatus(ticket, now) {
  const available = Math.max(0, ticket.quota - ticket.reserved - ticket.sold);
  if (now < ticket.saleStartsAt) return 'not_released';
  if (available <= 0) return 'sold_out';
  if (now > ticket.saleEndsAt) return 'ended';
  return 'on_sale';
}

export async function getPublicEvent(slug) {
  const event = await prisma.event.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      ...eventInclude,
      images: { orderBy: { sortOrder: 'asc' } },
      ticketTypes: { where: { isActive: true }, orderBy: [{ saleStartsAt: 'asc' }, { price: 'asc' }] },
    },
  });
  if (!event) throw new AppError('EVENT_NOT_FOUND', 'Acara tidak ditemukan.', 404);

  const now = new Date();
  const minPrice = event.ticketTypes.length ? Math.min(...event.ticketTypes.map((t) => t.price)) : 0;

  return {
    ...toCard(event, minPrice),
    description: event.description,
    terms: event.terms ?? '',
    gallery: event.images.map((img) => publicImageUrl(img.storagePath)),
    ticketCategories: event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      period: periodLabel(t.saleStartsAt, t.saleEndsAt),
      price: t.price,
      quota: Math.max(0, t.quota - t.reserved - t.sold), // sisa yang bisa dipesan
      status: ticketStatus(t, now),
    })),
  };
}

export async function getHomeFeed() {
  const [popular, upcoming, week] = await Promise.all([
    listPublicEvents({ page: 1, pageSize: 8, sort: 'popular' }),
    listPublicEvents({ page: 1, pageSize: 4, sort: 'date' }),
    listPublicEvents({ page: 1, pageSize: 12, sort: 'date', days: 7 }),
  ]);

  // Kelompokkan event minggu ini per tanggal (urutan sudah terurut waktu mulai).
  const groups = [];
  for (const gig of week.items) {
    const badge = dayBadge(new Date(gig.startsAt));
    const last = groups[groups.length - 1];
    if (last && last.date === badge.date && last.month === badge.month) last.gigs.push(gig);
    else groups.push({ ...badge, gigs: [gig] });
  }

  return { popular: popular.items, upcoming: upcoming.items, thisWeek: groups };
}

export async function listGenres() {
  return prisma.genre.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });
}

export async function listVenues() {
  return prisma.venue.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, city: true, address: true } });
}
