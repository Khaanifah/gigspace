// Status tampilan sebuah pesanan tiket (dipakai halaman My Tickets).
export function getTicketStatus(ticket) {
  if (ticket.isScanned) return 'expired';
  if (ticket.eventTimestamp && new Date(ticket.eventTimestamp) < new Date()) {
    return 'expired';
  }
  return 'active';
}
