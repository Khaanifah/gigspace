// Konfigurasi bisnis di sisi server. Nilai ini yang berlaku, bukan angka dari browser.
export const SERVICE_FEE = Number(process.env.SERVICE_FEE ?? 7000); // rupiah per pesanan
export const ORDER_TTL_MINUTES = Number(process.env.ORDER_TTL_MINUTES ?? 60); // batas waktu bayar
export const MAX_TICKETS_PER_ORDER = 10;
export const MAX_PENDING_ORDERS_PER_USER = 5; // cegah menimbun stok dengan pesanan belum dibayar
