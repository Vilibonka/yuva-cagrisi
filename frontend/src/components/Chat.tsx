'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api, { API_BASE_URL } from '@/api';
import { getStoredAccessToken } from '@/lib/auth';
import { io, Socket } from 'socket.io-client';

/* ─── Types ─── */
interface Message {
  id: string;
  senderUserId: string;
  content: string;
  status: string;
  createdAt: string;
  sender?: { id: string; fullName: string };
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
}

/* ─── Component ─── */
export default function Chat({ conversationId, currentUserId, otherUserId, otherUserName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  /* ── Check block status ── */
  const checkBlockStatus = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const res = await api.get(`/user-blocks/check/${otherUserId}`);
      setBlockStatus(res.data);
    } catch { setBlockStatus(null); }
  }, [otherUserId]);

  /* ── Fetch messages + socket ── */
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    checkBlockStatus();

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/conversations/${conversationId}/messages`);
        setMessages(res.data);
      } catch (err) { console.error('Error fetching messages:', err); }
      finally { setLoading(false); }
    };
    fetchMessages();

    const token = getStoredAccessToken();
    if (!token) { setLoading(false); return; }

    const newSocket = io(API_BASE_URL, { auth: { token }, transports: ['websocket'] });
    setSocket(newSocket);
    newSocket.on('connect', () => newSocket.emit('joinConversation', { conversationId }));
    newSocket.on('newMessage', (msg: Message) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });
    return () => { newSocket.disconnect(); };
  }, [conversationId, checkBlockStatus]);

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
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'DELETED', content: 'Bu mesaj silindi' } : m));
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

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const isBlocked = blockStatus?.isBlocked ?? false;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col flex-1 rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-xl items-center justify-center shadow-lg">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-gray-400 text-sm font-medium">Sohbet yükleniyor...</span>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="flex flex-col flex-1 rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-orange-100/30 overflow-hidden relative">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-5 py-3.5 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] w-[100px] h-[100px] rounded-full bg-white/10" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative w-9 h-9 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center text-white text-sm font-bold">
            {otherUserName?.charAt(0) || '💬'}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-orange-400 rounded-full" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">{otherUserName || 'Sohbet'}</span>
            <p className="text-[10px] text-white/70 font-medium">
              {isBlocked ? '⛔ Engellendi' : '● Çevrimiçi'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {otherUserId && (
          <div className="flex items-center gap-1.5 relative z-10">
            {blockStatus?.blockedByMe ? (
              <button onClick={handleUnblock} disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-semibold hover:bg-white/30 transition disabled:opacity-50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                Engeli Kaldır
              </button>
            ) : !blockStatus?.blockedByThem && (
              <button onClick={() => setShowBlockModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold hover:bg-red-500/40 transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                Engelle
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50/50 to-white/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <svg className="w-6 h-6 text-orange-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <p className="text-sm font-bold text-gray-700">Henüz mesaj yok</p>
            <p className="text-xs text-gray-400 mt-1">İlk mesajı göndererek sohbeti başlatın.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderUserId === currentUserId;
            const isDeleted = msg.status === 'DELETED';
            const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-full bg-gray-100/80 text-[10px] font-semibold text-gray-400 backdrop-blur-sm">
                      {new Date(msg.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}>
                  {!isMe && msg.sender?.fullName && (
                    <span className="text-[10px] font-bold text-gray-500 ml-1 mb-0.5">{msg.sender.fullName}</span>
                  )}
                  <div className={`group relative px-4 py-2.5 max-w-[75%] text-sm leading-relaxed ${
                    isDeleted
                      ? 'bg-gray-100 text-gray-400 italic rounded-2xl border border-gray-200'
                      : isMe
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-br-md shadow-md shadow-orange-200/40'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md shadow-sm'
                  }`}>
                    {isDeleted ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        {msg.content}
                      </span>
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                    )}
                    {/* Delete button on hover */}
                    {isMe && !isDeleted && (
                      <button onClick={() => softDelete(msg.id)}
                        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center"
                        title="Mesajı Sil">
                        <svg className="w-3 h-3 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mt-1 px-1">
                    {formatTime(msg.createdAt)}
                    {isMe && !isDeleted && msg.status === 'READ' && <span className="ml-1 text-blue-400">✓✓</span>}
                  </span>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-0.5" />
      </div>

      {/* ── Blocked Banner ── */}
      {isBlocked && (
        <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
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
        <form onSubmit={sendMessage} className="p-3 bg-white/60 backdrop-blur-sm border-t border-gray-100 flex gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 text-sm transition-all hover:border-gray-300"
          />
          <button type="submit" disabled={!inputValue.trim()}
            className="px-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-200/50 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center shadow-md shadow-orange-200/40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      )}

      {/* ── Block Modal ── */}
      {showBlockModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Kullanıcıyı Engelle</h3>
                <p className="text-xs text-gray-500">Bu kullanıcı size mesaj gönderemeyecek.</p>
              </div>
            </div>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Engelleme sebebi (opsiyonel)..."
              rows={3}
              className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowBlockModal(false); setBlockReason(''); }}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                İptal
              </button>
              <button onClick={handleBlock} disabled={actionLoading}
                className="flex-[1.5] px-4 py-3 rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition shadow-md disabled:opacity-50">
                {actionLoading ? 'Engelleniyor...' : 'Engelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
