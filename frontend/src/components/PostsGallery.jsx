"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bone, Filter, Image as ImageIcon, Info, MapPin } from 'lucide-react';
import api from '@/api';

export default function PostsGallery() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    species: '',
    city: '',
    size: '',
    gender: '',
  });

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });

        const response = await api.get(`/pet-posts?${params.toString()}`);
        setPosts(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [filters]);

  const handleFilterChange = (event) => {
    setFilters((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 md:flex-row">
      <div className="w-full flex-shrink-0 md:w-64">
        <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 text-orange-600">
            <Filter className="h-5 w-5" />
            <h3 className="text-lg font-bold text-gray-800">Filtreler</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Tur</label>
              <select name="species" value={filters.species} onChange={handleFilterChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-orange-500">
                <option value="">Tumu</option>
                <option value="DOG">Kopek</option>
                <option value="CAT">Kedi</option>
                <option value="BIRD">Kus</option>
                <option value="RABBIT">Tavsan</option>
                <option value="OTHER">Diger</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Sehir</label>
              <input
                type="text"
                name="city"
                placeholder="Orn: Ankara"
                value={filters.city}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Boyut</label>
              <select name="size" value={filters.size} onChange={handleFilterChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-orange-500">
                <option value="">Tumu</option>
                <option value="SMALL">Kucuk</option>
                <option value="MEDIUM">Orta</option>
                <option value="LARGE">Buyuk</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Cinsiyet</label>
              <select name="gender" value={filters.gender} onChange={handleFilterChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-orange-500">
                <option value="">Tumu</option>
                <option value="MALE">Erkek</option>
                <option value="FEMALE">Disi</option>
              </select>
            </div>

            <button
              onClick={() => setFilters({ species: '', city: '', size: '', gender: '' })}
              className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Yuva Arayan Canlar</h2>
          <span className="text-sm font-medium text-gray-500">{posts.length} ilan bulundu</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-2xl border border-gray-100 bg-white" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Bone className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-700">Aramaniza uygun canli bulunamadi</h3>
            <p className="mt-2 text-gray-500">Lutfen filtreleri degistirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const primaryImage = post.images?.find((image) => image.isPrimary) || post.images?.[0];
              const imageUrl = primaryImage ? `http://localhost:3000${primaryImage.imageUrl}` : null;

              return (
                <Link href={`/posts/${post.id}`} key={post.id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    {imageUrl ? (
                      <img src={imageUrl} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="mb-2 h-10 w-10 opacity-50" />
                        <span className="text-xs">Gorsel Yok</span>
                      </div>
                    )}

                    {post.postType === 'FOUND_STRAY' && (
                      <span className="absolute left-3 top-3 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        Kayip / Sokak
                      </span>
                    )}
                    {post.postType === 'TEMP_HOME_NEEDED' && (
                      <span className="absolute left-3 top-3 rounded-full bg-purple-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        Gecici Yuva
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-1 text-lg font-bold text-gray-800 transition group-hover:text-orange-600">{post.title}</h3>
                    <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {post.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {post.pet?.species === 'DOG' ? 'Kopek' : post.pet?.species === 'CAT' ? 'Kedi' : 'Diger'}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
