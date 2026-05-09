'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setPreviewUrl('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      
      if (response.data.previewUrl) {
        setPreviewUrl(response.data.previewUrl);
        // Attempt to open automatically, though browsers might block async window.open
        window.open(response.data.previewUrl, '_blank');
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Şifremi Unuttum
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600">
            Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-200">
              <p>{message}</p>
              {previewUrl && (
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-lg bg-green-600 px-4 py-2 font-semibold text-white shadow hover:bg-green-700 transition"
                >
                  📨 Sahte Mail Kutusunu Aç (Test İçin)
                </a>
              )}
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="sr-only">E-posta Adresi</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="relative block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm transition-all"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-400 transition-all shadow-lg hover:shadow-orange-500/30"
            >
              {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
              Giriş ekranına dön
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
