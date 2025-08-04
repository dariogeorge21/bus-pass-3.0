import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { BookingProvider } from '@/contexts/BookingContext';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bus Pass Booking - St. Joseph\'s College of Engineering and Technology, Palai',
  description: 'Online bus pass booking system for students',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BookingProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {children}
          </div>
          <Toaster />
        </BookingProvider>
      </body>
    </html>
  );
}