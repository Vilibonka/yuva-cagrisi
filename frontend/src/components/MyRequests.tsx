'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Clock3, MapPin, PawPrint, Home, Users,
  Heart, Phone, FileText, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import api, { buildMediaUrl } from '@/api';
import { getStoredUser } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type FilterKey = 'ALL' | RequestStatus;

interface StatusHistoryItem {
  id: number;
  oldStatus: RequestStatus | null;
  newStatus: RequestStatus;
  changedAt: string;
  note?: string | null;
  changedBy?: { fullName: string } | null;
}

interface PostImage {
  imageUrl: string;
  isPrimary: boolean;
}

interface Post {
  id: number;
  title: string;
  city?: string;
  images?: PostImage[];
}

interface AdoptionRequest {
  id: number;
  postId: number;
  status: RequestStatus;
  message: string;
  housingType?: string;
  hasOtherPets: boolean;
  hasChildren: boolean;
  contactPhone?: string;
  experienceWithPets?: string;
  whyAdopt?: string;
  createdAt: string;
  reviewedAt?: string;
  post?: Post;
  statusHistory?: StatusHistoryItem[];
}

interface StatusConfigEntry {
  label: string;
  color: string;
  icon: React.ElementType;
  iconColor: string;
  gradient: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getPrimaryImage(post?: Post): PostImage | null {
  return post?.images?.find((img) => img.isPrimary) ?? post?.images?.[0] ?? null;
}

const statusConfig: Record<RequestStatus, StatusConfigEntry> = {
  PENDING:   { label: 'Beklemede',   color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   icon: Clock,        iconColor: 'text-amber-500',  gradient: 'from-amber-500 to-amber-600' },
  APPROVED:  { label: 'Onaylandı',   color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
  REJECTED:  { label: 'Reddedildi',  color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',       icon: XCircle,      iconColor: 'text-rose-500',    gradient: 'from-rose-500 to-rose-600' },
  CANCELLED: { label: 'İptal Edildi',color: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',       icon: AlertCircle,  iconColor: 'text-gray-400',    gradient: 'from-gray-400 to-gray-500' },
};

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',      label: 'Tümü' },
  { key: 'PENDING',  label: 'Bekleyen' },
  { key: 'APPROVED', label: 'Onaylanan' },
  { key: 'REJECTED', label: 'Reddedilen' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyRequests() {
  const router = useRouter();
  const [requests, setRequests]     = useState<AdoptionRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter]         = useState<FilterKey>('ALL');

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) { router.replace('/login'); return; }

    (async () => {
      try {
        const { data } = await api.get<AdoptionRequest[]>('/adoption-requests/my');
        setRequests(data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string | string[] } } };
        const msg = e.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Başvurularınız yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filteredRequests = filter === 'ALL'
    ? requests
    : requests.filter((r) => r.status === filter);

  const counts: Record<FilterKey, number> = {
    ALL:      requests.length,
    PENDING:  requests.filter((r) => r.status === 'PENDING').length,
    APPROVED: requests.filter((r) => r.status === 'APPROVED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
    CANCELLED: requests.filter((r) => r.status === 'CANCELLED').length,
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-rose-50" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-orange-500 animate-spin" />
          <span className="text-gray-400 text-sm font-medium">Başvurular yükleniyor...</span>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden">

      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-rose-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-200/30 to-amber-100/20 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-200/20 to-orange-100/20 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-[8%]  left-[5%]  text-4xl opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>🐾</div>
      <div className="absolute top-[20%] right-[8%] text-3xl opacity-10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🐾</div>
      <div className="absolute bottom-[10%] left-[12%] text-5xl opacity-[0.07] animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}>🐾</div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 py-8 px-4">

        {/* ── Header Card ── */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl shadow-orange-100/50 border border-white/60 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-200/50">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Başvurularım
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">Sahiplenme başvurularınızın durumunu takip edin.</p>
            </div>
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <PawPrint className="w-4 h-4" /> İlanları Keşfet
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm shadow-orange-200/50'
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

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* ── Empty State ── */}
        {filteredRequests.length === 0 ? (
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl shadow-orange-100/50 border border-white/60 p-12 text-center">
            <PawPrint className="mx-auto mb-4 h-14 w-14 text-gray-200" />
            <h2 className="text-xl font-bold text-gray-800">
              {filter === 'ALL' ? 'Henüz başvurunuz yok' : 'Bu durumda başvuru yok'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {filter === 'ALL'
                ? 'İlanları inceleyip size uygun dost için hemen başvuru yapın.'
                : 'Seçili filtreye uygun başvurunuz bulunmuyor.'}
            </p>
            {filter === 'ALL' && (
              <Link
                href="/posts"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                İlanlara Git <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          /* ── Request Cards ── */
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const primaryImage = getPrimaryImage(request.post);
              const imageUrl     = buildMediaUrl(primaryImage?.imageUrl);
              const config       = statusConfig[request.status] ?? statusConfig.CANCELLED;
              const StatusIcon   = config.icon;
              const isExpanded   = expandedId === request.id;

              return (
                <div
                  key={request.id}
                  className="overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-lg shadow-orange-100/30 border border-white/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* ── Card Body ── */}
                  <div className="flex flex-col lg:flex-row">
                    {/* Image */}
                    <div className="relative w-full lg:w-56 h-48 lg:h-auto bg-gray-100 flex-shrink-0 overflow-hidden">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt={request.post?.title ?? 'İlan'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-50">
                          <PawPrint className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${config.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">{request.post?.title ?? 'İlan bulunamadı'}</h2>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                            {request.post?.city && (
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {request.post.city}</span>
                            )}
                            <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" /> {formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Message preview */}
                      <div className="rounded-xl bg-gray-50 p-3.5 mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Başvuru Mesajınız</p>
                        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{request.message}</p>
                      </div>

                      {/* Pills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {request.housingType && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            <Home className="w-3 h-3" /> {request.housingType}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                          <PawPrint className="w-3 h-3" /> {request.hasOtherPets ? 'Evcil hayvan var' : 'Evcil hayvan yok'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-700">
                          <Users className="w-3 h-3" /> {request.hasChildren ? 'Çocuklu ev' : 'Çocuksuz ev'}
                        </span>
                        {request.contactPhone && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                            <Phone className="w-3 h-3" /> {request.contactPhone}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/posts/${request.postId}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
                        >
                          İlanı Görüntüle <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : request.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-200"
                        >
                          Detaylar {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {request.reviewedAt && (
                          <span className="text-[11px] text-gray-400 ml-auto">
                            Değerlendirilme: {formatDate(request.reviewedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Expandable Details ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-rose-400" /> Deneyim
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{request.experienceWithPets || 'Belirtilmedi'}</p>
                        </div>
                        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-orange-400" /> Neden Sahiplenmek İstiyor?
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{request.whyAdopt || 'Belirtilmedi'}</p>
                        </div>
                      </div>

                      {/* Status Timeline */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5 text-gray-400" /> Durum Geçmişi
                        </h4>
                        {(request.statusHistory?.length ?? 0) > 0 ? (
                          <div className="relative pl-6 space-y-3">
                            {request.statusHistory!.map((item, index) => {
                              const isLast   = index === request.statusHistory!.length - 1;
                              const itemConf = statusConfig[item.newStatus] ?? statusConfig.CANCELLED;
                              return (
                                <div key={item.id} className="relative">
                                  {!isLast && <div className="absolute left-[-16px] top-6 bottom-[-12px] w-0.5 bg-gray-200" />}
                                  <div className={`absolute left-[-20px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white bg-gradient-to-br ${itemConf.gradient}`} />
                                  <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                      <span className="text-sm font-semibold text-gray-800">
                                        {item.oldStatus
                                          ? `${(statusConfig[item.oldStatus] ?? statusConfig.CANCELLED).label} → ${itemConf.label}`
                                          : `${itemConf.label} olarak oluşturuldu`}
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-medium">{formatDate(item.changedAt)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      İşlemi yapan: <span className="font-semibold text-gray-700">{item.changedBy?.fullName ?? 'Sistem'}</span>
                                    </div>
                                    {item.note && <p className="text-xs text-gray-400 mt-1.5 italic">{item.note}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-400 text-center">
                            Durum geçmişi henüz oluşmadı.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
