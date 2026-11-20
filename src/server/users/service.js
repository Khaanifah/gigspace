import { prisma } from '@/lib/prisma';
import { AppError } from '@/server/http';

function toView(u) {
  return {
    id: u.id,
    name: u.fullName || u.email.split('@')[0],
    email: u.email,
    phone: u.whatsapp ?? '-',
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function listUsers({ page, pageSize, role, status, q }) {
  const where = {
    ...(role ? { role } : {}),
    ...(status ? { isActive: status === 'active' } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, rows, grouped] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }), // jumlah per role, tidak terpengaruh filter
  ]);

  const counts = { USER: 0, ORGANIZER: 0, ADMIN: 0 };
  for (const g of grouped) counts[g.role] = g._count._all;

  return {
    items: rows.map(toView),
    counts,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function getUserDetail(id) {
  const u = await prisma.user.findUnique({
    where: { id },
    include: { organizerProfile: true, _count: { select: { orders: true, tickets: true } } },
  });
  if (!u) throw new AppError('USER_NOT_FOUND', 'Pengguna tidak ditemukan.', 404);
  return {
    ...toView(u),
    organizationName: u.organizerProfile?.organizationName ?? null,
    orderCount: u._count.orders,
    ticketCount: u._count.tickets,
  };
}

// Mengubah role / status akun. Semua aturan dicek di server, di dalam satu transaksi.
export async function updateUser(admin, id, changes, log) {
  const result = await prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) throw new AppError('USER_NOT_FOUND', 'Pengguna tidak ditemukan.', 404);

      const nextRole = changes.role ?? target.role;
      const nextActive = changes.isActive ?? target.isActive;
      if (nextRole === target.role && nextActive === target.isActive) return { user: target, changed: false };

      // Admin tidak boleh mengubah role atau menonaktifkan akunnya sendiri (cegah terkunci).
      if (target.id === admin.id && (nextRole !== target.role || nextActive === false)) {
        throw new AppError('SELF_MODIFICATION', 'Anda tidak dapat mengubah role atau menonaktifkan akun Anda sendiri.', 403);
      }

      // Jangan sampai sistem kehilangan admin aktif terakhir. Baris admin dikunci agar dua perubahan
      // bersamaan (dua admin saling menurunkan) tidak bisa sama-sama lolos.
      const losesAdmin = target.role === 'ADMIN' && target.isActive && (nextRole !== 'ADMIN' || nextActive === false);
      if (losesAdmin) {
        await tx.$queryRaw`SELECT id FROM users WHERE role = 'ADMIN'::"Role" AND is_active = true FOR UPDATE`;
        const others = await tx.user.count({ where: { role: 'ADMIN', isActive: true, id: { not: target.id } } });
        if (others === 0) {
          throw new AppError('LAST_ADMIN', 'Tidak dapat mengubah admin aktif terakhir. Angkat admin lain terlebih dahulu.', 409);
        }
      }

      const user = await tx.user.update({ where: { id }, data: { role: nextRole, isActive: nextActive } });

      // EO wajib punya profil organisasi agar bisa memiliki event.
      if (nextRole === 'ORGANIZER') {
        const profile = await tx.organizerProfile.findUnique({ where: { userId: id } });
        if (!profile) {
          await tx.organizerProfile.create({
            data: { userId: id, organizationName: target.fullName || target.email.split('@')[0] },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'user.update',
          entity: 'user',
          entityId: id,
          metadata: {
            from: { role: target.role, isActive: target.isActive },
            to: { role: nextRole, isActive: nextActive },
          },
        },
      });

      return { user, changed: true };
    },
    { timeout: 15_000, maxWait: 10_000 }
  );

  if (result.changed) log?.info({ targetId: id, adminId: admin.id }, 'pengguna diperbarui oleh admin');
  return toView(result.user);
}
