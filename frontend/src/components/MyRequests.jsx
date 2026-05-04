"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock3, MapPin, PawPrint, Home, Users, Heart, Phone, FileText, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import api from '@/api';
import { getStoredUser } from '@/lib/auth';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getPrimaryImage(post) {
  return post?.images?.find((image) => image.isPrimary) || post?.images?.[0] || null;
}

const statusConfig = {
  PENDING: { label: 'Beklemede', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', icon: Clock, iconColor: 'text-amber-500', gradient: 'from-amber-500 to-amber-600' },
  APPROVED: { label: 'Onaylandı', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
  REJECTED: { label: 'Reddedildi', color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200', icon: XCircle, iconColor: 'text-rose-500', gradient: 'from-rose-500 to-rose-600' },
  CANCELLED: { label: 'İptal Edildi', color: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200', icon: AlertCircle, iconColor: 'text-gray-400', gradient: 'from-gray-400 to-gray-500' },
};

export default function MyRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const fetchRequests = async () => {
      try {
        const response = await api.get('/adoption-requests/my');
        setRequests(response.data);
      } catch (err) {
        const message = err.response?.data?.message;
        setError(Array.isArray(message) ? message.join(', ') : message || 'Başvurularınız yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router]);

  const filteredRequests = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter(r => r.status === 'PENDING').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-gray-400 text-sm font-medium">Başvurular yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 py-6 px-4">
      {/* Header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
              Başvurularım
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">Sahiplenme başvurularınızın durumunu takip edin.</p>
          </div>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200/50 transition hover:from-orange-600 hover:to-orange-700"
          >
            <PawPrint className="w-4 h-4" /> İlanları Keşfet
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {[
            { key: 'ALL', label: 'Tümü' },
            { key: 'PENDING', label: 'Bekleyen' },
            { key: 'APPROVED', label: 'Onaylanan' },
            { key: 'REJECTED', label: 'Reddedilen' },
          ].map(tab => (
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      )}

      {/* Request Cards */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
          <PawPrint className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-800">
            {filter === 'ALL' ? 'Henüz başvurunuz yok' : 'Bu durumda başvuru yok'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {filter === 'ALL' ? 'İlanları inceleyip size uygun dost için hemen başvuru yapın.' : 'Seçili filtreye uygun başvurunuz bulunmuyor.'}
          </p>
          {filter === 'ALL' && (
            <Link href="/posts" className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700">
              İlanlara Git <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const primaryImage = getPrimaryImage(request.post);
            const imageUrl = primaryImage ? `http://localhost:3001${primaryImage.imageUrl}` : null;
            const config = statusConfig[request.status] || statusConfig.CANCELLED;
            const StatusIcon = config.icon;
            const isExpanded = expandedId === request.id;

            return (
              <div key={request.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                {/* Main Card */}
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="relative w-full lg:w-56 h-48 lg:h-auto bg-gray-100 flex-shrink-0 overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={request.post?.title || 'İlan'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <PawPrint className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    {/* Status overlay on image */}
                    <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${config.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{request.post?.title || 'İlan bulunamadı'}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                          {request.post?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {request.post.city}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock3 className="w-3 h-3" /> {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="rounded-xl bg-gray-50 p-3.5 mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Başvuru Mesajınız</p>
                      <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{request.message}</p>
                    </div>

                    {/* Quick Info Pills */}
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

                    {/* Actions Row */}
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

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Experience */}
                      <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-400" /> Deneyim
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{request.experienceWithPets || 'Belirtilmedi'}</p>
                      </div>
                      {/* Motivation */}
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
                      {request.statusHistory?.length > 0 ? (
                        <div className="relative pl-6 space-y-3">
                          {request.statusHistory.map((item, index) => {
                            const isLast = index === request.statusHistory.length - 1;
                            const itemConfig = statusConfig[item.newStatus] || statusConfig.CANCELLED;
                            return (
                              <div key={item.id} className="relative">
                                {/* Vertical Line */}
                                {!isLast && (
                                  <div className="absolute left-[-16px] top-6 bottom-[-12px] w-0.5 bg-gray-200" />
                                )}
                                {/* Dot */}
                                <div className={`absolute left-[-20px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white bg-gradient-to-br ${itemConfig.gradient}`} />
                                
                                <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                    <span className="text-sm font-semibold text-gray-800">
                                      {item.oldStatus
                                        ? `${(statusConfig[item.oldStatus] || statusConfig.CANCELLED).label} → ${itemConfig.label}`
                                        : `${itemConfig.label} olarak oluşturuldu`
                                      }
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">{formatDate(item.changedAt)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    İşlemi yapan: <span className="font-semibold text-gray-700">{item.changedBy?.fullName || 'Sistem'}</span>
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
  );
}
