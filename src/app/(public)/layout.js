import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

export default function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      <Navbar />
      <div className="flex-1" suppressHydrationWarning>
        {children}
      </div>
      <Footer />
    </div>
  );
}