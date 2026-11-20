import { prisma } from '@/lib/prisma';
import { AppError } from '@/server/http';
import { publicImageUrl } from '@/server/events/format';
import { sniffImage } from '@/server/payments/files';
import { createNotifications, adminRecipientIds } from '@/server/notifications/outbox';
import { uploadEventPosterFile, removeEventPosterFile, MAX_POSTER_BYTES } from '@/server/events/poster-storage';
import { getSalesByEvent } from '@/server/organizer/service';

const TX_OPTIONS = { timeout: 15_000, maxWait: 5_000 };

// Poster hanya boleh diganti selagi belum tayang; setelah PUBLISHED, gambar sudah lolos kurasi.
const POSTER_EDITABLE = ['DRAFT', 'PENDING_REVIEW', 'REJECTED'];

function slugify(text) {
  const base = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'acara';
}

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

// Akun EO yang dibuat lewat jalur lain (mis. peran diubah admin) mungkin belum punya profil.
async function ensureOrganizerProfile(tx, user) {
  const existing = await tx.organizerProfile.findUnique({ where: { userId: user.id } });
  if (existing) return existing;
  return tx.organizerProfile.create({
    data: { userId: user.id, organizationName: user.fullName || user.email.split('@')[0] },
  });
}

// ───────────── BUAT ACARA ─────────────

// Acara langsung masuk antrean kurasi (PENDING_REVIEW). Acara, venue, dan kategori tiket dibuat
// dalam satu transaksi: tidak ada acara setengah jadi. Jadwal jual: sejak dibuat sampai acara mulai.
export async function createEvent(user, input, log) {
  const now = new Date();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const event = await prisma.$transaction(async (tx) => {
        const genre = await tx.genre.findUnique({ where: { id: input.genreId } });
        if (!genre) throw new AppError('GENRE_NOT_FOUND', 'Genre tidak ditemukan.', 400);

        const profile = await ensureOrganizerProfile(tx, user);

        // Venue dicari berdasarkan nama + kota (tanpa membedakan huruf besar/kecil); dibuat bila belum ada.
        let venue = await tx.venue.findFirst({
          where: {
            name: { equals: input.venue.name, mode: 'insensitive' },
            city: { equals: input.venue.city, mode: 'insensitive' },
          },
        });
        if (!venue) venue = await tx.venue.create({ data: { name: input.venue.name, city: input.venue.city } });

        const created = await tx.event.create({
          data: {
            organizerId: profile.id,
            genreId: genre.id,
            venueId: venue.id,
            title: input.title,
            slug: `${slugify(input.title)}-${randomSuffix()}`,
            description: input.description,
            terms: input.terms || null,
            startsAt: input.startsAt,
            endsAt: input.endsAt ?? null,
            status: 'PENDING_REVIEW',
            ticketTypes: {
              create: input.ticketTypes.map((t) => ({
                name: t.name,
                price: t.price,
                quota: t.quota,
                saleStartsAt: now,
                saleEndsAt: input.startsAt,
              })),
            },
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: 'event.create',
            entity: 'event',
            entityId: created.id,
            metadata: { title: created.title, ticketTypes: input.ticketTypes.length },
          },
        });

        await createNotifications(tx, {
          recipients: await adminRecipientIds(tx),
          type: 'EVENT_SUBMITTED',
          entityId: created.id,
          title: 'Pengajuan acara baru',
          body: `"${created.title}" menunggu kurasi.`,
          url: '/admin/curation',
        });

        return created;
      }, TX_OPTIONS);

      log?.info({ eventId: event.id, by: user.id }, 'acara diajukan');
      return { id: event.id, slug: event.slug, title: event.title, status: event.status };
    } catch (err) {
      if (err?.code === 'P2002' && attempt < 2) continue; // slug bentrok (sangat jarang): coba suffix lain
      throw err;
    }
  }
  throw new AppError('SLUG_CONFLICT', 'Gagal membuat acara. Silakan coba lagi.', 409);
}

// ───────────── POSTER ─────────────

export async function uploadEventPoster(user, eventId, file, log) {
  if (file.size === 0) throw new AppError('FILE_EMPTY', 'File poster kosong.', 400);
  if (file.size > MAX_POSTER_BYTES) throw new AppError('FILE_TOO_LARGE', 'Ukuran poster maksimal 5 MB.', 413);

  // Pemilik acara (atau admin). Acara milik orang lain dijawab 404 agar keberadaannya tidak bocor.
  const event = await prisma.event.findFirst({
    where: { id: eventId, ...(user.role === 'ADMIN' ? {} : { organizer: { userId: user.id } }) },
    select: { id: true, status: true, posterPath: true },
  });
  if (!event) throw new AppError('EVENT_NOT_FOUND', 'Acara tidak ditemukan.', 404);
  if (!POSTER_EDITABLE.includes(event.status)) {
    throw new AppError('EVENT_LOCKED', 'Poster tidak bisa diganti setelah acara tayang.', 409);
  }

  // Tipe file dicek dari isinya (magic bytes), bukan dari nama atau Content-Type kiriman klien.
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = sniffImage(buffer);
  if (!mime) throw new AppError('FILE_TYPE', 'Poster harus berupa gambar JPG atau PNG.', 400);

  const path = await uploadEventPosterFile({ eventId, buffer, mime });
  try {
    await prisma.event.update({ where: { id: eventId }, data: { posterPath: path } });
  } catch (err) {
    await removeEventPosterFile(path).catch(() => {}); // jangan tinggalkan file yatim
    throw err;
  }
  await removeEventPosterFile(event.posterPath).catch(() => {}); // poster lama dihapus setelah yang baru aman

  log?.info({ eventId, by: user.id }, 'poster diunggah');
  return { posterUrl: publicImageUrl(path) };
}

// ───────────── DAFTAR ACARA EO ─────────────

// Dipanggil langsung oleh halaman server /organizer/events. Status asli dari database.
export async function listOrganizerEvents(user) {
  const profile = await prisma.organizerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { profile: null, events: [] };

  const [events, sales] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        venue: { select: { name: true, city: true } },
        ticketTypes: { select: { quota: true } },
      },
    }),
    getSalesByEvent(profile.id),
  ]);

  return {
    profile,
    events: events.map((ev) => {
      const s = sales.get(ev.id) ?? { sold: 0, revenue: 0 };
      return {
        id: ev.id,
        title: ev.title,
        status: ev.status, // DRAFT | PENDING_REVIEW | PUBLISHED | REJECTED | CANCELLED | COMPLETED
        rejectReason: ev.status === 'REJECTED' ? ev.rejectReason : null,
        startsAt: ev.startsAt,
        venueName: ev.venue ? `${ev.venue.name}, ${ev.venue.city}` : 'Lokasi menyusul',
        sold: s.sold,
        revenue: s.revenue,
        quota: ev.ticketTypes.reduce((sum, t) => sum + t.quota, 0),
      };
    }),
  };
}
