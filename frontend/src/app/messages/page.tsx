"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';
import api from '@/api';
import Chat from '@/components/Chat';
import { MessageSquare, ChevronRight, Search, Loader2, Inbox } from 'lucide-react';

interface ConversationUser {
  id: string;
  fullName: string;
  profileImageUrl?: string | null;
}

interface Participant {
  userId: string;
  user: ConversationUser;
}

interface LastMessage {
  content: string;
  createdAt: string;
  status: string;
  senderUserId: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  post?: { id: string; title: string } | null;
  messages: LastMessage[];
}

export default function MessagesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ConversationUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);

    const fetchConversations = async () => {
      try {
        const res = await api.get('/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error("Error fetching conversations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [router]);

  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    // Mark messages as read when opening the conversation
    try {
      await api.get(`/conversations/${convId}/messages`);
    } catch {}
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins} dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} sa`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün`;
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredConversations = conversations.filter((conv: Conversation) => {
    if (!searchQuery.trim()) return true;
    const other = conv.participants.find((p: Participant) => p.userId !== currentUser?.id)?.user;
    const q = searchQuery.toLowerCase();
    return (
      other?.fullName?.toLowerCase().includes(q) ||
      conv.post?.title?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-gray-400 text-sm font-medium">Mesajlar yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col h-[calc(100vh-100px)] bg-white rounded-2xl shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/60 overflow-hidden my-4">
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] border-r border-gray-100 flex-col h-full bg-white`}>
          {/* Sidebar Header */}
          <div className="p-5 border-b border-gray-100">
            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-orange-600" />
              </div>
              Mesajlarım
            </h1>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Sohbet ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-600">
                  {searchQuery ? 'Sonuç bulunamadı' : 'Henüz sohbet yok'}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {searchQuery ? 'Farklı bir arama deneyin.' : 'İlan sayfasından sohbet başlatabilirsiniz.'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredConversations.map((conv: Conversation) => {
                  const otherParticipant = conv.participants.find((p: Participant) => p.userId !== currentUser?.id)?.user;
                  const lastMessage = conv.messages?.[0];
                  const isActive = activeConversationId === conv.id;
                  const isUnread = lastMessage && lastMessage.senderUserId !== currentUser?.id && lastMessage.status === 'SENT';

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-150 flex items-center gap-3.5 ${
                        isActive
                          ? 'bg-orange-50 shadow-sm'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {getInitials(otherParticipant?.fullName)}
                        {isUnread && !isActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className={`text-sm truncate ${isUnread ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-800'}`}>
                            {otherParticipant?.fullName || 'Bilinmeyen'}
                          </span>
                          {lastMessage && (
                            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2 font-medium">
                              {formatTimeAgo(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        {conv.post && (
                          <p className="text-[11px] font-semibold text-orange-500 truncate mb-0.5">
                            {conv.post.title}
                          </p>
                        )}

                        <p className={`text-xs truncate ${isUnread ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                          {lastMessage ? (
                            lastMessage.status === 'DELETED'
                              ? 'Bu mesaj silindi'
                              : (lastMessage.senderUserId === currentUser?.id ? 'Sen: ' : '') + lastMessage.content
                          ) : (
                            <span className="italic">Henüz mesaj yok</span>
                          )}
                        </p>
                      </div>

                      {isActive && <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Chat */}
        <div className={`${activeConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-gray-50/30 relative`}>
          {activeConversationId ? (
            <>
              {/* Mobile back button */}
              <div className="md:hidden p-3 border-b border-gray-100 bg-white">
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="text-orange-600 font-semibold text-sm px-4 py-2 bg-orange-50 rounded-xl hover:bg-orange-100 transition"
                >
                  ← Geri Dön
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 p-4 md:p-6 flex flex-col">
                  <Chat conversationId={activeConversationId} currentUserId={currentUser?.id} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-6">
              <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                <MessageSquare className="w-10 h-10 text-orange-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">Mesajlaşmaya Başlayın</h3>
              <p className="text-sm mt-2 text-center max-w-xs">
                Soldaki listeden bir sohbet seçin veya bir ilan sayfasından iletişime geçin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
