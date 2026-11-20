export const initialOrganizerEvents = [
  {
    id: 'EVT-101',
    title: 'Senja di Kota Lama Live',
    date: '2026-12-12',
    location: 'Kawasan Kota Lama, Semarang',
    status: 'Active', // 'Pending' | 'Active' | 'Rejected'
    sold: 420,
    quota: 500,
    revenue: 68500000,
    tickets: [
      { name: 'Early Bird', price: 120000, quota: 150 },
      { name: 'Regular', price: 175000, quota: 350 },
    ],
  },
  {
    id: 'EVT-102',
    title: 'Neon Synth & Indie Night',
    date: '2026-12-20',
    location: 'Marina Convention Hall, Semarang',
    status: 'Pending', // 'Pending' | 'Active' | 'Rejected'
    sold: 0,
    quota: 300,
    revenue: 0,
    tickets: [
      { name: 'Presale 1', price: 95000, quota: 300 },
    ],
  },
  {
    id: 'EVT-103',
    title: 'Midnight Acoustic Rooftop',
    date: '2026-11-28',
    location: 'Sky Lounge Simpang Lima',
    status: 'Rejected', // 'Pending' | 'Active' | 'Rejected'
    sold: 0,
    quota: 120,
    revenue: 0,
    tickets: [
      { name: 'VIP Seat', price: 250000, quota: 120 },
    ],
  },
];

export const initialAttendeesData = [
  {
    id: 'ATT-01',
    ticketCode: 'GIG-2026-VIP01',
    buyerName: 'Raka Pratama',
    eventTitle: 'Senja di Kota Lama Live',
    ticketType: 'VIP Pass',
    checkedIn: false,
  },
  {
    id: 'ATT-02',
    ticketCode: 'GIG-2026-REG02',
    buyerName: 'Nadia Kusuma',
    eventTitle: 'Senja di Kota Lama Live',
    ticketType: 'Regular',
    checkedIn: false,
  },
  {
    id: 'ATT-03',
    ticketCode: 'GIG-2026-USED99',
    buyerName: 'Dimas Wijaya',
    eventTitle: 'Senja di Kota Lama Live',
    ticketType: 'Early Bird',
    checkedIn: true,
  },
  {
    id: 'ATT-04',
    ticketCode: 'GIG-2026-REG04',
    buyerName: 'Salsa Maharani',
    eventTitle: 'Senja di Kota Lama Live',
    ticketType: 'Regular',
    checkedIn: false,
  },
];