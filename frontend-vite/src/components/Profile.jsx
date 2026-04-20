import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, Phone, MapPin, Edit3, Heart, Save, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('INFO'); // INFO, FAVORITES
  const [profile, setProfile] = useState({});
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchSavedPosts();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
    } catch (err) {
      if(err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const res = await api.get('/users/me/saved-posts');
      setSavedPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', profile);
      alert('Profil güncellendi!');
    } catch (err) {
      alert('Güncelleme başarısız!');
    } finally {
      setSaving(false);
    }
  };

  const removeSavedPost = async (postId) => {
    try {
      await api.post(`/users/me/saved-posts/${postId}`); // Togging removes it
      setSavedPosts(prev => prev.filter(sp => sp.post.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center p-12">Yükleniyor...</div>;

  return (
    <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6">
      
      {/* Sidebar */}
      <div className="md:col-span-1 bg-white rounded-2xl shadow p-6 h-fit border border-gray-100">
        <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          {profile.fullName?.charAt(0)}
        </div>
        <h2 className="text-center font-bold text-xl text-gray-800">{profile.fullName}</h2>
        <p className="text-center text-sm text-gray-500 mb-6">{profile.email}</p>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('INFO')}
            className={`flex items-center gap-2 p-3 rounded-lg font-medium transition ${activeTab === 'INFO' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <User className="w-5 h-5"/> Kişisel Bilgiler
          </button>
          <button 
            onClick={() => setActiveTab('FAVORITES')}
            className={`flex items-center gap-2 p-3 rounded-lg font-medium transition ${activeTab === 'FAVORITES' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Heart className="w-5 h-5"/> Favorilerim
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="md:col-span-3">
        {activeTab === 'INFO' ? (
          <div className="bg-white rounded-2xl shadow p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Edit3 className="text-orange-500 w-6 h-6"/> Profili Düzenle
            </h3>
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <input type="text" name="fullName" value={profile.fullName || ''} onChange={handleProfileChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone className="w-4 h-4"/> Telefon</label>
                  <input type="text" name="phone" value={profile.phone || ''} onChange={handleProfileChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4"/> Şehir</label>
                  <input type="text" name="city" value={profile.city || ''} onChange={handleProfileChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <input type="text" name="district" value={profile.district || ''} onChange={handleProfileChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hakkımda (Biyografi)</label>
                <textarea name="bio" value={profile.bio || ''} onChange={handleProfileChange} rows="3" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition disabled:opacity-70">
                  <Save className="w-5 h-5"/> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-8 border border-gray-100 min-h-[500px]">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Heart className="text-red-500 w-6 h-6 fill-red-500"/> Kaydedilen İlanlar
            </h3>
            
            {savedPosts.length === 0 ? (
              <div className="text-center text-gray-400 py-12">Henüz favoriye alınmış bir ilan yok.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedPosts.map((saved) => (
                  <div key={saved.id} className="border border-gray-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition bg-gray-50">
                     <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                       {saved.post.images?.length > 0 ? (
                         <img src={`http://localhost:3000${saved.post.images[0].imageUrl}`} alt="pet" className="w-full h-full object-cover"/>
                       ) : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">Resimsiz</div>}
                     </div>
                     <div className="flex flex-col justify-between flex-1">
                       <div>
                         <Link to={`/posts/${saved.post.id}`} className="font-bold text-gray-800 hover:text-orange-600 line-clamp-1">{saved.post.title}</Link>
                         <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {saved.post.city}</div>
                       </div>
                       <button onClick={() => removeSavedPost(saved.post.id)} className="text-xs text-red-500 font-medium hover:text-red-700 w-fit">
                         Favorilerden Çıkar
                       </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
