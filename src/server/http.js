import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/server/logger';

// Error yang aman ditampilkan ke pengguna (pesan sudah dirancang, bukan error mentah).
export class AppError extends Error {
  constructor(code, message, status = 400, fields = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function ok(data = null, message = 'Data berhasil diproses', status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function failResponse(code, message, status, fields) {
  const error = fields ? { code, fields } : { code };
  return NextResponse.json({ success: false, message, error }, { status });
}

function errorResponse(err, log) {
  if (err instanceof ZodError) {
    const fields = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    log.warn({ code: 'VALIDATION_ERROR', fields }, 'validasi gagal');
    return failResponse('VALIDATION_ERROR', fields[0]?.message ?? 'Data tidak valid', 400, fields);
  }
  if (err instanceof AppError) {
    log.warn({ code: err.code, status: err.status }, err.message);
    return failResponse(err.code, err.message, err.status, err.fields);
  }
  // Error tak terduga: detail hanya ke log server, pengguna hanya melihat pesan umum.
  log.error({ err, code: 'INTERNAL_ERROR' }, 'error tak terduga');
  return failResponse('INTERNAL_ERROR', 'Terjadi kesalahan pada server. Silakan coba lagi.', 500);
}

// Pertahanan CSRF dasar: browser selalu mengirim header Origin pada POST lintas-situs.
function assertSameOrigin(request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  if (!origin) return; // klien non-browser (curl/Postman), tidak membawa cookie browser
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  let originHost = '';
  try {
    originHost = new URL(origin).host;
  } catch {
    // dibiarkan kosong -> ditolak di bawah
  }
  if (!host || originHost !== host) {
    throw new AppError('FORBIDDEN_ORIGIN', 'Permintaan ditolak.', 403);
  }
}

// Pembungkus semua Route Handler: request ID, log durasi, penanganan error seragam.
export function route(name, handler) {
  return async function wrapped(request, context) {
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
    const started = Date.now();
    const log = logger.child({
      module: name,
      requestId,
      method: request.method,
      endpoint: new URL(request.url).pathname,
    });

    let response;
    try {
      assertSameOrigin(request);
      response = await handler(request, context, { log, requestId });
    } catch (err) {
      response = errorResponse(err, log);
    }

    response.headers.set('x-request-id', requestId);
    log.info({ status: response.status, durationMs: Date.now() - started }, 'request selesai');
    return response;
  };
}

// Baca body JSON lalu validasi dengan schema Zod.
export async function parseJson(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new AppError('INVALID_JSON', 'Format permintaan tidak valid.', 400);
  }
  return schema.parse(body);
}
