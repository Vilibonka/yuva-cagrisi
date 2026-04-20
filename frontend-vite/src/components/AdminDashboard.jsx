import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, AlertOctagon, Trash2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('USERS');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch(err) { console.error(err); }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data);
    } catch(err) { console.error(err); }
  };

  const toggleUserFreeze = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/freeze`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    } catch (err) { console.error(err); alert("İşlem başarısız."); }
  };

  const dismissReport = async (reportId) => {
    try {
      await api.patch(`/admin/reports/${reportId}/dismiss`);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'DISMISSED' } : r));
    } catch (err) { console.error(err); }
  };

  const removePost = async (reportId) => {
    if(!window.confirm("Bu ilanı kalıcı olarak silmek istediğinize emin misiniz?")) return;
    try {
      await api.patch(`/admin/reports/${reportId}/remove-post`);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'REVIEWED' } : r));
      alert("İlan silindi.");
    } catch (err) { console.error(err); alert("Silme başarısız."); }
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
            <button onClick={() => setActiveTab('USERS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'USERS' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Users className="w-5 h-5"/> Kullanıcılar
            </button>
            <button onClick={() => setActiveTab('REPORTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'REPORTS' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <AlertOctagon className="w-5 h-5"/> Şikayetler {reports.filter(r => r.status === 'OPEN').length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{reports.filter(r => r.status === 'OPEN').length}</span>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
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
        </div>

      </div>
    </div>
  );
}
