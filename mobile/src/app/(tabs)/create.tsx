import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { appendListingFormData, ListingForm, ListingFormValues } from '@/components/ListingForm';
import { LoadingState } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';

export default function CreatePostScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace({ pathname: '/login', params: { redirectTo: '/create' } });
    }
  }, [isAuthenticated, isLoading]);

  const submit = async (values: ListingFormValues) => {
    const payload = new FormData();
    appendListingFormData(payload, values);

    try {
      await api.post('/pet-posts', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('İlan yayınlandı', 'Dostumuz artık listede görünüyor.');
      router.replace('/');
    } catch (error) {
      Alert.alert('İlan oluşturulamadı', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  };

  if (isLoading || !isAuthenticated) {
    return <LoadingState label="Hesap kontrol ediliyor..." />;
  }

  return (
    <ListingForm
      title="Yeni ilan oluştur"
      subtitle="Net fotoğraf ve iyi açıklama, doğru yuvaya ulaşma şansını artırır."
      submitLabel="İlanı Yayınla"
      onSubmit={submit}
    />
  );
}
