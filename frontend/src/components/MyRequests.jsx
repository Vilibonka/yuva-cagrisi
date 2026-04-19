"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock3, MapPin, PawPrint } from 'lucide-react';
import api from '@/api';
import RequestStatusBadge from '@/components/RequestStatusBadge';
import RequestStatusTimeline from '@/components/RequestStatusTimeline';
import { getStoredUser } from '@/lib/auth';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('tr-TR');
}

function getPrimaryImage(post) {
  return post?.images?.find((image) => image.isPrimary) || post?.images?.[0] || null;
}

export default function MyRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError(Array.isArray(message) ? message.join(', ') : message || 'Basvurulariniz yuklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router]);

  if (loading) {
    return <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-12 text-center shadow-sm">Basvurular yukleniyor...</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Basvurularim</h1>
            <p className="mt-2 text-sm text-gray-500">Tum sahiplenme basvurularinizin guncel durumunu ve gecmisini burada gorebilirsiniz.</p>
          </div>
          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
            Toplam {requests.length} basvuru
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
          <PawPrint className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-800">Henuz bir basvurunuz yok</h2>
          <p className="mt-2 text-sm text-gray-500">Ilanlari inceleyip size uygun dost icin hemen basvuru yapabilirsiniz.</p>
          <Link href="/posts" className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700">
            Ilanlara git <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        requests.map((request) => {
          const primaryImage = getPrimaryImage(request.post);
          const imageUrl = primaryImage ? `http://localhost:3000${primaryImage.imageUrl}` : null;

          return (
            <div key={request.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                <div className="relative min-h-64 bg-gray-100">
                  {imageUrl ? (
                    <img src={imageUrl} alt={request.post?.title || 'Ilan gorseli'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">Gorsel yok</div>
                  )}
                </div>

                <div className="flex flex-col gap-6 p-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {request.post?.city || 'Sehir yok'}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{request.post?.title || 'Ilan bulunamadi'}</h2>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          Basvuru: {formatDate(request.createdAt)}
                        </span>
                        <span>Degerlendirme: {formatDate(request.reviewedAt)}</span>
                      </div>
                    </div>
                    <RequestStatusBadge status={request.status} />
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                    <div className="font-semibold text-gray-800">Mesajiniz</div>
                    <p className="mt-2 leading-6">{request.message}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-600">
                      <div className="font-semibold text-gray-800">Yasam kosullari</div>
                      <div className="mt-3 space-y-2">
                        <div>Konut tipi: <span className="font-medium text-gray-800">{request.housingType || '-'}</span></div>
                        <div>Diger evcil hayvan: <span className="font-medium text-gray-800">{request.hasOtherPets ? 'Var' : 'Yok'}</span></div>
                        <div>Cocuk bulunan ev: <span className="font-medium text-gray-800">{request.hasChildren ? 'Evet' : 'Hayir'}</span></div>
                        <div>Iletisim telefonu: <span className="font-medium text-gray-800">{request.contactPhone || '-'}</span></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-600">
                      <div className="font-semibold text-gray-800">Deneyim ve motivasyon</div>
                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400">Deneyim</div>
                          <div className="mt-1 font-medium text-gray-800">{request.experienceWithPets || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400">Neden sahiplenmek istiyor?</div>
                          <div className="mt-1 font-medium text-gray-800">{request.whyAdopt || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-sm font-semibold text-gray-800">Durum gecmisi</div>
                    <RequestStatusTimeline history={request.statusHistory} />
                  </div>

                  <div className="flex justify-end">
                    <Link href={`/posts/${request.postId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition hover:text-orange-700">
                      Ilani goruntule <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
