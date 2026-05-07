"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, ShieldAlert, Loader2, MoreVertical, Ban, Flag, MessageSquareX, X, CheckSquare, Square } from 'lucide-react';
import api, { API_BASE_URL } from '@/api';
import { getStoredAccessToken } from '@/lib/auth';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { showSuccess, showError, showInfo } from '@/utils/toast';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam / İstenmeyen Mesaj' },
  { value: 'HARASSMENT', label: 'Taciz / Zorbalık' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Uygunsuz İçerik' },
  { value: 'SCAM', label: 'Dolandırıcılık' },
  { value: 'FAKE_ACCOUNT', label: 'Sahte Hesap' },
  { value: 'OTHER', label: 'Diğer' },
];

export default function Chat({ conversationId, currentUserId, onConversationDeleted }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  // Get other user id from messages
  const otherUserId = messages.find(m => m.senderUserId !== currentUserId)?.senderUserId || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/conversations/${conversationId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    const token = getStoredAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinConversation', { conversationId });
    });

    newSocket.on('newMessage', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [conversationId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;
    
    socket.emit('sendMessage', {
      conversationId,
      content: inputValue
    });
    setInputValue("");
  };

  const softDelete = async (messageId) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[200px]">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          Mesaj silinsin mi?
        </div>
        <p className="text-xs text-gray-500">Bu işlem geri alınamaz.</p>
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.patch(`/conversations/messages/${messageId}/soft-delete`);
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'DELETED', content: 'Bu mesaj silindi' } : m));
                showSuccess("Mesaj silindi");
              } catch(err) {
                console.error("Cannot delete message", err);
                showError("Mesaj silinemedi");
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition shadow-sm"
          >
            Sil
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
      style: {
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #fee2e2'
      }
    });
  };

  // ───── Block User ─────
  const handleBlockUser = () => {
    if (!otherUserId) return;
    setMenuOpen(false);
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[200px]">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
          <Ban className="w-5 h-5 text-rose-500" />
          Kullanıcıyı engelle?
        </div>
        <p className="text-xs text-gray-500">Bu kişi artık size mesaj gönderemeyecek ve siz de bu kişiye mesaj gönderemeyeceksiniz.</p>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">İptal</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.post('/conversations/block-user', { targetUserId: otherUserId });
                setIsBlocked(true);
                showSuccess("Kullanıcı engellendi.");
              } catch (err) {
                console.error(err);
                showError(err.response?.data?.message || "Engelleme başarısız.");
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition shadow-sm"
          >
            Engelle
          </button>
        </div>
      </div>
    ), { duration: 10000, position: 'top-center', style: { borderRadius: '16px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' } });
  };

  // ───── Delete Conversation ─────
  const handleDeleteConversation = () => {
    setMenuOpen(false);
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[200px]">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
          <MessageSquareX className="w-5 h-5 text-rose-500" />
          Sohbet silinsin mi?
        </div>
        <p className="text-xs text-gray-500">Bu sohbet sizin tarafınızdan kalıcı olarak silinecektir.</p>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">İptal</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.delete(`/conversations/${conversationId}`);
                showSuccess("Sohbet silindi.");
                if (onConversationDeleted) onConversationDeleted(conversationId);
              } catch (err) {
                console.error(err);
                showError("Sohbet silinemedi.");
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition shadow-sm"
          >
            Sil
          </button>
        </div>
      </div>
    ), { duration: 10000, position: 'top-center', style: { borderRadius: '16px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' } });
  };

  // ───── Report User Modal ─────
  const toggleReason = (reason) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleReportSubmit = async () => {
    if (!otherUserId || selectedReasons.length === 0) {
      showError("En az bir şikâyet nedeni seçmelisiniz.");
      return;
    }
    setReportSubmitting(true);
    try {
      await api.post('/conversations/report-user', {
        targetUserId: otherUserId,
        reasons: selectedReasons,
        description: reportDescription || undefined,
      });
      showSuccess("Şikâyetiniz iletildi. Teşekkür ederiz.");
      setReportModalOpen(false);
      setSelectedReasons([]);
      setReportDescription('');
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Şikâyet gönderilemedi.");
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden items-center justify-center">
        <Loader2 className="w-7 h-7 text-orange-500 animate-spin mb-3" />
        <span className="text-gray-400 text-sm font-medium">Sohbet yükleniyor...</span>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 z-10">
        <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full text-xs font-bold">
          💬
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-sm font-bold text-gray-800">Canlı Sohbet</span>
          <span className="text-[10px] text-emerald-500 font-semibold">● Çevrimiçi</span>
        </div>

        {/* 3-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-700"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={handleBlockUser}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Ban className="w-4 h-4" /> Kişiyi Engelle
              </button>
              <button
                onClick={() => { setMenuOpen(false); setReportModalOpen(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              >
                <Flag className="w-4 h-4" /> Kişiyi Şikâyet Et
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleDeleteConversation}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <MessageSquareX className="w-4 h-4" /> Sohbeti Sil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Blocked Banner */}
      {isBlocked && (
        <div className="bg-rose-50 border-b border-rose-100 px-5 py-2.5 flex items-center gap-2 text-sm text-rose-700 font-medium">
          <Ban className="w-4 h-4" />
          Bu kullanıcı engellendi. Mesaj gönderemezsiniz.
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-orange-500 ml-0.5" />
            </div>
            <p className="text-sm font-bold text-gray-700">Henüz mesaj yok</p>
            <p className="text-xs text-gray-400 mt-1">İlk mesajı göndererek sohbeti başlatın.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderUserId === currentUserId;
            const isDeleted = msg.status === 'DELETED';
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender name for received messages */}
                {!isMe && msg.sender?.fullName && (
                  <span className="text-[10px] font-bold text-gray-500 ml-1 mb-0.5">{msg.sender.fullName}</span>
                )}
                <div 
                  className={`relative px-4 py-2.5 max-w-[80%] text-sm leading-relaxed ${
                    isDeleted
                      ? 'bg-gray-100 text-gray-400 italic rounded-2xl border border-gray-200'
                      : isMe 
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-br-md shadow-sm shadow-orange-200/40' 
                        : 'bg-white text-gray-800 border border-gray-200/80 rounded-2xl rounded-bl-md shadow-sm'
                  }`}
                >
                  {isDeleted ? (
                    <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-gray-400"/> {msg.content}</span>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                <div className="flex items-center mt-1 gap-2 px-1 text-[10px] text-gray-400 font-medium">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && !isDeleted && (
                    <button onClick={() => softDelete(msg.id)} className="text-gray-400 hover:text-red-500 transition p-0.5 rounded" title="Mesajı Sil">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} className="h-0.5" />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2.5">
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isBlocked ? "Engellenmiş kullanıcıya mesaj gönderilemez" : "Mesajınızı yazın..."} 
          disabled={isBlocked}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || isBlocked}
          className="px-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm shadow-orange-200/40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>

    {/* Report Modal */}
    {reportModalOpen && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <Flag className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Kullanıcıyı Şikâyet Et</h3>
                <p className="text-xs text-gray-400">Nedenlerden birini veya birkaçını seçin</p>
              </div>
            </div>
            <button onClick={() => { setReportModalOpen(false); setSelectedReasons([]); setReportDescription(''); }} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Reasons */}
          <div className="px-6 py-4 space-y-2">
            {REPORT_REASONS.map(reason => {
              const isSelected = selectedReasons.includes(reason.value);
              return (
                <button
                  key={reason.value}
                  onClick={() => toggleReason(reason.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    isSelected
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isSelected ? <CheckSquare className="w-4.5 h-4.5 text-amber-600" /> : <Square className="w-4.5 h-4.5 text-gray-400" />}
                  {reason.label}
                </button>
              );
            })}
          </div>

          {/* Description */}
          <div className="px-6 pb-4">
            <textarea
              rows="3"
              placeholder="Ek açıklama (opsiyonel)..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
            <button
              onClick={() => { setReportModalOpen(false); setSelectedReasons([]); setReportDescription(''); }}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              İptal
            </button>
            <button
              onClick={handleReportSubmit}
              disabled={selectedReasons.length === 0 || reportSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {reportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              {reportSubmitting ? 'Gönderiliyor...' : 'Şikâyet Et'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
