import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Camera, X } from 'lucide-react-native';
import { z } from 'zod';

import { CitySelect } from '@/components/CitySelect';
import { Button, Field, Section, colors } from '@/components/Design';
import { buildImageUrl } from '@/lib/config';
import { emptyToUndefined, optionalTrimmedText, requiredTrimmed } from '@/lib/validation';
import {
  AnimalSize,
  Gender,
  PetPost,
  PostImage,
  PostType,
  Species,
} from '@/types';

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

const listingSchema = z
  .object({
    title: requiredTrimmed('Başlık', 120),
    description: requiredTrimmed('Açıklama', 2000),
    city: requiredTrimmed('Şehir', 100),
    district: optionalTrimmedText('İlçe', 100),
    addressNote: optionalTrimmedText('Adres notu', 500),
    name: optionalTrimmedText('Dostun adı', 100),
    breed: optionalTrimmedText('Irk', 100),
    estimatedAgeMonths: z.string().refine((value) => !value.trim() || /^\d+$/.test(value.trim()), 'Yaş negatif olmayan tam sayı olmalı.'),
    healthSummary: optionalTrimmedText('Sağlık özeti', 1000),
    temperament: optionalTrimmedText('Karakter', 1000),
    color: optionalTrimmedText('Renk', 100),
    vaccinationSummary: optionalTrimmedText('Aşı bilgisi', 1000),
    specialNeedsNote: optionalTrimmedText('Özel ihtiyaç notu', 1000),
    species: z.enum(speciesOptions),
    gender: z.enum(genderOptions),
    size: z.enum(sizeOptions),
    postType: z.enum(postTypeOptions),
    isVaccinated: z.boolean(),
    isNeutered: z.boolean(),
    isUrgent: z.boolean(),
    images: z.array(imageAssetSchema),
    keptImages: z.array(z.string()),
  })
  .superRefine((values, context) => {
    const imageCount = values.images.length + values.keptImages.length;
    if (imageCount < 1) {
      context.addIssue({
        code: 'custom',
        message: 'En az bir fotoğraf eklemelisin.',
        path: ['images'],
      });
    }
    if (imageCount > 5) {
      context.addIssue({
        code: 'custom',
        message: 'En fazla 5 fotoğraf ekleyebilirsin.',
        path: ['images'],
      });
    }
  });

export type ListingFormValues = z.infer<typeof listingSchema>;

export const listingDefaults: ListingFormValues = {
  title: '',
  description: '',
  city: '',
  district: '',
  addressNote: '',
  name: '',
  breed: '',
  estimatedAgeMonths: '',
  healthSummary: '',
  temperament: '',
  color: '',
  vaccinationSummary: '',
  specialNeedsNote: '',
  species: 'DOG',
  gender: 'UNKNOWN',
  size: 'MEDIUM',
  postType: 'REHOME_OWNED_PET',
  isVaccinated: false,
  isNeutered: false,
  isUrgent: false,
  images: [],
  keptImages: [],
};

interface ListingFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialValues?: ListingFormValues;
  existingImages?: PostImage[];
  onSubmit: (values: ListingFormValues) => Promise<void>;
}

