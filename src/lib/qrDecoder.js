// Dekoder QR lintas-browser untuk layar check-in (hanya dipakai di browser).
//
// - Chrome Android / macOS: memakai BarcodeDetector bawaan browser (cepat, hemat baterai).
// - iPhone/Safari, Firefox, Chrome Windows/Linux: BarcodeDetector tidak ada atau tidak mendukung QR,
//   jadi memakai jsQR (JavaScript murni). Library dimuat malas, hanya saat benar-benar dibutuhkan.
//
// Butuh dependensi:  npm install jsqr

export class DecoderLoadError extends Error {
  constructor() {
    super('JSQR_LOAD_FAILED');
    this.name = 'DecoderLoadError';
  }
}

let jsQRPromise = null;

function loadJsQR() {
  if (!jsQRPromise) {
    jsQRPromise = import('jsqr')
      .then((mod) => {
        // Bergantung bundler, fungsinya bisa ada di mod, mod.default, atau mod.default.default
        let fn = mod;
        for (let i = 0; i < 3 && typeof fn !== 'function'; i += 1) fn = fn?.default;
        if (typeof fn !== 'function') throw new Error('bad export');
        return fn;
      })
      .catch(() => {
        jsQRPromise = null; // izinkan coba lagi (mis. koneksi sempat putus saat memuat)
        throw new DecoderLoadError();
      });
  }
  return jsQRPromise;
}

let nativeDetector; // undefined = belum dicek, null = tidak tersedia

async function getNativeDetector() {
  if (nativeDetector !== undefined) return nativeDetector;
  nativeDetector = null;
  try {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      // Di beberapa platform BarcodeDetector ada tetapi tidak mendukung QR: jangan dipakai.
      const formats = await window.BarcodeDetector.getSupportedFormats?.();
      if (!formats || formats.includes('qr_code')) {
        nativeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      }
    }
  } catch {
    nativeDetector = null;
  }
  return nativeDetector;
}

let scratchCanvas = null;

// Gambar sumber (video / img) ke kanvas, diperkecil agar pemindaian cepat, lalu ambil pikselnya.
function readImageData(source, maxSide) {
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  if (!w || !h) return null;

  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  if (!scratchCanvas) scratchCanvas = document.createElement('canvas');
  scratchCanvas.width = cw;
  scratchCanvas.height = ch;
  const ctx = scratchCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, cw, ch);
  return ctx.getImageData(0, 0, cw, ch);
}

// Mengembalikan isi QR (string) atau null bila tidak ada QR yang terbaca.
//   source: HTMLVideoElement (frame kamera) atau HTMLImageElement (foto/screenshot)
//   still:  true untuk gambar diam -> lebih teliti (dua skala, coba juga QR terbalik warna)
// Melempar DecoderLoadError bila dekoder cadangan gagal dimuat.
export async function decodeQr(source, { still = false } = {}) {
  const native = await getNativeDetector();
  if (native) {
    try {
      const codes = await native.detect(source);
      const hit = codes?.find((c) => c.rawValue);
      if (hit) return hit.rawValue;
    } catch {
      // frame belum siap / gagal dibaca: lanjut
    }
    // Untuk video, frame berikutnya segera datang; jsQR yang lebih berat hanya untuk gambar diam.
    if (!still) return null;
  }

  const jsQR = await loadJsQR();
  const sizes = still ? [1600, 800] : [640];
  for (const maxSide of sizes) {
    const img = readImageData(source, maxSide);
    if (!img) return null;
    const code = jsQR(img.data, img.width, img.height, {
      inversionAttempts: still ? 'attemptBoth' : 'dontInvert',
    });
    if (code?.data) return code.data;
  }
  return null;
}
