import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';

import { LoadingState, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { formatTime } from '@/lib/labels';
import { Message } from '@/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket(!!id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<Message[]>(`/conversations/${id}/messages`);
    setMessages(data);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => Alert.alert('Sohbet açılamadı', error?.response?.data?.message || 'Lütfen tekrar dene.'))
      .finally(() => setLoading(false));
  }, [load]);

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

    socket.on('newMessage', onMessage);
    return () => {
      socket.off('newMessage', onMessage);
    };
  }, [id, socket]);

  const sendMessage = () => {
    if (!socket || !id || !inputValue.trim()) return;
    socket.emit('sendMessage', {
      conversationId: id,
      content: inputValue.trim(),
    });
    setInputValue('');
  };

  if (loading) return <LoadingState label="Sohbet yükleniyor..." />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.status}>
        <Text style={[styles.statusText, isConnected && styles.statusOnline]}>{isConnected ? 'Canlı bağlantı açık' : 'Bağlantı bekleniyor'}</Text>
      </View>

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
              <View style={[styles.bubble, isMine ? styles.mineBubble : styles.theirBubble, deleted && styles.deletedBubble]}>
                <Text style={[styles.messageText, isMine && styles.mineText, deleted && styles.deletedText]}>
                  {deleted ? 'Bu mesaj silindi' : item.content}
                </Text>
              </View>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#a79d94"
          style={styles.input}
          multiline
        />
        <Pressable style={[styles.sendButton, !inputValue.trim() && styles.sendButtonDisabled]} onPress={sendMessage} disabled={!inputValue.trim()}>
          <Send color="#fff" size={20} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  status: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  statusText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  statusOnline: { color: colors.success },
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
