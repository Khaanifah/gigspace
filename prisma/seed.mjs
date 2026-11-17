// Data awal (referensi saja): genre, venue, metode pembayaran.
// Event, tiket, dan pesanan TIDAK di-seed; semuanya lewat fitur aplikasi.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genres = ['Indie', 'Rock', 'Solo', 'Classic'];

const venues = [
  { name: 'JIExpo Kemayoran', city: 'Jakarta Pusat', address: 'Kemayoran, Jakarta Pusat' },
  { name: 'PRPP Jawa Tengah', city: 'Semarang', address: 'Tawangmas, Semarang' },
];

// Nomor tujuan mengikuti data yang sebelumnya hardcode di frontend; ganti dengan rekening asli.
const paymentMethods = [
  { code: 'qris', name: 'QRIS', category: 'QRIS', accountNumber: 'ID102026GIGSPACE' },
  { code: 'shopeepay', name: 'ShopeePay', category: 'EWALLET', accountNumber: '0812-3456-7890' },
  { code: 'ovo', name: 'OVO', category: 'EWALLET', accountNumber: '0812-3456-7890' },
  { code: 'dana', name: 'DANA', category: 'EWALLET', accountNumber: '0812-3456-7890' },
  { code: 'linkaja', name: 'LinkAja', category: 'EWALLET', accountNumber: '0812-3456-7890' },
  { code: 'bri', name: 'BRI', category: 'BANK', accountNumber: 'VABRI1234567' },
  { code: 'cimb', name: 'CIMB NIAGA', category: 'BANK', accountNumber: 'VACIMB8890123' },
  { code: 'bni', name: 'BNI', category: 'BANK', accountNumber: 'VABNI98812345' },
  { code: 'bca', name: 'BCA', category: 'BANK', accountNumber: 'VABCA39012345' },
  { code: 'mandiri', name: 'Mandiri', category: 'BANK', accountNumber: 'VAMDR88901234' },
  { code: 'bsi', name: 'BSI', category: 'BANK', accountNumber: 'VABSI90012345' },
  { code: 'btn', name: 'BTN', category: 'BANK', accountNumber: 'VABTN20012345' },
  { code: 'danamon', name: 'Danamon', category: 'BANK', accountNumber: 'VADMN77012345' },
];

async function main() {
  for (const name of genres) {
    await prisma.genre.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const v of venues) {
    const exists = await prisma.venue.findFirst({ where: { name: v.name, city: v.city } });
    if (!exists) await prisma.venue.create({ data: v });
  }

  for (const [i, m] of paymentMethods.entries()) {
    await prisma.paymentMethod.upsert({
      where: { code: m.code },
      update: { name: m.name, category: m.category, accountNumber: m.accountNumber },
      create: { ...m, sortOrder: i },
    });
  }
}

main()
  .then(() => console.log('Seed selesai.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
