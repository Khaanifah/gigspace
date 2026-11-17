import { prisma } from '@/lib/prisma';
import { AppError } from '@/server/http';
import { logger } from '@/server/logger';
import { generateOrderCode } from '@/server/orders/code';
import {
  SERVICE_FEE,
  ORDER_TTL_MINUTES,
  MAX_PENDING_ORDERS_PER_USER,
} from '@/server/config';
import { dateLabel, timeLabel, publicImageUrl } from '@/server/events/format';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const orderInclude = {
  items: {
    orderBy: { ticketNameSnapshot: 'asc' },
    include: { ticketType: { include: { event: { include: { venue: true } } } } },
  },
  payment: { include: { method: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
};

// Bentuk respons disesuaikan dengan field yang sudah dipakai halaman checkout di frontend.
function toOrderView(order) {
  const event = order.items[0]?.ticketType.event;
  const method = order.payment?.method;
  return {
    id: order.code,
    uuid: order.id,
    code: order.code,
    status: order.status,
    expiresAt: order.expiresAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    eventId: event?.slug ?? null,
    eventTitle: event?.title ?? '',
    dateLabel: event ? dateLabel(event.startsAt) : '',
    timeLabel: event ? timeLabel(event.startsAt) : '',
    location: event ? `${event.venue.name}, ${event.venue.city}` : '',
    image: event ? publicImageUrl(event.posterPath) : null,
    items: order.items.map((i) => ({
      id: i.ticketTypeId,
      name: i.ticketNameSnapshot,
      price: i.unitPriceSnapshot,
      quantity: i.quantity,
    })),
    totalItems: order.items.reduce((s, i) => s + i.quantity, 0),
    subtotal: order.subtotal,
    serviceFee: order.serviceFee,
    totalPay: order.total,
    buyer: {
      fullName: order.buyerName,
      gender: order.buyerGender,
      whatsapp: order.buyerWhatsapp,
      email: order.buyerEmail,
    },
    paymentStatus: order.payment?.status ?? null,
    rejectionNote:
      order.payment?.status === 'REJECTED' ? (order.payment.verifications?.[0]?.note ?? null) : null,
    paymentMethod: method
      ? {
          id: method.code,
          name: method.name,
          category: method.category === 'BANK' ? 'bank' : 'ewallet', // QRIS termasuk kelompok e-wallet di UI
          accountNumber: method.accountNumber,
          accountName: method.accountName,
        }
      : null,
  };
}

// Mengembalikan stok yang direservasi. Pembaruan status bersifat kondisional
// (hanya dari PENDING), jadi aman dipanggil bersamaan/berulang: hanya satu yang berhasil.
async function releaseOrder(orderId, newStatus) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: newStatus },
    });
    if (count === 0) return false;

    const items = await tx.orderItem.findMany({ where: { orderId }, orderBy: { ticketTypeId: 'asc' } });
    for (const it of items) {
      await tx.ticketType.update({
        where: { id: it.ticketTypeId },
        data: { reserved: { decrement: it.quantity } },
      });
    }
    return true;
  });
}

// Pesanan kedaluwarsa dilepas secara "lazy" setiap ada aktivitas order.
// Pesanan yang bukti bayarnya sedang diperiksa admin TIDAK ikut kedaluwarsa.
export async function expireOverdueOrders(limit = 50) {
  const overdue = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
      // Pembayaran yang sedang diperiksa (UNDER_REVIEW) tidak ikut kedaluwarsa; yang ditolak tetap bisa kedaluwarsa.
      payment: { is: { status: { in: ['PENDING', 'REJECTED'] } } },
    },
    select: { id: true },
    take: limit,
  });
  let released = 0;
  for (const { id } of overdue) {
    if (await releaseOrder(id, 'EXPIRED')) released += 1;
  }
  if (released) logger.info({ module: 'orders.expire', released }, 'pesanan kedaluwarsa dilepas');
  return released;
}

function signature(items) {
  return items
    .map((i) => `${i.ticketTypeId}:${i.quantity}`)
    .sort()
    .join('|');
}

