import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { EmptyState, ErrorState, LoadingState, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/labels';
import { Conversation } from '@/types';

export default function MessagesScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace({ pathname: '/login', params: { redirectTo: '/messages' } });
  }, [isAuthenticated, isLoading]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    const { data } = await api.get<Conversation[]>('/conversations');
    setConversations(data);
  }, [isAuthenticated]);

  const loadScreen = useCallback(
    async ({ withLoading = false }: { withLoading?: boolean } = {}) => {
      if (withLoading) setLoading(true);
      setLoadError(null);
      try {
        await load();
      } catch (error) {
        setLoadError(getApiErrorMessage(error, 'Mesajlar yüklenemedi. Lütfen tekrar dene.'));
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void loadScreen({ withLoading: true });
  }, [loadScreen]);

  const refresh = async () => {
    setRefreshing(true);
    await loadScreen();
    setRefreshing(false);
  };

  if (isLoading || loading) return <LoadingState label="Mesajlar yükleniyor..." />;

  if (loadError) {
    return <ErrorState title="Mesajlar açılamadı" description={loadError} onRetry={() => loadScreen({ withLoading: true })} />;
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListEmptyComponent={<EmptyState title="Henüz sohbet yok" description="İlan detayından ilan sahibiyle sohbet başlatabilirsin." />}
      renderItem={({ item }) => {
        const other = item.participants?.find((participant) => participant.userId !== user?.id)?.user;
        const lastMessage = item.messages?.[0];
        return (
          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/messages/[id]', params: { id: item.id } })}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{other?.fullName?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.name}>{other?.fullName || 'Sohbet'}</Text>
              {item.post?.title ? <Text numberOfLines={1} style={styles.postTitle}>{item.post.title}</Text> : null}
              <Text numberOfLines={1} style={styles.preview}>
                {lastMessage?.status === 'DELETED' ? 'Bu mesaj silindi' : lastMessage?.content || 'Henüz mesaj yok'}
              </Text>
            </View>
            <Text style={styles.date}>{formatDate(item.lastMessageAt || item.createdAt)}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, padding: 16, paddingBottom: 32 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#fff4ed',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: { color: colors.primaryDark, fontSize: 18, fontWeight: '900' },
  content: { flex: 1, gap: 3 },
  name: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  postTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  preview: { color: colors.muted, fontSize: 13 },
  date: { color: colors.muted, fontSize: 11, fontWeight: '700' },
});