export function ListingForm({
  title,
  subtitle,
  submitLabel,
  initialValues = listingDefaults,
  existingImages = [],
  onSubmit,
}: ListingFormProps) {
  const [isPickingImages, setIsPickingImages] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    defaultValues: initialValues,
    mode: 'onTouched',
    resolver: zodResolver(listingSchema),
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const images = watch('images');
  const keptImages = watch('keptImages');
  const keptImageSet = useMemo(() => new Set(keptImages), [keptImages]);
  const visibleExistingImages = existingImages.filter((image) => keptImageSet.has(image.imageUrl));
  const totalImageCount = images.length + visibleExistingImages.length;

  const pickImages = async () => {
    if (totalImageCount >= 5 || isSubmitting || isPickingImages) return;

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
        selectionLimit: Math.max(1, 5 - totalImageCount),
      });

      if (!result.canceled) {
        const existingUris = new Set(images.map((image) => image.uri));
        const uniqueAssets = result.assets.filter((asset) => asset.uri && !existingUris.has(asset.uri));
        const nextImages = [...images, ...uniqueAssets].slice(0, Math.max(0, 5 - visibleExistingImages.length));

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

  const removeExistingImage = (imageUrl: string) => {
    setValue(
      'keptImages',
      keptImages.filter((keptImage) => keptImage !== imageUrl),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const submit = handleSubmit(onSubmit);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
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
          render={({ field: { onChange, value } }) => <CitySelect label="Şehir" value={value} onChange={onChange} placeholder="Şehir seç" error={errors.city?.message} />}
        />
        <Controller
          control={control}
          name="district"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field label="İlçe" value={value} onBlur={onBlur} onChangeText={onChange} placeholder="Opsiyonel" error={errors.district?.message} />
          )}
        />
        <Controller
          control={control}
          name="addressNote"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              label="Adres notu"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              multiline
              placeholder="Mahalle, yakın konum veya teslim notu."
              error={errors.addressNote?.message}
            />
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
        <Controller
          control={control}
          name="isUrgent"
          render={({ field: { onChange, value } }) => <ToggleRow label="Acil yuva aranıyor" value={value} onChange={onChange} />}
        />
      </Section>

      <Section title="Dostumuzun Bilgileri">
        <Controller
          control={control}
          name="name"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field label="Adı" value={value} onBlur={onBlur} onChangeText={onChange} placeholder="Bilinmiyorsa boş bırak" error={errors.name?.message} />
          )}
        />
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
          name="color"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field label="Renk" value={value} onBlur={onBlur} onChangeText={onChange} placeholder="Opsiyonel" error={errors.color?.message} />
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

      <Section title="Sağlık Bilgileri">
        <Controller
          control={control}
          name="isVaccinated"
          render={({ field: { onChange, value } }) => <ToggleRow label="Aşıları var" value={value} onChange={onChange} />}
        />
        <Controller
          control={control}
          name="isNeutered"
          render={({ field: { onChange, value } }) => <ToggleRow label="Kısırlaştırılmış" value={value} onChange={onChange} />}
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
              placeholder="Bilinen sağlık durumu"
              error={errors.healthSummary?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="vaccinationSummary"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              label="Aşı bilgisi"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Karma, kuduz, parazit vb."
              error={errors.vaccinationSummary?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="specialNeedsNote"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              label="Özel ihtiyaç notu"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              multiline
              placeholder="İlaç, bakım veya hassasiyet varsa belirt."
              error={errors.specialNeedsNote?.message}
            />
          )}
        />
      </Section>

      <Section title="Fotoğraflar">
        <Button
          title={totalImageCount >= 5 ? 'Maksimum 5 fotoğraf' : 'Fotoğraf Seç'}
          variant="secondary"
          disabled={totalImageCount >= 5 || isSubmitting || isPickingImages}
          loading={isPickingImages}
          icon={<Camera color={colors.primaryDark} size={18} />}
          onPress={pickImages}
        />
        <Text style={styles.photoCount}>{totalImageCount}/5 fotoğraf seçildi</Text>
        {errors.images?.message ? <Text style={styles.errorText}>{errors.images.message}</Text> : null}
        <View style={styles.previewGrid}>
          {visibleExistingImages.map((image) => (
            <ExistingPreview key={image.imageUrl} image={image} disabled={isSubmitting} onRemove={removeExistingImage} />
          ))}
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

      <Button title={submitLabel} loading={isSubmitting} disabled={isPickingImages} onPress={submit} />
    </ScrollView>
  );
}

