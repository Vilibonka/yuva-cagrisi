import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';

import { CitySelect } from '@/components/CitySelect';
import { Button, Field, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/errors';
import { getRedirectTarget } from '@/lib/navigation';
import { emailField, emptyToUndefined, fullNamePattern, optionalPhoneField, optionalTrimmedText } from '@/lib/validation';

const registerSchema = z.object({
  fullName: z
    .string()
    .refine((value) => value.trim().length > 0, 'Ad Soyad gerekli.')
    .refine((value) => value.trim().length <= 100, 'Ad Soyad en fazla 100 karakter olabilir.')
    .refine((value) => fullNamePattern.test(value.trim()), 'Ad Soyad sadece harf ve boşluk içerebilir.'),
  email: emailField(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı.').max(100, 'Şifre en fazla 100 karakter olabilir.'),
  contactPhone: optionalPhoneField(),
  city: optionalTrimmedText('Şehir', 100),
  district: optionalTrimmedText('İlçe', 100),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      contactPhone: '',
      city: '',
      district: '',
    },
    mode: 'onTouched',
    resolver: zodResolver(registerSchema),
  });

  const submit = handleSubmit(async (values) => {
    try {
      await signUp({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        contactPhone: emptyToUndefined(values.contactPhone),
        city: emptyToUndefined(values.city),
        district: emptyToUndefined(values.district),
      });
      router.replace(getRedirectTarget(redirectTo) as Href);
    } catch (error) {
      Alert.alert('Kayıt başarısız', getApiErrorMessage(error, 'Lütfen bilgileri kontrol et.'));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Yuva ağına katıl</Text>
          <Text style={styles.subtitle}>İlan oluşturmak, başvuru yapmak ve mesajlaşmak için hesabını oluştur.</Text>
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
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                label="E-posta"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field label="Şifre" value={value} onBlur={onBlur} onChangeText={onChange} secureTextEntry error={errors.password?.message} />
            )}
          />
          <Controller
            control={control}
            name="contactPhone"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                label="Telefon"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.contactPhone?.message}
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
              <Field label="İlçe" value={value} onBlur={onBlur} onChangeText={onChange} error={errors.district?.message} />
            )}
          />
          <Button title="Kayıt Ol" loading={isSubmitting} onPress={submit} />
          <Button
            title="Zaten hesabım var"
            variant="ghost"
            onPress={() => router.push({ pathname: '/login', params: { redirectTo: getRedirectTarget(redirectTo) } })}
          />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: 18, padding: 16 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
});
