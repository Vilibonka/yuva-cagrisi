import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Bir Yuva Bir Dost',
  description: 'Sokak hayvanı sahiplendirme platformu',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-800 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex w-full flex-1 p-4 sm:p-8">{children}</main>
          <footer className="w-full border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500 shadow-inner">
            <div className="mx-auto max-w-6xl px-4">
              <p className="mb-2 font-bold text-gray-700">Bir Yuva Bir Dost</p>
              <p>&copy; {new Date().getFullYear()} Yuva Çağrısı Platformu. Tüm hakları saklıdır.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
