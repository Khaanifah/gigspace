import { route, AppError } from '@/server/http';

// Login OTP sudah diganti login password. Endpoint ini dinonaktifkan; folder ini boleh dihapus.
const gone = async () => {
  throw new AppError('NOT_FOUND', 'Tidak ditemukan.', 404);
};

export const POST = route('auth.otp-disabled', gone);
