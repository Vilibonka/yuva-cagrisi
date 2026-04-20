'use client';

import React, { useEffect, useState } from 'react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data } = await api.get('/users/me/saved-posts');
        setFavorites(data);
      } catch (err: any) {
        setError('Favoriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFavorites();
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Lütfen giriş yapın</h1>
        <Link href="/login" className="mt-4 inline-block text-orange-600 underline">Giriş Sayfası</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Favori İlanlarım</h1>
      
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <p className="text-lg text-gray-500">Henüz favorilere eklenmiş bir ilan yok.</p>
          <Link href="/posts" className="mt-4 inline-block rounded-lg bg-orange-600 px-6 py-2 font-bold text-white transition-all hover:bg-orange-700">
            İlanlara Göz At
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl">
              <div className="relative h-48 w-full bg-gray-200">
                {fav.post.images && fav.post.images[0] ? (
                  <img
                    src={fav.post.images[0].imageUrl}
                    alt={fav.post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">Görsel Yok</div>
                )}
                <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-orange-600 backdrop-blur-sm">
                  {fav.post.pet?.species}
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-2 truncate text-xl font-bold text-gray-900">{fav.post.title}</h3>
                <p className="mb-4 text-sm text-gray-500">{fav.post.city}</p>
                <Link href={`/posts/${fav.post.id}`} className="block w-full rounded-lg border border-orange-600 py-2 text-center text-sm font-bold text-orange-600 transition-all hover:bg-orange-600 hover:text-white">
                  Detayları Gör
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
