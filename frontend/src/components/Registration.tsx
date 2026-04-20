'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';
import Link from 'next/link';

const Registration = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    contactPhone: '',
    city: '',
    biography: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/register', formData);
      login({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kayıt yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8 rounded-2xl bg-white p-10 shadow-2xl transition-all hover:shadow-orange-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Yeni Bir Hesap Oluşturun</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500">
              Giriş yapın
            </Link>
          </p>
        </div>
        <form className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
          {error && (
            <div className="col-span-full rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
            <input
              name="fullName"
              type="text"
              required
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              placeholder="Ad Soyad"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">E-posta</label>
            <input
              name="email"
              type="email"
              required
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              placeholder="e-posta@ornek.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Şifre</label>
            <input
              name="password"
              type="password"
              required
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">İletişim Telefonu</label>
            <input
              name="contactPhone"
              type="text"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              placeholder="05xx xxx xx xx"
              value={formData.contactPhone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Şehir</label>
            <input
              name="city"
              type="text"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              placeholder="İstanbul"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="col-span-full space-y-1">
            <label className="text-sm font-medium text-gray-700">Biyografi / Hakkınızda</label>
            <textarea
              name="biography"
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              placeholder="Kendinizden bahsetmek ister misiniz?"
              value={formData.biography}
              onChange={handleChange}
            />
          </div>

          <div className="col-span-full">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg border border-transparent bg-orange-600 px-4 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
            >
              {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;
