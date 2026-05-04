"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle, ArrowLeft, Bone, CheckCircle2, Home, Info, MapPin,
  MessageSquare, Phone, User, XCircle, Clock3, Heart, PawPrint, Shield,
  ChevronLeft, Loader2, Users, Calendar,
} from 'lucide-react';
import api from '@/api';
import RequestStatusBadge from '@/components/RequestStatusBadge';
import RequestStatusTimeline from '@/components/RequestStatusTimeline';
import { getStoredUser } from '@/lib/auth';
import Chat from './Chat';
import ReportModal from './ReportModal';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('tr-TR');
}

function getPrimaryImage(post) {
  return post?.images?.find((image) => image.isPrimary) || post?.images?.[0] || null;
}

function RequestFact({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3.5 ring-1 ring-gray-100 text-sm">
      <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">{label}</div>
      <div className="font-semibold text-gray-800">{value || '-'}</div>
    </div>
  );
}

const speciesMap = { DOG: '🐕 Köpek', CAT: '🐈 Kedi', BIRD: '🐦 Kuş', RABBIT: '🐇 Tavşan', OTHER: '🐾 Diğer' };
const genderMap = { MALE: 'Erkek', FEMALE: 'Dişi' };
const sizeMap = { SMALL: 'Küçük', MEDIUM: 'Orta', LARGE: 'Büyük' };
const statusLabel = { ACTIVE: 'Aktif', ADOPTED: 'Sahiplendirildi', CLOSED: 'Kapatıldı' };
const statusColor = { ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200', ADOPTED: 'bg-blue-50 text-blue-700 ring-blue-200', CLOSED: 'bg-gray-100 text-gray-600 ring-gray-200' };

export default function PostDetails() {
  const params = useParams();
  const router = useRouter();
  const postId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [post, setPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [myRequest, setMyRequest] = useState(null);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [updatingPostStatus, setUpdatingPostStatus] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [formState, setFormState] = useState({
    message: '',
    housingType: '',
    hasOtherPets: false,
    hasChildren: false,
    experienceWithPets: '',
    whyAdopt: '',
    contactPhone: '',
  });

  useEffect(() => {
    setCurrentUser(getStoredUser());
    setAuthResolved(true);
  }, []);

  useEffect(() => {
    if (!currentUser?.phone) {
      return;
    }

    setFormState((previous) => (
      previous.contactPhone
        ? previous
        : { ...previous, contactPhone: currentUser.phone }
    ));
  }, [currentUser]);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      return;
    }

    setLoadingPost(true);
    setPageError(null);

    try {
      const response = await api.get(`/pet-posts/${postId}`);
      setPost(response.data);
    } catch (err) {
      const message = err.response?.data?.message;
      setPageError(Array.isArray(message) ? message.join(', ') : message || 'Ilan yuklenemedi.');
    } finally {
      setLoadingPost(false);
    }
  }, [postId]);

  const fetchOwnerRequests = useCallback(async () => {
    if (!postId) {
      return;
    }

    setLoadingRequests(true);
    setActionError(null);

    try {
      const response = await api.get(`/pet-posts/${postId}/adoption-requests`);
      setOwnerRequests(response.data);
      setMyRequest(null);
    } catch (err) {
      const message = err.response?.data?.message;
      setActionError(Array.isArray(message) ? message.join(', ') : message || 'Basvurular yuklenemedi.');
    } finally {
      setLoadingRequests(false);
    }
  }, [postId]);

  const fetchMyRequest = useCallback(async () => {
    if (!postId) {
      return;
    }

    setLoadingRequests(true);
    setActionError(null);

    try {
      const response = await api.get('/adoption-requests/my', {
        params: { postId },
      });
      setMyRequest(response.data[0] || null);
      setOwnerRequests([]);
    } catch (err) {
      const message = err.response?.data?.message;
      setActionError(Array.isArray(message) ? message.join(', ') : message || 'Basvuru bilgileriniz yuklenemedi.');
    } finally {
      setLoadingRequests(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    if (!post || !postId) {
      return;
    }

    if (!currentUser) {
      setMyRequest(null);
      setOwnerRequests([]);
      setLoadingRequests(false);
      return;
    }

    if (currentUser.id === post.ownerUserId) {
      fetchOwnerRequests();
      return;
    }

    fetchMyRequest();
  }, [currentUser, fetchMyRequest, fetchOwnerRequests, post, postId]);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleApply = async (event) => {
    event.preventDefault();

    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (post?.status !== 'ACTIVE') {
      setActionError('Bu ilan su anda yeni basvuru kabul etmiyor.');
      return;
    }

    setSubmittingRequest(true);
    setActionError(null);

    try {
      const response = await api.post('/adoption-requests', {
        postId,
        ...formState,
      });
      setMyRequest(response.data);
    } catch (err) {
      const message = err.response?.data?.message;
      setActionError(Array.isArray(message) ? message.join(', ') : message || 'Basvuru gonderilemedi.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleReview = async (requestId, status) => {
    const confirmationMessage = status === 'APPROVED'
      ? 'Bu basvuruyu onaylamak istediginize emin misiniz?'
      : 'Bu basvuruyu reddetmek istediginize emin misiniz?';

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setReviewingRequestId(requestId);
    setActionError(null);

    try {
      await api.patch(`/adoption-requests/${requestId}/status`, { status });
      await Promise.all([fetchPost(), fetchOwnerRequests()]);
    } catch (err) {
      const message = err.response?.data?.message;
      setActionError(Array.isArray(message) ? message.join(', ') : message || 'Basvuru durumu guncellenemedi.');
    } finally {
      setReviewingRequestId(null);
    }
  };

  const handlePostStatusUpdate = async (status) => {
    const confirmationMessage = status === 'ADOPTED'
      ? 'Ilani manuel olarak sahiplendirildi durumuna almak istediginize emin misiniz?'
      : 'Ilani kapatmak istediginize emin misiniz?';

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setUpdatingPostStatus(true);
    setActionError(null);

    try {
      const response = await api.patch(`/pet-posts/${postId}/status`, { status });
      setPost(response.data);
    } catch (err) {
      const message = err.response?.data?.message;
      setActionError(Array.isArray(message) ? message.join(', ') : message || 'Ilan durumu guncellenemedi.');
    } finally {
      setUpdatingPostStatus(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="mx-auto w-full max-w-5xl flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-gray-400 text-sm font-medium">İlan yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (pageError) {
    return <div className="mx-auto w-full max-w-5xl rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">{pageError}</div>;
  }

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-12 text-center shadow-sm">
        <PawPrint className="mx-auto mb-3 w-10 h-10 text-gray-300" />
        <p className="text-gray-500 font-medium">İlan bulunamadı.</p>
      </div>
    );
  }

  const primaryImage = getPrimaryImage(post);
  const imageUrl = primaryImage ? `http://localhost:3001${primaryImage.imageUrl}` : null;
  const isOwner = Boolean(currentUser && currentUser.id === post.ownerUserId);

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/60 my-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-orange-600 rounded-xl px-3 py-2 hover:bg-gray-50">
          <ChevronLeft className="h-4 w-4" /> Geri Dön
        </button>
        <div className="flex items-center gap-3">
          {!isOwner && (
            <button onClick={() => setIsReportOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 transition hover:text-red-500 rounded-lg px-3 py-2 hover:bg-red-50">
              <AlertTriangle className="h-3.5 w-3.5" /> Şikâyet Et
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left: Image */}
        <div className="relative bg-gray-100">
          {imageUrl ? (
            <div className="relative h-80 lg:h-full min-h-[400px] overflow-hidden">
              <img src={imageUrl} alt={post.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="flex h-80 lg:h-full min-h-[400px] items-center justify-center bg-gray-50">
              <div className="text-center">
                <PawPrint className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Görsel eklenmemiş</p>
              </div>
            </div>
          )}
          {/* Status Badge on Image */}
          <div className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ${statusColor[post.status] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
            {statusLabel[post.status] || post.status}
          </div>
          {/* Species Badge */}
          <div className="absolute top-4 right-4 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm">
            {speciesMap[post.pet?.species] || '🐾 Hayvan'}
          </div>
        </div>

        {/* Right: Details */}
        <div className="p-6 lg:p-8 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)]">
          {/* Title & Location */}
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {post.city}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.createdAt)}</span>
            </div>
          </div>

          {/* Pet Info Pills */}
          <div className="flex flex-wrap gap-2">
            {post.pet?.breed && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                <Bone className="w-3 h-3" /> {post.pet.breed}
              </span>
            )}
            {post.pet?.gender && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                {genderMap[post.pet.gender] || post.pet.gender}
              </span>
            )}
            {post.pet?.size && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                {sizeMap[post.pet.size] || post.pet.size}
              </span>
            )}
            {post.pet?.estimatedAgeMonths && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
                <Clock3 className="w-3 h-3" /> {post.pet.estimatedAgeMonths} aylık
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-gray-400" /> Açıklama
            </h4>
            <p className="text-sm leading-relaxed text-gray-600">{post.description}</p>
          </div>

          {/* Health Summary */}
          {post.pet?.healthSummary && (
            <div className="rounded-xl bg-emerald-50 p-3.5 ring-1 ring-emerald-100">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Sağlık Durumu
              </h4>
              <p className="text-sm text-emerald-700">{post.pet.healthSummary}</p>
            </div>
          )}

          {/* Owner Card */}
          <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-bold">
                {post.owner?.fullName?.charAt(0) || <User className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">İlan Sahibi</p>
                <p className="text-sm font-bold text-gray-800">{post.owner?.fullName || 'Bilinmiyor'}</p>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          )}

          {isOwner ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => handlePostStatusUpdate('ADOPTED')}
                    disabled={updatingPostStatus || post.status !== 'ACTIVE'}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Sahiplendirildi
                    </span>
                  </button>
                  <button
                    onClick={() => handlePostStatusUpdate('CLOSED')}
                    disabled={updatingPostStatus || post.status !== 'ACTIVE'}
                    className="rounded-xl bg-gray-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> İlanı Kapat
                    </span>
                  </button>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Gelen Başvurular</h3>
                      <p className="mt-0.5 text-xs text-gray-400">Bu ilana gelen tüm sahiplenme taleplerini yönetin.</p>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200">
                      {ownerRequests.length} başvuru
                    </div>
                  </div>
                </div>

                {loadingRequests ? (
                  <div className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-500">Basvurular yukleniyor...</div>
                ) : ownerRequests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                    Bu ilana henuz basvuru gelmedi.
                  </div>
                ) : (
                  ownerRequests.map((request) => (
                    <div key={request.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="mb-1 text-xs uppercase tracking-wide text-gray-400">Basvuran Kullanici</div>
                          <div className="text-xl font-bold text-gray-900">{request.applicant?.fullName || 'Bilinmiyor'}</div>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {request.contactPhone || request.applicant?.phone || '-'}
                            </span>
                            <span>{request.applicant?.email || '-'}</span>
                          </div>
                        </div>
                        <RequestStatusBadge status={request.status} />
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <RequestFact label="Mesaj" value={request.message} />
                        <RequestFact label="Konut tipi" value={request.housingType} />
                        <RequestFact label="Diger evcil hayvan" value={request.hasOtherPets ? 'Var' : 'Yok'} />
                        <RequestFact label="Cocuk bulunan ev" value={request.hasChildren ? 'Evet' : 'Hayir'} />
                        <RequestFact label="Hayvan deneyimi" value={request.experienceWithPets} />
                        <RequestFact label="Neden sahiplenmek istiyor" value={request.whyAdopt} />
                      </div>

                      <div className="mt-4">
                        <div className="mb-3 text-sm font-semibold text-gray-800">Durum gecmisi</div>
                        <RequestStatusTimeline history={request.statusHistory} />
                      </div>

                      {request.status === 'PENDING' && post.status === 'ACTIVE' && (
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <button
                            onClick={() => handleReview(request.id, 'APPROVED')}
                            disabled={reviewingRequestId === request.id}
                            className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                          >
                            <span className="inline-flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" /> Onayla
                            </span>
                          </button>
                          <button
                            onClick={() => handleReview(request.id, 'REJECTED')}
                            disabled={reviewingRequestId === request.id}
                            className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                          >
                            <span className="inline-flex items-center gap-2">
                              <XCircle className="h-5 w-5" /> Reddet
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {!authResolved ? (
                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                    Oturum bilgileriniz kontrol ediliyor...
                  </div>
                ) : !currentUser ? (
                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
                    <h3 className="text-lg font-bold text-gray-900">Sahiplenme Basvurusu</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Bu ilana basvuru yapabilmek icin once giris yapmaniz gerekiyor.
                    </p>
                    <button
                      onClick={() => router.push('/login')}
                      className="mt-4 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                    >
                      Giris Yap ve Basvur
                    </button>
                  </div>
                ) : loadingRequests && !myRequest ? (
                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                    Basvuru bilgileriniz yukleniyor...
                  </div>
                ) : myRequest ? (
                  <div className="space-y-4 rounded-3xl border border-gray-200 bg-gray-50 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Basvuru Durumunuz</h3>
                        <p className="mt-1 text-sm text-gray-500">Bu ilana ait mevcut sahiplenme basvurunuz asagida gosteriliyor.</p>
                      </div>
                      <RequestStatusBadge status={myRequest.status} />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                      <div className="font-semibold text-gray-800">Mesajiniz</div>
                      <p className="mt-2 leading-6">{myRequest.message}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <RequestFact label="Konut tipi" value={myRequest.housingType} />
                      <RequestFact label="Diger evcil hayvan" value={myRequest.hasOtherPets ? 'Var' : 'Yok'} />
                      <RequestFact label="Cocuk bulunan ev" value={myRequest.hasChildren ? 'Evet' : 'Hayir'} />
                      <RequestFact label="Iletisim telefonu" value={myRequest.contactPhone} />
                    </div>

                    <div>
                      <div className="mb-3 text-sm font-semibold text-gray-800">Durum gecmisi</div>
                      {loadingRequests ? (
                        <div className="rounded-2xl bg-white p-4 text-sm text-gray-500">Basvuru gecmisi yukleniyor...</div>
                      ) : (
                        <RequestStatusTimeline history={myRequest.statusHistory} />
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="space-y-4 rounded-3xl border border-gray-200 bg-gray-50 p-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Sahiplenme Basvurusu</h3>
                      <p className="mt-1 text-sm text-gray-500">Kendinizi kisaca tanitin ve dostumuz icin neden uygun bir yuva oldugunuzu anlatin.</p>
                    </div>

                    {post.status !== 'ACTIVE' && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        Bu ilan su anda yeni basvuru kabul etmiyor.
                      </div>
                    )}

                    <textarea
                      required
                      name="message"
                      value={formState.message}
                      onChange={handleFormChange}
                      rows="4"
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                      placeholder="Kendinizi ve neden sahiplenmek istediginizi anlatin."
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        name="housingType"
                        value={formState.housingType}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-500"
                        placeholder="Konut tipi"
                      />
                      <input
                        name="contactPhone"
                        value={formState.contactPhone}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-500"
                        placeholder="Iletisim telefonu"
                      />
                    </div>

                    <textarea
                      name="experienceWithPets"
                      value={formState.experienceWithPets}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-500"
                      placeholder="Daha once hayvan bakimi deneyiminiz varsa yazin."
                    />

                    <textarea
                      name="whyAdopt"
                      value={formState.whyAdopt}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-500"
                      placeholder="Bu dostu neden sahiplenmek istediginizi yazin."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                        <input type="checkbox" name="hasOtherPets" checked={formState.hasOtherPets} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        Diger evcil hayvanlarim var
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                        <input type="checkbox" name="hasChildren" checked={formState.hasChildren} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        Cocuk bulunan bir evde yasiyorum
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingRequest || post.status !== 'ACTIVE'}
                      className="w-full rounded-2xl bg-orange-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
                    >
                      {submittingRequest ? 'Basvuru gonderiliyor...' : 'Basvuru Gonder'}
                    </button>
                  </form>
                )}

                <button
                  disabled={loadingChat}
                  onClick={async () => {
                    if (!currentUser) { router.push('/login'); return; }
                    if (showChat) { setShowChat(false); return; }
                    setLoadingChat(true);
                    try {
                      const res = await api.post('/conversations', { targetUserId: post.ownerUserId, postId: post.id });
                      setActiveConversationId(res.data.id);
                      setShowChat(true);
                    } catch (err) {
                      const message = err.response?.data?.message;
                      setActionError(Array.isArray(message) ? message.join(', ') : message || 'Sohbet başlatılamadı.');
                    } finally { setLoadingChat(false); }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-sm font-bold text-white shadow-sm shadow-orange-200/40 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="h-4 w-4" /> 
                  {loadingChat ? 'Bağlanıyor...' : showChat ? 'Sohbeti Gizle' : 'Sahibi ile İletişime Geç'}
                </button>

                {showChat && activeConversationId && currentUser && (
                  <div className="mt-4">
                    <Chat conversationId={activeConversationId} currentUserId={currentUser.id} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      <ReportModal postId={postId} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
