import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Extract tokens from backend response. Backend might be returning { accessToken: "..." } or { access_token: "..." }
      const token = response.data.accessToken || response.data.token || response.data.access_token; 
      
      if (token) {
        localStorage.setItem('accessToken', token);
        setSuccess(true);
        // Yönlendirme simülasyonu
        setTimeout(() => {
          // navigate('/dashboard'); 
          console.log("Authenticated state updated.");
        }, 1500);
      } else {
        setError('Giriş başarısız, token sunucudan alınamadı.');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(Array.isArray(err.response.data.message) ? err.response.data.message.join(', ') : err.response.data.message);
      } else {
        setError('Sunucu bağlantısında bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Giriş Yap</h2>
      {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...</div>}
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
            placeholder="ornek@posta.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
            placeholder="••••••••"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition duration-200"
        >
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
};

export default Login;
