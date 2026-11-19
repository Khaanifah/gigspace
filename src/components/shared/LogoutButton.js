'use client';

import { useAuth } from '@/context/AuthContext';

export default function LogoutButton({ className = '' }) {
  const { logout } = useAuth();
  return (
    <button
      type="button"
      onClick={async () => {
        await logout();
        window.location.href = '/auth';
      }}
      className={className}
    >
      Keluar
    </button>
  );
}
