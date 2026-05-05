import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, MessageCircle, Send } from 'lucide-react-native';

import { Badge, Button, Field, LoadingState, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { buildImageUrl } from '@/lib/config';
import { genderLabels, postTypeLabels, requestStatusLabels, sizeLabels, speciesLabels } from '@/lib/labels';
import { AdoptionRequest, PetPost, SavedPost } from '@/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<PetPost | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [myRequest, setMyRequest] = useState<AdoptionRequest | null>(null);
  const [message, setMessage] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: postData }] = await Promise.all([api.get<PetPost>(`/pet-posts/${id}`)]);
    setPost(postData);

    if (isAuthenticated) {
      const [favoriteRes, requestRes] = await Promise.all([
        api.get<SavedPost[]>('/users/me/saved-posts'),
        api.get<AdoptionRequest[]>('/adoption-requests/my', { params: { postId: id } }),
      ]);
      setIsFavorite(favoriteRes.data.some((item) => item.postId === id));
      setMyRequest(requestRes.data[0] || null);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => Alert.alert('İlan açılamadı', error?.response?.data?.message || 'Lütfen tekrar dene.'))
      .finally(() => setLoading(false));
  }, [load]);

  const toggleFavorite = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const { data } = await api.post(`/users/me/saved-posts/${post.id}`);
    setIsFavorite(data.saved);
  };

  const submitRequest = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (message.trim().length < 10) {
      Alert.alert('Biraz daha bilgi', 'Başvuru mesajı en az 10 karakter olmalı.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post<AdoptionRequest>('/adoption-requests', {
        postId: post.id,
        message: message.trim(),
        contactPhone: contactPhone.trim() || user?.contactPhone || undefined,
      });
      setMyRequest(data);
      setMessage('');
      Alert.alert('Başvuru gönderildi', 'İlan sahibi başvurunu inceleyebilecek.');
    } catch (error: any) {
      Alert.alert('Başvuru gönderilemedi', error?.response?.data?.message || 'Lütfen tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  const startConversation = async () => {
    if (!post?.owner?.id) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const { data } = await api.post('/conversations', {
        targetUserId: post.owner.id,
        postId: post.id,
      });
      router.push({ pathname: '/messages/[id]', params: { id: data.id } });
    } catch (error: any) {
      Alert.alert('Sohbet açılamadı', error?.response?.data?.message || 'Lütfen tekrar dene.');
    }
  };

  if (loading || !post) {
    return <LoadingState label="İlan detayı açılıyor..." />;
  }

  const images = post.images || [];
  const isOwner = isAuthenticated && user?.id === (post.owner?.id || post.ownerUserId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
        {images.length > 0 ? (
          images.map((image, index) => {
            const imageUrl = buildImageUrl(image.imageUrl);
            return imageUrl ? <Image key={`${image.imageUrl}-${index}`} source={{ uri: imageUrl }} style={styles.photo} /> : null;
          })
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>Görsel yok</Text>
          </View>
        )}
      </ScrollView>

      <Section>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Badge label={postTypeLabels[post.postType]} tone="orange" />
            <Text style={styles.title}>{post.title}</Text>
          </View>
          <Pressable style={[styles.favorite, isFavorite && styles.favoriteActive]} onPress={toggleFavorite}>
            <Heart color={isFavorite ? '#fff' : colors.danger} fill={isFavorite ? '#fff' : 'transparent'} size={22} />
          </Pressable>
        </View>
        <Text style={styles.description}>{post.description}</Text>
        <View style={styles.metaGrid}>
          <Meta label="Şehir" value={post.city} />
          <Meta label="Tür" value={post.pet?.species ? speciesLabels[post.pet.species] : '-'} />
          <Meta label="Cinsiyet" value={post.pet?.gender ? genderLabels[post.pet.gender] : '-'} />
          <Meta label="Boyut" value={post.pet?.size ? sizeLabels[post.pet.size] : '-'} />
          <Meta label="Yaş" value={post.pet?.estimatedAgeMonths ? `${post.pet.estimatedAgeMonths} ay` : '-'} />
          <Meta label="Irk" value={post.pet?.breed || '-'} />
        </View>
        {post.pet?.healthSummary ? <Text style={styles.note}>Sağlık: {post.pet.healthSummary}</Text> : null}
        {post.pet?.temperament ? <Text style={styles.note}>Karakter: {post.pet.temperament}</Text> : null}
      </Section>

      <Section title="İlan Sahibi">
        <Text style={styles.ownerName}>{post.owner?.fullName || 'İlan sahibi'}</Text>
        <Text style={styles.ownerMeta}>{post.owner?.email || ''}</Text>
        {!isOwner ? (
          <Button title="Mesaj Gönder" icon={<MessageCircle color="#fff" size={18} />} onPress={startConversation} />
        ) : (
          <Badge label="Bu ilan sana ait" tone="blue" />
        )}
      </Section>

      {!isOwner ? (
        <Section title="Sahiplenme Başvurusu">
          {!isAuthenticated ? (
            <>
              <Text style={styles.description}>Başvuru yapmak için önce giriş yapmalısın.</Text>
              <Button title="Giriş Yap" onPress={() => router.push('/login')} />
            </>
          ) : myRequest ? (
            <>
              <Badge label={requestStatusLabels[myRequest.status]} tone={myRequest.status === 'APPROVED' ? 'green' : myRequest.status === 'REJECTED' ? 'red' : 'orange'} />
              <Text style={styles.description}>Bu ilana daha önce başvuru yaptın.</Text>
            </>
          ) : (
            <>
              <Field label="Başvuru mesajı" value={message} onChangeText={setMessage} multiline placeholder="Neden sahiplenmek istiyorsun? Yaşam koşullarını kısaca anlat." />
              <Field label="İletişim telefonu" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" placeholder={user?.contactPhone || 'Opsiyonel'} />
              <Button title="Başvuruyu Gönder" loading={submitting} icon={<Send color="#fff" size={18} />} onPress={submitRequest} />
            </>
          )}
        </Section>
      ) : null}
    </ScrollView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 32 },
  gallery: { gap: 12, paddingRight: 16 },
  photo: { backgroundColor: '#efe7df', borderRadius: 20, height: 280, width: 300 },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#efe7df',
    borderRadius: 20,
    height: 240,
    justifyContent: 'center',
    width: 300,
  },
  photoPlaceholderText: { color: colors.muted, fontWeight: '800' },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  titleBlock: { flex: 1, gap: 10 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '900', lineHeight: 31 },
  favorite: {
    alignItems: 'center',
    backgroundColor: '#fff4ed',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  favoriteActive: { backgroundColor: colors.danger },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: {
    backgroundColor: '#fbf7f3',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: '47%',
    padding: 12,
  },
  metaLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  metaValue: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 3 },
  note: { color: colors.ink, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  ownerName: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  ownerMeta: { color: colors.muted, fontSize: 13 },
});
