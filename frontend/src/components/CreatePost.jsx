"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, CheckCircle, X } from 'lucide-react';
import api from '@/api';
import { getStoredUser } from '@/lib/auth';

export default function CreatePost() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    species: 'DOG',
    breed: '',
    gender: 'UNKNOWN',
    estimatedAgeMonths: '',
    size: 'MEDIUM',
    healthSummary: '',
    temperament: '',
    postType: 'REHOME_OWNED_PET',
    title: '',
    description: '',
    city: '',
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);

  React.useEffect(() => {
    api.get('/cities').then(res => setCities(res.data)).catch(console.error);
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (images.length + selectedFiles.length > 5) {
      setError('Maksimum 5 fotograf yukleyebilirsiniz.');
      return;
    }

    setImages((previous) => [...previous, ...selectedFiles]);
    const newPreviewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((previous) => [...previous, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
    setPreviewUrls((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const currentUser = getStoredUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          payload.append(key, value);
        }
      });
      images.forEach((image) => payload.append('images', image));

      await api.post('/pet-posts', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      router.push('/posts');
    } catch (err) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Ilan olusturulurken bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="bg-orange-500 px-8 py-6 text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">Yeni Ilan Olustur</h2>
        <p className="mt-2 text-orange-100">Dostumuz icin en uygun yuvayi bulalim.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 p-8">
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="border-b pb-2 text-xl font-bold text-gray-800">Ilan Bilgileri</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Ilan Basligi</label>
              <input
                required
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                placeholder="Orn: 2 aylik sevimli terrier yuva ariyor"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Ilan Turu</label>
              <select
                name="postType"
                value={formData.postType}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
              >
                <option value="REHOME_OWNED_PET">Evcil Hayvan Sahiplendirme</option>
                <option value="FOUND_STRAY">Sokakta Bulunan Can</option>
                <option value="TEMP_HOME_NEEDED">Gecici Yuva Araniyor</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Sehir</label>
              <select
                required
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
              >
                <option value="">Sehir Secin</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Detayli Aciklama</label>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
                placeholder="Hayvanin aliskanliklari, ihtiyaclari ve sureci hakkinda bilgi verin."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="mt-6 border-b pb-2 text-xl font-bold text-gray-800">Dostumuzun Bilgileri</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Tur</label>
              <select
                name="species"
                value={formData.species}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
              >
                <option value="DOG">Kopek</option>
                <option value="CAT">Kedi</option>
                <option value="BIRD">Kus</option>
                <option value="RABBIT">Tavsan</option>
                <option value="OTHER">Diger</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Irk</label>
              <input
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
                placeholder="Orn: Tekir"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Cinsiyet</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
              >
                <option value="UNKNOWN">Bilinmiyor</option>
                <option value="MALE">Erkek</option>
                <option value="FEMALE">Disi</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Boyut</label>
              <select
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
              >
                <option value="SMALL">Kucuk</option>
                <option value="MEDIUM">Orta</option>
                <option value="LARGE">Buyuk</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Tahmini Yas (Ay)</label>
              <input
                type="number"
                name="estimatedAgeMonths"
                value={formData.estimatedAgeMonths}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
                placeholder="Orn: 12"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Karakter</label>
              <input
                name="temperament"
                value={formData.temperament}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
                placeholder="Sakin, oyuncu vb."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="mt-6 border-b pb-2 text-xl font-bold text-gray-800">Fotograflar</h3>
          <p className="text-sm text-gray-500">Ilk eklenen fotograf ana vitrin gorseli olur. En fazla 5 fotograf ekleyebilirsiniz.</p>

          <div className="flex w-full items-center justify-center">
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <Camera className="mb-2 h-10 w-10 text-gray-400" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-orange-600">Secmek icin tiklayin</span> veya surukleyip birakin
                </p>
              </div>
              <input multiple type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {previewUrls.map((url, index) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200">
                  <img src={url} alt="Preview" className="h-full w-full object-cover" />
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-600/80 py-1 text-center text-xs font-semibold text-white">
                      Ana Gorsel
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-500/80 p-1 text-white opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white transition ${loading ? 'bg-orange-400' : 'bg-orange-600 shadow-lg hover:bg-orange-700 hover:shadow-orange-600/30'}`}
          >
            {loading ? 'Yukleniyor...' : (
              <>
                <CheckCircle className="h-6 w-6" />
                Ilani Yayinla
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
