// Bukti anti-overselling: 20 pembeli berebut tiket berkuota 5 pada saat yang sama.
// Memakai pernyataan UPDATE bersyarat yang SAMA dengan yang dipakai API saat membuat pesanan.
// Jalankan: node --env-file=.env scripts/race-test.mjs   (butuh data demo: node --env-file=.env prisma/seed-demo.mjs)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const QUOTA = 5;
const BUYERS = 20;

async function main() {
  const event = await prisma.event.findFirst({ where: { slug: 'demo-lalala-festival' } });
  if (!event) throw new Error('Event demo tidak ada. Jalankan seed-demo dulu.');

  const day = 24 * 3600 * 1000;
  const type = await prisma.ticketType.create({
    data: {
      eventId: event.id,
      name: 'RACE TEST',
      price: 1000,
      quota: QUOTA,
      saleStartsAt: new Date(Date.now() - day),
      saleEndsAt: new Date(Date.now() + day),
    },
  });

  try {
    const results = await Promise.all(
      Array.from({ length: BUYERS }, () =>
        prisma.$transaction(async (tx) => {
          const affected = await tx.$executeRaw`
            UPDATE ticket_types
               SET reserved = reserved + 1, updated_at = now()
             WHERE id = ${type.id}::uuid
               AND is_active
               AND sale_starts_at <= now()
               AND sale_ends_at >= now()
               AND quota - reserved - sold >= 1`;
          return affected === 1;
        })
      )
    );

    const success = results.filter(Boolean).length;
    const final = await prisma.ticketType.findUnique({ where: { id: type.id } });
    console.log(`Pembeli bersamaan : ${BUYERS}`);
    console.log(`Kuota             : ${QUOTA}`);
    console.log(`Berhasil reservasi: ${success}`);
    console.log(`Ditolak (habis)   : ${BUYERS - success}`);
    console.log(`reserved di DB    : ${final.reserved}`);
    console.log(success === QUOTA && final.reserved === QUOTA ? 'HASIL: AMAN, tidak ada overselling.' : 'HASIL: ADA MASALAH!');
  } finally {
    await prisma.ticketType.delete({ where: { id: type.id } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
