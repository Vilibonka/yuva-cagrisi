'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, Heart, Settings, PlusSquare, LayoutDashboard, Bell, MessageSquare, X, CheckCheck, Clock, Info } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import toast from 'react-hot-toast';
import api from '@/api';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const { socket } = useSocket({ userId: user?.id });
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifPanel, setShowNotifPanel] = React.useState(false);
  const [notifLoading, setNotifLoading] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Close notification panel on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread counts on mount and route change
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCounts = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          api.get('/notifications/unread-count'),
          api.get('/conversations/unread-count')
        ]);
        setUnreadNotifications(notifRes.data.count || 0);
        setUnreadMessages(msgRes.data.count || 0);
      } catch (error) {
        console.error("Failed to fetch unread counts", error);
      }
    };

    fetchCounts();
  }, [isAuthenticated, pathname]);

  // Handle real-time WebSocket notifications
  React.useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: any) => {
      if (notification.type === 'NEW_MESSAGE') {
        // Only increase message badge, not notification badge
        setUnreadMessages((prev) => prev + 1);
        toast(notification.message || 'Yeni bir mesajınız var!', { icon: '✉️', duration: 4000 });
      } else {
        setUnreadNotifications((prev) => prev + 1);
        setNotifications((prev) => [notification, ...prev]);
        toast(notification.message, { icon: '🔔', duration: 5000 });
      }
    };

    socket.on('new_notification', handleNotification);
    return () => { socket.off('new_notification', handleNotification); };
  }, [socket]);

  // Toggle notification panel
  const toggleNotifPanel = async () => {
    const nextState = !showNotifPanel;
    setShowNotifPanel(nextState);

    if (nextState) {
      setNotifLoading(true);
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setNotifLoading(false);
      }

      // Mark all as read
      if (unreadNotifications > 0) {
        try {
          await api.patch('/notifications/mark-all-read');
          setUnreadNotifications(0);
        } catch {}
      }
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'REQUEST_CREATED': return '🐾';
      case 'REQUEST_APPROVED': return '🎉';
      case 'REQUEST_REJECTED': return '❌';
      case 'NEW_MESSAGE': return '✉️';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  };

  return (
    <header className="w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black tracking-tighter text-orange-600 transition-all group-hover:text-orange-700">
            BİR YUVA BİR DOST
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/posts"
            className={`text-sm font-semibold transition-colors ${
              pathname === '/posts' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            İlanlar
          </Link>
          <Link
            href="/listings/create"
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
              pathname === '/listings/create' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <PlusSquare className="h-4 w-4" /> İlan Ver
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Favorites */}
              <Link
                href="/profile/favorites"
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                  pathname === '/profile/favorites'
                    ? 'bg-red-50 text-red-500'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'
                }`}
                title="Favorilerim"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Messages */}
              <Link
                href="/messages"
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                  pathname === '/messages'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'
                }`}
                title="Mesajlarım"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={toggleNotifPanel}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer outline-none ${
                    showNotifPanel
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'
                  }`}
                  title="Bildirimler"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifPanel && (
                  <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] origin-top-right rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/60 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange-500" />
                        Bildirimler
                      </h3>
                      <button
                        onClick={() => setShowNotifPanel(false)}
                        className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Panel Body */}
                    <div className="overflow-y-auto max-h-[380px] divide-y divide-gray-50">
                      {notifLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Info className="w-6 h-6 text-gray-300" />
                          </div>
                          <p className="text-sm font-medium">Henüz bildirim yok</p>
                          <p className="text-xs mt-1 text-gray-300">Yeni bildirimler burada görünecek.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`px-5 py-3.5 hover:bg-orange-50/40 transition-colors cursor-default ${
                              !notif.isRead ? 'bg-orange-50/60' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 mb-0.5">{notif.title}</p>
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(notif.createdAt)}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <div className="flex-shrink-0 mt-1.5">
                                  <span className="w-2 h-2 rounded-full bg-orange-500 block" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="group relative ml-1">
                <button className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200">
                  <User className="h-4 w-4" />
                  {user?.fullName?.split(' ')[0]}
                </button>
                <div className="absolute right-0 top-full mt-2 w-52 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-200/60 transition-all scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible z-[100]">
                  <Link href="/profile/settings" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
                    <Settings className="h-4 w-4" /> Ayarlar
                  </Link>
                  <Link href="/my-requests" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
                    <LayoutDashboard className="h-4 w-4" /> Başvurularım
                  </Link>
                  <Link href="/my-listings" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
                    <PlusSquare className="h-4 w-4" /> İlanlarım
                  </Link>

                  <div className="my-1.5 border-t border-gray-100" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="h-4 w-4" /> Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-orange-600 transition px-3 py-2">Giriş</Link>
              <Link href="/register" className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white transition hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200/50">
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
