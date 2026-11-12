export const ticketsData = [
  {
    id: 'CGSYH124',
    transactionCode: 'CGSYH124',
    eventTitle: 'LaLaLa Festival',
    location: 'JIExpo Kemayoran, Jakarta Pusat',
    dateLabel: 'Kamis, 12 November 2026',
    timeLabel: '16:30 WIB',
    quantity: 3,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    isScanned: false,
    eventTimestamp: '2026-12-20T16:30:00+07:00',
    items: [
      { ticketCode: 'ABC110', category: 'General Admission', isScanned: false },
      { ticketCode: 'ABC111', category: 'General Admission', isScanned: false },
      { ticketCode: 'ABC112', category: 'General Admission', isScanned: false },
    ],
  },
  {
    id: 'CGSYH125',
    transactionCode: 'CGSYH125',
    eventTitle: 'Nama Gigs',
    location: 'PRPP, Semarang',
    dateLabel: 'Kamis, 12 November 2026',
    timeLabel: '16:30 WIB',
    quantity: 4,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    isScanned: false,
    eventTimestamp: '2026-12-25T16:30:00+07:00',
    items: [
      { ticketCode: 'SMG201', category: 'Festival', isScanned: false },
      { ticketCode: 'SMG202', category: 'Festival', isScanned: false },
      { ticketCode: 'SMG203', category: 'Festival', isScanned: false },
      { ticketCode: 'SMG204', category: 'Festival', isScanned: false },
    ],
  },
  {
    id: 'CGSYH110',
    transactionCode: 'CGSYH110',
    eventTitle: 'TESYAFEST VOL 3',
    location: 'PRPP Jawa Tengah, Semarang',
    dateLabel: 'Kamis, 12 November 2026',
    timeLabel: '16:30 WIB',
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    isScanned: true,
    eventTimestamp: '2026-10-10T16:30:00+07:00',
    items: [
      { ticketCode: 'TSY001', category: 'VIP', isScanned: true },
      { ticketCode: 'TSY002', category: 'VIP', isScanned: true },
    ],
  },
  {
    id: 'CGSYH109',
    transactionCode: 'CGSYH109',
    eventTitle: 'Nama Gigs',
    location: 'PRPP, Semarang',
    dateLabel: 'Kamis, 12 November 2026',
    timeLabel: '16:30 WIB',
    quantity: 4,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    isScanned: true,
    eventTimestamp: '2026-10-05T16:30:00+07:00',
    items: [
      { ticketCode: 'SMG101', category: 'Reguler', isScanned: true },
      { ticketCode: 'SMG102', category: 'Reguler', isScanned: true },
      { ticketCode: 'SMG103', category: 'Reguler', isScanned: true },
      { ticketCode: 'SMG104', category: 'Reguler', isScanned: true },
    ],
  },
];

export function getTicketStatus(ticket) {
  if (ticket.isScanned) return 'expired';
  if (ticket.eventTimestamp && new Date(ticket.eventTimestamp) < new Date()) {
    return 'expired';
  }
  return 'active';
}