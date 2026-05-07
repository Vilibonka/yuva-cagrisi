"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertOctagon, Trash2, ShieldAlert, CheckCircle, XCircle, LayoutDashboard, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { showSuccess, showError } from '@/utils/toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);

  // Mock Admin Headers
  const adminHeaders = {
    headers: { 'x-user-role': 'ADMIN' }
  };

  useEffect(() => {
    fetchUsers();
    fetchReports();
    fetchPosts();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3000/admin/users', adminHeaders);
      setUsers(res.data);
    } catch(err) { console.error(err); }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get('http://localhost:3000/admin/reports', adminHeaders);
      setReports(res.data);
    } catch(err) { console.error(err); }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:3000/admin/posts', adminHeaders);
      setPosts(res.data);
    } catch(err) { console.error(err); }
  };

  const confirmAction = (title, message, confirmText, onConfirm, isDanger = true) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[200px]">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
          <ShieldAlert className={`w-5 h-5 ${isDanger ? 'text-rose-500' : 'text-emerald-500'}`} />
          {title}
        </div>
        <p className="text-xs text-gray-500">{message}</p>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">İptal</button>
          <button onClick={() => { toast.dismiss(t.id); onConfirm(); }} className={`px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition shadow-sm ${isDanger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>{confirmText}</button>
        </div>
      </div>
    ), { duration: 10000, position: 'top-center', style: { borderRadius: '16px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', border: `1px solid ${isDanger ? '#fee2e2' : '#d1fae5'}` } });
  };

  const toggleUserFreeze = async (userId) => {
    try {
      await axios.patch(`http://localhost:3000/admin/users/${userId}/freeze`, {}, adminHeaders);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
      showSuccess("Kullanıcı durumu güncellendi.");
    } catch (err) { console.error(err); showError("İşlem başarısız."); }
  };

  const dismissReport = async (reportId) => {
    try {
      await axios.patch(`http://localhost:3000/admin/reports/${reportId}/dismiss`, {}, adminHeaders);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'DISMISSED' } : r));
      showSuccess("Şikayet yoksayıldı.");
    } catch (err) { console.error(err); showError("İşlem başarısız."); }
  };

  const removePost = (reportId) => {
    confirmAction("İlan kalıcı olarak silinsin mi?", "Bu ilan tamamen silinecek. İşlem geri alınamaz.", "Sil", async () => {
      try {
        await axios.patch(`http://localhost:3000/admin/reports/${reportId}/remove-post`, {}, adminHeaders);
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'REVIEWED' } : r));
        showSuccess("İlan silindi.");
      } catch (err) { console.error(err); showError("Silme başarısız."); }
    });
  };

  const approvePost = (postId) => {
    confirmAction("İlan onaylansın mı?", "İlan onaylanarak yayına alınacaktır.", "Onayla", async () => {
      try {
        await axios.patch(`http://localhost:3000/admin/posts/${postId}/approve`, {}, adminHeaders);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'ACTIVE' } : p));
        showSuccess("İlan onaylandı.");
      } catch (err) { console.error(err); showError("İşlem başarısız."); }
    }, false);
  };

  const deletePost = (postId) => {
    confirmAction("İlan silinsin mi?", "İlan tamamen sistemden kaldırılacaktır.", "Sil", async () => {
      try {
        await axios.delete(`http://localhost:3000/admin/posts/${postId}`, adminHeaders);
        setPosts(prev => prev.filter(p => p.id !== postId));
        showSuccess("İlan silindi.");
      } catch (err) { console.error(err); showError("İşlem başarısız."); }
    });
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-900 rounded-2xl p-4 text-white shadow-xl h-fit">
          <div className="flex items-center gap-3 mb-8 px-2 mt-2 text-orange-500 font-bold text-lg">
            <ShieldAlert className="w-6 h-6"/> Yönetim Paneli
          </div>
          <div className="space-y-2">
            <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'OVERVIEW' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-5 h-5"/> Genel Bakış
            </button>
            <button onClick={() => setActiveTab('USERS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'USERS' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Users className="w-5 h-5"/> Kullanıcılar
            </button>
            <button onClick={() => setActiveTab('POSTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'POSTS' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <FileText className="w-5 h-5"/> İlanlar
              {posts.filter(p => p.status === 'PENDING').length > 0 && <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{posts.filter(p => p.status === 'PENDING').length}</span>}
            </button>
            <button onClick={() => setActiveTab('REPORTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'REPORTS' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <AlertOctagon className="w-5 h-5"/> Şikayetler {reports.filter(r => r.status === 'OPEN').length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{reports.filter(r => r.status === 'OPEN').length}</span>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {activeTab === 'OVERVIEW' && (
            <div className="p-6">
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h2 className="text-2xl font-extrabold text-gray-800">Genel Bakış</h2>
                <p className="text-sm text-gray-500 mt-1">Sistem istatistikleri ve güncel durum özeti.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Toplam Kullanıcı</p>
                      <h3 className="text-3xl font-bold">{users.length}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl"><Users className="w-6 h-6"/></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-1">Aktif Kullanıcı</p>
                      <h3 className="text-3xl font-bold">{users.filter(u => u.isActive).length}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl"><CheckCircle className="w-6 h-6"/></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-orange-100 text-sm font-medium mb-1">Toplam Şikayet</p>
                      <h3 className="text-3xl font-bold">{reports.length}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl"><FileText className="w-6 h-6"/></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-rose-100 text-sm font-medium mb-1">Açık Şikayetler</p>
                      <h3 className="text-3xl font-bold">{reports.filter(r => r.status === 'OPEN').length}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl"><AlertOctagon className="w-6 h-6"/></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'USERS' && (
            <div>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Kullanıcı Yönetimi</h2>
                <p className="text-sm text-gray-500">Platformdaki kullanıcıları görüntüleyin veya dondurun.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr><th className="p-4 font-semibold">Ad Soyad</th><th className="p-4 font-semibold">Email</th><th className="p-4 font-semibold">Rol</th><th className="p-4 font-semibold">Durum</th><th className="p-4 font-semibold">İşlem</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800">{u.fullName}</td>
                        <td className="p-4 text-gray-500">{u.email}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
                        <td className="p-4">
                          {u.isActive ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4"/> Aktif</span> : <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4"/> Donduruldu</span>}
                        </td>
                        <td className="p-4">
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => toggleUserFreeze(u.id)} className={`text-xs font-bold px-3 py-1 rounded border transition ${u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                              {u.isActive ? 'Hesabı Dondur' : 'Aktifleştir'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'REPORTS' && (
            <div>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Şikayet Yönetimi</h2>
                <p className="text-sm text-gray-500">Kullanıcılar tarafından şikayet edilen içerikleri inceleyin.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr><th className="p-4 font-semibold">İlan</th><th className="p-4 font-semibold">Şikayet Eden</th><th className="p-4 font-semibold">Sebep</th><th className="p-4 font-semibold">Durum</th><th className="p-4 font-semibold">İşlemler</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reports.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-orange-600">
                          <a href={`/posts/${r.post?.id}`} target="_blank" rel="noreferrer" className="hover:underline">{r.post?.title || "Silinmiş İlan"}</a>
                          <div className="text-xs text-gray-400 mt-1">İlan Durumu: {r.post?.status}</div>
                        </td>
                        <td className="p-4 text-gray-600">{r.reportedBy?.fullName}</td>
                        <td className="p-4">
                          <span className="font-semibold text-gray-700">{r.reason}</span>
                          {r.description && <p className="text-xs text-gray-500 mt-1 max-w-xs">{r.description}</p>}
                        </td>
                        <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                        </td>
                        <td className="p-4">
                          {r.status === 'OPEN' && (
                            <div className="flex gap-2">
                              <button onClick={() => dismissReport(r.id)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded text-xs transition">Yoksay</button>
                              <button onClick={() => removePost(r.id)} className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium flex items-center gap-1 rounded text-xs transition"><Trash2 className="w-3 h-3"/> İlanı Sil</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">Kayıtlı şikayet yok.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'POSTS' && (
            <div>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">İlan Yönetimi</h2>
                <p className="text-sm text-gray-500">Kullanıcıların oluşturduğu ilanları inceleyin ve onaylayın.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr><th className="p-4 font-semibold">Başlık</th><th className="p-4 font-semibold">Oluşturan</th><th className="p-4 font-semibold">Tarih</th><th className="p-4 font-semibold">Durum</th><th className="p-4 font-semibold">İşlemler</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {posts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-orange-600">
                          <a href={`/posts/${p.id}`} target="_blank" rel="noreferrer" className="hover:underline">{p.title}</a>
                        </td>
                        <td className="p-4 text-gray-600">{p.owner?.fullName || 'Bilinmiyor'}</td>
                        <td className="p-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</td>
                        <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {p.status === 'PENDING' && (
                              <button onClick={() => approvePost(p.id)} className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 font-medium flex items-center gap-1 rounded text-xs transition"><CheckCircle className="w-3 h-3"/> Onayla</button>
                            )}
                            <button onClick={() => deletePost(p.id)} className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium flex items-center gap-1 rounded text-xs transition"><Trash2 className="w-3 h-3"/> Sil</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {posts.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">Kayıtlı ilan yok.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
