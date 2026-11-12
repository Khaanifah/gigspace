export const eventsData = Array.from({ length: 32 }, (_, i) => {
  const id = String(i + 1);
  const genres = ['Indie', 'Rock', 'Solo', 'Classic'];

  const sampleTickets = [
    {
      id: `${id}-t1`,
      name: 'Presale 2',
      period: '1–10 Oktober 2026',
      price: 190000,
      quota: 50,
      status: 'on_sale', // 'on_sale' | 'not_released' | 'sold_out'
    },
    {
      id: `${id}-t2`,
      name: 'Bundle 2 Tiket',
      period: '1–10 Oktober 2026',
      price: 360000,
      quota: 30,
      status: 'on_sale',
    },
    {
      id: `${id}-t3`,
      name: 'Bundle 4 Tiket',
      period: '1–10 Oktober 2026',
      price: 700000,
      quota: 20,
      status: 'on_sale',
    },
    {
      id: `${id}-t4`,
      name: 'Presale 3',
      period: '17–26 Oktober 2026',
      price: 220000,
      quota: 100,
      status: 'not_released',
    },
    {
      id: `${id}-t5`,
      name: 'OTS',
      period: '12 November 2026',
      price: 250000,
      quota: 50,
      status: 'not_released',
    },
    {
      id: `${id}-t6`,
      name: 'Presale 1',
      period: '18–30 September 2026',
      price: 150000,
      quota: 0,
      status: 'sold_out',
    },
  ];

  if (i === 0) {
    return {
      id: '1',
      title: 'LaLaLa Festival',
      organizer: 'PT Indo The Nusantara',
      location: 'JIExpo Kemayoran, Jakarta Pusat',
      dateLabel: 'Kamis, 12 November 2026',
      timeLabel: '16:30 WIB',
      genre: 'Indie',
      price: 150000, // Harga Mulai Dari (termasuk Presale 1)
      image:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&auto=format&fit=crop',
      ],
      description:
        'LaLaLa Festival hadir kembali membawa pengalaman festival musik bernuansa alam terbuka dengan deretan musisi lokal dan internasional terbaik. Nikmati tata panggung imersif, instalasi seni visual, serta kurasi kuliner pilihan sepanjang pertunjukan berlangsung.',
      terms:
        'Tiket yang sudah dibeli tidak dapat dikembalikan atau ditukar. Penonton wajib menunjukkan e-ticket berisi kode QR resmi Gigspace saat penukaran wristband di pintu masuk venue. Dilarang membawa senjata tajam, obat-obatan terlarang, serta makanan dan minuman dari luar area konser.',
      ticketCategories: sampleTickets,
    };
  }

  return {
    id,
    title: 'Nama Gigs',
    organizer: 'Penyelenggara',
    location: 'Lokasi',
    dateLabel: 'Kamis, 12 November 2026',
    timeLabel: '16:30 WIB',
    genre: genres[i % 4],
    price: 150000,
    image:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&auto=format&fit=crop',
    ],
    description:
      'Pertunjukan musik intim yang mempertemukan musisi independen pilihan dengan penikmat skena lokal. Saksikan penampilan spesial secara langsung dengan tata suara dan pencahayaan panggung yang dirancang khusus untuk menciptakan suasana malam yang berkesan.',
    terms:
      'Satu kode QR berlaku untuk satu orang pengunjung. Penukaran tiket dibuka 2 jam sebelum gerbang konser dibuka. Penyelenggara berhak menolak masuk pengunjung yang tidak mematuhi tata tertib keselamatan di area venue.',
    ticketCategories: sampleTickets,
  };
});