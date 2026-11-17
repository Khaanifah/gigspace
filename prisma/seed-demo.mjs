// Data DEMO agar halaman Home/Discover/Detail tidak kosong saat pengembangan.
// Jalankan: node --env-file=.env prisma/seed-demo.mjs
// Aman dijalankan ulang: event demo (slug diawali "demo-") dihapus lalu dibuat ulang dengan tanggal baru.
// Hapus semua data demo nanti dengan menghapus event ber-slug "demo-%" lewat panel admin/SQL.
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const at = (base, days, hour = 0) => new Date(base + days * DAY + hour * 60 * 60 * 1000);

const IMG = (id, w = 1400) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop`;
const POSTERS = ['photo-1514525253161-7a46d19cd819', 'photo-1501281668745-f7f57925c3b4', 'photo-1493225457124-a3eb161ffa5f'];
const GALLERY = ['photo-1514525253161-7a46d19cd819', 'photo-1459749411175-04bf5292ceea', 'photo-1470229722913-7c0e2dbbafd3'];

const DESCRIPTION =
  'Pertunjukan musik intim yang mempertemukan musisi independen pilihan dengan penikmat skena lokal. Saksikan penampilan spesial secara langsung dengan tata suara dan pencahayaan panggung yang dirancang khusus untuk menciptakan suasana malam yang berkesan.';
const TERMS =
  'Satu kode QR berlaku untuk satu orang pengunjung. Penukaran tiket dibuka 2 jam sebelum gerbang konser dibuka. Penyelenggara berhak menolak masuk pengunjung yang tidak mematuhi tata tertib keselamatan di area venue.';

const EVENTS = [
  { slug: 'demo-lalala-festival', title: 'LaLaLa Festival', genre: 'Indie', venue: 0, inDays: 3, hour: 16.5 },
  { slug: 'demo-senja-di-kota-tua', title: 'Senja di Kota Tua', genre: 'Indie', venue: 0, inDays: 5, hour: 18 },
  { slug: 'demo-riuh-rock-fest', title: 'Riuh Rock Fest', genre: 'Rock', venue: 1, inDays: 6, hour: 17 },
  { slug: 'demo-malam-akustik', title: 'Solo Session: Malam Akustik', genre: 'Solo', venue: 1, inDays: 9, hour: 19 },
  { slug: 'demo-orkestra-nusantara', title: 'Orkestra Nusantara Live', genre: 'Classic', venue: 0, inDays: 14, hour: 19.5 },
  { slug: 'demo-indie-garden-party', title: 'Indie Garden Party', genre: 'Indie', venue: 1, inDays: 18, hour: 15 },
  { slug: 'demo-gelombang-rock-night', title: 'Gelombang Rock Night', genre: 'Rock', venue: 0, inDays: 22, hour: 20 },
  { slug: 'demo-suara-tunggal', title: 'Suara Tunggal', genre: 'Solo', venue: 0, inDays: 27, hour: 19 },
  { slug: 'demo-classic-nights', title: 'Classic Nights', genre: 'Classic', venue: 1, inDays: 33, hour: 19 },
  { slug: 'demo-panggung-pesisir', title: 'Panggung Pesisir', genre: 'Rock', venue: 1, inDays: 41, hour: 16 },
];

function ticketTypes(eventStart, now) {
  const closeOnSale = eventStart - 2 * DAY; // penjualan reguler ditutup 2 hari sebelum acara
  return [
    { name: 'Presale 1', price: 150000, quota: 40, sold: 40, start: now - 30 * DAY, end: now - 10 * DAY },
    { name: 'Presale 2', price: 190000, quota: 50, sold: 12, start: now - 5 * DAY, end: closeOnSale },
    { name: 'Bundle 2 Tiket', price: 360000, quota: 30, sold: 4, start: now - 5 * DAY, end: closeOnSale },
    { name: 'Bundle 4 Tiket', price: 700000, quota: 20, sold: 0, start: now - 5 * DAY, end: closeOnSale },
    { name: 'Presale 3', price: 220000, quota: 100, sold: 0, start: closeOnSale, end: eventStart - DAY },
    { name: 'OTS', price: 250000, quota: 50, sold: 0, start: eventStart - DAY, end: eventStart },
  ];
}

async function main() {
  const [genres, venues] = await Promise.all([prisma.genre.findMany(), prisma.venue.findMany({ orderBy: { name: 'asc' } })]);
  if (!genres.length || !venues.length) throw new Error('Genre/venue kosong. Jalankan dulu: npx prisma db seed');

  // Organizer demo (bukan akun yang bisa dipakai login; hanya pemilik data demo).
  const email = 'organizer-demo@gigspace.local';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { authUserId: randomUUID(), email, fullName: 'Organizer Demo', role: 'ORGANIZER' } });
  }
  let organizer = await prisma.organizerProfile.findUnique({ where: { userId: user.id } });
  if (!organizer) {
    organizer = await prisma.organizerProfile.create({
      data: { userId: user.id, organizationName: 'PT Indo The Nusantara', description: 'Organizer data demo' },
    });
  }

  // Reset event demo lama (gagal bila sudah ada pesanan yang memakainya: itu disengaja).
  await prisma.event.deleteMany({ where: { slug: { startsWith: 'demo-' } } });

  const now = Date.now();
  for (const [i, e] of EVENTS.entries()) {
    const genre = genres.find((g) => g.name === e.genre) ?? genres[0];
    const venue = venues[e.venue % venues.length];
    // Jam acara dihitung dalam WIB (UTC+7): tengah malam WIB pada hari target + jam acara.
    const wib = new Date(at(now, e.inDays) + 7 * 3600000);
    const midnightWib = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - 7 * 3600000;
    const startsAt = new Date(midnightWib + e.hour * 3600000);
    const tickets = ticketTypes(startsAt.getTime(), now);

    await prisma.event.create({
      data: {
        organizerId: organizer.id,
        genreId: genre.id,
        venueId: venue.id,
        title: e.title,
        slug: e.slug,
        description: DESCRIPTION,
        terms: TERMS,
        startsAt,
        status: 'PUBLISHED',
        posterPath: IMG(POSTERS[i % POSTERS.length]),
        images: { create: GALLERY.map((g, n) => ({ storagePath: IMG(g, 1600), sortOrder: n })) },
        ticketTypes: {
          create: tickets.map((t) => ({
            name: t.name,
            price: t.price,
            quota: t.quota,
            sold: t.sold,
            saleStartsAt: new Date(t.start),
            saleEndsAt: new Date(t.end),
          })),
        },
      },
    });
  }
  console.log(`Seed demo selesai: ${EVENTS.length} event.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
