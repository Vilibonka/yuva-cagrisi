import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ban, Send, ShieldCheck } from 'lucide-react-native';

import { ErrorState, LoadingState, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { formatTime } from '@/lib/labels';
import { BlockStatus, Conversation, Message, User } from '@/types';

const defaultBlockStatus: BlockStatus = {
  isBlocked: false,
  blockedByMe: false,
  blockedByThem: false,
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket(!!id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [blockStatus, setBlockStatus] = useState<BlockStatus>(defaultBlockStatus);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const loadBlockStatus = useCallback(async (targetUserId: string) => {
    const { data } = await api.get<BlockStatus>(`/user-blocks/check/${targetUserId}`);
    setBlockStatus(data);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;

    const [{ data: nextMessages }, { data: conversations }] = await Promise.all([
      api.get<Message[]>(`/conversations/${id}/messages`),
      api.get<Conversation[]>('/conversations'),
    ]);

    const conversation = conversations.find((item) => item.id === id);
    const nextOtherUser = conversation?.participants?.find((participant) => participant.userId !== user?.id)?.user || null;

    setMessages(nextMessages);
    setOtherUser(nextOtherUser || null);

    if (nextOtherUser?.id) {
      await loadBlockStatus(nextOtherUser.id);
    } else {
      setBlockStatus(defaultBlockStatus);
    }
  }, [id, loadBlockStatus, user?.id]);

  const loadScreen = useCallback(
    async ({ withLoading = false }: { withLoading?: boolean } = {}) => {
      if (withLoading) setLoading(true);
      setLoadError(null);
      try {
        await load();
      } catch (error) {
        setLoadError(getApiErrorMessage(error, 'Sohbet yüklenemedi. Lütfen tekrar dene.'));
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setLoading(true);
    void loadScreen({ withLoading: true });
  }, [loadScreen]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('joinConversation', { conversationId: id });
    const onMessage = (message: Message) => {
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
        return [...current, message];
      });
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    };

    const onException = (error: { message?: string }) => {
      Alert.alert('Mesaj gönderilemedi', error?.message || 'Lütfen tekrar dene.');
      if (otherUser?.id) void loadBlockStatus(otherUser.id);
    };

    socket.on('newMessage', onMessage);
    socket.on('exception', onException);
    return () => {
      socket.off('newMessage', onMessage);
      socket.off('exception', onException);
    };
  }, [id, loadBlockStatus, otherUser?.id, socket]);

  const confirmDeleteMessage = (messageId: string) => {
    Alert.alert('Mesajı sil', 'Bu mesajı silmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void deleteMessage(messageId) },
    ]);
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await api.patch(`/conversations/messages/${messageId}/soft-delete`);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, status: 'DELETED', content: 'Bu mesaj silindi' } : message,
        ),
      );
    } catch (error) {
      Alert.alert('Mesaj silinemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  };

  const confirmBlockUser = () => {
    if (!otherUser?.id) return;
    Alert.alert('Kullanıcıyı engelle', `${otherUser.fullName} sana mesaj gönderemeyecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Engelle', style: 'destructive', onPress: () => void blockUser() },
    ]);
  };

  const blockUser = async () => {
    if (!otherUser?.id) return;
    setActionLoading(true);
    try {
      await api.post(`/user-blocks/${otherUser.id}`, {});
      setBlockStatus({ isBlocked: true, blockedByMe: true, blockedByThem: false });
    } catch (error) {
      Alert.alert('Engelleme başarısız', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    } finally {
      setActionLoading(false);
    }
  };

  const unblockUser = async () => {
    if (!otherUser?.id) return;
    setActionLoading(true);
    try {
      await api.delete(`/user-blocks/${otherUser.id}`);
      setBlockStatus(defaultBlockStatus);
    } catch (error) {
      Alert.alert('Engel kaldırılamadı', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    } finally {
      setActionLoading(false);
    }
  };

  const sendMessage = () => {
    if (blockStatus.isBlocked) {
      Alert.alert('Mesaj gönderilemedi', getBlockedMessage(blockStatus));
      return;
    }
    if (!socket || !isConnected || !id || !inputValue.trim()) return;
    socket.emit('sendMessage', {
      conversationId: id,
      content: inputValue.trim(),
    });
    setInputValue('');
  };

  if (loading) return <LoadingState label="Sohbet yükleniyor..." />;

  if (loadError) {
    return <ErrorState title="Sohbet açılamadı" description={loadError} onRetry={() => loadScreen({ withLoading: true })} />;
  }

  const canSend = !!socket && isConnected && !!id && !!inputValue.trim() && !blockStatus.isBlocked;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.status}>
        <View style={styles.statusTextWrap}>
          <Text style={[styles.statusText, isConnected && styles.statusOnline]}>{isConnected ? 'Canlı bağlantı açık' : 'Bağlantı bekleniyor'}</Text>
          {otherUser ? <Text style={styles.otherName}>{otherUser.fullName}</Text> : null}
        </View>
        {otherUser ? (
          blockStatus.blockedByMe ? (
            <Pressable style={styles.headerAction} disabled={actionLoading} onPress={unblockUser}>
              <ShieldCheck color={colors.success} size={16} />
              <Text style={styles.headerActionText}>Engeli Kaldır</Text>
            </Pressable>
          ) : !blockStatus.blockedByThem ? (
            <Pressable style={styles.headerAction} disabled={actionLoading} onPress={confirmBlockUser}>
              <Ban color={colors.danger} size={16} />
              <Text style={styles.headerActionText}>Engelle</Text>
            </Pressable>
          ) : null
        ) : null}
      </View>

      {blockStatus.isBlocked ? (
        <View style={styles.blockBanner}>
          <Ban color={colors.danger} size={18} />
          <Text style={styles.blockText}>{getBlockedMessage(blockStatus)}</Text>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isMine = item.senderUserId === user?.id;
          const deleted = item.status === 'DELETED';
          return (
            <View style={[styles.messageRow, isMine ? styles.mineRow : styles.theirRow]}>
              {!isMine && item.sender?.fullName ? <Text style={styles.sender}>{item.sender.fullName}</Text> : null}
              <Pressable
                disabled={!isMine || deleted}
                onLongPress={() => confirmDeleteMessage(item.id)}
                style={[styles.bubble, isMine ? styles.mineBubble : styles.theirBubble, deleted && styles.deletedBubble]}
              >
                <Text style={[styles.messageText, isMine && styles.mineText, deleted && styles.deletedText]}>
                  {deleted ? 'Bu mesaj silindi' : item.content}
                </Text>
              </Pressable>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={blockStatus.isBlocked ? 'Bu sohbet engellendi' : isConnected ? 'Mesaj yaz...' : 'Bağlantı bekleniyor...'}
          placeholderTextColor="#a79d94"
          style={styles.input}
          editable={!blockStatus.isBlocked}
          multiline
        />
        <Pressable style={[styles.sendButton, !canSend && styles.sendButtonDisabled]} onPress={sendMessage} disabled={!canSend}>
          <Send color="#fff" size={20} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function getBlockedMessage(blockStatus: BlockStatus) {
  if (blockStatus.blockedByMe) {
    return 'Bu kullanıcıyı engelledin. Mesaj göndermek için engeli kaldır.';
  }
  if (blockStatus.blockedByThem) {
    return 'Bu kullanıcı tarafından engellendin. Bu sohbette mesaj gönderemezsin.';
  }
  return 'Bu kullanıcıyla iletişim engellenmiştir.';
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusTextWrap: { flex: 1 },
  statusText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  statusOnline: { color: colors.success },
  otherName: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: 2 },
  headerAction: {
    alignItems: 'center',
    backgroundColor: '#fff4ed',
    borderColor: '#ffd2b8',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  headerActionText: { color: colors.primaryDark, fontSize: 12, fontWeight: '900' },
  blockBanner: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 14,
  },
  blockText: { color: colors.danger, flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 18 },
  list: { gap: 10, padding: 16, paddingBottom: 24 },
  messageRow: { maxWidth: '82%' },
  mineRow: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirRow: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  sender: { color: colors.muted, fontSize: 11, fontWeight: '800', marginBottom: 3 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  mineBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 5 },
  theirBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 5, borderColor: colors.line, borderWidth: 1 },
  deletedBubble: { backgroundColor: '#eee8e1' },
  messageText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  mineText: { color: '#fff' },
  deletedText: { color: colors.muted, fontStyle: 'italic' },
  time: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 4 },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  input: {
    backgroundColor: '#fbf7f3',
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    maxHeight: 120,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  sendButtonDisabled: { opacity: 0.45 },
});
