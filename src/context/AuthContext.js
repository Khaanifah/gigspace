'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Status login kini berasal dari server (cookie sesi Supabase), bukan state lokal.
// Antarmuka (isLoggedIn, userEmail, login, logout) dipertahankan agar Navbar & halaman auth tidak berubah.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setUser(json?.data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dipanggil halaman /auth setelah verify-otp berhasil; ambil ulang profil dari server.
  const login = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = await res.json();
      setUser(json?.data?.user ?? null);
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn: Boolean(user), userEmail: user?.email ?? '', user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
