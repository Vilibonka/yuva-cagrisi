import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Bone, User, Info, CheckCircle, XCircle, AlertTriangle, MessageSquare, Heart } from 'lucide-react';
import ReportModal from './ReportModal';
import Chat from './Chat';
import api from '../api';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.sub) {
        setCurrentUserId(decoded.sub);
      }
    }
  }, []);

  useEffect(() => {
    // We didn't create a GET /pet-posts/:id endpoint in our simplified backend plan
    // We can fetch all and filter, or we can quickly add a fetch for a specific post.
    // Assuming GET /pet-posts returning the array for now to filter locally (for simplicity).
    // In production, we need a dedicated ID endpoint.
    const getPost = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/pet-posts`);
        const found = res.data.find(p => p.id === id);
        if (found) {
          setPost(found);
        } else {
          // fetch individual maybe?
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    const checkSaved = async () => {
      if(localStorage.getItem('accessToken')) {
        try {
          const res = await api.get('/users/me/saved-posts');
          const saved = res.data.some(sp => sp.post.id === id);
          setIsSaved(saved);
        } catch(err) {}
      }
    };

    getPost();
    checkSaved();
  }, [id]);

  const toggleSave = async () => {
    if (!currentUserId) {
        alert("Favorilere eklemek için giriş yapmalısınız.");
        navigate('/login');
        return;
    }
    try {
        const res = await api.post(`/users/me/saved-posts/${id}`);
        setIsSaved(res.data.saved);
    } catch(err) {
        alert("İlan kaydedilemedi.");
    }
  };

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/pet-posts/${id}/status`, { status: newStatus });

      setPost(prev => ({ ...prev, status: newStatus }));
      if (newStatus !== 'ACTIVE') {
        // Redirect since it's hidden from gallery now
        navigate('/posts');
      }
    } catch (err) {
      console.error(err);
      alert("Durum güncellenirken bir hata oluştu.");
    } finally {
      setUpdating(false);
    }
  };

  const handleStartChat = async () => {
    if (!currentUserId) {
      alert("Mesajlaşmak için giriş yapmalısınız.");
      navigate('/login');
      return;
    }
    
    if (!showChat) {
      try {
        const res = await api.post('/conversations', {
          targetUserId: post.ownerUserId,
          postId: post.id
        });
        setConversationId(res.data.id);
        setShowChat(true);
      } catch (err) {
        console.error(err);
        alert("Sohbet başlatılamadı.");
      }
    } else {
      setShowChat(false);
    }
  };

  if (loading) return <div className="text-center p-12">Yükleniyor...</div>;
  if (!post) return <div className="text-center p-12 text-red-500">İlan bulunamadı.</div>;

  const isOwner = post.ownerUserId === currentUserId;

  return (
    <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="flex items-center justify-between m-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition font-medium">
          <ArrowLeft className="w-5 h-5" /> Geri Dön
        </button>
        {!isOwner && (
          <button onClick={() => setIsReportOpen(true)} className="flex items-center gap-2 text-red-400 hover:text-red-600 transition text-sm font-bold">
            <AlertTriangle className="w-4 h-4" /> İlanı Şikayet Et
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 pt-0">
        <div className="space-y-4">
          {post.images?.length > 0 ? (
            <div className="relative rounded-2xl overflow-hidden h-96 bg-gray-100 shadow-inner border border-gray-200">
              <img src={`http://localhost:3000${post.images[0].imageUrl}`} alt={post.title} className="w-full h-full object-cover" />
            </div>
          ) : (
             <div className="flex items-center justify-center rounded-2xl h-96 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400">
                Görsel Eklenmemiş
             </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${post.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{post.status}</span>
              <span className="text-sm text-gray-400">{new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800">{post.title}</h1>
            <div className="flex items-center gap-2 text-gray-500 mt-2 font-medium">
              <MapPin className="w-5 h-5" /> {post.city}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Bone className="w-5 h-5" /> Dostumuzun Bilgileri</h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div><span className="text-gray-500">Tür:</span> <span className="font-semibold text-gray-800">{post.pet?.species}</span></div>
              <div><span className="text-gray-500">Irk:</span> <span className="font-semibold text-gray-800">{post.pet?.breed || '-'}</span></div>
              <div><span className="text-gray-500">Cinsiyet:</span> <span className="font-semibold text-gray-800">{post.pet?.gender}</span></div>
              <div><span className="text-gray-500">Boyut:</span> <span className="font-semibold text-gray-800">{post.pet?.size}</span></div>
            </div>
          </div>

          <div>
             <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Info className="w-5 h-5" /> Açıklama</h4>
             <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl">{post.description}</p>
          </div>

          <div className="pt-6 border-t flex flex-col gap-3">
             <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg"><User className="w-5 h-5"/></div>
               <div>
                 <p className="text-xs text-gray-500">İlan Sahibi</p>
                 <p className="font-bold text-gray-800">{post.owner?.fullName || "Bilinmiyor"}</p>
               </div>
             </div>
             
             {isOwner ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => updateStatus('ADOPTED')} disabled={updating} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition">
                    <CheckCircle className="w-5 h-5" /> Sahiplendirildi
                  </button>
                  <button onClick={() => updateStatus('CLOSED')} disabled={updating} className="flex-1 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition">
                    <XCircle className="w-5 h-5" /> İlanı Kapat
                  </button>
                </div>
             ) : (
                 <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <button onClick={handleStartChat} className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-2">
                      <MessageSquare className="w-5 h-5" /> {showChat ? 'Sohbeti Gizle' : 'Sahibiyle Görüş'}
                    </button>
                    <button onClick={toggleSave} className={`px-5 rounded-xl border flex items-center justify-center transition ${isSaved ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-red-500'}`}>
                      <Heart className={`w-7 h-7 ${isSaved ? 'fill-red-500' : ''}`} />
                    </button>
                  </div>
                  
                  {showChat && conversationId && (
                     <div className="mt-4 border-t pt-4">
                        <Chat conversationId={conversationId} currentUserId={currentUserId} />
                     </div>
                  )}
                </div>
             )}
          </div>
        </div>
      </div>
      
      <ReportModal postId={id} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
