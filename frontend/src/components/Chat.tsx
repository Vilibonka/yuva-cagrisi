'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api, { API_BASE_URL, buildMediaUrl } from '@/api';
import { getStoredAccessToken } from '@/lib/auth';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface Message {
  id: string;
  senderUserId: string;
  content: string;
  status: string;
  createdAt: string;
  sender?: { id: string; fullName: string; profileImageUrl?: string | null };
}

interface BlockStatus {
  isBlocked: boolean;
  blockedByMe: boolean;
  blockedByThem: boolean;
}

interface ChatProps {
  conversationId: string;
  currentUserId: string;
  otherUserId?: string;
  otherUserName?: string;
  otherUserProfileImage?: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

const formatDay = (d: string) =>
  new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

/* ─── Component ──────────────────────────────────────────────────────────────── */

export default function Chat({
  conversationId,
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserProfileImage,
}: ChatProps) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages]         = useState<Message[]>([]);
  const [inputValue, setInputValue]     = useState('');
  const [socket, setSocket]             = useState<Socket | null>(null);
  const [otherStatus, setOtherStatus]     = useState<'online' | 'offline'>('offline');
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [blockStatus, setBlockStatus]   = useState<BlockStatus | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} sa önce`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  /* ── Block status ── */
  const checkBlockStatus = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const res = await api.get(`/user-blocks/check/${otherUserId}`);
      setBlockStatus(res.data);
    } catch { setBlockStatus(null); }
  }, [otherUserId]);

  /* ── Fetch + socket ── */
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    checkBlockStatus();

    (async () => {
      try {
        const res = await api.get(`/conversations/${conversationId}/messages`);
        setMessages(res.data);
      } catch (err) { console.error('Error fetching messages:', err); }
      finally { setLoading(false); }
    })();

    const token = getStoredAccessToken();
    if (!token) { setLoading(false); return; }

    const newSocket = io(API_BASE_URL, { auth: { token }, transports: ['websocket'] });
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      newSocket.emit('joinConversation', { conversationId });
      if (otherUserId) {
        newSocket.emit('getUserStatus', { userId: otherUserId }, (res: any) => {
          setOtherStatus(res.status);
          setOtherLastSeen(res.lastSeenAt);
        });
      }
    });

    newSocket.on('newMessage', (msg: Message) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });

    newSocket.on('userStatus', (data: { userId: string, status: 'online' | 'offline', lastSeenAt?: string }) => {
      if (data.userId === otherUserId) {
        setOtherStatus(data.status);
        if (data.lastSeenAt) setOtherLastSeen(data.lastSeenAt);
      }
    });

    newSocket.on('messagesRead', (data: { conversationId: string, userId: string }) => {
      if (data.conversationId === conversationId && data.userId === otherUserId) {
        setMessages(prev => prev.map(m => m.senderUserId === currentUserId ? { ...m, status: 'READ' } : m));
      }
    });

    return () => { newSocket.disconnect(); };
  }, [conversationId, checkBlockStatus, otherUserId, currentUserId]);

  /* ── Actions ── */
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || blockStatus?.isBlocked) return;
    socket.emit('sendMessage', { conversationId, content: inputValue });
    setInputValue('');
    inputRef.current?.focus();
  };

  const softDelete = async (messageId: string) => {
    if (!window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    try {
      await api.patch(`/conversations/messages/${messageId}/soft-delete`);
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, status: 'DELETED', content: 'Bu mesaj silindi' } : m),
      );
    } catch { console.error('Cannot delete message'); }
  };

  const handleBlock = async () => {
    if (!otherUserId) return;
    setActionLoading(true);
    try {
      await api.post(`/user-blocks/${otherUserId}`, { reason: blockReason || undefined });
      setBlockStatus({ isBlocked: true, blockedByMe: true, blockedByThem: false });
      setShowBlockModal(false);
      setBlockReason('');
    } catch { alert('Engelleme başarısız.'); }
    finally { setActionLoading(false); }
  };

  const handleUnblock = async () => {
    if (!otherUserId) return;
    setActionLoading(true);
    try {
      await api.delete(`/user-blocks/${otherUserId}`);
      setBlockStatus({ isBlocked: false, blockedByMe: false, blockedByThem: false });
    } catch { alert('Engel kaldırma başarısız.'); }
    finally { setActionLoading(false); }
  };

  const isBlocked = blockStatus?.isBlocked ?? false;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col flex-1 rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-orange-100/30 items-center justify-center min-h-[300px]">
        <div className="relative mb-3">
          <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
        </div>
        <span className="text-gray-400 text-sm font-medium">Sohbet yükleniyor...</span>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="flex flex-col flex-1 rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-orange-100/30 overflow-hidden relative">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-5 py-4 flex items-center justify-between relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-40px] right-[-40px] w-[120px] h-[120px] rounded-full bg-white/10" />
        <div className="absolute bottom-[-30px] left-[30%] w-[80px] h-[80px] rounded-full bg-white/5" />

        {/* Avatar + name */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-md">
            {otherUserProfileImage ? (
              <img 
                src={buildMediaUrl(otherUserProfileImage) || undefined} 
                className="w-full h-full object-cover"
                alt={otherUserName || 'User'}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-sm font-black text-white/50 uppercase">
                {otherUserName?.charAt(0) ?? '?'}
              </div>
            )}
            {(otherStatus === 'online' || otherLastSeen || isBlocked) && (
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${isBlocked ? 'bg-red-400' : (otherStatus === 'online' ? 'bg-emerald-400' : 'bg-gray-400')}`} />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">{otherUserName ?? 'Sohbet'}</p>
            <p className="text-[10px] text-white/70 font-medium tracking-wide">
              {isBlocked ? '⛔ Engellendi' : (
                otherStatus === 'online' 
                  ? '● Çevrimiçi' 
                  : (otherLastSeen ? `Son görülme: ${formatTimeAgo(otherLastSeen)}` : '')
              )}
            </p>
          </div>
        </div>

        {/* Block / Unblock buttons */}
        {otherUserId && (
          <div className="flex items-center gap-1.5 relative z-10">
            {blockStatus?.blockedByMe ? (
              <button
                onClick={handleUnblock}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/30 transition-all disabled:opacity-50"
              >
                Engeli Kaldır
              </button>
            ) : !blockStatus?.blockedByThem && (
              <button
                onClick={() => setShowBlockModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-white/80 text-xs font-bold hover:bg-red-500/40 hover:text-white transition-all"
              >
                Engelle
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 px-4 py-5 overflow-y-auto space-y-3 bg-gradient-to-b from-orange-50/20 via-white/10 to-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-700">Henüz mesaj yok</p>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">İlk mesajı göndererek sohbeti başlatın.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe      = msg.senderUserId === currentUserId;
            const isDeleted = msg.status === 'DELETED';
            const showDate  = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
            const senderProfileImage = isMe ? currentUser?.profileImageUrl : msg.sender?.profileImageUrl;

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[10px] font-semibold text-gray-400 shadow-sm border border-gray-100">
                      {formatDay(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Bubble Avatar */}
                  <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gray-100 overflow-hidden shadow-sm border border-white">
                    {senderProfileImage ? (
                      <img 
                        src={buildMediaUrl(senderProfileImage) || undefined} 
                        className="w-full h-full object-cover"
                        alt="sender"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-[10px] font-black text-gray-400 uppercase">
                        {(isMe ? currentUser?.fullName : msg.sender?.fullName)?.charAt(0) ?? '?'}
                      </div>
                    )}
                  </div>

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {!isMe && msg.sender?.fullName && (
                      <span className="text-[10px] font-bold text-orange-500/80 ml-1 mb-0.5 tracking-wide uppercase">
                        {msg.sender.fullName}
                      </span>
                    )}

                    <div className={`group relative px-4 py-2.5 text-sm leading-relaxed transition-all ${
                      isDeleted
                        ? 'bg-gray-100 text-gray-400 italic rounded-2xl border border-gray-200'
                        : isMe
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-br-sm shadow-lg shadow-orange-300/30'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm shadow-md shadow-gray-100/60'
                    }`}>
                      <span className="whitespace-pre-wrap break-words">{msg.content}</span>

                      {/* Delete on hover */}
                      {isMe && !isDeleted && (
                        <button
                          onClick={() => softDelete(msg.id)}
                          title="Mesajı Sil"
                          className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all w-7 h-7 rounded-full bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 flex items-center justify-center shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-gray-400 font-medium mt-1 px-1 flex items-center gap-1.5 justify-end">
                      {formatTime(msg.createdAt)}
                      {isMe && !isDeleted && (
                        <span className={`font-black text-[11px] leading-none ${msg.status === 'READ' ? 'text-blue-500' : 'text-gray-300'}`} title={msg.status === 'READ' ? 'Okundu' : 'İletildi'}>
                          {msg.status === 'READ' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* ── Blocked Banner ── */}
      {isBlocked && (
        <div className="px-5 py-3.5 bg-red-50/80 backdrop-blur-sm border-t border-red-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-sm text-red-600 font-medium">
            {blockStatus?.blockedByMe
              ? 'Bu kullanıcıyı engellediniz. Mesaj göndermek için engeli kaldırın.'
              : 'Bu kullanıcı tarafından engellendiniz.'}
          </p>
        </div>
      )}

      {/* ── Input Area ── */}
      {!isBlocked && (
        <form
          onSubmit={sendMessage}
          className="p-3 bg-white/70 backdrop-blur-sm border-t border-gray-100/80 flex gap-2.5 items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 hover:border-gray-300"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="flex-shrink-0 w-11 h-11 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-200/60 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center shadow-md shadow-orange-200/40"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      )}

      {/* ── Block Modal ── */}
      {showBlockModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-orange-100/40 border border-white/60 p-6 w-full max-w-sm">
            {/* Modal header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Kullanıcıyı Engelle</h3>
                <p className="text-xs text-gray-500 mt-0.5">Bu kullanıcı size mesaj gönderemeyecek.</p>
              </div>
            </div>

            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Engelleme sebebi (opsiyonel)..."
              rows={3}
              className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 resize-none mb-4"
            />

            <div className="flex gap-2.5">
              <button
                onClick={() => { setShowBlockModal(false); setBlockReason(''); }}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleBlock}
                disabled={actionLoading}
                className="flex-[1.5] px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-sm font-bold text-white shadow-md shadow-red-200/50 hover:from-red-600 hover:to-rose-700 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {actionLoading ? 'Engelleniyor...' : 'Engelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
