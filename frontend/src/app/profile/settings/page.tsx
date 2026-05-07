'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Mail, MapPin, Phone, User, NotebookPen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';
import { getApiErrorMessage } from '@/lib/errors';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactPhone: '',
    city: '',
    district: '',
    biography: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        contactPhone: user.contactPhone || '',
        city: user.city || '',
        district: user.district || '',
        biography: user.biography || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        contactPhone: formData.contactPhone.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        biography: formData.biography.trim(),
      };
      const { data } = await api.patch('/users/me', payload);
      updateUser(data);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Profil güncellenemedi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-7 text-white sm:px-8">
          <h1 className="text-2xl font-extrabold">Profil Ayarları</h1>
          <p className="mt-1.5 text-sm text-orange-100">Hesap bilgilerini güncel tutarak iletişim süreçlerini kolaylaştır.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 p-6 sm:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Profiliniz başarıyla güncellendi.
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <InputField
              icon={<User className="h-4 w-4 text-gray-400" />}
              label="Ad Soyad"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <InputField
              icon={<Mail className="h-4 w-4 text-gray-400" />}
              label="E-posta"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <InputField
              icon={<Phone className="h-4 w-4 text-gray-400" />}
              label="İletişim Telefonu"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              required
            />
            <InputField
              icon={<MapPin className="h-4 w-4 text-gray-400" />}
              label="Şehir"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
            <InputField
              icon={<MapPin className="h-4 w-4 text-gray-400" />}
              label="İlçe"
              name="district"
              value={formData.district}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Biyografi</label>
            <div className="relative">
              <NotebookPen className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <textarea
                name="biography"
                rows={5}
                required
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 transition-all focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
                value={formData.biography}
                onChange={handleChange}
                placeholder="Hayvan bakım deneyiminizi ve kendinizden kısa bir özeti yazın."
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  icon,
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
        <input
          name={name}
          type={type}
          required={required}
          className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 transition-all focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
