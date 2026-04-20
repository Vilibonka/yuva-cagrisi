"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Bone,
  CheckCircle2,
  Home,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  User,
  XCircle,
} from 'lucide-react';
import api from '@/api';
import RequestStatusBadge from '@/components/RequestStatusBadge';
import RequestStatusTimeline from '@/components/RequestStatusTimeline';
import { getStoredUser } from '@/lib/auth';
import Chat from './Chat';
import ReportModal from './ReportModal';
import FavoriteButton from './FavoriteButton';

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
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-2 font-medium text-gray-800">{value || '-'}</div>
    </div>
  );
}

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
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', status: '', title: '', message: '', requestId: null });
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

  const requestReview = (requestId, status) => {
    const message = status === 'APPROVED'
      ? 'Bu başvuruyu onaylamak istediğinize emin misiniz? Diğer bekleyen başvurular reddedilebilir.'
      : 'Bu başvuruyu reddetmek istediğinize emin misiniz?';
    const title = status === 'APPROVED' ? 'Başvuruyu Onayla' : 'Başvuruyu Reddet';

    setConfirmDialog({
      isOpen: true,
      type: 'REVIEW',
      status,
      title,
      message,
      requestId,
    });
  };

  const requestPostStatusUpdate = (status) => {
    const message = status === 'ADOPTED'
      ? 'İlanı manuel olarak sahiplendirildi durumuna almak istediğinize emin misiniz? Bu işlem geri alınamaz.'
      : 'İlanı kapatmak istediğinize emin misiniz? İlgili tüm başvurular reddedilmiş sayılacaktır.';
    const title = status === 'ADOPTED' ? 'İlanı Sahiplendir' : 'İlanı Kapat';

    setConfirmDialog({
      isOpen: true,
      type: 'POST_STATUS',
      status,
      title,
      message,
      requestId: null,
    });
  };

  const executeConfirmAction = async () => {
    const { type, status, requestId } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, isOpen: false });

    if (type === 'POST_STATUS') {
      setUpdatingPostStatus(true);
      setActionError(null);
      try {
        const response = await api.patch(`/pet-posts/${postId}/status`, { status });
        setPost(response.data);
      } catch (err) {
        const message = err.response?.data?.message;
        setActionError(Array.isArray(message) ? message.join(', ') : message || 'İlan durumu güncellenemedi.');
      } finally {
        setUpdatingPostStatus(false);
      }
    } else if (type === 'REVIEW') {
      setReviewingRequestId(requestId);
      setActionError(null);
      try {
        await api.patch(`/adoption-requests/${requestId}/status`, { status });
        await Promise.all([fetchPost(), fetchOwnerRequests()]);
      } catch (err) {
        const message = err.response?.data?.message;
        setActionError(Array.isArray(message) ? message.join(', ') : message || 'Başvuru durumu güncellenemedi.');
      } finally {
        setReviewingRequestId(null);
      }
    }
  };

  if (loadingPost) {
    return <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-12 text-center shadow-sm">Ilan yukleniyor...</div>;
  }

  if (pageError) {
    return <div className="mx-auto w-full max-w-5xl rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-700">{pageError}</div>;
  }

  if (!post) {
    return <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-12 text-center text-red-500 shadow-sm">Ilan bulunamadi.</div>;
  }

  const primaryImage = getPrimaryImage(post);
  const imageUrl = primaryImage ? `http://localhost:3001${primaryImage.imageUrl}` : null;
  const isOwner = Boolean(currentUser && currentUser.id === post.ownerUserId);

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-100">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 font-medium text-gray-500 transition hover:text-orange-600">
          <ArrowLeft className="h-5 w-5" /> Geri Don
        </button>
        {!isOwner && (
          <button onClick={() => setIsReportOpen(true)} className="flex items-center gap-2 text-sm font-bold text-red-400 transition hover:text-red-600">
            <AlertTriangle className="h-4 w-4" /> Ilani Sikayet Et
          </button>
        )}
      </div>

      <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {imageUrl ? (
            <div className="relative h-96 overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 shadow-inner">
              <img src={imageUrl} alt={post.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
              Gorsel eklenmemis
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${post.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {post.status}
              </span>
              <span className="text-sm text-gray-400">{formatDate(post.createdAt)}</span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <h1 className="text-3xl font-extrabold text-gray-800">{post.title}</h1>
              {!isOwner && <FavoriteButton postId={post.id} />}
            </div>
            <div className="mt-2 flex items-center gap-2 font-medium text-gray-500">
              <MapPin className="h-5 w-5" /> {post.city}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-gray-700">
              <Bone className="h-5 w-5" /> Dostumuzun Bilgileri
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div><span className="text-gray-500">Tur:</span> <span className="font-semibold text-gray-800">{post.pet?.species}</span></div>
              <div><span className="text-gray-500">Irk:</span> <span className="font-semibold text-gray-800">{post.pet?.breed || '-'}</span></div>
              <div><span className="text-gray-500">Cinsiyet:</span> <span className="font-semibold text-gray-800">{post.pet?.gender}</span></div>
              <div><span className="text-gray-500">Boyut:</span> <span className="font-semibold text-gray-800">{post.pet?.size || '-'}</span></div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-2 font-bold text-gray-700">
              <Info className="h-5 w-5" /> Aciklama
            </h4>
            <p className="rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">{post.description}</p>
          </div>

          <div className="border-t pt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ilan Sahibi</p>
                <p className="font-bold text-gray-800">{post.owner?.fullName || 'Bilinmiyor'}</p>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionError}
              </div>
            )}

            {isOwner ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => requestPostStatusUpdate('ADOPTED')}
                    disabled={updatingPostStatus || post.status !== 'ACTIVE'}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Sahiplendirildi
                    </span>
                  </button>
                  <button
                    onClick={() => requestPostStatusUpdate('CLOSED')}
                    disabled={updatingPostStatus || post.status !== 'ACTIVE'}
                    className="rounded-2xl bg-gray-800 px-4 py-3 font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    <span className="inline-flex items-center gap-2">
                      <XCircle className="h-5 w-5" /> Ilani Kapat
                    </span>
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Gelen Basvurular</h3>
                      <p className="mt-1 text-sm text-gray-500">Bu ilana gelen tum sahiplenme taleplerini burada yonetebilirsiniz.</p>
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
                      {ownerRequests.length} basvuru
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
                            onClick={() => requestReview(request.id, 'APPROVED')}
                            disabled={reviewingRequestId === request.id}
                            className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                          >
                            <span className="inline-flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" /> Onayla
                            </span>
                          </button>
                          <button
                            onClick={() => requestReview(request.id, 'REJECTED')}
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
                  onClick={() => {
                    if (!currentUser) {
                      router.push('/login');
                      return;
                    }

                    setShowChat((previous) => !previous);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                >
                  <MessageSquare className="h-5 w-5" /> {showChat ? 'Sohbeti Gizle' : 'Sahibi ile Iletisime Gec'}
                </button>

                {showChat && currentUser && (
                  <div className="mt-4 border-t pt-4">
                    <Chat conversationId={`conv-${postId}`} currentUserId={currentUser.id} />
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Home className="h-4 w-4 text-orange-500" /> Konum
                </div>
                <div className="text-sm text-gray-500">{post.city}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Phone className="h-4 w-4 text-orange-500" /> Iletisim
                </div>
                <div className="text-sm text-gray-500">{post.owner?.phone || 'Telefon paylasilmamis'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportModal postId={postId} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">{confirmDialog.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{confirmDialog.message}</p>
            </div>
            <div className="flex items-center justify-end gap-3 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-200"
              >
                İptal
              </button>
              <button
                onClick={executeConfirmAction}
                className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-orange-700"
              >
                Evet, Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
