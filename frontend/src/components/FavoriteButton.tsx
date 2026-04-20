'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  postId: string;
  initialIsFavorited?: boolean;
}

export default function FavoriteButton({ postId, initialIsFavorited = false }: FavoriteButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If we have access to user data, check if this post is in their savedPosts
    if (user?.savedPosts) {
      const match = user.savedPosts.some((fav: any) => fav.postId === postId);
      setIsFavorited(match);
    }
  }, [user, postId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link click if nested
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/users/me/saved-posts/${postId}`);
      setIsFavorited(data.saved);
    } catch (err) {
      console.error('Favori işlemi başarısız:', err);
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
          ? 'bg-red-500 text-white shadow-lg' 
          : 'bg-white/80 text-gray-600 hover:text-red-500 hover:shadow-md'
      } backdrop-blur-sm group-hover:scale-110`}
      aria-label="Favorilere Ekle"
    >
      <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
    </button>
  );
}
