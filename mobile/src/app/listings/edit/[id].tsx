import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  appendListingFormData,
  ListingForm,
  listingValuesFromPost,
  ListingFormValues,
} from '@/components/ListingForm';
import { ErrorState, LoadingState } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { PetPost } from '@/types';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [post, setPost] = useState<PetPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace({ pathname: '/login', params: { redirectTo: id ? `/listings/edit/${id}` : '/my-listings' } });
    }
  }, [id, isAuthenticated, isLoading]);

  const load = useCallback(async () => {
    if (!id || !isAuthenticated) return;

    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get<PetPost>(`/pet-posts/${id}`);
      setPost(data);
    } catch (error) {
      setPost(null);
      setLoadError(getApiErrorMessage(error, 'İlan düzenleme bilgileri yüklenemedi. Lütfen tekrar dene.'));
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const initialValues = useMemo(() => (post ? listingValuesFromPost(post) : undefined), [post]);
  const ownerId = post?.owner?.id || post?.ownerUserId;
  const isOwner = !!user?.id && !!ownerId && user.id === ownerId;

  const submit = async (values: ListingFormValues) => {
    if (!id) return;

    const payload = new FormData();
    appendListingFormData(payload, values, { includeKeptImages: true });

    try {
      await api.patch(`/pet-posts/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('İlan güncellendi', 'Değişikliklerin kaydedildi.');
      router.replace({ pathname: '/post/[id]', params: { id } });
    } catch (error) {
      Alert.alert('İlan güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  };

  if (isLoading || loading) {
    return <LoadingState label="İlan hazırlanıyor..." />;
  }

  if (loadError) {
    return <ErrorState title="İlan düzenlenemedi" description={loadError} onRetry={load} />;
  }

  if (!post || !initialValues) {
    return <ErrorState title="İlan bulunamadı" description="Bu ilana erişilemiyor olabilir." onRetry={load} />;
  }

  if (!isOwner) {
    return <ErrorState title="Yetkin yok" description="Bu ilanı yalnızca ilan sahibi düzenleyebilir." />;
  }

  return (
    <ListingForm
      title="İlanı düzenle"
      subtitle="Bilgileri güncelle, görselleri koru veya yenilerini ekle."
      submitLabel="Değişiklikleri Kaydet"
      initialValues={initialValues}
      existingImages={post.images || []}
      onSubmit={submit}
    />
  );
}
