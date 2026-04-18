import type { Metadata } from "next";

import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Yuva Çağrısı",
  description: "Sokak Hayvanı Sahiplendirme Platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-800 font-sans antialiased">
        <header className="w-full bg-white shadow-md border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-orange-600 tracking-tight">
              Yuva Çağrısı <span className="font-medium text-gray-500 text-sm ml-2 hidden sm:inline">Sokak Hayvanı Sahiplendirme Platformu</span>
            </h1>
            <nav className="flex space-x-4 sm:space-x-6 text-sm sm:text-base">
              <Link href="/posts" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">İlanlar</Link>
              <Link href="/create-post" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">İlan Ver</Link>
              <Link href="/admin" className="text-red-600 font-bold hover:text-red-700 transition border-b-2 border-transparent hover:border-red-600 pb-1">Admin</Link>
              <Link href="/login" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">Giriş</Link>
              <Link href="/register" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">Kayıt</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full flex p-4 sm:p-8">
          {children}
        </main>
        
        <footer className="w-full bg-white border-t border-gray-200 text-center py-4 text-sm text-gray-500">
          © {new Date().getFullYear()} Yuva Çağrısı Platformu. Tüm Hakları Saklıdır.
        </footer>
      </body>
    </html>
  );
}
