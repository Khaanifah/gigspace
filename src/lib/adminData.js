export const initialCurationData = [
  {
    id: 'CUR-001',
    eventTitle: 'LaLaLa Festival',
    organizer: 'PT Indo The Nusantara',
    organizerEmail: 'event@indothenusantara.id',
    submissionDate: '4 September 2026',
    eventDate: '12 November 2026',
    eventTime: '16:30 WIB',
    location: 'JIExpo Kemayoran, Jakarta Pusat',
    genre: 'Indie',
    status: 'Pending', // 'Urgent' | 'Pending' | 'Disetujui' | 'Ditolak'
    isUrgent: true,
    image:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop',
    description:
      'Festival musik tahunan berskala nasional dengan konsep panggung terbuka, instalasi seni visual, dan kurasi musisi indie tanah air.',
    tickets: [
      { name: 'Presale 1', price: 150000, quota: 200 },
      { name: 'Presale 2', price: 190000, quota: 300 },
      { name: 'VIP Lounge', price: 450000, quota: 50 },
    ],
  },
  {
    id: 'CUR-002',
    eventTitle: 'Semarang Indie Fest 2026',
    organizer: 'Kolektif Suara Pesisir',
    organizerEmail: 'halo@suarapesisir.com',
    submissionDate: '4 September 2026',
    eventDate: '12 November 2026',
    eventTime: '18:00 WIB',
    location: 'PRPP Jawa Tengah, Semarang',
    genre: 'Indie',
    status: 'Pending',
    isUrgent: true,
    image:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop',
    description:
      'Showcase kolaborasi band independen Jawa Tengah dan Yogyakarta dalam satu panggung intim.',
    tickets: [
      { name: 'Early Bird', price: 85000, quota: 150 },
      { name: 'Regular', price: 120000, quota: 350 },
    ],
  },
  {
    id: 'CUR-003',
    eventTitle: 'Gelombang Rock Night',
    organizer: 'PT Indo The Nusantara',
    organizerEmail: 'event@indothenusantara.id',
    submissionDate: '4 September 2026',
    eventDate: '12 November 2026',
    eventTime: '19:30 WIB',
    location: 'JIExpo Kemayoran, Jakarta Pusat',
    genre: 'Rock',
    status: 'Disetujui',
    isUrgent: false,
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&auto=format&fit=crop',
    description:
      'Malam penghormatan bagi skena musik rock alternatif Indonesia dengan tata cahaya dan tata suara penuh.',
    tickets: [
      { name: 'Festival Standing', price: 175000, quota: 500 },
    ],
  },
  {
    id: 'CUR-004',
    eventTitle: 'Classic Nights Symphony',
    organizer: 'Nusantara Chamber',
    organizerEmail: 'admin@nusantarachamber.org',
    submissionDate: '4 September 2026',
    eventDate: '12 November 2026',
    eventTime: '16:30 WIB',
    location: 'PRPP Jawa Tengah, Semarang',
    genre: 'Classic',
    status: 'Disetujui',
    isUrgent: false,
    image:
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&auto=format&fit=crop',
    description:
      'Pertunjukan orkestra kamar membawakan aransemen ulang karya musik klasik modern.',
    tickets: [
      { name: 'Silver Seat', price: 150000, quota: 120 },
      { name: 'Gold Seat', price: 250000, quota: 80 },
    ],
  },
];

export const initialPaymentsData = [
  {
    id: 'TRX-20261101',
    buyerName: 'Itsnan Nur Khanifah',
    buyerEmail: 'itsnan@student.unnes.ac.id',
    eventTitle: 'LaLaLa Festival',
    ticketSummary: '1x Presale 2, 1x Bundle 2 Tiket',
    totalAmount: 557000,
    paymentMethod: 'Transfer Bank - BRI (VABRI1234567)',
    submittedAt: '12 Nov 2026, 14:20 WIB',
    status: 'Menunggu Verifikasi', // 'Menunggu Verifikasi' | 'Lunas' | 'Ditolak'
    proofImage:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop',
  },
  {
    id: 'TRX-20261102',
    buyerName: 'Raka Pratama',
    buyerEmail: 'raka.pratama@gmail.com',
    eventTitle: 'Semarang Indie Fest 2026',
    ticketSummary: '2x Regular',
    totalAmount: 247000,
    paymentMethod: 'E-Wallet - QRIS',
    submittedAt: '12 Nov 2026, 15:05 WIB',
    status: 'Menunggu Verifikasi',
    proofImage:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop',
  },
  {
    id: 'TRX-20261099',
    buyerName: 'Nadia Putri',
    buyerEmail: 'nadiaputri@yahoo.com',
    eventTitle: 'Gelombang Rock Night',
    ticketSummary: '1x Festival Standing',
    totalAmount: 182000,
    paymentMethod: 'Transfer Bank - BCA',
    submittedAt: '11 Nov 2026, 19:40 WIB',
    status: 'Lunas',
    proofImage:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop',
  },
];

export const initialUsersData = [
  {
    id: 'USR-001',
    name: 'Administrator Gigspace',
    email: 'admin@gigspace.id',
    phone: '0812-0000-0001',
    role: 'Admin',
    joinedAt: '1 Agustus 2026',
    status: 'Aktif',
  },
  {
    id: 'USR-002',
    name: 'PT Indo The Nusantara',
    email: 'event@indothenusantara.id',
    phone: '0812-3456-7890',
    role: 'EO',
    joinedAt: '15 Agustus 2026',
    status: 'Aktif',
  },
  {
    id: 'USR-003',
    name: 'Itsnan Nur Khanifah',
    email: 'itsnan@student.unnes.ac.id',
    phone: '0857-1122-3344',
    role: 'Pembeli',
    joinedAt: '2 September 2026',
    status: 'Aktif',
  },
  {
    id: 'USR-004',
    name: 'Dimas Arya (Gate A)',
    email: 'scanner.gatea@gigspace.id',
    phone: '0813-9988-7766',
    role: 'Petugas',
    joinedAt: '10 Oktober 2026',
    status: 'Aktif',
  },
  {
    id: 'USR-005',
    name: 'Kolektif Suara Pesisir',
    email: 'halo@suarapesisir.com',
    phone: '0821-4455-6677',
    role: 'EO',
    joinedAt: '20 Oktober 2026',
    status: 'Aktif',
  },
];