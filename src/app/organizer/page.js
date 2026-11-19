import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/server/auth/session';
import LogoutButton from '@/components/shared/LogoutButton';

// Halaman organizer dasar. Angka berasal dari database; dashboard lengkap menyusul di modul organizer.
export default async function OrganizerHome() {
  const user = await getSessionUser();
  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: user.id },
    include: { _count: { select: { events: true } } },
  });

  const sold = profile
    ? await prisma.ticketType.aggregate({ where: { event: { organizerId: profile.id } }, _sum: { sold: true } })
    : null;

  return (
    <main className="min-h-screen bg-[#F5F6F8] py-10 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-pink-100 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#FF2E9A] uppercase tracking-wide">Organizer</p>
            <h1 className="text-2xl font-extrabold text-[#1C1C1C]">
              {profile?.organizationName ?? user.fullName ?? user.email}
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <LogoutButton className="text-xs font-bold text-gray-500 hover:text-[#FF2E9A] cursor-pointer" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#FFF9FC] border border-pink-100 p-4">
            <p className="text-xs font-bold text-gray-500">Event milik Anda</p>
            <p className="text-3xl font-extrabold text-[#1C1C1C]">{profile?._count.events ?? 0}</p>
          </div>
          <div className="rounded-xl bg-[#FFF9FC] border border-pink-100 p-4">
            <p className="text-xs font-bold text-gray-500">Tiket terjual</p>
            <p className="text-3xl font-extrabold text-[#1C1C1C]">{sold?._sum.sold ?? 0}</p>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Pengelolaan event, tipe tiket, dan layar check-in sedang disiapkan.
        </p>
        <Link href="/" className="inline-block text-sm font-bold text-[#FF2E9A] hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
