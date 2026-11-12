import { DM_Sans, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas-neue',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${dmSans.variable} ${bebasNeue.variable}`}>
      <body className={`${dmSans.className} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}