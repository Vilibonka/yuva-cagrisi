import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Filter, MapPin, Bone, Info, Image as ImageIcon } from 'lucide-react';

export default function PostsGallery() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    species: '',
    city: '',
    size: '',
    gender: ''
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axios.get(`http://localhost:3000/pet-posts?${params.toString()}`);
      setPosts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
          <div className="flex items-center gap-2 mb-6 text-orange-600">
            <Filter className="w-5 h-5" />
            <h3 className="font-bold text-lg text-gray-800">Filtreler</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tür</label>
              <select name="species" value={filters.species} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500">
                <option value="">Tümü</option>
                <option value="DOG">Köpek</option>
                <option value="CAT">Kedi</option>
                <option value="BIRD">Kuş</option>
                <option value="RABBIT">Tavşan</option>
                <option value="OTHER">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Şehir</label>
              <input type="text" name="city" placeholder="Örn: Ankara" value={filters.city} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Boyut</label>
              <select name="size" value={filters.size} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500">
                <option value="">Tümü</option>
                <option value="SMALL">Küçük</option>
                <option value="MEDIUM">Orta</option>
                <option value="LARGE">Büyük</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cinsiyet</label>
              <select name="gender" value={filters.gender} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500">
                <option value="">Tümü</option>
                <option value="MALE">Erkek</option>
                <option value="FEMALE">Dişi</option>
              </select>
            </div>
            
            <button onClick={() => setFilters({species: '', city: '', size: '', gender: ''})} className="w-full py-2 mt-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Main Gallery */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Yuva Arayan Canlar</h2>
          <span className="text-sm text-gray-500 font-medium">{posts.length} ilan bulundu</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-80 border border-gray-100"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm flex flex-col items-center">
            <Bone className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700">Aramanıza uygun canlı bulunamadı</h3>
            <p className="text-gray-500 mt-2">Lütfen filtreleri değiştirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => {
              const primaryImage = post.images?.find(i => i.isPrimary) || post.images?.[0];
              const imageUrl = primaryImage ? `http://localhost:3000${primaryImage.imageUrl}` : null;
              
              return (
                <Link to={`/posts/${post.id}`} key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition group flex flex-col">
                  <div className="h-56 relative bg-gray-100 overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs">Görsel Yok</span>
                      </div>
                    )}
                    {post.postType === 'FOUND_STRAY' && (
                      <span className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Kayıp/Sokak</span>
                    )}
                    {post.postType === 'TEMP_HOME_NEEDED' && (
                      <span className="absolute top-3 left-3 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Geçici Yuva</span>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1 group-hover:text-orange-600 transition">{post.title}</h3>
                    <div className="flex items-center text-gray-500 text-sm mt-3 gap-3">
                      <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {post.city}</div>
                      <div className="flex items-center gap-1"><Info className="w-4 h-4" /> {post.pet?.species === 'DOG' ? 'Köpek' : post.pet?.species === 'CAT' ? 'Kedi' : 'Diğer'}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
