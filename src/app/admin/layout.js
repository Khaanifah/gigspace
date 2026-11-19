import { redirect } from 'next/navigation';
import { getSessionUser } from '@/server/auth/session';
import AdminShell from './AdminShell';

// Penjaga di SERVER: role dibaca dari database lewat cookie sesi yang divalidasi,
// bukan dari sessionStorage/cookie buatan browser.
export default async function AdminLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (user.role !== 'ADMIN') redirect('/');
  return <AdminShell>{children}</AdminShell>;
}
