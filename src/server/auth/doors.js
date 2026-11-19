// "Pintu" login yang dipilih pengguna di layar login. Pintu BUKAN penentu role:
// server mencocokkannya dengan role yang tersimpan di database.
export const DOORS = {
  user: { roles: ['USER', 'ORGANIZER', 'ADMIN'], redirectTo: '/' },
  organizer: { roles: ['ORGANIZER'], redirectTo: '/organizer' },
  admin: { roles: ['ADMIN'], redirectTo: '/admin/curation' },
};

export const DOOR_KEYS = Object.keys(DOORS);

const LABELS = { organizer: 'Organizer', admin: 'Admin' };

export function doorAllows(door, role) {
  return DOORS[door].roles.includes(role);
}

export function doorDeniedMessage(door) {
  return `Akun ini tidak terdaftar sebagai ${LABELS[door] ?? 'pengguna'}.`;
}

// Tujuan setelah login berdasarkan role dari database (dipakai fast login).
export function redirectForRole(role) {
  if (role === 'ADMIN') return DOORS.admin.redirectTo;
  if (role === 'ORGANIZER') return DOORS.organizer.redirectTo;
  return DOORS.user.redirectTo;
}
