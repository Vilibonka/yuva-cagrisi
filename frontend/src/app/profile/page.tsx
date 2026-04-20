'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Settings, Heart, LayoutDashboard, MapPin, Calendar, Mail, Phone, Edit } from 'lucide-react';
import api from '@/api';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch latest full profile data just in case
      api.get('/users/me')
        .then(res => setProfileData(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !profileData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Lütfen giriş yapın</h1>
        <Link href="/login" className="mt-4 inline-block text-orange-600 underline">Giriş Sayfası</Link>
      </div>
    );
  }

  const joinDate = new Date(profileData.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center flex flex-col items-center">
            <div className="h-32 w-32 rounded-full bg-orange-100 overflow-hidden border-4 border-orange-50 shadow-inner mb-4 relative">
              {profileData.profileImageUrl ? (
                <img src={`http://localhost:3001${profileData.profileImageUrl}`} alt={profileData.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-4xl text-orange-600 font-bold">
                  {profileData.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{profileData.fullName}</h1>
            <p className="text-gray-500 text-sm mb-4">{profileData.city || 'Şehir belirtilmemiş'}</p>
            
            <Link href="/profile/settings" className="flex items-center gap-2 bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-2 rounded-full text-sm w-full justify-center transition-all">
              <Edit className="w-4 h-4" /> Profili Düzenle
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-2">İletişim Bilgileri</h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-orange-500" />
              <span className="truncate">{profileData.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-orange-500" />
              <span>{profileData.contactPhone || 'Belirtilmemiş'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>{profileData.city ? `${profileData.city}${profileData.district ? ', ' + profileData.district : ''}` : 'Belirtilmemiş'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{joinDate} tarihinde katıldı</span>
            </div>
          </div>
        </div>

        {/* Right Column: Bio & Links */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hakkımda</h2>
            <div className="p-4 bg-gray-50 rounded-2xl text-gray-600 min-h-[120px]">
              {profileData.biography ? (
                <p className="whitespace-pre-wrap leading-relaxed">{profileData.biography}</p>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>Henüz biyografi eklenmemiş.</p>
                  <Link href="/profile/settings" className="text-orange-500 underline mt-2 inline-block">Hemen Ekle</Link>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mt-4 px-2">Hızlı Erişim</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link href="/my-requests" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-3xl shadow-lg border border-transparent hover:border-orange-200 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-700">Taleplerim</span>
            </Link>

            <Link href="/profile/favorites" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-3xl shadow-lg border border-transparent hover:border-orange-200 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-700">Favori İlanlarım</span>
            </Link>

            <Link href="/profile/settings" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-3xl shadow-lg border border-transparent hover:border-orange-200 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-700">Ayarlar</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
