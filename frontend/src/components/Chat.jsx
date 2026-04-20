"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Send, Trash2, ShieldAlert } from 'lucide-react';

export default function Chat({ conversationId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. Fetch initial messages
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/conversations/${conversationId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();

    // 2. Initialize Socket Connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinConversation', { conversationId });
    });

    newSocket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
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
    try {
      await axios.patch(`http://localhost:3001/conversations/messages/${messageId}/soft-delete`);
      // Update local state instantly for better UX
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'DELETED', content: 'This message was deleted' } : m));
    } catch(err) {
      console.error("Cannot delete message", err);
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-4 font-bold text-gray-700 flex justify-between items-center">
        <span>Mesajlar</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(msg => {
          const isMe = msg.senderUserId === currentUserId;
          const isDeleted = msg.status === 'DELETED';
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`relative px-4 py-2 max-w-xs md:max-w-md rounded-2xl ${isMe ? 'bg-orange-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'} ${isDeleted && 'bg-gray-200 text-gray-500 italic border border-gray-300'}`}>
                {isDeleted ? (
                  <span className="flex items-center gap-1 text-sm"><ShieldAlert className="w-4 h-4"/> {msg.content}</span>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
              <div className="flex items-center mt-1 gap-2 text-xs text-gray-400">
                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isMe && !isDeleted && (
                  <button onClick={() => softDelete(msg.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-3 h-3" /></button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Mesajınızı yazın..." 
          className="flex-1 px-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
        <button type="submit" className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
