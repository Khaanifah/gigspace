'use client';

// 1. SKELETON LOADING (Untuk Grid Card Gigs / Discover)
export function GigsGridSkeleton({ count = 16 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#FFF0F6] rounded-2xl overflow-hidden border border-pink-100 animate-pulse flex flex-col"
        >
          <div className="h-36 w-full bg-pink-200/70" />
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 bg-pink-200 rounded" />
              <div className="h-4 w-3/4 bg-pink-200 rounded" />
              <div className="h-3 w-1/2 bg-pink-200/80 rounded" />
            </div>
            <div className="pt-3 border-t border-pink-200/60 space-y-1.5">
              <div className="h-2.5 w-14 bg-pink-200 rounded" />
              <div className="h-4 w-28 bg-pink-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 2. EMPTY STATE (Ketika data dari database/filter kosong)
export function EmptyState({
  title = 'Belum ada konser ditemukan',
  description = 'Coba ubah kata kunci pencarian atau pilih kategori genre lainnya.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="bg-[#FFF0F6] border border-pink-200 rounded-2xl py-16 px-6 text-center max-w-lg mx-auto my-6 space-y-3">
      <div className="w-12 h-12 rounded-full bg-[#FF2E9A]/15 text-[#FF2E9A] flex items-center justify-center mx-auto font-black text-xl">
        !
      </div>
      <h3 className="text-base md:text-lg font-extrabold text-[#1C1C1C]">{title}</h3>
      <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="bg-[#FF2E9A] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-pink-600 transition cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// 3. ERROR STATE (Ketika gagal fetch data dari API / koneksi terputus)
export function ErrorState({
  message = 'Terjadi kesalahan saat memuat data konser.',
  onRetry,
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl py-14 px-6 text-center max-w-lg mx-auto my-6 space-y-3">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto font-black text-xl">
        ×
      </div>
      <h3 className="text-base md:text-lg font-extrabold text-red-700">Gagal Memuat Data</h3>
      <p className="text-xs md:text-sm text-red-600/90">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-red-700 transition cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}

// 4. STATUS BANNER (Success / Error Alert untuk Form seperti Auth & OTP)
export function StatusAlert({ type = 'success', message }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  return (
    <div
      className={`px-4 py-3 rounded-lg text-xs font-semibold border flex items-start gap-2.5 ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-red-50 border-red-200 text-red-600'
      }`}
    >
      <span className="font-black text-sm leading-none mt-0.5">
        {isSuccess ? '✓' : '!'}
      </span>
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

// 5. SKELETON LOADING (Untuk Daftar Tiket di My Tickets)
export function TicketsListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white/70 border border-pink-100 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-pink-200/70 flex-shrink-0" />
            <div className="space-y-2.5 flex-1">
              <div className="h-5 w-44 bg-pink-200 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                <div className="h-3.5 w-36 bg-pink-200/80 rounded" />
                <div className="h-3.5 w-36 bg-pink-200/80 rounded" />
                <div className="h-3.5 w-24 bg-pink-200/80 rounded" />
                <div className="h-3.5 w-24 bg-pink-200/80 rounded" />
              </div>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-6">
            <div className="h-6 w-24 bg-pink-200/80 rounded-full" />
            <div className="h-8 w-28 bg-pink-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}