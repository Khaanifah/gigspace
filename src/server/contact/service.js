import { prisma } from '@/lib/prisma';
import { AppError } from '@/server/http';
import { createNotifications, adminRecipientIds } from '@/server/notifications/outbox';
import { COOPERATION_SUBJECT } from '@/server/contact/schemas';

// Pesan disimpan + admin diberi notifikasi (in-app + outbox) dalam satu transaksi.
export async function createContactMessage(input, log) {
  const created = await prisma.$transaction(async (tx) => {
    const message = await tx.contactMessage.create({ data: input });
    await createNotifications(tx, {
      recipients: await adminRecipientIds(tx),
      type: 'CONTACT_NEW',
      entityId: message.id,
      title: input.subject === COOPERATION_SUBJECT ? 'Pengajuan kerjasama baru' : 'Pesan kontak baru',
      body: `${input.name} · ${input.subject}`, // tanpa email/isi pesan agar tidak bocor lewat push
      url: '/admin/contact',
    });
    return message;
  });
  log?.info({ contactId: created.id, subject: input.subject }, 'pesan kontak diterima');
  return { id: created.id };
}

function toView(m) {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    message: m.message,
    status: m.status,
    isCooperation: m.subject === COOPERATION_SUBJECT,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function listContactMessages({ page, pageSize, status, subject, q }) {
  const where = {
    ...(status ? { status } : {}),
    ...(subject ? { subject } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { message: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, rows, grouped] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contactMessage.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const counts = { NEW: 0, READ: 0, REPLIED: 0 };
  for (const g of grouped) counts[g.status] = g._count._all;

  return {
    items: rows.map(toView),
    counts, // jumlah per status (tidak terpengaruh filter)
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function updateContactStatus(admin, id, status, log) {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new AppError('CONTACT_NOT_FOUND', 'Pesan tidak ditemukan.', 404);

    const message = await tx.contactMessage.update({ where: { id }, data: { status } });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'contact.status',
        entity: 'contact_message',
        entityId: id,
        metadata: { from: existing.status, to: status },
      },
    });
    return message;
  });
  log?.info({ contactId: id, status, adminId: admin.id }, 'status pesan kontak diubah');
  return toView(updated);
}
