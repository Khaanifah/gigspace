import { redirect } from 'next/navigation';
import { getSessionUser } from '@/server/auth/session';
import OrganizerShell from './OrganizerShell';

// Penjaga di SERVER: role dibaca dari database lewat cookie sesi yang divalidasi.
// Hanya ORGANIZER (admin boleh meninjau).
export default async function OrganizerLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') redirect('/');
  return <OrganizerShell>{children}</OrganizerShell>;
}
