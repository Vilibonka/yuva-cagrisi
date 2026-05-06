import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { EmptyState, ErrorState, LoadingState, colors } from '@/components/Design';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { SavedPost } from '@/types';

export default function FavoritesScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    const { data } = await api.get<SavedPost[]>('/users/me/saved-posts');
    setItems(data);
  }, [isAuthenticated]);

  const loadScreen = useCallback(
    async ({ withLoading = false }: { withLoading?: boolean } = {}) => {
      if (withLoading) setLoading(true);
      setLoadError(null);
      try {
        await load();
      } catch (error) {
        setLoadError(getApiErrorMessage(error, 'Favoriler yüklenemedi. Lütfen tekrar dene.'));
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

  const toggleFavorite = async (postId: string) => {
    try {
      await api.post(`/users/me/saved-posts/${postId}`);
      setItems((current) => current.filter((item) => item.postId !== postId));
    } catch (error) {
      Alert.alert('Favori güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  };

  if (isLoading || loading) return <LoadingState label="Favoriler yükleniyor..." />;

  if (loadError) {
    return <ErrorState title="Favoriler açılamadı" description={loadError} onRetry={() => loadScreen({ withLoading: true })} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListEmptyComponent={<EmptyState title="Henüz favori yok" description="Beğendiğin ilanları kalp ikonuyla buraya ekleyebilirsin." />}
      renderItem={({ item }) => (
        <PostCard
          post={item.post}
          isFavorite
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.postId } })}
          onToggleFavorite={() => toggleFavorite(item.postId)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
});
