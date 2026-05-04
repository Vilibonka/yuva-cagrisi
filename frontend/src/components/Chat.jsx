"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import api from '@/api';
import { io } from 'socket.io-client';

export default function Chat({ conversationId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    const newSocket = io('http://localhost:3001', {
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
      senderUserId: currentUserId,
      conversationId,
      content: inputValue
    });
    setInputValue("");
  };

  const softDelete = async (messageId) => {
    if (!window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
    try {
      await api.patch(`/conversations/messages/${messageId}/soft-delete`);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'DELETED', content: 'Bu mesaj silindi' } : m));
    } catch(err) {
      console.error("Cannot delete message", err);
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
    <div className="flex flex-col flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 z-10">
        <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full text-xs font-bold">
          💬
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-800">Canlı Sohbet</span>
          <span className="text-[10px] text-emerald-500 font-semibold">● Çevrimiçi</span>
        </div>
      </div>

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
          placeholder="Mesajınızı yazın..." 
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all"
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim()}
          className="px-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm shadow-orange-200/40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