export function listingValuesFromPost(post: PetPost): ListingFormValues {
  return {
    ...listingDefaults,
    title: post.title || '',
    description: post.description || '',
    city: post.city || '',
    district: post.district || '',
    addressNote: post.addressNote || '',
    name: post.pet?.name || '',
    breed: post.pet?.breed || '',
    estimatedAgeMonths: post.pet?.estimatedAgeMonths != null ? String(post.pet.estimatedAgeMonths) : '',
    healthSummary: post.pet?.healthSummary || '',
    temperament: post.pet?.temperament || '',
    color: post.pet?.color || '',
    vaccinationSummary: post.pet?.vaccinationSummary || '',
    specialNeedsNote: post.pet?.specialNeedsNote || '',
    species: post.pet?.species || 'DOG',
    gender: post.pet?.gender || 'UNKNOWN',
    size: post.pet?.size || 'MEDIUM',
    postType: post.postType || 'REHOME_OWNED_PET',
    isVaccinated: !!post.pet?.isVaccinated,
    isNeutered: !!post.pet?.isNeutered,
    isUrgent: !!post.isUrgent,
    images: [],
    keptImages: post.images?.map((image) => image.imageUrl) || [],
  };
}

export function appendListingFormData(payload: FormData, values: ListingFormValues, options: { includeKeptImages?: boolean } = {}) {
  payload.append('species', values.species);
  payload.append('gender', values.gender);
  payload.append('size', values.size);
  payload.append('postType', values.postType);
  payload.append('title', values.title.trim());
  payload.append('description', values.description.trim());
  payload.append('city', values.city.trim());
  payload.append('isVaccinated', String(values.isVaccinated));
  payload.append('isNeutered', String(values.isNeutered));
  payload.append('isUrgent', String(values.isUrgent));

  appendOptional(payload, 'district', values.district);
  appendOptional(payload, 'addressNote', values.addressNote);
  appendOptional(payload, 'name', values.name);
  appendOptional(payload, 'breed', values.breed);
  appendOptional(payload, 'estimatedAgeMonths', values.estimatedAgeMonths);
  appendOptional(payload, 'healthSummary', values.healthSummary);
  appendOptional(payload, 'temperament', values.temperament);
  appendOptional(payload, 'color', values.color);
  appendOptional(payload, 'vaccinationSummary', values.vaccinationSummary);
  appendOptional(payload, 'specialNeedsNote', values.specialNeedsNote);

  if (options.includeKeptImages) {
    payload.append('keptImages', JSON.stringify(values.keptImages));
  }

  values.images.forEach((image, index) => {
    const fallbackName = `bir-yuva-bir-dost-${Date.now()}-${index}.jpg`;
    const name = image.fileName || image.uri.split('/').pop() || fallbackName;
    payload.append('images', {
      uri: image.uri,
      name,
      type: image.mimeType || 'image/jpeg',
    } as unknown as Blob);
  });
}

function appendOptional(payload: FormData, key: string, value?: string | null) {
  const nextValue = emptyToUndefined(value);
  if (nextValue) payload.append(key, nextValue);
}

function ExistingPreview({
  image,
  disabled,
  onRemove,
}: {
  image: PostImage;
  disabled: boolean;
  onRemove: (imageUrl: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const uri = failed ? null : buildImageUrl(image.imageUrl);

  return (
    <View style={styles.previewWrap}>
      {uri ? (
        <Image source={{ uri }} style={styles.preview} onError={() => setFailed(true)} />
      ) : (
        <View style={styles.previewPlaceholder}>
          <Text style={styles.previewPlaceholderText}>Görsel</Text>
        </View>
      )}
      <Pressable style={styles.remove} disabled={disabled} onPress={() => onRemove(image.imageUrl)}>
        <X color="#fff" size={16} />
      </Pressable>
    </View>
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

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable style={[styles.toggle, value && styles.toggleActive]} onPress={() => onChange(!value)}>
      <Text style={[styles.toggleText, value && styles.toggleTextActive]}>{label}</Text>
      <Text style={[styles.togglePill, value && styles.togglePillActive]}>{value ? 'Evet' : 'Hayır'}</Text>
    </Pressable>
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
  previewPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#efe7df',
    flex: 1,
    justifyContent: 'center',
  },
  previewPlaceholderText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
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
  toggle: {
    alignItems: 'center',
    backgroundColor: '#fbf7f3',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 13,
  },
  toggleActive: { backgroundColor: '#fff4ed', borderColor: '#ffd2b8' },
  toggleText: { color: colors.muted, flex: 1, fontSize: 14, fontWeight: '800' },
  toggleTextActive: { color: colors.ink },
  togglePill: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  togglePillActive: { color: colors.primaryDark },
});
