// Akun demo untuk "Fast Login". Peran ditentukan di server dari kunci ini,
// bukan dari data apa pun yang dikirim browser selain nama kuncinya.
// Email organizer sama dengan pemilik event demo di prisma/seed-demo.mjs.
export const FAST_LOGIN_ACCOUNTS = {
  user: {
    role: 'USER',
    fullName: 'Demo User',
    email: process.env.FAST_LOGIN_USER_EMAIL ?? 'demo-user@gigspace.local',
  },
  organizer: {
    role: 'ORGANIZER',
    fullName: 'Demo Organizer',
    email: process.env.FAST_LOGIN_ORGANIZER_EMAIL ?? 'organizer-demo@gigspace.local',
  },
  admin: {
    role: 'ADMIN',
    fullName: 'Demo Admin',
    email: process.env.FAST_LOGIN_ADMIN_EMAIL ?? 'demo-admin@gigspace.local',
  },
};

export const FAST_LOGIN_KEYS = Object.keys(FAST_LOGIN_ACCOUNTS);
