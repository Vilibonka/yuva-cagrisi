import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import { z } from 'zod';

import { Button, Field, LoadingState, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { emptyToUndefined, optionalTrimmedText, requiredTrimmed } from '@/lib/validation';
import { AnimalSize, Gender, PostType, Species } from '@/types';

const speciesOptions = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'] as const satisfies readonly Species[];
const genderOptions = ['UNKNOWN', 'MALE', 'FEMALE'] as const satisfies readonly Gender[];
const sizeOptions = ['SMALL', 'MEDIUM', 'LARGE'] as const satisfies readonly AnimalSize[];
const postTypeOptions = ['REHOME_OWNED_PET', 'FOUND_STRAY', 'TEMP_HOME_NEEDED'] as const satisfies readonly PostType[];

const labels: Record<string, string> = {
  DOG: 'Köpek',
  CAT: 'Kedi',
  BIRD: 'Kuş',
  RABBIT: 'Tavşan',
  OTHER: 'Diğer',
  UNKNOWN: 'Bilinmiyor',
  MALE: 'Erkek',
  FEMALE: 'Dişi',
  SMALL: 'Küçük',
  MEDIUM: 'Orta',
  LARGE: 'Büyük',
  REHOME_OWNED_PET: 'Sahiplendirme',
  FOUND_STRAY: 'Sokakta Bulunan',
  TEMP_HOME_NEEDED: 'Geçici Yuva',
};

const imageAssetSchema = z.custom<ImagePicker.ImagePickerAsset>(
  (value) => typeof value === 'object' && value !== null && 'uri' in value && typeof (value as ImagePicker.ImagePickerAsset).uri === 'string',
  { message: 'Geçerli bir fotoğraf seç.' },
);

const createPostSchema = z.object({
  title: requiredTrimmed('Başlık', 120),
  description: requiredTrimmed('Açıklama', 2000),
  city: requiredTrimmed('Şehir', 100),
  breed: optionalTrimmedText('Irk', 100),
  estimatedAgeMonths: z.string().refine((value) => !value.trim() || /^\d+$/.test(value.trim()), 'Yaş negatif olmayan tam sayı olmalı.'),
  healthSummary: optionalTrimmedText('Sağlık özeti', 1000),
  temperament: optionalTrimmedText('Karakter', 1000),
  species: z.enum(speciesOptions),
  gender: z.enum(genderOptions),
  size: z.enum(sizeOptions),
  postType: z.enum(postTypeOptions),
  images: z.array(imageAssetSchema).min(1, 'En az bir fotoğraf eklemelisin.').max(5, 'En fazla 5 fotoğraf ekleyebilirsin.'),
});

type CreatePostFormValues = z.infer<typeof createPostSchema>;

const createPostDefaults: CreatePostFormValues = {
  title: '',
  description: '',
  city: '',
  breed: '',
  estimatedAgeMonths: '',
  healthSummary: '',
  temperament: '',
  species: 'DOG',
  gender: 'UNKNOWN',
  size: 'MEDIUM',
  postType: 'REHOME_OWNED_PET',
  images: [],
};

export default function CreatePostScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isPickingImages, setIsPickingImages] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostFormValues>({
    defaultValues: createPostDefaults,
    mode: 'onTouched',
    resolver: zodResolver(createPostSchema),
  });
  const images = watch('images');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  const pickImages = async () => {
    if (images.length >= 5 || isSubmitting || isPickingImages) return;

    setIsPickingImages(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin gerekli', 'Fotoğraf seçebilmek için medya izni vermelisin.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        selectionLimit: Math.max(1, 5 - images.length),
      });

      if (!result.canceled) {
        const existingUris = new Set(images.map((image) => image.uri));
        const uniqueAssets = result.assets.filter((asset) => asset.uri && !existingUris.has(asset.uri));
        const nextImages = [...images, ...uniqueAssets].slice(0, 5);

        if (uniqueAssets.length < result.assets.length) {
          Alert.alert('Tekrarlanan fotoğraf', 'Aynı fotoğraf ikinci kez eklenmedi.');
        }

        setValue('images', nextImages, { shouldDirty: true, shouldValidate: true });
      }
    } finally {
      setIsPickingImages(false);
    }
  };

  const removeImage = (uri: string) => {
    setValue(
      'images',
      images.filter((image) => image.uri !== uri),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const submit = handleSubmit(async (values) => {
    const payload = new FormData();
    payload.append('species', values.species);
    payload.append('gender', values.gender);
    payload.append('size', values.size);
    payload.append('postType', values.postType);
    payload.append('title', values.title.trim());
    payload.append('description', values.description.trim());
    payload.append('city', values.city.trim());

    const breedValue = emptyToUndefined(values.breed);
    const ageValue = emptyToUndefined(values.estimatedAgeMonths);
    const healthValue = emptyToUndefined(values.healthSummary);
    const temperamentValue = emptyToUndefined(values.temperament);

    if (breedValue) payload.append('breed', breedValue);
    if (ageValue) payload.append('estimatedAgeMonths', ageValue);
    if (healthValue) payload.append('healthSummary', healthValue);
    if (temperamentValue) payload.append('temperament', temperamentValue);

    values.images.forEach((image, index) => {
      const fallbackName = `bir-yuva-bir-dost-${Date.now()}-${index}.jpg`;
      const name = image.fileName || image.uri.split('/').pop() || fallbackName;
      payload.append('images', {
        uri: image.uri,
        name,
        type: image.mimeType || 'image/jpeg',
      } as unknown as Blob);
    });

    try {
      await api.post('/pet-posts', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      reset(createPostDefaults);
      Alert.alert('İlan yayınlandı', 'Dostumuz artık listede görünüyor.');
      router.replace('/');
    } catch (error) {
      Alert.alert('İlan oluşturulamadı', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  });

  if (isLoading || !isAuthenticated) {
    return <LoadingState label="Hesap kontrol ediliyor..." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.title}>Yeni ilan oluştur</Text>
        <Text style={styles.subtitle}>Net fotoğraf ve iyi açıklama, doğru yuvaya ulaşma şansını artırır.</Text>
      </View>

      <Section title="İlan Bilgileri">
        <Controller
          control={control}
          name="title"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              label="Başlık"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Örn. Kadıköy'de yuva arayan sakin kedi"
              error={errors.title?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field label="Şehir" value={value} onBlur={onBlur} onChangeText={onChange} placeholder="Örn. İstanbul" error={errors.city?.message} />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              label="Açıklama"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              multiline
              placeholder="Hikayesini, ihtiyaçlarını ve iletişim sürecini anlat."
              error={errors.description?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="postType"
          render={({ field: { onChange, value } }) => <ChoiceGroup value={value} options={postTypeOptions} onChange={onChange} />}
        />
      </Section>

      <Section title="Dostumuzun Bilgileri">
        <Controller
          control={control}
          name="species"
          render={({ field: { onChange, value } }) => <ChoiceGroup value={value} options={speciesOptions} onChange={onChange} />}
        />
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => <ChoiceGroup value={value} options={genderOptions} onChange={onChange} />}
        />
        <Controller
          control={control}
          name="size"
          render={({ field: { onChange, value } }) => <ChoiceGroup value={value} options={sizeOptions} onChange={onChange} />}
        />
        <Controller
          control={control}
          name="breed"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field label="Irk" value={value} onBlur={onBlur} onChangeText={onChange} placeholder="Opsiyonel" error={errors.breed?.message} />
          )}
        />
        <Controller
          control={control}
          name="estimatedAgeMonths"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              label="Tahmini yaş (ay)"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              keyboardType="number-pad"
              error={errors.estimatedAgeMonths?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="healthSummary"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              label="Sağlık özeti"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Aşılı, kısırlaştırılmış vb."
              error={errors.healthSummary?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="temperament"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              label="Karakter"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Sakin, oyuncu, çocuklarla uyumlu..."
              error={errors.temperament?.message}
            />
          )}
        />
      </Section>

      <Section title="Fotoğraflar">
        <Button
          title={images.length >= 5 ? 'Maksimum 5 fotoğraf' : 'Fotoğraf Seç'}
          variant="secondary"
          disabled={images.length >= 5 || isSubmitting}
          loading={isPickingImages}
          icon={<Camera color={colors.primaryDark} size={18} />}
          onPress={pickImages}
        />
        <Text style={styles.photoCount}>{images.length}/5 fotoğraf seçildi</Text>
        {errors.images?.message ? <Text style={styles.errorText}>{errors.images.message}</Text> : null}
        <View style={styles.previewGrid}>
          {images.map((image) => (
            <View key={image.uri} style={styles.previewWrap}>
              <Image source={{ uri: image.uri }} style={styles.preview} />
              <Pressable style={styles.remove} disabled={isSubmitting} onPress={() => removeImage(image.uri)}>
                <X color="#fff" size={16} />
              </Pressable>
            </View>
          ))}
        </View>
      </Section>

      <Button title="İlanı Yayınla" loading={isSubmitting} disabled={isPickingImages} onPress={submit} />
    </ScrollView>
  );
}

function ChoiceGroup<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return (
    <View style={styles.choiceWrap}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable key={option} style={[styles.choice, active && styles.choiceActive]} onPress={() => onChange(option)}>
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{labels[option] || option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    backgroundColor: '#fbf7f3',
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.muted, fontWeight: '800' },
  choiceTextActive: { color: '#fff' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  photoCount: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  previewWrap: { borderRadius: 14, height: 96, overflow: 'hidden', position: 'relative', width: 96 },
  preview: { height: '100%', width: '100%' },
  remove: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 28,
  },
});
