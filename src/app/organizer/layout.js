import { redirect } from 'next/navigation';
import { getSessionUser } from '@/server/auth/session';

// Penjaga di SERVER: hanya ORGANIZER (admin boleh meninjau).
export default async function OrganizerLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') redirect('/');
  return children;
}
