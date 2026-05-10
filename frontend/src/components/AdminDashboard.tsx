'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/api';
import Link from 'next/link';
import { X, PlusSquare } from 'lucide-react';

/* ──────────────────────────── Types ──────────────────────────── */
interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role: string;
  createdAt: string;
}

interface AdminPost {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  pet: { name: string; species: string };
  owner: { fullName: string; email: string };
  city: { name: string };
}

interface AdminReport {
  id: string;
  reason: string;
  description?: string;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'REMOVED';
  createdAt: string;
  post?: { id: string; title: string; status: string };
  reportedBy?: { id: string; fullName: string };
}

type Tab = 'OVERVIEW' | 'USERS' | 'REPORTS' | 'POSTS';

/* ──────────────────────────── Component ──────────────────────────── */
export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  /* ── Add User Modal State ── */
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ fullName: '', email: '', password: '', role: 'USER' });
  const [addUserLoading, setAddUserLoading] = useState(false);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  /* ── Data fetching ── */
  const fetchData = useCallback(async (query: string = '') => {
    setDataLoading(true);
    try {
      const qParam = query ? `?q=${encodeURIComponent(query)}` : '';
      const [uRes, rRes, pRes] = await Promise.all([
        api.get(`/admin/users${qParam}`),
        api.get('/admin/reports'),
        api.get(`/admin/posts${qParam}`),
      ]);
      setUsers(uRes.data);
      setReports(rRes.data);
      setPosts(pRes.data);
    } catch (err) {
      console.error('Admin data fetch failed', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchData(searchQuery);
  }, [user, fetchData]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === 'ADMIN') fetchData(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchData, user]);

  /* ── Actions ── */
  const toggleFreeze = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/freeze`);
      setUsers((p) => p.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));
    } catch { alert('İşlem başarısız.'); }
    finally { setActionLoading(null); }
  };

  const dismissReport = async (reportId: string) => {
    setActionLoading(reportId);
    try {
      await api.patch(`/admin/reports/${reportId}/dismiss`);
      setReports((p) => p.map((r) => (r.id === reportId ? { ...r, status: 'DISMISSED' } : r)));
    } catch { alert('İşlem başarısız.'); }
    finally { setActionLoading(null); }
  };

  const removePost = async (reportId: string) => {
    if (!window.confirm('Bu ilanı kalıcı olarak silmek istediğinize emin misiniz?')) return;
    setActionLoading(reportId);
    try {
      await api.patch(`/admin/reports/${reportId}/remove-post`);
      setReports((p) => p.map((r) => (r.id === reportId ? { ...r, status: 'REVIEWED' } : r)));
      // Also refresh posts if we are on that tab
      fetchData(searchQuery);
    } catch { alert('Silme başarısız.'); }
    finally { setActionLoading(null); }
  };

  const deletePostDirectly = async (postId: string) => {
    if (!window.confirm('Bu ilanı kalıcı olarak silmek istediğinize emin misiniz?')) return;
    setActionLoading(postId);
    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts((p) => p.filter((item) => item.id !== postId));
    } catch { alert('Silme başarısız.'); }
    finally { setActionLoading(null); }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((p) => p.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch { alert('Rol güncelleme başarısız.'); }
    finally { setActionLoading(null); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    try {
      const res = await api.post('/admin/users', newUserData);
      setUsers([res.data, ...users]);
      setShowAddUserModal(false);
      setNewUserData({ fullName: '', email: '', password: '', role: 'USER' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Kullanıcı oluşturulamadı.');
    } finally {
      setAddUserLoading(false);
    }
  };

  /* ── Derived data ── */
  const openReports = reports.filter((r) => r.status === 'OPEN').length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const frozenUsers = users.filter((u) => !u.isActive).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── Loading / guard ── */
  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ──────────────────────────── Render ──────────────────────────── */
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background — matching auth pages */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-rose-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-200/30 to-amber-100/20 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-200/20 to-orange-100/20 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Floating Decorations */}
      <div className="absolute top-[10%] left-[8%] text-4xl opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>🛡️</div>
      <div className="absolute top-[25%] right-[12%] text-3xl opacity-10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>⚙️</div>
      <div className="absolute bottom-[15%] left-[15%] text-5xl opacity-[0.07] animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}>🐾</div>

      {/* Main Card */}
      <div className="relative w-full max-w-[1200px] overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl shadow-orange-100/50 border border-white/60">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-8 py-7 relative overflow-hidden">
          <div className="absolute top-[-40px] right-[-40px] w-[160px] h-[160px] rounded-full bg-white/10" />
          <div className="absolute bottom-[-20px] left-[-20px] w-[120px] h-[120px] rounded-full bg-white/10" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg">🛡️</span>
                Yönetim Paneli
              </h1>
              <p className="text-white/80 text-sm mt-1">Hoş geldiniz, {user.fullName}</p>
            </div>
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/30 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Ana Sayfa
            </Link>
          </div>

          {/* Tab Bar */}
          <div className="relative z-10 flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {([['OVERVIEW', '📊', 'Genel Bakış'], ['USERS', '👥', 'Kullanıcılar'], ['POSTS', '🐾', 'İlanlar'], ['REPORTS', '🚨', 'Şikayetler']] as [Tab, string, string][]).map(([key, icon, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === key ? 'bg-white text-orange-600 shadow-lg' : 'text-white/80 hover:bg-white/20'}`}>
                <span>{icon}</span> {label}
                {key === 'REPORTS' && openReports > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{openReports}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {dataLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── OVERVIEW TAB ── */}
              {activeTab === 'OVERVIEW' && (
                <div className="animate-fadeIn space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Toplam Kullanıcı', value: users.length, icon: '👥', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
                      { label: 'Toplam İlan', value: posts.length, icon: '🐾', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
                      { label: 'Aktif Kullanıcı', value: activeUsers, icon: '✅', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Açık Şikayet', value: openReports, icon: '🚨', color: 'from-red-500 to-red-600', bg: 'bg-red-50' },
                    ].map((card) => (
                      <div key={card.label} className={`${card.bg} rounded-2xl p-5 border border-white/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">{card.icon}</span>
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                            <span className="text-white text-xs font-bold">{card.value}</span>
                          </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">{card.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick recent reports */}
                  <div className="rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">🕐 Son Şikayetler</h3>
                      <button onClick={() => setActiveTab('REPORTS')} className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition">Tümünü Gör →</button>
                    </div>
                    {reports.slice(0, 3).map((r) => (
                      <div key={r.id} className="px-6 py-3 border-b border-gray-50 last:border-0 flex items-center justify-between gap-4 hover:bg-orange-50/30 transition">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{r.post?.title || 'Silinmiş İlan'}</p>
                          <p className="text-xs text-gray-400">{r.reportedBy?.fullName} · {formatDate(r.createdAt)}</p>
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${r.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                      </div>
                    ))}
                    {reports.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-400">Kayıtlı şikayet yok.</p>}
                  </div>
                </div>
              )}

              {/* ── USERS TAB ── */}
              {activeTab === 'USERS' && (
                <div className="animate-fadeIn space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Kullanıcı Yönetimi</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Platformdaki kullanıcıları görüntüleyin veya dondurun.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end min-w-[300px]">
                      <div className="relative flex-1 max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input type="text" placeholder="Kullanıcı ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                          className="block w-full rounded-2xl border border-gray-200 bg-white/50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100" />
                      </div>
                      <button onClick={() => setShowAddUserModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-orange-200 text-orange-600 text-sm font-bold shadow-sm hover:bg-orange-50 hover:border-orange-300 transition-all active:scale-95">
                        <PlusSquare className="w-4 h-4" /> Yeni Kullanıcı
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Ad Soyad</th>
                            <th className="px-6 py-4 font-semibold">Email</th>
                            <th className="px-6 py-4 font-semibold">Rol</th>
                            <th className="px-6 py-4 font-semibold">Durum</th>
                            <th className="px-6 py-4 font-semibold">Kayıt Tarihi</th>
                            <th className="px-6 py-4 font-semibold">İşlem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-orange-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {u.fullName.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-gray-800">{u.fullName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-500">{u.email}</td>
                              <td className="px-6 py-4">
                                <select 
                                  value={u.role} 
                                  disabled={actionLoading === u.id || u.id === user.id}
                                  onChange={(e) => changeUserRole(u.id, e.target.value)}
                                  className="bg-transparent border-none text-[10px] font-bold focus:ring-0 cursor-pointer p-0 text-blue-700 uppercase tracking-wider"
                                >
                                  <option value="USER">👤 Kullanıcı</option>
                                  <option value="ADMIN">👑 Admin</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                {u.isActive ? (
                                  <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aktif
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-red-500 text-xs font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-red-500" /> Donduruldu
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                              <td className="px-6 py-4">
                                {u.role !== 'ADMIN' && (
                                  <button onClick={() => toggleFreeze(u.id)} disabled={actionLoading === u.id}
                                    className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                                    {actionLoading === u.id ? '...' : u.isActive ? 'Dondur' : 'Aktifleştir'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">Kullanıcı bulunamadı.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── POSTS TAB ── */}
              {activeTab === 'POSTS' && (
                <div className="animate-fadeIn space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">İlan Yönetimi</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Sistemdeki tüm ilanları görüntüleyin ve denetleyin.</p>
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <input type="text" placeholder="İlan ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-64 rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4 font-semibold">İlan / Hayvan</th>
                            <th className="px-6 py-4 font-semibold">Sahibi</th>
                            <th className="px-6 py-4 font-semibold">Konum</th>
                            <th className="px-6 py-4 font-semibold">Durum</th>
                            <th className="px-6 py-4 font-semibold">Tarih</th>
                            <th className="px-6 py-4 font-semibold">İşlem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {posts.map((p) => (
                            <tr key={p.id} className="hover:bg-orange-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <Link href={`/posts/${p.id}`} target="_blank" className="font-bold text-gray-800 hover:text-orange-600 transition-colors">
                                  {p.title}
                                </Link>
                                <p className="text-[10px] text-gray-400 mt-0.5">{p.pet.species} · {p.pet.name || 'İsimsiz'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-700">{p.owner.fullName}</p>
                                <p className="text-[10px] text-gray-400">{p.owner.email}</p>
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-xs">{p.city.name}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                  p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{p.status}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                              <td className="px-6 py-4">
                                <button onClick={() => deletePostDirectly(p.id)} disabled={actionLoading === p.id}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {posts.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">İlan bulunamadı.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── REPORTS TAB ── */}
              {activeTab === 'REPORTS' && (
                <div className="animate-fadeIn space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Şikayet Yönetimi</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Kullanıcılar tarafından şikayet edilen içerikleri inceleyin.</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4 font-semibold">İlan</th>
                            <th className="px-6 py-4 font-semibold">Şikayet Eden</th>
                            <th className="px-6 py-4 font-semibold">Sebep</th>
                            <th className="px-6 py-4 font-semibold">Durum</th>
                            <th className="px-6 py-4 font-semibold">Tarih</th>
                            <th className="px-6 py-4 font-semibold">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {reports.map((r) => (
                            <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <Link href={`/posts/${r.post?.id}`} target="_blank" className="font-semibold text-orange-600 hover:underline text-sm">
                                  {r.post?.title || 'Silinmiş İlan'}
                                </Link>
                                {r.post?.status && <p className="text-[10px] text-gray-400 mt-0.5">Durum: {r.post.status}</p>}
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-sm">{r.reportedBy?.fullName}</td>
                              <td className="px-6 py-4">
                                <span className="font-semibold text-gray-700 text-sm">{r.reason}</span>
                                {r.description && <p className="text-xs text-gray-400 mt-1 max-w-[200px] line-clamp-2">{r.description}</p>}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                  r.status === 'OPEN' ? 'bg-orange-100 text-orange-700' :
                                  r.status === 'REVIEWED' ? 'bg-green-100 text-green-700' :
                                  r.status === 'DISMISSED' ? 'bg-gray-100 text-gray-500' :
                                  'bg-red-100 text-red-600'
                                }`}>{r.status}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(r.createdAt)}</td>
                              <td className="px-6 py-4">
                                {r.status === 'OPEN' && (
                                  <div className="flex gap-2">
                                    <button onClick={() => dismissReport(r.id)} disabled={actionLoading === r.id}
                                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition disabled:opacity-50">
                                      Yoksay
                                    </button>
                                    <button onClick={() => removePost(r.id)} disabled={actionLoading === r.id}
                                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg text-xs transition flex items-center gap-1 disabled:opacity-50">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      Sil
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                          {reports.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">Kayıtlı şikayet yok.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── ADD USER MODAL ── */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-scaleIn">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Yeni Kullanıcı Ekle</h3>
                <button onClick={() => setShowAddUserModal(false)} className="text-white/80 hover:text-white transition"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Ad Soyad</label>
                  <input type="text" required value={newUserData.fullName} onChange={(e) => setNewUserData({...newUserData, fullName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">E-posta</label>
                  <input type="email" required value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Şifre</label>
                  <input type="password" required placeholder="••••••••" value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Rol</label>
                  <select value={newUserData.role} onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-sm font-semibold">
                    <option value="USER">👤 Standart Kullanıcı</option>
                    <option value="ADMIN">👑 Yönetici (Admin)</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={addUserLoading}
                    className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all disabled:opacity-50">
                    {addUserLoading ? 'Ekleniyor...' : 'Kullanıcıyı Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
