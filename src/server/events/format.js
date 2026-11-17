// Format tanggal/waktu untuk tampilan (zona WIB), sama dengan label yang dulu hardcode di frontend.
const TZ = 'Asia/Jakarta';

export function dateLabel(date) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(date);
}

export function timeLabel(date) {
  const text = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(date);
  return `${text.replace('.', ':')} WIB`;
}

function parts(date) {
  const get = (opts) => new Intl.DateTimeFormat('id-ID', { ...opts, timeZone: TZ }).format(date);
  return {
    day: get({ day: 'numeric' }),
    month: get({ month: 'long' }),
    year: get({ year: 'numeric' }),
  };
}

// "12 November 2026" | "1–10 Oktober 2026" | "30 September – 3 Oktober 2026"
export function periodLabel(start, end) {
  const a = parts(start);
  const b = parts(end);
  if (a.day === b.day && a.month === b.month && a.year === b.year) return `${a.day} ${a.month} ${a.year}`;
  if (a.month === b.month && a.year === b.year) return `${a.day}–${b.day} ${a.month} ${a.year}`;
  if (a.year === b.year) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
}

export function dayBadge(date) {
  return {
    date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', timeZone: TZ }).format(date),
    month: new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: TZ }).format(date),
  };
}

// URL gambar: path Supabase Storage (bucket publik event-images) atau URL penuh (data demo).
export function publicImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/event-images/${encoded}`;
}
