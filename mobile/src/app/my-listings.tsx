import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Clock3, Eye, Image as ImageIcon, MapPin, Pencil, PlusSquare, Users } from 'lucide-react-native';

import { Badge, Button, EmptyState, ErrorState, LoadingState, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { buildImageUrl } from '@/lib/config';
import { getApiErrorMessage } from '@/lib/errors';
import { formatDate, postStatusLabels, speciesLabels } from '@/lib/labels';
import { PetPost, PostStatus } from '@/types';

type FilterKey = 'ALL' | 'ACTIVE' | 'ADOPTED' | 'CLOSED';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Tümü' },
  { key: 'ACTIVE', label: 'Aktif' },
  { key: 'ADOPTED', label: 'Sahiplendirildi' },
  { key: 'CLOSED', label: 'Kapatıldı' },
];

export default function MyListingsScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [posts, setPosts] = useState<PetPost[]>([]);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace({ pathname: '/login', params: { redirectTo: '/my-listings' } });
    }
  }, [isAuthenticated, isLoading]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    const { data } = await api.get<PetPost[]>('/pet-posts/my');
    setPosts(data);
  }, [isAuthenticated]);

  const loadScreen = useCallback(
    async ({ withLoading = false }: { withLoading?: boolean } = {}) => {
      if (withLoading) setLoading(true);
      setLoadError(null);
      try {
        await load();
      } catch (error) {
        setLoadError(getApiErrorMessage(error, 'İlanların yüklenemedi. Lütfen tekrar dene.'));
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

  const filteredPosts = useMemo(() => {
    return filter === 'ALL' ? posts : posts.filter((post) => post.status === filter);
  }, [filter, posts]);

  const counts = useMemo<Record<FilterKey, number>>(
    () => ({
      ALL: posts.length,
      ACTIVE: posts.filter((post) => post.status === 'ACTIVE').length,
      ADOPTED: posts.filter((post) => post.status === 'ADOPTED').length,
      CLOSED: posts.filter((post) => post.status === 'CLOSED').length,
    }),
    [posts],
  );

  if (isLoading || loading) {
    return <LoadingState label="İlanların yükleniyor..." />;
  }

  if (loadError) {
    return <ErrorState title="İlanların açılamadı" description={loadError} onRetry={() => loadScreen({ withLoading: true })} />;
  }

  return (
    <FlatList
      data={filteredPosts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>İlanlarım</Text>
            <Text style={styles.subtitle}>Oluşturduğun ilanları ve gelen başvuruları buradan takip et.</Text>
          </View>
          <Button title="Yeni İlan" icon={<PlusSquare color="#fff" size={18} />} onPress={() => router.push('/create')} />
          <View style={styles.filters}>
            {filterOptions.map((option) => {
              const active = filter === option.key;
              return (
                <Pressable key={option.key} style={[styles.filter, active && styles.filterActive]} onPress={() => setFilter(option.key)}>
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{option.label}</Text>
                  <Text style={[styles.filterCount, active && styles.filterTextActive]}>{counts[option.key]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title={filter === 'ALL' ? 'Henüz ilan yok' : 'Bu durumda ilan yok'}
          description={filter === 'ALL' ? 'İlk ilanını oluşturarak bir dosta yuva bulmaya başlayabilirsin.' : 'Seçili filtreye uygun ilan bulunamadı.'}
        />
      }
      renderItem={({ item }) => <ListingCard post={item} />}
    />
  );
}

function ListingCard({ post }: { post: PetPost }) {
  const [imageFailed, setImageFailed] = useState(false);
  const primaryImage = post.images?.find((image) => image.isPrimary) || post.images?.[0];
  const imageUrl = imageFailed ? null : buildImageUrl(primaryImage?.imageUrl);
  const pendingRequests = post.adoptionRequests?.filter((request) => request.status === 'PENDING').length || 0;
  const totalRequests = post.adoptionRequests?.length || 0;
  const status = post.status || 'DRAFT';

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} onError={() => setImageFailed(true)} />
        ) : (
          <View style={styles.placeholder}>
            <ImageIcon color="#c9bdb2" size={30} />
            <Text style={styles.placeholderText}>Görsel yok</Text>
          </View>
        )}
        <View style={styles.badgeWrap}>
          <Badge label={postStatusLabels[status]} tone={getStatusTone(status)} />
        </View>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.cardTitle}>{post.title}</Text>
        <View style={styles.metaRow}>
          <MapPin color={colors.primary} size={14} />
          <Text style={styles.metaText}>{post.city || '-'}</Text>
          <Clock3 color={colors.muted} size={14} />
          <Text style={styles.metaText}>{formatDate(post.createdAt)}</Text>
        </View>
        <View style={styles.stats}>
          <Stat icon={<Users color={colors.primaryDark} size={15} />} label={`${totalRequests} başvuru`} />
          {pendingRequests > 0 ? <Stat icon={<Clock3 color={colors.primaryDark} size={15} />} label={`${pendingRequests} bekleyen`} /> : null}
          <Stat icon={<Eye color={colors.primaryDark} size={15} />} label={`${post.viewCount || 0} görüntülenme`} />
        </View>
        <Text style={styles.species}>{post.pet?.species ? speciesLabels[post.pet.species] : 'Dost'}</Text>
        <View style={styles.cardActions}>
          <Button title="Detay" variant="secondary" onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })} />
          <Button
            title="Düzenle"
            icon={<Pencil color="#fff" size={16} />}
            onPress={() => router.push(`/listings/edit/${post.id}` as never)}
          />
        </View>
      </View>
    </View>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

function getStatusTone(status: PostStatus) {
  if (status === 'ACTIVE') return 'green';
  if (status === 'ADOPTED') return 'blue';
  if (status === 'CLOSED') return 'neutral';
  if (status === 'PENDING') return 'orange';
  return 'neutral';
}

const styles = StyleSheet.create({
  list: { gap: 14, padding: 16, paddingBottom: 32 },
  header: { gap: 14, marginBottom: 4 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontWeight: '800' },
  filterCount: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  filterTextActive: { color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: { backgroundColor: '#efe7df', height: 170, position: 'relative' },
  image: { height: '100%', width: '100%' },
  placeholder: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  placeholderText: { color: '#a79d94', fontWeight: '700' },
  badgeWrap: { left: 12, position: 'absolute', top: 12 },
  body: { gap: 10, padding: 14 },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  metaRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaText: { color: colors.muted, fontSize: 12, fontWeight: '700', marginRight: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  stat: {
    alignItems: 'center',
    backgroundColor: '#fff4ed',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  species: { color: colors.ink, fontSize: 13, fontWeight: '900' },
});
