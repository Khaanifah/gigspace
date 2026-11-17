import { prisma } from '@/lib/prisma';
import { AppError } from '@/server/http';
import { ORDER_TTL_MINUTES } from '@/server/config';
import { dateLabel, timeLabel } from '@/server/events/format';
import { expireOverdueOrders, findOwnedOrderRecord, getOrder } from '@/server/orders/service';
import { uploadPaymentProof, removeObject, createProofSignedUrl, PROOF_BUCKET } from '@/server/storage';
import { sniffImage, MAX_PROOF_BYTES } from '@/server/payments/files';
import { createNotifications, adminRecipientIds } from '@/server/notifications/outbox';
import { generateTicketCode, generateQrToken } from '@/server/tickets/codes';

// ───────────── SISI PEMBELI ─────────────

export async function submitPaymentProof(user, idOrCode, file, log) {
  await expireOverdueOrders();

  const order = await findOwnedOrderRecord(user, idOrCode, { payment: true });
  if (!order) throw new AppError('ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.', 404);
  if (order.status !== 'PENDING') {
    throw new AppError('ORDER_NOT_PAYABLE', 'Pesanan ini sudah tidak dapat dibayar.', 409);
  }
  if (!order.payment) throw new AppError('PAYMENT_NOT_FOUND', 'Data pembayaran tidak ditemukan.', 404);
  if (!['PENDING', 'REJECTED'].includes(order.payment.status)) {
    throw new AppError('PROOF_ALREADY_SUBMITTED', 'Bukti pembayaran sudah dikirim dan sedang diperiksa.', 409);
  }

  if (file.size === 0) throw new AppError('FILE_EMPTY', 'File kosong.', 400);
  if (file.size > MAX_PROOF_BYTES) throw new AppError('FILE_TOO_LARGE', 'Ukuran file maksimal 10 MB.', 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = sniffImage(buffer);
  if (!mime) throw new AppError('FILE_TYPE_INVALID', 'Format file tidak didukung. Unggah gambar JPG atau PNG.', 415);

  const storagePath = await uploadPaymentProof({ orderId: order.id, buffer, mime });

  try {
    await prisma.$transaction(async (tx) => {
      // Penjaga klik ganda: hanya satu permintaan yang berhasil memindahkan status ke UNDER_REVIEW.
      const guard = await tx.payment.updateMany({
        where: { id: order.payment.id, status: order.payment.status },
        data: { status: 'UNDER_REVIEW' },
      });
      if (guard.count === 0) {
        throw new AppError('PROOF_ALREADY_SUBMITTED', 'Bukti pembayaran sudah dikirim dan sedang diperiksa.', 409);
      }

      const proof = await tx.paymentProof.create({
        data: { paymentId: order.payment.id, storagePath, mimeType: mime, sizeBytes: buffer.length },
      });

      await createNotifications(tx, {
        recipients: await adminRecipientIds(tx),
        type: 'PROOF_UPLOADED',
        entityId: proof.id,
        title: 'Bukti pembayaran baru',
        body: `Pesanan ${order.code} menunggu verifikasi pembayaran.`,
        url: '/admin/payments',
      });
    });
  } catch (err) {
    await removeObject(PROOF_BUCKET, storagePath).catch(() => {}); // jangan tinggalkan file yatim
    throw err;
  }

  log?.info({ orderId: order.id, bytes: buffer.length, mime }, 'bukti pembayaran diunggah');
  return getOrder(user, order.id);
}

export async function getOrderPayment(user, idOrCode) {
  const order = await findOwnedOrderRecord(user, idOrCode, {
    payment: {
      include: {
        method: true,
        proofs: { orderBy: { uploadedAt: 'desc' } },
        verifications: { orderBy: { createdAt: 'desc' } },
      },
    },
  });
  if (!order?.payment) throw new AppError('PAYMENT_NOT_FOUND', 'Data pembayaran tidak ditemukan.', 404);
  const p = order.payment;
  return {
    status: p.status,
    amount: p.amount,
    method: { id: p.method.code, name: p.method.name },
    proofCount: p.proofs.length,
    lastUploadedAt: p.proofs[0]?.uploadedAt.toISOString() ?? null,
    verifications: p.verifications.map((v) => ({
      decision: v.decision,
      note: v.note,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

// ───────────── SISI ADMIN ─────────────

export async function listPayments({ page, pageSize, status, q }) {
  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { order: { code: { contains: q, mode: 'insensitive' } } },
            { order: { buyerName: { contains: q, mode: 'insensitive' } } },
            { order: { buyerEmail: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        method: true,
        proofs: { orderBy: { uploadedAt: 'desc' }, take: 1 },
        order: { include: { items: { take: 1, include: { ticketType: { include: { event: { select: { title: true } } } } } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((p) => ({
      id: p.id,
      orderCode: p.order.code,
      buyerName: p.order.buyerName,
      buyerEmail: p.order.buyerEmail,
      eventTitle: p.order.items[0]?.ticketType.event.title ?? '',
      method: p.method.name,
      amount: p.amount,
      status: p.status,
      submittedAt: p.proofs[0]?.uploadedAt.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function getPaymentDetail(paymentId) {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      method: true,
      proofs: { orderBy: { uploadedAt: 'desc' } },
      verifications: { orderBy: { createdAt: 'desc' }, include: { admin: { select: { email: true } } } },
      order: { include: { items: { include: { ticketType: { include: { event: { include: { venue: true } } } } } } } },
    },
  });
  if (!p) throw new AppError('PAYMENT_NOT_FOUND', 'Pembayaran tidak ditemukan.', 404);

  const event = p.order.items[0]?.ticketType.event;
  return {
    id: p.id,
    status: p.status,
    amount: p.amount,
    method: { id: p.method.code, name: p.method.name, category: p.method.category },
    order: {
      code: p.order.code,
      status: p.order.status,
      subtotal: p.order.subtotal,
      serviceFee: p.order.serviceFee,
      total: p.order.total,
      expiresAt: p.order.expiresAt.toISOString(),
      buyer: {
        fullName: p.order.buyerName,
        gender: p.order.buyerGender,
        whatsapp: p.order.buyerWhatsapp,
        email: p.order.buyerEmail,
      },
      event: event ? { title: event.title, dateLabel: dateLabel(event.startsAt), timeLabel: timeLabel(event.startsAt) } : null,
      items: p.order.items.map((i) => ({ name: i.ticketNameSnapshot, price: i.unitPriceSnapshot, quantity: i.quantity })),
    },
    // URL bertanda tangan berumur 2 menit; bukti pembayaran tidak pernah publik.
    proofs: await Promise.all(
      p.proofs.map(async (pr) => ({
        id: pr.id,
        uploadedAt: pr.uploadedAt.toISOString(),
        mimeType: pr.mimeType,
        sizeBytes: pr.sizeBytes,
        url: await createProofSignedUrl(pr.storagePath),
      }))
    ),
    verifications: p.verifications.map((v) => ({
      decision: v.decision,
      note: v.note,
      admin: v.admin.email,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

const TX_OPTIONS = { timeout: 15_000, maxWait: 5_000 };

// Menyetujui pembayaran: SEMUA langkah dalam satu transaksi. Gagal di mana pun = tidak ada yang berubah.
export async function approvePayment(admin, paymentId, note, log) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: { orderBy: { ticketTypeId: 'asc' }, include: { ticketType: { include: { event: { include: { organizer: true } } } } } },
          },
        },
      },
    });
    if (!payment) throw new AppError('PAYMENT_NOT_FOUND', 'Pembayaran tidak ditemukan.', 404);
    const order = payment.order;

    // 1) Penjaga: hanya pembayaran UNDER_REVIEW yang boleh disetujui, dan hanya sekali.
    //    Dua admin menekan "setujui" bersamaan -> satu berhasil, satu mendapat 409.
    const guard = await tx.payment.updateMany({ where: { id: paymentId, status: 'UNDER_REVIEW' }, data: { status: 'APPROVED' } });
    if (guard.count === 0) {
      throw new AppError('PAYMENT_NOT_REVIEWABLE', 'Pembayaran ini sudah diproses atau belum memiliki bukti untuk diperiksa.', 409);
    }

    // 2) Order PENDING -> PAID
    const paid = await tx.order.updateMany({ where: { id: order.id, status: 'PENDING' }, data: { status: 'PAID' } });
    if (paid.count === 0) throw new AppError('ORDER_NOT_PAYABLE', 'Status pesanan tidak memungkinkan persetujuan.', 409);

    // 3) Stok: dari "dipesan" (reserved) menjadi "terjual" (sold)
    for (const item of order.items) {
      const moved = await tx.$executeRaw`
        UPDATE ticket_types
           SET reserved = reserved - ${item.quantity}, sold = sold + ${item.quantity}, updated_at = now()
         WHERE id = ${item.ticketTypeId}::uuid AND reserved >= ${item.quantity}`;
      if (moved === 0) throw new AppError('INVENTORY_INCONSISTENT', 'Data stok tidak konsisten. Hubungi pengembang.', 500);
    }

    // 4) Terbitkan e-ticket (dijamin sekali oleh penjaga status di langkah 1)
    const tickets = [];
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i += 1) {
        tickets.push({
          orderItemId: item.id,
          eventId: item.ticketType.eventId,
          ownerId: order.userId,
          code: generateTicketCode(),
          qrToken: generateQrToken(),
        });
      }
    }
    await tx.ticket.createMany({ data: tickets });

    // 5) Riwayat verifikasi + audit
    await tx.paymentVerification.create({ data: { paymentId, adminId: admin.id, decision: 'APPROVED', note: note || null } });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'payment.approve',
        entity: 'payment',
        entityId: paymentId,
        metadata: { orderCode: order.code, total: order.total, tickets: tickets.length },
      },
    });

    // 6) Notifikasi in-app + outbox (Web Push dikirim worker, di luar transaksi ini)
    const event = order.items[0].ticketType.event;
    await createNotifications(tx, {
      recipients: [order.userId],
      type: 'PAYMENT_APPROVED',
      entityId: paymentId,
      title: 'Pembayaran disetujui',
      body: `Pembayaran pesanan ${order.code} disetujui. ${tickets.length} e-ticket untuk ${event.title} sudah terbit.`,
      url: '/my-tickets',
    });
    await createNotifications(tx, {
      recipients: [event.organizer.userId],
      type: 'ORDER_PAID',
      entityId: paymentId,
      title: 'Pesanan baru masuk',
      body: `${order.buyerName} membeli ${tickets.length} tiket ${event.title}.`,
      url: '/organizer',
    });

    return { orderCode: order.code, tickets: tickets.length };
  }, TX_OPTIONS);

  log?.info({ paymentId, adminId: admin.id, ...result }, 'pembayaran disetujui');
  return result;
}

export async function rejectPayment(admin, paymentId, note, log) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!payment) throw new AppError('PAYMENT_NOT_FOUND', 'Pembayaran tidak ditemukan.', 404);

    const guard = await tx.payment.updateMany({ where: { id: paymentId, status: 'UNDER_REVIEW' }, data: { status: 'REJECTED' } });
    if (guard.count === 0) {
      throw new AppError('PAYMENT_NOT_REVIEWABLE', 'Pembayaran ini sudah diproses atau belum memiliki bukti untuk diperiksa.', 409);
    }

    // Beri waktu baru agar pembeli sempat mengunggah ulang; stok tetap ditahan selama itu.
    await tx.order.update({ where: { id: payment.orderId }, data: { expiresAt: new Date(Date.now() + ORDER_TTL_MINUTES * 60_000) } });

    await tx.paymentVerification.create({ data: { paymentId, adminId: admin.id, decision: 'REJECTED', note } });
    await tx.auditLog.create({
      data: { actorId: admin.id, action: 'payment.reject', entity: 'payment', entityId: paymentId, metadata: { orderCode: payment.order.code, note } },
    });

    await createNotifications(tx, {
      recipients: [payment.order.userId],
      type: 'PAYMENT_REJECTED',
      entityId: `${paymentId}:${Date.now()}`, // bisa ditolak lebih dari sekali (unggah ulang)
      title: 'Pembayaran ditolak',
      body: `Pembayaran pesanan ${payment.order.code} ditolak: ${note}`,
      url: `/checkout/instruction?order=${payment.order.code}`,
    });

    return { orderCode: payment.order.code };
  }, TX_OPTIONS);

  log?.info({ paymentId, adminId: admin.id, ...result }, 'pembayaran ditolak');
  return result;
}
