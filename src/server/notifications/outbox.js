// Notifikasi dalam aplikasi + event outbox ditulis di TRANSAKSI BISNIS yang sama.
// Worker (modul berikutnya) membaca outbox_events lalu mengirim Web Push.
// Kegagalan push nanti tidak akan pernah membatalkan transaksi bisnis.
export async function createNotifications(tx, { recipients, type, entityId, title, body, url }) {
  for (const userId of recipients) {
    const notification = await tx.notification.create({ data: { userId, title, body, url } });
    await tx.outboxEvent.create({
      data: {
        type: 'PUSH_NOTIFICATION',
        dedupKey: `${type}:${entityId}:${userId}`, // UNIQUE: mencegah notifikasi ganda saat retry
        payload: { notificationId: notification.id, userId, title, body, url },
      },
    });
  }
}

export async function adminRecipientIds(tx) {
  const admins = await tx.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
  return admins.map((a) => a.id);
}
