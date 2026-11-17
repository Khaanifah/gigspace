import { PrismaClient } from '@prisma/client';

// Satu instance untuk seluruh proses; mencegah koneksi menumpuk saat hot reload.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__gigspacePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__gigspacePrisma = prisma;
}
