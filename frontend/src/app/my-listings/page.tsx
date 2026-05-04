"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Eye, PawPrint, PlusSquare, Clock3, Users, XCircle, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '@/api';
import { getStoredUser } from '@/lib/auth';

interface PostImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

interface Pet {
  id: string;
  species: string;
  breed?: string;
  gender?: string;
}

interface AdoptionRequestSummary {
  id: string;
  status: string;
  applicantUserId: string;
}

interface MyPost {
  id: string;
  title: string;
  city?: string;
  status: string;
  viewCount: number;
  createdAt: string;
  pet: Pet;
  images: PostImage[];
  adoptionRequests: AdoptionRequestSummary[];
}

type FilterKey = 'ALL' | 'ACTIVE' | 'ADOPTED' | 'CLOSED';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getPrimaryImage(post: MyPost) {
  return post?.images?.find((image: PostImage) => image.isPrimary) || post?.images?.[0] || null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  PENDING: { label: 'Beklemede', color: 'bg-amber-100 text-amber-700 ring-amber-200', icon: Clock3 },
  ADOPTED: { label: 'Sahiplendirildi', color: 'bg-blue-100 text-blue-700 ring-blue-200', icon: PawPrint },
  CLOSED: { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-600 ring-gray-200', icon: XCircle },
  DRAFT: { label: 'Taslak', color: 'bg-gray-100 text-gray-500 ring-gray-200', icon: AlertCircle },
};

const speciesMap: Record<string, string> = {
  DOG: '🐕 Köpek',
  CAT: '🐈 Kedi',
  BIRD: '🐦 Kuş',
  RABBIT: '🐇 Tavşan',
  OTHER: '🐾 Diğer'
};

export default function MyListingsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('ALL');

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const fetchPosts = async () => {
      try {
        const response = await api.get('/pet-posts/my');
        setPosts(response.data);
      } catch (err) {
        setError('İlanlarınız yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [router]);

  const filteredPosts = filter === 'ALL' ? posts : posts.filter(p => p.status === filter);

  const counts: Record<FilterKey, number> = {
    ALL: posts.length,
    ACTIVE: posts.filter((p: MyPost) => p.status === 'ACTIVE').length,
    ADOPTED: posts.filter((p: MyPost) => p.status === 'ADOPTED').length,
    CLOSED: posts.filter((p: MyPost) => p.status === 'CLOSED').length,
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-gray-400 text-sm font-medium">İlanlar yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6 px-4">
      {/* Header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <PawPrint className="w-4.5 h-4.5 text-orange-600" />
              </div>
              İlanlarım
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">Oluşturduğunuz tüm ilanları buradan yönetebilirsiniz.</p>
          </div>
          <Link
            href="/listings/create"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200/50 transition hover:from-orange-600 hover:to-orange-700"
          >
            <PlusSquare className="w-4 h-4" /> Yeni İlan
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {([
            { key: 'ALL' as FilterKey, label: 'Tümü' },
            { key: 'ACTIVE' as FilterKey, label: 'Aktif' },
            { key: 'ADOPTED' as FilterKey, label: 'Sahiplendirildi' },
            { key: 'CLOSED' as FilterKey, label: 'Kapatıldı' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${filter === tab.key ? 'text-orange-100' : 'text-gray-400'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
          <PawPrint className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-800">
            {filter === 'ALL' ? 'Henüz ilan oluşturmadınız' : 'Bu durumda ilan yok'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {filter === 'ALL'
              ? 'Sokak hayvanlarına yuva bulmak için hemen bir ilan oluşturun.'
              : 'Seçili filtreye uygun ilanınız bulunmuyor.'}
          </p>
          {filter === 'ALL' && (
            <Link href="/listings/create" className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700">
              İlan Oluştur <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPosts.map((post) => {
            const primaryImage = getPrimaryImage(post);
            const imageUrl = primaryImage ? `http://localhost:3001${primaryImage.imageUrl}` : null;
            const config = statusConfig[post.status] || statusConfig.DRAFT;
            const StatusIcon = config.icon;
            const pendingRequests = post.adoptionRequests?.filter(r => r.status === 'PENDING').length || 0;
            const totalRequests = post.adoptionRequests?.length || 0;

            return (
              <div key={post.id} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-gray-200">
                {/* Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      <PawPrint className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ${config.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </div>
                  {/* Species Badge */}
                  <div className="absolute top-3 right-3 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                    {speciesMap[post.pet?.species] || '🐾 Hayvan'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-900 truncate mb-1">{post.title}</h3>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    {post.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {post.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock3 className="w-3 h-3" /> {formatDate(post.createdAt)}
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-600">
                      <Users className="w-3.5 h-3.5" />
                      {totalRequests} başvuru
                    </div>
                    {pendingRequests > 0 && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
                        <Clock3 className="w-3.5 h-3.5" />
                        {pendingRequests} bekleyen
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-600">
                      <Eye className="w-3.5 h-3.5" />
                      {post.viewCount || 0} görüntülenme
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/posts/${post.id}`}
                      className="flex-1 text-center rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
                    >
                      İlanı Görüntüle
                    </Link>
                    {pendingRequests > 0 && (
                      <Link
                        href={`/posts/${post.id}`}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600 shadow-sm"
                      >
                        Başvuruları İncele
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
