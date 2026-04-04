import React, { useState } from 'react';
import api from '../api';

const Registration = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'USER'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/auth/register', formData);
      setSuccess('Kayıt işlemi başarılı! Platforma hoş geldiniz, şimdi giriş yapabilirsiniz.');
      setFormData({ fullName: '', email: '', password: '', role: 'USER' });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(Array.isArray(err.response.data.message) ? err.response.data.message.join(', ') : err.response.data.message);
      } else {
        setError('Kayıt oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyiniz.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Aramıza Katıl</h2>
      {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">{success}</div>}
      
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
          <input 
            type="text" 
            name="fullName"
            required 
            value={formData.fullName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
          <input 
            type="email" 
            name="email"
            required 
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
            placeholder="ornek@posta.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
          <input 
            type="password" 
            name="password"
            required 
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rol Belirleme</label>
          <select 
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
          >
            <option value="USER">Kullanıcı (Standart)</option>
            <option value="MODERATOR">Moderatör</option>
            <option value="ADMIN">Yönetici (Admin)</option>
          </select>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition duration-200 mt-2"
        >
          {loading ? 'İşleminiz Yapılıyor...' : 'Kayıt Ol'}
        </button>
      </form>
    </div>
  );
};

export default Registration;
