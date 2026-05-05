import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import { Badge, EmptyState, LoadingState, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatDate, requestStatusLabels } from '@/lib/labels';
import { AdoptionRequest } from '@/types';

export default function RequestsScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    const { data } = await api.get<AdoptionRequest[]>('/adoption-requests/my');
    setRequests(data);
  }, [isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => Alert.alert('Başvurular açılamadı', error?.response?.data?.message || 'Lütfen tekrar dene.'))
      .finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  };

  if (isLoading || loading) return <LoadingState label="Başvurular yükleniyor..." />;

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListEmptyComponent={<EmptyState title="Henüz başvuru yok" description="İlan detayından sahiplenme başvurusu gönderebilirsin." />}
      renderItem={({ item }) => {
        const tone = item.status === 'APPROVED' ? 'green' : item.status === 'REJECTED' ? 'red' : 'orange';
        return (
          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.postId } })}>
            <Badge label={requestStatusLabels[item.status]} tone={tone} />
            <Text style={styles.title}>{item.post?.title || 'İlan'}</Text>
            <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
            <Text numberOfLines={3} style={styles.message}>
              {item.message}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    gap: 9,
    padding: 16,
  },
  title: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  message: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});
