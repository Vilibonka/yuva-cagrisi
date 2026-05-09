'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Geçersiz veya eksik token. Lütfen şifre sıfırlama bağlantınızı kontrol edin.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        newPassword 
      });
      setMessage(response.data.message || 'Şifreniz başarıyla sıfırlandı.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Bir hata oluştu. Token süresi dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl border border-gray-100">
      <div>
        <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
          Yeni Şifre Belirle
        </h2>
        <p className="mt-4 text-center text-sm text-gray-600">
          Hesabınız için kullanacağınız yeni şifrenizi girin.
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {message && (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-200">
            {message} Yönlendiriliyorsunuz...
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
            <input
              id="new-password"
              type="password"
              required
              disabled={!token || !!message}
              className="relative block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm transition-all"
              placeholder="En az 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Şifre Tekrarı</label>
            <input
              id="confirm-password"
              type="password"
              required
              disabled={!token || !!message}
              className="relative block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm transition-all"
              placeholder="Şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || !token || !!message}
            className="group relative flex w-full justify-center rounded-xl border border-transparent bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-400 transition-all shadow-lg hover:shadow-orange-500/30"
          >
            {loading ? 'Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
          </button>
        </div>
        
        <div className="text-center text-sm">
          <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
            Giriş ekranına dön
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center text-orange-600">Yükleniyor...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
