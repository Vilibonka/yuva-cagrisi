'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { showSuccess, showError, showInfo } from '@/utils/toast';

interface FavoriteButtonProps {
  postId: string;
  initialIsFavorited?: boolean;
}

interface SavedPostSummary {
  postId: string;
}

export default function FavoriteButton({ postId, initialIsFavorited = false }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  // Check if this post is already favorited on mount
  useEffect(() => {
    if (!isAuthenticated || checked) return;

    const checkFavoriteStatus = async () => {
      try {
        const { data } = await api.get('/users/me/saved-posts');
        const isSaved = data.some((fav: SavedPostSummary) => fav.postId === postId);
        setIsFavorited(isSaved);
      } catch {
        // Silently fail - just show as not favorited
      } finally {
        setChecked(true);
      }
    };

    checkFavoriteStatus();
  }, [isAuthenticated, postId, checked]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/users/me/saved-posts/${postId}`);
      setIsFavorited(data.saved);
      if (data.saved) {
        showSuccess('İlan favorilere eklendi');
      } else {
        showInfo('İlan favorilerden çıkarıldı');
      }
    } catch (err) {
      console.error('Favori işlemi başarısız:', err);
      showError('Favori işlemi başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`rounded-full p-2 transition-all duration-300 ${
        isFavorited
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
          : 'bg-white/80 text-gray-600 hover:text-red-500 hover:shadow-md'
      } backdrop-blur-sm`}
      aria-label={isFavorited ? 'Favorilerden kaldır' : 'Favorilere ekle'}
    >
      <Heart className={`h-5 w-5 transition-transform ${isFavorited ? 'fill-current' : ''} ${loading ? 'animate-pulse' : ''}`} />
    </button>
  );
}
