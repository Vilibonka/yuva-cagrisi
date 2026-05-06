import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, MessageCircle, Send } from 'lucide-react-native';
import { z } from 'zod';

import { Badge, Button, ErrorState, Field, LoadingState, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { buildImageUrl } from '@/lib/config';
import { getApiErrorMessage } from '@/lib/errors';
import { genderLabels, postTypeLabels, requestStatusLabels, sizeLabels, speciesLabels } from '@/lib/labels';
import { emptyToUndefined, optionalPhoneField, requiredTrimmed } from '@/lib/validation';
import { AdoptionRequest, PetPost, SavedPost } from '@/types';

const adoptionRequestSchema = z.object({
  message: requiredTrimmed('Başvuru mesajı', 1000).refine((value) => value.trim().length >= 10, 'Başvuru mesajı en az 10 karakter olmalı.'),
  contactPhone: optionalPhoneField(),
});

type AdoptionRequestFormValues = z.infer<typeof adoptionRequestSchema>;

const adoptionRequestDefaults: AdoptionRequestFormValues = {
  message: '',
  contactPhone: '',
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<PetPost | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [myRequest, setMyRequest] = useState<AdoptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdoptionRequestFormValues>({
    defaultValues: adoptionRequestDefaults,
    mode: 'onTouched',
    resolver: zodResolver(adoptionRequestSchema),
  });

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: postData }] = await Promise.all([api.get<PetPost>(`/pet-posts/${id}`)]);
    setPost(postData);
    setIsFavorite(false);
    setMyRequest(null);

    if (isAuthenticated) {
      const [favoriteRes, requestRes] = await Promise.all([
        api.get<SavedPost[]>('/users/me/saved-posts'),
        api.get<AdoptionRequest[]>('/adoption-requests/my', { params: { postId: id } }),
      ]);
      setIsFavorite(favoriteRes.data.some((item) => item.postId === id));
      setMyRequest(requestRes.data[0] || null);
    }
  }, [id, isAuthenticated]);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await load();
    } catch (error) {
      setPost(null);
      setLoadError(getApiErrorMessage(error, 'İlan detayı yüklenemedi. Lütfen tekrar dene.'));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  const toggleFavorite = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const { data } = await api.post(`/users/me/saved-posts/${post.id}`);
      setIsFavorite(data.saved);
    } catch (error) {
      Alert.alert('Favori güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  };

  const submitRequest = handleSubmit(async (values) => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const { data } = await api.post<AdoptionRequest>('/adoption-requests', {
        postId: post.id,
        message: values.message.trim(),
        contactPhone: emptyToUndefined(values.contactPhone) || user?.contactPhone || undefined,
      });
      setMyRequest(data);
      reset(adoptionRequestDefaults);
      Alert.alert('Başvuru gönderildi', 'İlan sahibi başvurunu inceleyebilecek.');
    } catch (error) {
      Alert.alert('Başvuru gönderilemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  });

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
    } catch (error) {
      Alert.alert('Sohbet açılamadı', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  };

  if (loading) {
    return <LoadingState label="İlan detayı açılıyor..." />;
  }

  if (loadError) {
    return <ErrorState title="İlan açılamadı" description={loadError} onRetry={fetchPost} />;
  }

  if (!post) {
    return <ErrorState title="İlan bulunamadı" description="Bu ilan kaldırılmış veya erişilemiyor olabilir." onRetry={fetchPost} />;
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
              <Controller
                control={control}
                name="message"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    label="Başvuru mesajı"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    placeholder="Neden sahiplenmek istiyorsun? Yaşam koşullarını kısaca anlat."
                    error={errors.message?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="contactPhone"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    label="İletişim telefonu"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    placeholder={user?.contactPhone || 'Opsiyonel'}
                    error={errors.contactPhone?.message}
                  />
                )}
              />
              <Button title="Başvuruyu Gönder" loading={isSubmitting} icon={<Send color="#fff" size={18} />} onPress={submitRequest} />
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
