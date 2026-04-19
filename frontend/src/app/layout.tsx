import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yuva Cagrisi',
  description: 'Sokak hayvani sahiplendirme platformu',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-800 antialiased">
        <header className="w-full border-b border-gray-200 bg-white shadow-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
            <h1 className="text-2xl font-extrabold tracking-tight text-orange-600">
              Yuva Cagrisi <span className="ml-2 hidden text-sm font-medium text-gray-500 sm:inline">Sokak Hayvani Sahiplendirme Platformu</span>
            </h1>
            <nav className="flex space-x-4 text-sm sm:space-x-6 sm:text-base">
              <Link href="/posts" className="border-b-2 border-transparent pb-1 font-medium text-gray-600 transition hover:border-orange-500 hover:text-orange-500">Ilanlar</Link>
              <Link href="/create-post" className="border-b-2 border-transparent pb-1 font-medium text-gray-600 transition hover:border-orange-500 hover:text-orange-500">Ilan Ver</Link>
              <Link href="/my-requests" className="border-b-2 border-transparent pb-1 font-medium text-gray-600 transition hover:border-orange-500 hover:text-orange-500">Basvurularim</Link>
              <Link href="/admin" className="border-b-2 border-transparent pb-1 font-bold text-red-600 transition hover:border-red-600 hover:text-red-700">Admin</Link>
              <Link href="/login" className="border-b-2 border-transparent pb-1 font-medium text-gray-600 transition hover:border-orange-500 hover:text-orange-500">Giris</Link>
              <Link href="/register" className="border-b-2 border-transparent pb-1 font-medium text-gray-600 transition hover:border-orange-500 hover:text-orange-500">Kayit</Link>
            </nav>
          </div>
        </header>

        <main className="flex w-full flex-1 p-4 sm:p-8">{children}</main>

        <footer className="w-full border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
          (c) {new Date().getFullYear()} Yuva Cagrisi Platformu. Tum haklari saklidir.
        </footer>
      </body>
    </html>
  );
}
