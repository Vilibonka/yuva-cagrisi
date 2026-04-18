import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function CreatePost() {
  const navigate = useNavigate();
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
    city: ''
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (images.length + selectedFiles.length > 5) {
      setError("Maksimum 5 fotoğraf yükleyebilirsiniz.");
      return;
    }
    setImages(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      images.forEach(image => {
        data.append('images', image);
      });

      // Adjust backend URL to match your proxy or exact URL
      await axios.post('http://localhost:3000/pet-posts', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
          // Add Authorization header here if implemented
        }
      });
      
      navigate('/posts');
    } catch (err) {
      console.error(err);
      setError("İlan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-orange-500 py-6 px-8 text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">Yeni İlan Oluştur</h2>
        <p className="mt-2 text-orange-100">Dostumuz için en uygun yuvayı bulalım.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-xl font-bold border-b pb-2 text-gray-800">İlan Bilgileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">İlan Başlığı</label>
              <input required name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition" placeholder="Örn: 2 aylık sevimli teli terier yuva arıyor" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">İlan Türü</label>
              <select name="postType" value={formData.postType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition">
                <option value="REHOME_OWNED_PET">Evcil Hayvan Sahiplendirme</option>
                <option value="FOUND_STRAY">Sokakta Bulunan Can</option>
                <option value="TEMP_HOME_NEEDED">Geçici Yuva Aranıyor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Şehir</label>
              <input required name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition" placeholder="Örn: İstanbul" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Detaylı Açıklama</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition" placeholder="Hayvanın alışkanlıkları, ihtiyaçları vb." />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold border-b pb-2 text-gray-800 mt-6">Dostumuzun Bilgileri</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tür</label>
              <select name="species" value={formData.species} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition">
                <option value="DOG">Köpek</option>
                <option value="CAT">Kedi</option>
                <option value="BIRD">Kuş</option>
                <option value="RABBIT">Tavşan</option>
                <option value="OTHER">Diğer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Irk (Varsa)</label>
              <input name="breed" value={formData.breed} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition" placeholder="Örn: Tekir" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cinsiyet</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition">
                <option value="UNKNOWN">Bilinmiyor</option>
                <option value="MALE">Erkek</option>
                <option value="FEMALE">Dişi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Boyut</label>
              <select name="size" value={formData.size} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition">
                <option value="SMALL">Küçük</option>
                <option value="MEDIUM">Orta</option>
                <option value="LARGE">Büyük</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tahmini Yaş (Ay)</label>
              <input type="number" name="estimatedAgeMonths" value={formData.estimatedAgeMonths} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition" placeholder="Örn: 12" />
            </div>
            
             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Karakter / Huy</label>
              <input name="temperament" value={formData.temperament} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition" placeholder="Sakin, oyuncu vb." />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold border-b pb-2 text-gray-800 mt-6">Fotoğraflar</h3>
          <p className="text-sm text-gray-500">İlk eklenen fotoğraf ana vitrin görseli olacaktır. En fazla 5 fotoğraf ekleyebilirsiniz.</p>
          
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Camera className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500"><span className="font-semibold text-orange-600">Seçmek için tıklayın</span> veya sürükleyip bırakın</p>
              </div>
              <input multiple type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200">
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-600/80 text-white text-xs py-1 text-center font-semibold">Ana Görsel</div>
                  )}
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 border-t">
          <button type="submit" disabled={loading} className={`w-full py-4 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition ${loading ? 'bg-orange-400' : 'bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-orange-600/30'}`}>
            {loading ? 'Yükleniyor...' : <><CheckCircle className="w-6 h-6" /> İlanı Yayınla</>}
          </button>
        </div>
      </form>
    </div>
  );
}
