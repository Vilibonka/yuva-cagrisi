'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bone, Image as ImageIcon, MapPin, PawPrint,
  Search, SlidersHorizontal, X, Clock,
} from 'lucide-react';
import api, { buildMediaUrl } from '@/api';
import FavoriteButton from './FavoriteButton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  title: string;
  description: string;
  postType: 'FOUND_STRAY' | 'REHOME_OWNED_PET' | 'TEMP_HOME_NEEDED';
  city: string;
  isUrgent: boolean;
  createdAt: string;
  pet?: {
    species: string;
    breed?: string;
    gender?: string;
    estimatedAgeMonths?: number;
    healthSummary?: string;
  };
  images?: Array<{ imageUrl: string; isPrimary: boolean }>;
  owner?: { fullName: string; profileImageUrl?: string };
}

interface Filters {
  q: string;
  species: string;
  city: string;
  size: string;
  gender: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const speciesLabels: Record<string, string> = {
  DOG: 'Köpek', CAT: 'Kedi', BIRD: 'Kuş', RABBIT: 'Tavşan', OTHER: 'Diğer',
};
const speciesEmojis: Record<string, string> = {
  DOG: '🐕', CAT: '🐈', BIRD: '🐦', RABBIT: '🐇', OTHER: '🐾',
};
const postTypeLabels: Record<string, { label: string; color: string }> = {
  FOUND_STRAY:      { label: 'Sokakta Bulunan', color: 'bg-sky-500' },
  REHOME_OWNED_PET: { label: 'Sahiplendirme',   color: 'bg-amber-500' },
  TEMP_HOME_NEEDED: { label: 'Geçici Yuva',      color: 'bg-violet-500' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diffMs   = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return 'Az önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)  return `${diffHrs} saat önce`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7)  return `${diffDays} gün önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-sm shadow-lg">
      <div className="h-60 animate-pulse bg-gradient-to-br from-orange-50 to-gray-100" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-4 w-1/2 animate-pulse rounded-xl bg-gray-100" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 animate-pulse rounded-full bg-orange-50" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PostsGallery() {
  const [posts, setPosts]           = useState<Post[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters]       = useState<Filters>({ q: '', species: '', city: '', size: '', gender: '' });
  const [cities, setCities]         = useState<{ id: string; name: string }[]>([]);
  const loaderRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.get('/cities').then(res => setCities(res.data)).catch(console.error);
  }, []);

  const fetchPosts = async (currentPage: number, append = false) => {
    if (currentPage === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      params.append('page', currentPage.toString());
      params.append('limit', '12');
      const { data } = await api.get(`/pet-posts?${params}`);
      setPosts(prev => append ? [...prev, ...data.data] : data.data);
      setHasNextPage(data.meta.hasNextPage);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => {
    setPage(1);
    const id = setTimeout(() => fetchPosts(1, false), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (page > 1) fetchPosts(page, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !loading && !loadingMore) setPage(p => p + 1); },
      { threshold: 0.1 },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loading, loadingMore]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const clearFilters = () => setFilters({ q: '', species: '', city: '', size: '', gender: '' });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full overflow-hidden">

      {/* ── Animated Background ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/40 to-rose-50" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-orange-200/25 to-amber-100/15 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-rose-200/15 to-orange-100/15 blur-3xl animate-pulse" style={{ animationDuration: '9s' }} />
      </div>

      {/* Floating paw decorations */}
      <div className="fixed top-[15%] left-[3%]  text-5xl opacity-[0.06] animate-bounce pointer-events-none" style={{ animationDuration: '4s' }}>🐾</div>
      <div className="fixed top-[40%] right-[2%] text-4xl opacity-[0.06] animate-bounce pointer-events-none" style={{ animationDuration: '5s', animationDelay: '1s' }}>🐾</div>
      <div className="fixed bottom-[20%] left-[2%] text-3xl opacity-[0.05] animate-bounce pointer-events-none" style={{ animationDuration: '3.5s', animationDelay: '2s' }}>❤️</div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">

        {/* ── Hero Header ── */}
        <div className="mb-10 text-center relative">
          {/* Glassmorphic badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-white/70 backdrop-blur-sm px-5 py-2 text-sm font-bold text-orange-600 shadow-sm mb-5">
            <PawPrint className="h-4 w-4" />
            Sahiplendirme İlanları
          </div>

          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Yuva Arayan{' '}
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              Canlar
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 leading-relaxed">
            Sevgi dolu bir yuvaya kavuşmayı bekleyen dostlarımızı keşfedin.
          </p>

          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-6 mt-7">
            {[
              { emoji: '🐾', label: '1000+ İlan' },
              { emoji: '🏠', label: 'Güvenli Sahiplendirme' },
              { emoji: '❤️', label: 'Binlerce Mutlu Yuva' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-5 py-2.5 shadow-sm">
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-bold text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="mb-8 rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-orange-100/30 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                  filtersOpen || activeFilterCount > 0
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtreler
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs font-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" /> Temizle
                </button>
              )}
            </div>
            <span className={`text-sm font-medium ${loading ? 'text-orange-400 animate-pulse' : 'text-gray-400'}`}>
              {loading ? 'Yükleniyor...' : `${posts.length} ilan bulundu`}
            </span>
          </div>

          {/* Expandable filter grid */}
          <div className={`grid grid-cols-1 gap-4 overflow-hidden transition-all duration-300 sm:grid-cols-2 lg:grid-cols-5 ${
            filtersOpen ? 'mt-5 max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            {/* Species */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Tür</label>
              <select name="species" value={filters.species} onChange={handleFilterChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100">
                <option value="">Tümü</option>
                <option value="DOG">🐕 Köpek</option>
                <option value="CAT">🐈 Kedi</option>
                <option value="BIRD">🐦 Kuş</option>
                <option value="RABBIT">🐇 Tavşan</option>
                <option value="OTHER">🐾 Diğer</option>
              </select>
            </div>

            {/* Keyword */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Arama</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" name="q" placeholder="İlan, tür, vb..." value={filters.q} onChange={handleFilterChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-9 pr-3 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Şehir</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select name="city" value={filters.city} onChange={handleFilterChange}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-9 pr-4 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100">
                  <option value="">Tümü</option>
                  {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Cinsiyet</label>
              <select name="gender" value={filters.gender} onChange={handleFilterChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100">
                <option value="">Tümü</option>
                <option value="MALE">Erkek</option>
                <option value="FEMALE">Dişi</option>
                <option value="UNKNOWN">Bilinmiyor</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Boyut</label>
              <select name="size" value={filters.size} onChange={handleFilterChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100">
                <option value="">Tümü</option>
                <option value="SMALL">Küçük</option>
                <option value="MEDIUM">Orta</option>
                <option value="LARGE">Büyük</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-orange-100/30 p-16 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 shadow-md">
              <Bone className="h-10 w-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Aramanıza uygun ilan bulunamadı</h3>
            <p className="mt-2 max-w-md text-gray-400 text-sm leading-relaxed">
              Filtreleri değiştirerek veya temizleyerek tekrar deneyin. Yeni ilanlar sürekli eklenmektedir.
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          /* ── Post Cards ── */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const primaryImage = post.images?.find(img => img.isPrimary) ?? post.images?.[0];
              const imageUrl     = buildMediaUrl(primaryImage?.imageUrl);
              const species      = post.pet?.species ?? 'OTHER';
              const typeInfo     = postTypeLabels[post.postType] ?? postTypeLabels.FOUND_STRAY;

              return (
                <div
                  key={post.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-orange-100/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-orange-200/30 hover:border-orange-200/40"
                >
                  <Link href={`/posts/${post.id}`} className="flex flex-col">
                    {/* Image */}
                    <div className="relative h-60 overflow-hidden bg-gradient-to-br from-orange-50 to-gray-100">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
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

                      {/* Dark gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

                      {/* Type + Urgent badges */}
                      <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                        <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-sm ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {post.isUrgent && (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-md animate-pulse">
                            🚨 Acil
                          </span>
                        )}
                      </div>

                      {/* Species badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="rounded-xl bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm backdrop-blur-sm">
                          {speciesEmojis[species]} {speciesLabels[species] ?? species}
                        </span>
                      </div>

                      {/* Time badge */}
                      <div className="absolute bottom-3 right-3">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                          <Clock className="h-3 w-3" /> {timeAgo(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 text-base font-black text-gray-800 tracking-tight transition-colors group-hover:text-orange-600">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400">
                          {post.description}
                        </p>
                      )}

                      <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between border-t border-gray-100/80 pt-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5 text-orange-400" />
                            <span className="font-semibold">{post.city}</span>
                          </div>
                          {post.owner && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-[10px] font-black text-white shadow-sm">
                                {post.owner.fullName?.charAt(0) ?? '?'}
                              </div>
                              <span className="max-w-[100px] truncate font-medium">{post.owner.fullName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Favorite button */}
                  <div className="absolute right-3 top-3 z-10">
                    <FavoriteButton postId={post.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Infinite Scroll Trigger ── */}
        <div ref={loaderRef} className="mt-10 py-8 flex justify-center items-center">
          {loadingMore && (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500 shadow-md" />
              <p className="text-sm font-medium text-gray-400 animate-pulse">Daha fazla ilan yükleniyor...</p>
            </div>
          )}
          {!hasNextPage && posts.length > 0 && !loading && (
            <div className="text-center py-4 px-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 text-gray-400 text-sm font-medium shadow-sm">
              ✨ Tüm ilanlar bu kadar. Aradığını bulamadın mı? Filtreleri değiştirmeyi dene!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
