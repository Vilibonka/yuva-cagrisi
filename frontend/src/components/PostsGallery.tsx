'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bone, Image as ImageIcon, MapPin, PawPrint, Search, SlidersHorizontal, X, Clock, Loader2 } from 'lucide-react';
import api, { buildMediaUrl } from '@/api';
import FavoriteButton from './FavoriteButton';

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
    weightKg?: number;
    healthSummary?: string;
  };
  images?: Array<{
    imageUrl: string;
    isPrimary: boolean;
  }>;
  owner?: {
    fullName: string;
    profileImageUrl?: string;
  };
}

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

const postTypeLabels: Record<string, { label: string; color: string }> = {
  FOUND_STRAY: { label: 'Sokakta Bulunan', color: 'bg-sky-500' },
  REHOME_OWNED_PET: { label: 'Sahiplendirme', color: 'bg-amber-500' },
  TEMP_HOME_NEEDED: { label: 'Geçici Yuva', color: 'bg-violet-500' },
};

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
  "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir",
  "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const normalizeText = (text: string) => {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} saat önce`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString('tr-TR');
}

export default function PostsGallery() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    species: '',
    city: '',
    gender: '',
    ageRange: '',
    weightRange: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCitySearch(val);
    setShowCityDropdown(true);
    if (val.trim() === '') {
      setFilters(prev => ({ ...prev, city: '' }));
    }
  };

  const selectCity = (city: string) => {
    setCitySearch(city);
    setFilters(prev => ({ ...prev, city }));
    setShowCityDropdown(false);
  };

  const normalizedCitySearch = normalizeText(citySearch);
  const filteredCities = citySearch.trim() === '' ? [] : TURKEY_CITIES.filter((city) => normalizeText(city).includes(normalizedCitySearch));
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, page, totalPages]);

  useEffect(() => {
    // Reset page and posts when filters change
    setPage(1);
    setPosts([]);
  }, [filters]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        params.append('page', page.toString());
        params.append('limit', '12');

        const response = await api.get(`/pet-posts?${params.toString()}`);
        const { data, totalPages: fetchedTotalPages } = response.data;
        
        setPosts(prev => page === 1 ? data : [...prev, ...data]);
        setTotalPages(fetchedTotalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchPosts();
  }, [filters, page]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const clearFilters = () => {
    setFilters({ species: '', city: '', gender: '', ageRange: '', weightRange: '' });
    setCitySearch('');
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4">
      {/* Hero Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-700 mb-4">
          <PawPrint className="h-4 w-4" /> Sahiplendirme İlanları
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Yuva Arayan <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">Canlar</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500">
          Sevgi dolu bir yuvaya kavuşmayı bekleyen dostlarımızı keşfedin.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                filtersOpen || activeFilterCount > 0
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtreler
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" /> Temizle
              </button>
            )}
          </div>
          <span className="text-sm font-medium text-gray-400">
            {loading ? 'Yükleniyor...' : `${posts.length} ilan bulundu`}
          </span>
        </div>

        {/* Expandable Filters */}
        <div
          className={`grid grid-cols-1 gap-4 overflow-hidden transition-all duration-300 sm:grid-cols-2 lg:grid-cols-5 ${
            filtersOpen ? 'mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Tür</label>
            <select
              name="species"
              value={filters.species}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              <option value="">Tümü</option>
              <option value="DOG">🐕 Köpek</option>
              <option value="CAT">🐈 Kedi</option>
              <option value="BIRD">🐦 Kuş</option>
              <option value="RABBIT">🐇 Tavşan</option>
              <option value="OTHER">🐾 Diğer</option>
            </select>
          </div>

          <div ref={cityRef} className="relative">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Şehir</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Şehir adı..."
                value={citySearch}
                onChange={handleCityInput}
                onFocus={() => setShowCityDropdown(true)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                autoComplete="off"
              />
              {showCityDropdown && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                  {filteredCities.length > 0 ? (
                    filteredCities.map(city => (
                      <button
                        key={city}
                        onClick={() => selectCity(city)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">Şehir bulunamadı</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Cinsiyet</label>
            <select
              name="gender"
              value={filters.gender}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              <option value="">Tümü</option>
              <option value="MALE">Erkek</option>
              <option value="FEMALE">Dişi</option>
              <option value="UNKNOWN">Bilinmiyor</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Yaş Aralığı</label>
            <select
              name="ageRange"
              value={filters.ageRange}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              <option value="">Tümü</option>
              <option value="AGE_0_6">0-6 ay</option>
              <option value="AGE_6_24">6-24 ay</option>
              <option value="AGE_24_96">2-8 yaş</option>
              <option value="AGE_96_PLUS">8+ yaş</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Kilo Aralığı</label>
            <select
              name="weightRange"
              value={filters.weightRange}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              <option value="">Tümü</option>
              <option value="WEIGHT_0_5">0-5 kg</option>
              <option value="WEIGHT_5_15">5-15 kg</option>
              <option value="WEIGHT_15_30">15-30 kg</option>
              <option value="WEIGHT_30_PLUS">30+ kg</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="h-56 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-gray-100" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
            <Bone className="h-10 w-10 text-orange-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700">Aramanıza uygun ilan bulunamadı</h3>
          <p className="mt-2 max-w-md text-gray-400">
            Filtreleri değiştirerek veya temizleyerek tekrar deneyin. Yeni ilanlar sürekli eklenmektedir.
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => {
            const primaryImage = post.images?.find((img) => img.isPrimary) || post.images?.[0];
            const imageUrl = buildMediaUrl(primaryImage?.imageUrl);
            const species = post.pet?.species || 'OTHER';
            const typeInfo = postTypeLabels[post.postType] || postTypeLabels.FOUND_STRAY;

            return (
              <div 
                key={post.id} 
                ref={posts.length === index + 1 ? lastPostElementRef : null}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50"
              >
                <Link href={`/posts/${post.id}`} className="flex flex-col">
                  {/* Image Section */}
                  <div className="relative h-60 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={post.title}
                        loading="lazy"
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

                    {/* Top Badges */}
                    <div className="absolute left-3 top-3 flex flex-col gap-2">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-md ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {post.isUrgent && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-md animate-pulse">
                          🚨 Acil
                        </span>
                      )}
                    </div>

                    {/* Species Emoji */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm backdrop-blur-sm">
                        {speciesEmojis[species]} {speciesLabels[species] || species}
                      </span>
                    </div>

                    {/* Time Badge */}
                    <div className="absolute bottom-3 right-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                        <Clock className="h-3 w-3" /> {timeAgo(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 text-base font-bold text-gray-800 transition group-hover:text-orange-600">
                      {post.title}
                    </h3>

                    {post.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400">
                        {post.description}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 text-orange-400" />
                          <span className="font-medium">{post.city}</span>
                        </div>

                        {post.owner && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600">
                              {post.owner.fullName?.charAt(0) || '?'}
                            </div>
                            <span className="max-w-[100px] truncate">{post.owner.fullName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Favorite Button */}
                <div className="absolute right-3 top-3 z-10">
                  <FavoriteButton postId={post.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="mt-8 flex justify-center pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-orange-500 shadow-sm ring-1 ring-gray-100">
            <Loader2 className="h-4 w-4 animate-spin" /> Daha fazla yükleniyor...
          </div>
        </div>
      )}
      
      {!loading && !loadingMore && posts.length > 0 && page >= totalPages && (
        <div className="mt-8 pb-8 text-center text-sm text-gray-400">
          Tüm ilanları görüntülediniz.
        </div>
      )}
    </div>
  );
}
