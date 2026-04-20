'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, Heart, Settings, PlusSquare, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter text-orange-600">
            BİR YUVA BİR DOST
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/posts" className="text-sm font-semibold text-gray-600 transition hover:text-orange-600">İlanlar</Link>
          <Link href="/create-post" className="flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-orange-600">
            <PlusSquare className="h-4 w-4" /> İlan Ver
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-6">
              <Link href="/profile/favorites" className="text-sm font-semibold text-gray-600 transition hover:text-orange-600" title="Favori İlanlarım">
                Favori İlanlarım
              </Link>
              <div className="group relative">
                <button className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200">
                  <User className="h-4 w-4" />
                  {user?.fullName?.split(' ')[0]}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-gray-100 bg-white p-2 shadow-2xl transition-all scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible">
                  <Link href="/profile/settings" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <Settings className="h-4 w-4" /> Ayarlar
                  </Link>
                  <Link href="/my-requests" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <LayoutDashboard className="h-4 w-4" /> Başvurularım
                  </Link>
                  <div className="my-2 border-t border-gray-100" />
                  <button 
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-orange-600">Giriş</Link>
              <Link href="/register" className="rounded-full bg-orange-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-orange-700 shadow-lg shadow-orange-200">
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
