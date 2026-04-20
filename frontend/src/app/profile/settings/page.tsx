'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';
import { Camera } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    contactPhone: '',
    city: '',
    biography: '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        contactPhone: user.contactPhone || '',
        city: user.city || '',
        biography: user.biography || '',
      });
      if (user.profileImageUrl) {
        // Ensure to construct proper URL if needed, depending on how it's stored.
        setPreviewUrl(`http://localhost:3001${user.profileImageUrl}`);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('contactPhone', formData.contactPhone);
      submitData.append('city', formData.city);
      submitData.append('biography', formData.biography);
      
      if (profileImage) {
        submitData.append('profileImage', profileImage);
      }

      const { data } = await api.patch('/users/me', submitData);
      
      updateUser(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profil güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 border-b pb-4">Profil Ayarları</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              Profiliniz başarıyla güncellendi.
            </div>
          )}

          <div className="flex flex-col items-center justify-center space-y-4 pb-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-gray-100 bg-gray-50 flex items-center justify-center transition-all group-hover:border-orange-200">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profil Fotoğrafı" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-10 w-10 text-gray-300 group-hover:text-orange-400 transition-colors" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold">Fotoğraf Değiştir</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
            <input
              name="fullName"
              type="text"
              required
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">İletişim Telefonu</label>
            <input
              name="contactPhone"
              type="tel"
              pattern="05[0-9]{9}"
              title="Lütfen telefon numaranızı boşluk bırakmadan 05XXXXXXXXX formatında (11 hane) girin."
              maxLength={11}
              placeholder="Örn: 05551234567"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              value={formData.contactPhone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Şehir</label>
            <input
              name="city"
              type="text"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Biyografi</label>
            <textarea
              name="biography"
              rows={5}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              value={formData.biography}
              onChange={handleChange}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-orange-700 hover:scale-[1.02] disabled:bg-orange-300"
            >
              {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
