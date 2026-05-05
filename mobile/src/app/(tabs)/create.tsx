import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Camera, X } from 'lucide-react-native';

import { Button, Field, LoadingState, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { AnimalSize, Gender, PostType, Species } from '@/types';

const speciesOptions: Species[] = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'];
const genderOptions: Gender[] = ['UNKNOWN', 'MALE', 'FEMALE'];
const sizeOptions: AnimalSize[] = ['SMALL', 'MEDIUM', 'LARGE'];
const postTypeOptions: PostType[] = ['REHOME_OWNED_PET', 'FOUND_STRAY', 'TEMP_HOME_NEEDED'];

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

export default function CreatePostScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [breed, setBreed] = useState('');
  const [estimatedAgeMonths, setEstimatedAgeMonths] = useState('');
  const [healthSummary, setHealthSummary] = useState('');
  const [temperament, setTemperament] = useState('');
  const [species, setSpecies] = useState<Species>('DOG');
  const [gender, setGender] = useState<Gender>('UNKNOWN');
  const [size, setSize] = useState<AnimalSize>('MEDIUM');
  const [postType, setPostType] = useState<PostType>('REHOME_OWNED_PET');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  const pickImages = async () => {
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
      setImages((current) => [...current, ...result.assets].slice(0, 5));
    }
  };

  const removeImage = (uri: string) => {
    setImages((current) => current.filter((image) => image.uri !== uri));
  };

  const submit = async () => {
    if (!title.trim() || !description.trim() || !city.trim()) {
      Alert.alert('Eksik bilgi', 'Başlık, açıklama ve şehir zorunlu.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Fotoğraf gerekli', 'En az bir fotoğraf eklemelisin.');
      return;
    }

    const payload = new FormData();
    payload.append('species', species);
    payload.append('gender', gender);
    payload.append('size', size);
    payload.append('postType', postType);
    payload.append('title', title.trim());
    payload.append('description', description.trim());
    payload.append('city', city.trim());
    if (breed.trim()) payload.append('breed', breed.trim());
    if (estimatedAgeMonths.trim()) payload.append('estimatedAgeMonths', estimatedAgeMonths.trim());
    if (healthSummary.trim()) payload.append('healthSummary', healthSummary.trim());
    if (temperament.trim()) payload.append('temperament', temperament.trim());

    images.forEach((image, index) => {
      const name = image.fileName || `yuva-${Date.now()}-${index}.jpg`;
      payload.append('images', {
        uri: image.uri,
        name,
        type: image.mimeType || 'image/jpeg',
      } as any);
    });

    setSubmitting(true);
    try {
      await api.post('/pet-posts', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('İlan yayınlandı', 'Dostumuz artık listede görünüyor.');
      router.replace('/');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('İlan oluşturulamadı', Array.isArray(message) ? message.join('\n') : message || 'Lütfen tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <Field label="Başlık" value={title} onChangeText={setTitle} placeholder="Örn. Kadıköy'de yuva arayan sakin kedi" />
        <Field label="Şehir" value={city} onChangeText={setCity} placeholder="Örn. İstanbul" />
        <Field label="Açıklama" value={description} onChangeText={setDescription} multiline placeholder="Hikayesini, ihtiyaçlarını ve iletişim sürecini anlat." />
        <ChoiceGroup value={postType} options={postTypeOptions} onChange={setPostType} />
      </Section>

      <Section title="Dostumuzun Bilgileri">
        <ChoiceGroup value={species} options={speciesOptions} onChange={setSpecies} />
        <ChoiceGroup value={gender} options={genderOptions} onChange={setGender} />
        <ChoiceGroup value={size} options={sizeOptions} onChange={setSize} />
        <Field label="Irk" value={breed} onChangeText={setBreed} placeholder="Opsiyonel" />
        <Field label="Tahmini yaş (ay)" value={estimatedAgeMonths} onChangeText={setEstimatedAgeMonths} keyboardType="number-pad" />
        <Field label="Sağlık özeti" value={healthSummary} onChangeText={setHealthSummary} placeholder="Aşılı, kısırlaştırılmış vb." />
        <Field label="Karakter" value={temperament} onChangeText={setTemperament} placeholder="Sakin, oyuncu, çocuklarla uyumlu..." />
      </Section>

      <Section title="Fotoğraflar">
        <Button title={images.length >= 5 ? 'Maksimum 5 fotoğraf' : 'Fotoğraf Seç'} variant="secondary" disabled={images.length >= 5} icon={<Camera color={colors.primaryDark} size={18} />} onPress={pickImages} />
        <View style={styles.previewGrid}>
          {images.map((image) => (
            <View key={image.uri} style={styles.previewWrap}>
              <Image source={{ uri: image.uri }} style={styles.preview} />
              <Pressable style={styles.remove} onPress={() => removeImage(image.uri)}>
                <X color="#fff" size={16} />
              </Pressable>
            </View>
          ))}
        </View>
      </Section>

      <Button title="İlanı Yayınla" loading={submitting} onPress={submit} />
    </ScrollView>
  );
}

function ChoiceGroup<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (value: T) => void }) {
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
