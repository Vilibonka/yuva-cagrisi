import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { z } from 'zod';

import { CitySelect } from '@/components/CitySelect';
import { Button, Field, LoadingState, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
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
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaults: SettingsFormValues = {
  fullName: '',
  contactPhone: '',
  city: '',
  district: '',
  biography: '',
};

export default function ProfileSettingsScreen() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
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
      });

      await updateUser({ ...user, ...data });
      Alert.alert('Profil güncellendi', 'Bilgilerin kaydedildi.');
      router.replace('/profile');
    } catch (error) {
      Alert.alert('Profil güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  });

  if (isLoading || !isAuthenticated) {
    return <LoadingState label="Profil bilgileri hazırlanıyor..." />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Profil Ayarları</Text>
          <Text style={styles.subtitle}>İlan sahipleri ve başvuranlar seni bu bilgilerle tanır.</Text>
        </View>

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
          <Button title="Değişiklikleri Kaydet" loading={isSubmitting} onPress={submit} />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: 18, padding: 16, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
});
