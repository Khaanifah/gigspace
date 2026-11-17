'use client';

import { useEffect, useState } from 'react';

// Hook kecil untuk GET ke API internal. Status loading diturunkan dari perbandingan
// "permintaan terakhir yang selesai" vs "permintaan yang sedang diminta", jadi tidak ada
// setState sinkron di dalam effect.
export function useApiData(url) {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null, status: null });
  const key = url ? `${url}#${nonce}` : null;

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    const currentKey = `${url}#${nonce}`;

    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          return { data: null, error: json?.message || 'Gagal memuat data.', status: res.status };
        }
        return { data: json.data, error: null, status: res.status };
      })
      .catch(() => ({ data: null, error: 'Tidak dapat terhubung ke server.', status: 0 }))
      .then((r) => {
        if (!cancelled) setResult({ key: currentKey, ...r });
      });

    return () => {
      cancelled = true;
    };
  }, [url, nonce]);

  const isCurrent = result.key === key;
  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    status: isCurrent ? result.status : null,
    isLoading: Boolean(url) && !isCurrent,
    reload: () => setNonce((n) => n + 1),
  };
}
