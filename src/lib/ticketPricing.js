export function getLowestOnSalePrice(tickets = [], fallbackPrice = 0) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return Number(fallbackPrice) || 0;
  }

  const normalized = tickets
    .map((t) => ({
      price: Number(t?.price ?? t?.harga ?? 0),
      isOnSale: Boolean(
        t?.isOnSale ??
          t?.onSale ??
          (typeof t?.status === 'string' &&
            t.status.toLowerCase().includes('sale'))
      ),
    }))
    .filter((t) => !Number.isNaN(t.price) && t.price > 0);

  if (normalized.length === 0) {
    return Number(fallbackPrice) || 0;
  }

  const onSaleTickets = normalized.filter((t) => t.isOnSale);
  const pool = onSaleTickets.length > 0 ? onSaleTickets : normalized;

  return Math.min(...pool.map((t) => t.price));
}

export function formatStartingPrice(amount) {
  const num = Number(amount) || 0;
  return (
    'Rp ' +
    new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(num)
  );
}