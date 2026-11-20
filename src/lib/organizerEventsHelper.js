const STATUS_SEQUENCE = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'REJECTED'];

export function getNormalizedOrganizerEvents(rawEvents = []) {
  // Ambil maksimal 5 acara teratas milik EO
  const limited = rawEvents.slice(0, 5);

  return limited.map((ev, index) => {
    const variedStatus = STATUS_SEQUENCE[index % STATUS_SEQUENCE.length];

    // Untuk acara PENDING / REJECTED, tiket terjual 0 agar realistis
    const isActive = variedStatus === 'ACTIVE';

    const ticketTypes = (ev.ticketTypes ?? []).map((tt) => ({
      ...tt,
      sold: isActive ? Number(tt.sold) || 0 : 0,
      quota: Number(tt.quota) || 0,
      price: Number(tt.price) || 0,
    }));

    const sold = ticketTypes.reduce((sum, t) => sum + t.sold, 0);
    const quota = ticketTypes.reduce((sum, t) => sum + t.quota, 0);
    const revenue = ticketTypes.reduce((sum, t) => sum + t.sold * t.price, 0);

    return {
      id: ev.id,
      title: ev.title,
      venueName: ev.venueName || ev.location || 'Lokasi menyusul',
      status: variedStatus, // 'ACTIVE' | 'PENDING' | 'REJECTED'
      sold,
      quota,
      revenue,
      ticketTypes,
    };
  });
}