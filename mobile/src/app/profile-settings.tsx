import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Camera, User as UserIcon } from 'lucide-react-native';
import { z } from 'zod';

import { CitySelect } from '@/components/CitySelect';
import { Button, Field, LoadingState, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { buildImageUrl } from '@/lib/config';
import { getApiErrorMessage } from '@/lib/errors';
import { emptyToUndefined, fullNamePattern, optionalPhoneField, optionalTrimmedText } from '@/lib/validation';
import { User } from '@/types';

const settingsSchema = z.object({
  fullName: z
    .string()
    .refine((value) => value.trim().length > 0, 'Ad Soyad gerekli.')
    .refine((value) => value.trim().length <= 100, 'Ad Soyad en fazla 100 karakter olabilir.')
    .refine((value) => fullNamePattern.test(value.trim()), 'Ad Soyad sadece harf ve boşluk içerebilir.'),
  contactPhone: optionalPhoneField(),
  city: optionalTrimmedText('Şehir', 100),
  district: optionalTrimmedText('İlçe', 100),
  biography: optionalTrimmedText('Biyografi', 1000),
  showReadReceipts: z.boolean(),
  showLastSeen: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaults: SettingsFormValues = {
  fullName: '',
  contactPhone: '',
  city: '',
  district: '',
  biography: '',
  showReadReceipts: true,
  showLastSeen: true,
};

export default function ProfileSettingsScreen() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    defaultValues: defaults,
    mode: 'onTouched',
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace({ pathname: '/login', params: { redirectTo: '/profile-settings' } });
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!user) return;

    reset({
      fullName: user.fullName || '',
      contactPhone: user.contactPhone || '',
      city: user.city || '',
      district: user.district || '',
      biography: user.biography || '',
      showReadReceipts: user.showReadReceipts ?? true,
      showLastSeen: user.showLastSeen ?? true,
    });
  }, [reset, user]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    let active = true;

    api
      .get<User>('/users/me')
      .then(async ({ data }) => {
        if (!active) return;
        await updateUser(data);
        reset({
          fullName: data.fullName || '',
          contactPhone: data.contactPhone || '',
          city: data.city || '',
          district: data.district || '',
          biography: data.biography || '',
          showReadReceipts: data.showReadReceipts ?? true,
          showLastSeen: data.showLastSeen ?? true,
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, reset, updateUser]);

  const submit = handleSubmit(async (values) => {
    try {
      const { data } = await api.patch<User>('/users/me', {
        fullName: values.fullName.trim(),
        contactPhone: emptyToUndefined(values.contactPhone),
        city: emptyToUndefined(values.city),
        district: emptyToUndefined(values.district),
        biography: emptyToUndefined(values.biography),
        showReadReceipts: values.showReadReceipts,
        showLastSeen: values.showLastSeen,
      });

      await updateUser({ ...user, ...data });
      Alert.alert('Profil güncellendi', 'Bilgilerin kaydedildi.');
      router.replace('/profile');
    } catch (error) {
      Alert.alert('Profil güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  });

  const pickAvatar = async () => {
    if (avatarUploading) return;

    setAvatarUploading(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin gerekli', 'Profil fotoğrafı seçebilmek için medya izni vermelisin.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
      });

      if (result.canceled) return;

      const image = result.assets[0];
      const payload = new FormData();
      const fallbackName = `bir-yuva-bir-dost-avatar-${Date.now()}.jpg`;
      payload.append('avatar', {
        uri: image.uri,
        name: image.fileName || image.uri.split('/').pop() || fallbackName,
        type: image.mimeType || 'image/jpeg',
      } as unknown as Blob);

      const { data } = await api.patch<User>('/users/me/avatar', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await updateUser(data);
      Alert.alert('Fotoğraf güncellendi', 'Profil fotoğrafın kaydedildi.');
    } catch (error) {
      Alert.alert('Fotoğraf güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    } finally {
      setAvatarUploading(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <LoadingState label="Profil bilgileri hazırlanıyor..." />;
  }

  const avatarUrl = buildImageUrl(user?.profileImageUrl);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Profil Ayarları</Text>
          <Text style={styles.subtitle}>İlan sahipleri ve başvuranlar seni bu bilgilerle tanır.</Text>
        </View>

        <Section title="Profil Fotoğrafı">
          <View style={styles.avatarRow}>
            <View style={styles.avatarPreview}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <UserIcon color={colors.primary} size={32} />}
            </View>
            <View style={styles.avatarContent}>
              <Text style={styles.avatarTitle}>{user?.fullName}</Text>
              <Text style={styles.avatarMeta}>İlanlarda ve sohbetlerde görünen fotoğrafın.</Text>
            </View>
          </View>
          <Button
            title="Fotoğraf Seç"
            variant="secondary"
            loading={avatarUploading}
            icon={<Camera color={colors.primaryDark} size={18} />}
            onPress={pickAvatar}
          />
        </Section>

        <Section>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field label="Ad Soyad" value={value} onBlur={onBlur} onChangeText={onChange} error={errors.fullName?.message} />
            )}
          />
          <Controller
            control={control}
            name="contactPhone"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field label="İletişim Telefonu" value={value} onBlur={onBlur} onChangeText={onChange} keyboardType="phone-pad" error={errors.contactPhone?.message} />
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
              <Field label="İlçe" value={value} onBlur={onBlur} onChangeText={onChange} error={errors.district?.message} />
            )}
          />
          <Controller
            control={control}
            name="biography"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                label="Biyografi"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
                placeholder="Kısaca kendini ve hayvanlarla deneyimini anlat."
                error={errors.biography?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="showReadReceipts"
            render={({ field: { onChange, value } }) => <ToggleRow label="Okundu bilgisini göster" value={value} onChange={onChange} />}
          />
          <Controller
            control={control}
            name="showLastSeen"
            render={({ field: { onChange, value } }) => <ToggleRow label="Son görülme bilgisini göster" value={value} onChange={onChange} />}
          />
          <Button title="Değişiklikleri Kaydet" loading={isSubmitting} onPress={submit} />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable style={[styles.toggle, value && styles.toggleActive]} onPress={() => onChange(!value)}>
      <Text style={[styles.toggleText, value && styles.toggleTextActive]}>{label}</Text>
      <Text style={[styles.togglePill, value && styles.togglePillActive]}>{value ? 'Açık' : 'Kapalı'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: 18, padding: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  avatarRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  avatarPreview: {
    alignItems: 'center',
    backgroundColor: '#fff4ed',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  avatarImage: { height: '100%', width: '100%' },
  avatarContent: { flex: 1, gap: 4 },
  avatarTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  avatarMeta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
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