export async function createOrder(user, input, log) {
  await expireOverdueOrders();

  const now = new Date();
  const event = await prisma.event.findFirst({ where: { slug: input.eventSlug, status: 'PUBLISHED' } });
  if (!event) throw new AppError('EVENT_NOT_FOUND', 'Acara tidak ditemukan.', 404);
  if ((event.endsAt ?? event.startsAt) < now) throw new AppError('EVENT_ENDED', 'Acara ini sudah berakhir.', 409);

  const method = await prisma.paymentMethod.findFirst({ where: { code: input.paymentMethodCode, isActive: true } });
  if (!method) throw new AppError('PAYMENT_METHOD_INVALID', 'Metode pembayaran tidak tersedia.', 400);

  // Harga SELALU dari database.
  const ids = input.items.map((i) => i.ticketTypeId);
  const types = await prisma.ticketType.findMany({ where: { id: { in: ids }, eventId: event.id, isActive: true } });
  if (types.length !== ids.length) {
    throw new AppError('TICKET_INVALID', 'Ada tiket yang tidak valid untuk acara ini.', 400);
  }
  const typeById = new Map(types.map((t) => [t.id, t]));
  const lines = input.items
    .map((i) => ({ type: typeById.get(i.ticketTypeId), quantity: i.quantity }))
    .sort((a, b) => (a.type.id < b.type.id ? -1 : 1)); // urutan tetap -> hindari deadlock antar transaksi

  const subtotal = lines.reduce((s, l) => s + l.type.price * l.quantity, 0);
  const total = subtotal + SERVICE_FEE;

  // Cegah klik ganda: pesanan identik dalam 15 detik terakhir dikembalikan, bukan dibuat ulang.
  const recent = await prisma.order.findMany({
    where: { userId: user.id, status: 'PENDING', createdAt: { gte: new Date(Date.now() - 15_000) } },
    include: { items: true },
  });
  const wanted = signature(input.items);
  const duplicate = recent.find((o) => signature(o.items) === wanted);
  if (duplicate) {
    log?.warn({ orderId: duplicate.id }, 'permintaan ganda, mengembalikan pesanan yang sudah ada');
    return { order: await getOrder(user, duplicate.id), duplicate: true };
  }

  // Batasi pesanan belum dibayar per pengguna.
  const pendingCount = await prisma.order.count({ where: { userId: user.id, status: 'PENDING' } });
  if (pendingCount >= MAX_PENDING_ORDERS_PER_USER) {
    throw new AppError('TOO_MANY_PENDING_ORDERS', 'Anda memiliki terlalu banyak pesanan yang belum dibayar. Selesaikan atau batalkan dulu.', 429);
  }

  const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60_000);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        // Reservasi atomik: satu UPDATE bersyarat per jenis tiket. Dua request bersamaan tidak
        // bisa sama-sama lolos karena baris dikunci dan syarat sisa stok dicek ulang di dalam UPDATE.
        for (const { type, quantity } of lines) {
          const affected = await tx.$executeRaw`
            UPDATE ticket_types
               SET reserved = reserved + ${quantity}, updated_at = now()
             WHERE id = ${type.id}::uuid
               AND is_active
               AND sale_starts_at <= now()
               AND sale_ends_at >= now()
               AND quota - reserved - sold >= ${quantity}`;
          if (affected === 0) {
            throw new AppError('TICKET_UNAVAILABLE', `Tiket "${type.name}" tidak tersedia atau stok tidak mencukupi.`, 409);
          }
        }

        return tx.order.create({
          data: {
            code: generateOrderCode(),
            userId: user.id,
            subtotal,
            serviceFee: SERVICE_FEE,
            total,
            buyerName: input.buyer.fullName,
            buyerGender: input.buyer.gender,
            buyerWhatsapp: input.buyer.whatsapp,
            buyerEmail: input.buyer.email,
            expiresAt,
            items: {
              create: lines.map(({ type, quantity }) => ({
                ticketTypeId: type.id,
                ticketNameSnapshot: type.name,
                unitPriceSnapshot: type.price, // snapshot harga saat transaksi
                quantity,
              })),
            },
            payment: { create: { paymentMethodId: method.id, amount: total } },
          },
          include: orderInclude,
        });
      });
      log?.info({ orderId: created.id, code: created.code, total }, 'pesanan dibuat');
      return { order: toOrderView(created), duplicate: false };
    } catch (err) {
      const isCodeClash = err?.code === 'P2002' && String(err.meta?.target ?? '').includes('code');
      if (!isCodeClash || attempt === 2) throw err; // kode bentrok: coba lagi dengan kode baru
    }
  }
  throw new AppError('ORDER_FAILED', 'Gagal membuat pesanan.', 500);
}

// Mengambil pesanan MILIK pengguna (kode atau UUID). Pesanan orang lain dianggap tidak ada.
export async function findOwnedOrderRecord(user, idOrCode, include = {}) {
  const where = UUID_RE.test(idOrCode) ? { id: idOrCode } : { code: idOrCode.toUpperCase() };
  return prisma.order.findFirst({ where: { ...where, userId: user.id }, include });
}

// Hanya pemilik yang bisa melihat. Pesanan milik orang lain dijawab 404 (bukan 403)
// supaya keberadaannya tidak bocor (cegah IDOR).
export async function getOrder(user, idOrCode) {
  const where = UUID_RE.test(idOrCode) ? { id: idOrCode } : { code: idOrCode.toUpperCase() };
  const order = await prisma.order.findFirst({ where: { ...where, userId: user.id }, include: orderInclude });
  if (!order) throw new AppError('ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.', 404);
  return toOrderView(order);
}

export async function listOrders(user, { page, pageSize, status }) {
  await expireOverdueOrders();
  const where = { userId: user.id, ...(status ? { status } : {}) };
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return {
    items: rows.map(toOrderView),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function cancelOrder(user, idOrCode, log) {
  const where = UUID_RE.test(idOrCode) ? { id: idOrCode } : { code: idOrCode.toUpperCase() };
  const order = await prisma.order.findFirst({ where: { ...where, userId: user.id }, include: { payment: true } });
  if (!order) throw new AppError('ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.', 404);
  if (order.status !== 'PENDING') {
    throw new AppError('ORDER_NOT_CANCELLABLE', 'Pesanan ini tidak dapat dibatalkan.', 409);
  }
  if (order.payment && !['PENDING', 'REJECTED'].includes(order.payment.status)) {
    throw new AppError('ORDER_NOT_CANCELLABLE', 'Pembayaran sedang diperiksa, pesanan tidak dapat dibatalkan.', 409);
  }
  const released = await releaseOrder(order.id, 'CANCELLED');
  if (!released) throw new AppError('ORDER_NOT_CANCELLABLE', 'Pesanan ini tidak dapat dibatalkan.', 409);
  log?.info({ orderId: order.id }, 'pesanan dibatalkan pengguna');
  return getOrder(user, order.id);
}

export async function listPaymentMethods() {
  const rows = await prisma.paymentMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  return {
    serviceFee: SERVICE_FEE,
    // Nomor rekening sengaja tidak dikirim di sini; baru tampil di detail pesanan milik pengguna.
    items: rows.map((m) => ({ id: m.code, name: m.name, category: m.category === 'BANK' ? 'bank' : 'ewallet' })),
  };
}
