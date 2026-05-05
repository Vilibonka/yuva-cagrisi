'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';
import { getApiErrorMessage } from '@/lib/errors';
import Link from 'next/link';
import Image from 'next/image';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Giriş yapılamadı. Bilgilerinizi kontrol edin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-rose-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-200/30 to-amber-100/20 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-200/20 to-orange-100/20 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Floating Paw Decorations */}
      <div className="absolute top-[10%] left-[8%] text-4xl opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>🐾</div>
      <div className="absolute top-[25%] right-[12%] text-3xl opacity-10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🐾</div>
      <div className="absolute bottom-[15%] left-[15%] text-5xl opacity-[0.07] animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}>🐾</div>
      <div className="absolute bottom-[30%] right-[8%] text-3xl opacity-10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>❤️</div>

      {/* Main Card */}
      <div className="relative flex w-full max-w-[1000px] overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl shadow-orange-100/50 border border-white/60">
        
        {/* Left Panel - Illustration */}
        <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center relative bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 p-10 overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10" />
            <div className="absolute bottom-[-30px] left-[-30px] w-[160px] h-[160px] rounded-full bg-white/10" />
            <div className="absolute top-[40%] left-[-20px] w-[100px] h-[100px] rounded-full bg-white/5" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-56 h-56 mb-6 relative rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <Image
                src="/auth-hero.png"
                alt="Sevimli hayvan dostlarımız"
                fill
                className="object-contain rounded-full"
                priority
              />
            </div>
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
              Bir Yuva, Bir Dost
            </h2>
            <p className="text-white/85 text-sm leading-relaxed max-w-[280px]">
              Sokak hayvanlarına yuva bulmak için bir adım at. Her pati, sıcak bir yuvayı hak eder.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm">🐶</div>
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm">🐱</div>
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm">🐰</div>
              </div>
              <p className="text-white/70 text-xs font-medium">
                1000+ hayvan yuvasını buldu
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-14">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 lg:hidden">
              <span className="text-2xl">🐾</span>
              <span className="text-lg font-black text-orange-600 tracking-tight">BİR YUVA BİR DOST</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Hoş Geldiniz! 👋
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              Hesabınıza giriş yaparak devam edin
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 animate-shake">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 text-sm transition-all duration-200 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 hover:border-gray-300"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700">
                  Şifre
                </label>
                <a href="#" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                  Şifremi Unuttum
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-12 pr-12 py-3.5 text-gray-900 placeholder-gray-400 text-sm transition-all duration-200 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 hover:border-gray-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded-md border-gray-300 text-orange-500 focus:ring-orange-400 transition cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm text-gray-600 cursor-pointer select-none">
                Beni hatırla
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-200/60 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/80 px-4 text-gray-400 font-medium">veya</span>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500">
            Hesabınız yok mu?{' '}
            <Link
              href="/register"
              className="font-bold text-orange-500 hover:text-orange-600 transition-colors underline decoration-orange-200 underline-offset-2 hover:decoration-orange-400"
            >
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
