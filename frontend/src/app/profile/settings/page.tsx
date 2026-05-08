'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';
import { getApiErrorMessage } from '@/lib/errors';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    contactPhone: '',
    city: '',
    biography: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.get('/cities').then(res => setCities(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        contactPhone: user.contactPhone || '',
        city: user.city || '',
        biography: user.biography || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data } = await api.patch('/users/me', formData);
      updateUser(data);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Profil güncellenemedi.'));
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
              type="text"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              value={formData.contactPhone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Şehir</label>
            <select
              name="city"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500 appearance-none bg-white"
              value={formData.city}
              onChange={handleChange}
            >
              <option value="">Şehir Seçin</option>
              {cities.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
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
