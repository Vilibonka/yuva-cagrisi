"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle, Bone, CheckCircle2, Info, MapPin,
  MessageSquare, Phone, User, XCircle, Clock3, PawPrint, Shield,
  ChevronLeft, Loader2, Calendar, Heart, Home, ChevronDown, FileText, AlertCircle, Users,
} from 'lucide-react';
import api, { buildMediaUrl } from '@/api';
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

function PetFactItem({ icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border border-gray-100 ${color || 'bg-gray-50'}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xs font-black text-gray-800 truncate">{value || '-'}</p>
      </div>
    </div>
  );
}

function RequestFact({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white ring-1 ring-gray-100 transition-all hover:ring-orange-200 group">
      <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{label}</p>
        <p className="text-sm font-black text-gray-800 truncate">{value || '-'}</p>
      </div>
    </div>
  );
}

function SidebarSpec({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-4 group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
          {icon}
        </div>
        <span className="text-sm font-bold text-gray-400">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-800 tracking-tight">{value}</span>
    </div>
  );
}

const speciesMap = { DOG: '🐕 Köpek', CAT: '🐈 Kedi', BIRD: '🐦 Kuş', RABBIT: '🐇 Tavşan', OTHER: '🐾 Diğer' };
const genderMap = { MALE: 'Erkek', FEMALE: 'Dişi' };
const sizeMap = { SMALL: 'Küçük', MEDIUM: 'Orta', LARGE: 'Büyük' };
const housingTypeMap = { DETACHED: 'Müstakil', APARTMENT: 'Apartman', OTHER: 'Diğer' };
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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
    if (!currentUser?.contactPhone) {
      return;
    }

    setFormState((previous) => (
      previous.contactPhone
        ? previous
        : { ...previous, contactPhone: currentUser.contactPhone }
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
      <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-20 text-center shadow-xl ring-1 ring-gray-100 my-12">
        <PawPrint className="mx-auto mb-6 w-16 h-16 text-gray-200 animate-bounce" />
        <h2 className="text-2xl font-black text-gray-900">İlan Bulunamadı</h2>
        <p className="mt-2 text-gray-500 font-medium italic">Aradığınız dostumuz başka bir yuvaya gitmiş olabilir.</p>
        <button onClick={() => router.push('/')} className="mt-8 px-6 py-3 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all">Galeriye Dön</button>
      </div>
    );
  }

  const primaryImage = getPrimaryImage(post);
  const imageUrl = buildMediaUrl(primaryImage?.imageUrl);
  const isOwner = Boolean(currentUser && currentUser.id === post.ownerUserId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      {/* Top Breadcrumb / Actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="group flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-orange-600">
          <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-gray-100 group-hover:bg-orange-50 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </div>
          Geri Dön
        </button>
        {!isOwner && (
          <button 
            onClick={() => { if (!currentUser) { router.push('/login'); return; } setIsReportOpen(true); }} 
            className="flex items-center gap-1.5 text-xs font-black text-gray-400 hover:text-red-500 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> İlanı Bildir
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Gallery & Description */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-gray-200/40 ring-1 ring-gray-100 overflow-hidden">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-6">{post.title}</h1>
            
            {/* Gallery Viewer */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-[2rem] bg-[#f8fafc] ring-1 ring-gray-100 overflow-hidden group">
                 {!post.images || post.images.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <PawPrint className="w-20 h-20 text-gray-200" />
                    </div>
                 ) : (
                    <>
                      <img 
                        src={buildMediaUrl(post.images[activeImageIndex].imageUrl)} 
                        alt={post.title}
                        className="h-full w-full object-contain"
                      />
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity">
                         {post.images.length > 1 && (
                            <>
                              <button onClick={() => setActiveImageIndex(prev => prev === 0 ? post.images.length-1 : prev-1)} className="p-3 rounded-2xl bg-white/80 backdrop-blur-md shadow-xl hover:bg-white transition-all"><ChevronLeft className="w-6 h-6 text-gray-900" /></button>
                              <button onClick={() => setActiveImageIndex(prev => prev === post.images.length-1 ? 0 : prev+1)} className="p-3 rounded-2xl bg-white/80 backdrop-blur-md shadow-xl hover:bg-white transition-all"><ChevronLeft className="w-6 h-6 text-gray-900 rotate-180" /></button>
                            </>
                         )}
                      </div>
                    </>
                 )}
              </div>
              
              {/* Thumbnails Row */}
              {post.images && post.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {post.images.map((img, idx) => (
                    <button 
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative flex-shrink-0 w-24 aspect-[4/3] rounded-2xl overflow-hidden ring-2 transition-all ${activeImageIndex === idx ? 'ring-orange-500 scale-105 shadow-lg' : 'ring-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={buildMediaUrl(img.imageUrl)} className="w-full h-full object-cover" alt="thumbnail" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-200/40 ring-1 ring-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-1.5 h-8 bg-orange-500 rounded-full" /> İlan Detayları
            </h2>
            <div className="text-gray-600 leading-relaxed font-medium whitespace-pre-line text-lg">
              {post.description}
            </div>
          </div>

          {/* Health Summary */}
          {post.pet?.healthSummary && (
            <div className="bg-emerald-50 rounded-[2.5rem] p-10 ring-1 ring-emerald-100 relative overflow-hidden group">
              <Shield className="absolute -right-10 -top-10 w-40 h-40 text-emerald-100/50 -rotate-12 transition-transform group-hover:rotate-0" />
              <div className="relative">
                <h2 className="text-xl font-black text-emerald-900 mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-emerald-500 rounded-full" /> Sağlık Bilgileri
                </h2>
                <p className="text-emerald-800/80 font-bold text-lg leading-relaxed">{post.pet.healthSummary}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Specs & Actions */}
        <div className="space-y-8">
           {/* Price/Status Highlight */}
           <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-200 overflow-hidden relative">
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">İlan Durumu</div>
                <div className="text-3xl font-black tracking-tight">{statusLabel[post.status] || post.status}</div>
                <div className="mt-4 flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 w-fit">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${post.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-white'}`} />
                   <span className="text-xs font-black uppercase tracking-wider">{speciesMap[post.pet?.species] || 'Hayvan'}</span>
                </div>
              </div>
              <PawPrint className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 -rotate-12" />
           </div>

           {/* Specs Grid */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/40 ring-1 ring-gray-100 space-y-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Özellikler</h3>
              <div className="divide-y divide-gray-50">
                 <SidebarSpec label="Konum" value={post.city} icon={<MapPin className="w-4 h-4" />} />
                 <SidebarSpec label="Irk" value={post.pet?.breed || 'Belirtilmedi'} icon={<Bone className="w-4 h-4" />} />
                 <SidebarSpec label="Cinsiyet" value={genderMap[post.pet?.gender]} icon={<User className="w-4 h-4" />} />
                 <SidebarSpec label="Boyut" value={sizeMap[post.pet?.size]} icon={<Shield className="w-4 h-4" />} />
                 <SidebarSpec label="Yaş Grubu" value={
                    post.pet?.estimatedAgeMonths ? (
                      post.pet.estimatedAgeMonths <= 3 ? 'Bebek' :
                      post.pet.estimatedAgeMonths <= 12 ? 'Genç' :
                      post.pet.estimatedAgeMonths <= 48 ? 'Yetişkin' : 'Yaşlı'
                    ) : 'Bilinmiyor'
                 } icon={<Clock3 className="w-4 h-4" />} />
                 <SidebarSpec label="İlan Tarihi" value={formatDate(post.createdAt)} icon={<Calendar className="w-4 h-4" />} />
              </div>
           </div>

           {/* Owner Card */}
           <div className="bg-gray-50 rounded-[2.5rem] p-8 ring-1 ring-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center text-xl font-black shadow-lg">
                  {post.owner?.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İlan Sahibi</div>
                  <div className="text-lg font-black text-gray-800">{post.owner?.fullName || 'Bilinmiyor'}</div>
                </div>
              </div>

              {!isOwner ? (
                <div className="space-y-3">
                  <button 
                    disabled={loadingChat}
                    onClick={async () => {
                      if (!currentUser) { router.push('/login'); return; }
                      setLoadingChat(true);
                      try {
                        const res = await api.post('/conversations', { targetUserId: post.ownerUserId, postId: post.id });
                        router.push(`/messages?conversationId=${res.data.id}`);
                      } catch (err) {
                        const message = err.response?.data?.message;
                        setActionError(Array.isArray(message) ? message.join(', ') : message || 'Sohbet başlatılamadı.');
                      } finally { setLoadingChat(false); }
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-[1.25rem] font-black transition-all hover:bg-black hover:-translate-y-1 active:scale-95 shadow-xl shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loadingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                    {loadingChat ? 'Bağlanıyor...' : 'İletişime Geç'}
                  </button>

                  <button 
                    onClick={() => {
                      const el = document.getElementById('application-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-white text-orange-600 border-2 border-orange-100 py-3.5 rounded-[1.25rem] font-black transition-all hover:bg-orange-50 active:scale-95"
                  >
                    <Heart className="w-4 h-4" /> Sahiplenme Başvurusu Yap
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-white rounded-2xl border border-gray-100">
                   <p className="text-xs font-bold text-gray-400">Bu sizin ilanınızdır.</p>
                </div>
              )}
           </div>

           <div className="p-6 rounded-[2.5rem] bg-orange-50 border border-orange-100 text-center">
              <p className="text-xs font-bold text-orange-700 italic">"Bir yuva açarak bir hayat kurtarın. Onların size, sizin onlara ihtiyacı var."</p>
           </div>
        </div>
      </div>

      {/* Application / Requests Area (Scroll Target) */}
      <div id="application-section" className="mt-12">
        <div className="max-w-4xl mx-auto">
          {isOwner ? (
            <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl ring-1 ring-gray-100">
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Gelen Başvurular</h3>
                    <p className="mt-1 text-sm font-medium text-gray-400">Bu ilana gelen tüm sahiplenme talepleri.</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white font-black shadow-lg shadow-orange-200">
                    {ownerRequests.length}
                  </div>
                </div>

                <div className="grid gap-6">
                  {loadingRequests ? (
                    <div className="flex items-center justify-center p-12 text-gray-400 font-bold">
                      <Loader2 className="w-6 h-6 animate-spin mr-3" /> Başvurular yükleniyor...
                    </div>
                  ) : ownerRequests.length === 0 ? (
                    <div className="rounded-[2rem] border-2 border-dashed border-gray-100 p-16 text-center text-gray-400">
                      <PawPrint className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-bold text-sm">Henüz başvuru gelmedi.</p>
                    </div>
                  ) : (
                    ownerRequests.map((request) => (
                      <div key={request.id} className="group overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50/50 p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-orange-100/20">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 pb-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                              {request.applicant?.fullName?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-lg font-black text-gray-900">{request.applicant?.fullName}</div>
                              <div className="flex gap-4 mt-1">
                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {request.applicant?.contactPhone}</span>
                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {request.applicant?.email}</span>
                              </div>
                            </div>
                          </div>
                          <RequestStatusBadge status={request.status} />
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Başvuru Mesajı</p>
                            <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{request.message}"</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white border border-gray-100">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Konut</p>
                              <p className="text-xs font-black text-gray-800">{housingTypeMap[request.housingType]}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-gray-100">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Deneyim</p>
                              <p className="text-xs font-black text-gray-800">{request.experienceWithPets ? 'Var' : 'Yok'}</p>
                            </div>
                          </div>
                        </div>

                        {request.status === 'PENDING' && post.status === 'ACTIVE' && (
                          <div className="mt-8 flex gap-4">
                            <button onClick={() => handleReview(request.id, 'APPROVED')} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl font-black text-sm transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-emerald-100">Onayla</button>
                            <button onClick={() => handleReview(request.id, 'REJECTED')} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-black text-sm transition-all hover:bg-gray-200 active:scale-95">Reddet</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : myRequest ? (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl ring-1 ring-gray-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8">
                <RequestStatusBadge status={myRequest.status} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Başvurunuz</h3>
              <p className="text-sm font-medium text-gray-400 mb-8">Bu dostumuz için yaptığınız sahiplenme talebi.</p>

              <div className="space-y-8">
                <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 italic font-medium text-gray-600 leading-relaxed">
                  "{myRequest.message}"
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <RequestFact icon={<Home className="w-4 h-4" />} label="Konut" value={housingTypeMap[myRequest.housingType]} />
                  <RequestFact icon={<PawPrint className="w-4 h-4" />} label="Diğer Hayvan" value={myRequest.hasOtherPets ? 'Var' : 'Yok'} />
                  <RequestFact icon={<Users className="w-4 h-4" />} label="Çocuk" value={myRequest.hasChildren ? 'Evet' : 'Hayır'} />
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Süreç Takibi</p>
                  <RequestStatusTimeline history={myRequest.statusHistory} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleApply} className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-orange-100/40 ring-2 ring-orange-500/10 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-4">
                  <Heart className="w-3.5 h-3.5 fill-current" /> Yeni Bir Başlangıç
                </div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Sahiplenme Başvurusu</h3>
                <p className="text-gray-500 font-medium mb-10">Lütfen kendinizi ve bu dostumuza sunacağınız yuvayı kısaca anlatın.</p>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mesajınız</label>
                    <textarea
                      required name="message" value={formState.message} onChange={handleFormChange} rows="4"
                      placeholder="Örn: Daha önce kedi baktım, geniş bir dairem var..."
                      className="w-full bg-gray-50 border-none rounded-3xl p-6 text-gray-700 font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none"
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Konut Tipi</label>
                      <select name="housingType" value={formState.housingType} onChange={handleFormChange} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-700 focus:ring-4 focus:ring-orange-100 outline-none appearance-none">
                        <option value="">Seçin</option>
                        <option value="DETACHED">Müstakil / Bahçeli</option>
                        <option value="APARTMENT">Apartman Dairesi</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Evcil Hayvan Deneyimi</label>
                      <input name="experienceWithPets" value={formState.experienceWithPets} onChange={handleFormChange} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-700 focus:ring-4 focus:ring-orange-100 outline-none" placeholder="Var / Yok / Detay..." />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl bg-gray-50 cursor-pointer border-2 border-transparent transition-all hover:bg-orange-50 hover:border-orange-200 group">
                      <input type="checkbox" name="hasOtherPets" checked={formState.hasOtherPets} onChange={handleFormChange} className="w-5 h-5 rounded-lg border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm font-black text-gray-700 group-hover:text-orange-700">Başka Hayvan</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl bg-gray-50 cursor-pointer border-2 border-transparent transition-all hover:bg-orange-50 hover:border-orange-200 group">
                      <input type="checkbox" name="hasChildren" checked={formState.hasChildren} onChange={handleFormChange} className="w-5 h-5 rounded-lg border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm font-black text-gray-700 group-hover:text-orange-700">Çocuklu Ev</span>
                    </label>
                  </div>

                  <button type="submit" disabled={submittingRequest || post.status !== 'ACTIVE'} className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-orange-200 transition-all hover:bg-orange-700 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0">
                    {submittingRequest ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <ReportModal postId={postId} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
