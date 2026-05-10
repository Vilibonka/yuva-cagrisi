import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LogIn, MessageSquare, Plus, User } from 'lucide-react-native';

import { CitySelect } from '@/components/CitySelect';
import { Button, EmptyState, ErrorState, LoadingState, colors } from '@/components/Design';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { speciesLabels } from '@/lib/labels';
import { PaginatedResponse, PetPost, SavedPost, Species } from '@/types';

const PAGE_SIZE = 12;

const speciesOptions: { value: Species | ''; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'DOG', label: speciesLabels.DOG },
  { value: 'CAT', label: speciesLabels.CAT },
  { value: 'BIRD', label: speciesLabels.BIRD },
  { value: 'RABBIT', label: speciesLabels.RABBIT },
  { value: 'OTHER', label: speciesLabels.OTHER },
];

export default function HomeScreen() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PetPost[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [city, setCity] = useState('');
  const [species, setSpecies] = useState<Species | ''>('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (city.trim()) params.append('city', city.trim());
    if (species) params.append('species', species);
    return params.toString();
  }, [city, species]);

  const loadPosts = useCallback(
    async (nextPage = 1, append = false) => {
      const params = new URLSearchParams(query);
      params.set('page', String(nextPage));
      params.set('limit', String(PAGE_SIZE));

      const { data } = await api.get<PetPost[] | PaginatedResponse<PetPost>>(`/pet-posts?${params.toString()}`);
      const nextPosts = Array.isArray(data) ? data : data.data;
      const nextMeta = Array.isArray(data) ? null : data.meta;

      setPosts((current) => (append ? mergePosts(current, nextPosts) : nextPosts));
      setPage(nextMeta?.page || nextPage);
      setHasNextPage(nextMeta?.hasNextPage || false);
    },
    [query],
  );

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }

    const { data } = await api.get<SavedPost[]>('/users/me/saved-posts');
    setFavoriteIds(new Set(data.map((item) => item.postId)));
  }, [isAuthenticated]);

  const loadScreen = useCallback(
    async ({ withLoading = false }: { withLoading?: boolean } = {}) => {
      if (withLoading) setLoading(true);
      setLoadError(null);
      try {
        await Promise.all([loadPosts(1, false), loadFavorites()]);
      } catch (error) {
        setLoadError(getApiErrorMessage(error, 'İlanlar yüklenemedi. Lütfen tekrar dene.'));
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [loadFavorites, loadPosts],
  );

  useEffect(() => {
    void loadScreen({ withLoading: true });
  }, [loadScreen]);

  const refresh = async () => {
    setRefreshing(true);
    await loadScreen();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loading || loadingMore || refreshing || !hasNextPage) return;

    setLoadingMore(true);
    try {
      await loadPosts(page + 1, true);
    } catch (error) {
      Alert.alert('İlanlar yüklenemedi', getApiErrorMessage(error, 'Daha fazla ilan yüklenemedi. Lütfen tekrar dene.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFavorite = async (postId: string) => {
    if (!isAuthenticated) {
      router.push({ pathname: '/login', params: { redirectTo: '/' } });
      return;
    }

    const { data } = await api.post(`/users/me/saved-posts/${postId}`);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (data.saved) next.add(postId);
      else next.delete(postId);
      return next;
    });
  };

  if (authLoading || loading) {
    return <LoadingState label="İlanlar hazırlanıyor..." />;
  }

  if (loadError) {
    return <ErrorState title="İlanlar yüklenemedi" description={loadError} onRetry={() => loadScreen({ withLoading: true })} />;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Bir Yuva Bir Dost</Text>
          <Text style={styles.title}>Yuva arayan dostları keşfet</Text>
          <Text style={styles.subtitle}>Sokakta bulunan, geçici yuva arayan veya sahiplendirilecek canları tek yerden takip et.</Text>

          <View style={styles.actions}>
            {isAuthenticated ? (
              <>
                <Button title="İlan Ver" icon={<Plus color="#fff" size={18} />} onPress={() => router.push('/create')} />
                <Pressable style={styles.iconButton} onPress={() => router.push('/messages')}>
                  <MessageSquare color={colors.primaryDark} size={21} />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => router.push('/profile')}>
                  <User color={colors.primaryDark} size={21} />
                </Pressable>
              </>
            ) : (
              <>
                <Button title="Giriş Yap" icon={<LogIn color="#fff" size={18} />} onPress={() => router.push({ pathname: '/login', params: { redirectTo: '/' } })} />
                <Button title="Kayıt Ol" variant="secondary" onPress={() => router.push({ pathname: '/register', params: { redirectTo: '/' } })} />
              </>
            )}
          </View>

          {isAuthenticated ? <Text style={styles.welcome}>Merhaba, {user?.fullName?.split(' ')[0]}</Text> : null}

          <CitySelect label="Şehir" value={city} onChange={setCity} allowEmpty emptyLabel="Tüm şehirler" placeholder="Şehre göre filtrele" />

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={speciesOptions}
            keyExtractor={(item) => item.value || 'all'}
            contentContainerStyle={styles.filters}
            renderItem={({ item }) => {
              const active = item.value === species;
              return (
                <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setSpecies(item.value)}>
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      }
      ListEmptyComponent={<EmptyState title="İlan bulunamadı" description="Filtreleri değiştirerek tekrar deneyebilirsin." />}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : null}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          isFavorite={favoriteIds.has(item.id)}
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
          onToggleFavorite={() => toggleFavorite(item.id)}
        />
      )}
    />
  );
}

function mergePosts(current: PetPost[], nextPosts: PetPost[]) {
  const seen = new Set(current.map((post) => post.id));
  return [...current, ...nextPosts.filter((post) => !seen.has(post.id))];
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  header: { gap: 14, marginBottom: 16 },
  eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900', lineHeight: 36 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#fff4ed',
    borderColor: '#ffd2b8',
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  welcome: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  filters: { gap: 8, paddingRight: 16 },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  footerLoader: { paddingVertical: 20 },
});
