'use client';

export const PAYMENT_LOGOS = {
  // E-Wallet
  qris: '/payments/qris.png',
  shopeepay: '/payments/shopeepay.png',
  ovo: '/payments/ovo.png',
  dana: '/payments/dana.png',
  linkaja: '/payments/linkaja.png',

  // Transfer Bank
  bri: '/payments/bri.png',
  cimb: '/payments/cimb.png',
  bni: '/payments/bni.png',
  bca: '/payments/bca.png',
  mandiri: '/payments/mandiri.png',
  bsi: '/payments/bsi.png',
  btn: '/payments/btn.png',
  danamon: '/payments/danamon.png',
};

export function PaymentBrandLogo({ id, name, size = 'md' }) {
  const src = PAYMENT_LOGOS[id];

  const sizeClasses = {
    mini: 'h-4 sm:h-5 max-w-[64px]',
    sm: 'h-6 sm:h-7 max-w-[84px]',
    md: 'h-8 sm:h-10 max-w-[110px]',
  }[size] || 'h-8 max-w-[110px]';

  if (!src) {
    return (
      <span className="font-bold text-xs text-[#1C1C1C]">
        {name || id}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name || id}
      className={`${sizeClasses} w-auto object-contain select-none`}
    />
  );
}