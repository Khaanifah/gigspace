import { AppError } from '@/server/http';

// Rate limiter in-memory (per proses). Cukup untuk satu instance/tugas kuliah;
// untuk produksi multi-instance ganti dengan penyimpanan bersama (mis. Redis).
const buckets = new Map();

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip')) || 'unknown';
}

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  entry.count += 1;
  if (entry.count > limit) {
    throw new AppError('RATE_LIMITED', 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.', 429);
  }
}
