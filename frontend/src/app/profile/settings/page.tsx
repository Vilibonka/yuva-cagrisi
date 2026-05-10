'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api, { buildMediaUrl } from '@/api';
import { getApiErrorMessage } from '@/lib/errors';
import { 
  Camera, User, Mail, Phone, MapPin, 
  Info, CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff, MessageSquare, Clock,
  ChevronRight, Heart, PawPrint, Shield
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    fullName: '',
    contactPhone: '',
    city: '',
    biography: '',
    showReadReceipts: true,
    showLastSeen: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin check
  useEffect(() => {
    if (!isLoading && user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [user, isLoading, router]);

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
        showReadReceipts: user.showReadReceipts ?? true,
        showLastSeen: user.showLastSeen ?? true,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    
    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const { data } = await api.patch('/users/me/avatar', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Profil fotoğrafı yüklenemedi.'));
    } finally {
      setUploading(false);
    }
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Profil güncellenemedi.'));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || (user?.role === 'ADMIN')) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="relative min-h-screen pb-20 pt-10">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-white to-orange-50/30" />
      
      <div className="mx-auto max-w-5xl px-4">
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            Profil <span className="text-orange-600">Bilgilerim</span>
          </h1>
          <p className="mt-2 text-gray-500">Kişisel bilgilerinizi yönetin ve profilinizi özelleştirin.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Avatar & Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white bg-white/70 backdrop-blur-xl p-8 shadow-2xl shadow-orange-100/50 text-center">
              <div className="relative mx-auto mb-6 h-40 w-40">
                <div 
                  onClick={handleAvatarClick}
                  className="group relative h-full w-full cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  {user?.profileImageUrl ? (
                    <img 
                      src={buildMediaUrl(user.profileImageUrl) || undefined} 
                      alt={user.fullName}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-75"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50">
                      <User className="h-16 w-16 text-orange-300" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
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

              <h2 className="text-2xl font-bold text-gray-900">{user?.fullName}</h2>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-orange-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-orange-600/70">Rol</div>
                  <div className="text-sm font-black text-orange-700">Kullanıcı</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500/70">Üyelik</div>
                  <div className="text-sm font-black text-gray-700">
                    {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links / Stats */}
            <div className="rounded-3xl border border-white bg-white/70 backdrop-blur-xl p-6 shadow-xl shadow-orange-100/30">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">Hızlı Erişim</h3>
              <div className="space-y-2">
                {[
                  { label: 'İlanlarım', href: '/my-listings', icon: PawPrint },
                  { label: 'Başvurularım', href: '/my-requests', icon: Heart },
                ].map((link) => (
                  <button 
                    key={link.label}
                    onClick={() => router.push(link.href)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-orange-50 hover:text-orange-600 group"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white bg-white/80 backdrop-blur-xl p-8 shadow-2xl shadow-orange-100/50">
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 animate-shake">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 animate-fadeIn">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    Profiliniz başarıyla güncellendi!
                  </div>
                )}

                {/* Temel Bilgiler */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <User className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-black text-gray-800 tracking-tight">Genel Bilgiler</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-black uppercase tracking-wider text-gray-400">Ad Soyad</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          name="fullName"
                          type="text"
                          required
                          className="block w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3.5 pl-12 pr-4 text-gray-900 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
                          value={formData.fullName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-black uppercase tracking-wider text-gray-400">İletişim Telefonu</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          name="contactPhone"
                          type="tel"
                          placeholder="05xx xxx xx xx"
                          className="block w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3.5 pl-12 pr-4 text-gray-900 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
                          value={formData.contactPhone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-black uppercase tracking-wider text-gray-400">Şehir</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <select
                          name="city"
                          className="block w-full appearance-none rounded-2xl border border-gray-100 bg-gray-50/50 py-3.5 pl-12 pr-10 text-gray-900 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
                          value={formData.city}
                          onChange={handleChange}
                        >
                          <option value="">Şehir Seçin</option>
                          {cities.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-black uppercase tracking-wider text-gray-400">Biyografi</label>
                    <div className="relative">
                      <Info className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <textarea
                        name="biography"
                        rows={3}
                        placeholder="Kendinizden bahsedin..."
                        className="block w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3.5 pl-12 pr-4 text-gray-900 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
                        value={formData.biography}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Gizlilik Ayarları */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <Shield className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-black text-gray-800 tracking-tight">Gizlilik Ayarları</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-2xl border border-gray-50 bg-gray-50/30 p-5 transition-all hover:bg-orange-50/50">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800">Son Görülme</p>
                          <p className="text-[11px] text-gray-500">Durumunuzu kimler görebilir?</p>
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input 
                          type="checkbox" 
                          name="showLastSeen"
                          className="peer sr-only" 
                          checked={formData.showLastSeen}
                          onChange={handleChange}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-gray-50 bg-gray-50/30 p-5 transition-all hover:bg-orange-50/50">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                          <MessageSquare className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800">Okundu Bilgisi</p>
                          <p className="text-[11px] text-gray-500">Mesajların okundu durumu.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input 
                          type="checkbox" 
                          name="showReadReceipts"
                          className="peer sr-only" 
                          checked={formData.showReadReceipts}
                          onChange={handleChange}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-lg font-black text-white shadow-xl shadow-orange-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Güncelleniyor...
                      </>
                    ) : (
                      'Değişiklikleri Kaydet'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
