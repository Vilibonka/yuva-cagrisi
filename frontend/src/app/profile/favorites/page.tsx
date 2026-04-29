'use client';

import React, { useEffect, useState } from 'react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Heart, MapPin, Image as ImageIcon, Trash2, PawPrint, Clock } from 'lucide-react';

const speciesLabels: Record<string, string> = {
  DOG: 'Köpek',
  CAT: 'Kedi',
  BIRD: 'Kuş',
  RABBIT: 'Tavşan',
  OTHER: 'Diğer',
};

const speciesEmojis: Record<string, string> = {
  DOG: '🐕',
  CAT: '🐈',
  BIRD: '🐦',
  RABBIT: '🐇',
  OTHER: '🐾',
};

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
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

  const removeFavorite = async (postId: string) => {
    setRemoving(postId);
    try {
      await api.post(`/users/me/saved-posts/${postId}`);
      setFavorites((prev) => prev.filter((fav) => fav.postId !== postId));
    } catch (err) {
      console.error('Favori kaldırılamadı:', err);
    } finally {
      setRemoving(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="h-48 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
          <Heart className="h-10 w-10 text-orange-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Giriş Yapmanız Gerekiyor</h1>
        <p className="mt-2 text-gray-500">Favori ilanlarınızı görmek için lütfen giriş yapın.</p>
        <Link
          href="/login"
          className="mt-6 rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            <Heart className="h-3 w-3 fill-current" /> Favorilerim
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Favori İlanlarım
          </h1>
          <p className="mt-1 text-gray-500">
            Beğendiğiniz ve kaydettiğiniz ilanlar burada listelenir.
          </p>
        </div>
        {favorites.length > 0 && (
          <span className="hidden rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 sm:inline-flex">
            {favorites.length} ilan kaydedildi
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <Heart className="h-10 w-10 text-red-200" />
          </div>
          <h3 className="text-xl font-bold text-gray-700">Henüz favori ilanınız yok</h3>
          <p className="mt-2 max-w-md text-gray-400">
            İlanlar sayfasından beğendiğiniz canlara kalp simgesine tıklayarak favorilerinize ekleyebilirsiniz.
          </p>
          <Link
            href="/posts"
            className="mt-6 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
          >
            İlanlara Göz At
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const post = fav.post;
            const primaryImage = post.images?.find((img: any) => img.isPrimary) || post.images?.[0];
            const imageUrl = primaryImage ? `http://localhost:3001${primaryImage.imageUrl}` : null;
            const species = post.pet?.species || 'OTHER';

            return (
              <div
                key={fav.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <Link href={`/posts/${post.id}`} className="flex flex-col">
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-gray-300">
                        <ImageIcon className="mb-2 h-12 w-12 opacity-40" />
                        <span className="text-xs font-medium">Görsel Yok</span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Species badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm backdrop-blur-sm">
                        {speciesEmojis[species]} {speciesLabels[species] || species}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 text-base font-bold text-gray-800 transition group-hover:text-orange-600">
                      {post.title}
                    </h3>

                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 text-orange-400" />
                          <span className="font-medium">{post.city}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(fav.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFavorite(post.id);
                  }}
                  disabled={removing === post.id}
                  className="absolute right-3 top-3 z-10 rounded-full bg-red-500 p-2 text-white shadow-lg transition-all hover:bg-red-600 hover:scale-110 disabled:opacity-50"
                  aria-label="Favorilerden kaldır"
                >
                  {removing === post.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Heart className="h-4 w-4 fill-current" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
