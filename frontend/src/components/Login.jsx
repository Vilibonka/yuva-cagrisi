"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/api';
import { storeAuthSession } from '@/lib/auth';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post('/auth/login', { email, password });
      const accessToken = response.data.accessToken || response.data.token || response.data.access_token;
      const user = response.data.user;

      if (!accessToken || !user) {
        setError('Giris basarisiz, oturum bilgileri alinamadi.');
        return;
      }

      storeAuthSession({ accessToken, user });
      setSuccess(true);

      setTimeout(() => {
        router.push('/posts');
      }, 1200);
    } catch (err) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Sunucu baglantisinda bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">Giris Yap</h2>
      {error && <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 p-3 text-red-700">{error}</div>}
      {success && (
        <div className="mb-4 rounded-md border-l-4 border-green-500 bg-green-50 p-3 text-green-700">
          Basariyla giris yaptiniz. Yonlendiriliyorsunuz...
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">E-posta</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="ornek@posta.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Sifre</label>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white shadow-md transition duration-200 hover:bg-orange-600 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
        </button>
      </form>
    </div>
  );
};

export default Login;
