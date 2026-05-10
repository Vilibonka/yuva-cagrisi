import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Field, Section, colors } from '@/components/Design';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Token gerekli.'),
    newPassword: z.string().min(6, 'Şifre en az 6 karakter olmalı.').max(100, 'Şifre en fazla 100 karakter olabilir.'),
    confirmPassword: z.string().min(1, 'Şifre tekrarı gerekli.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Şifreler eşleşmiyor.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const resetToken = Array.isArray(token) ? token[0] : token;
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { token: resetToken || '', newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (resetToken) {
      setValue('token', resetToken, { shouldDirty: true, shouldValidate: true });
    }
  }, [resetToken, setValue]);

  const submit = handleSubmit(async (values) => {
    try {
      await api.post('/auth/reset-password', {
        token: values.token.trim(),
        newPassword: values.newPassword,
      });
      Alert.alert('Şifre sıfırlandı', 'Yeni şifrenle giriş yapabilirsin.', [
        { text: 'Girişe Dön', onPress: () => router.replace('/login') },
      ]);
    } catch (error) {
      Alert.alert('Şifre sıfırlanamadı', getApiErrorMessage(error, 'Token süresi dolmuş olabilir. Lütfen tekrar dene.'));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Yeni şifre belirle</Text>
          <Text style={styles.subtitle}>E-postadaki token ile hesabın için yeni bir şifre oluştur.</Text>
        </View>

        <Section>
          <Controller
            control={control}
            name="token"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field label="Token" value={value} onBlur={onBlur} onChangeText={onChange} autoCapitalize="none" error={errors.token?.message} />
            )}
          />
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field label="Yeni Şifre" value={value} onBlur={onBlur} onChangeText={onChange} secureTextEntry error={errors.newPassword?.message} />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                label="Yeni Şifre Tekrar"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry
                error={errors.confirmPassword?.message}
              />
            )}
          />
          <Button title="Şifreyi Sıfırla" loading={isSubmitting} onPress={submit} />
          <Button title="Giriş ekranına dön" variant="ghost" onPress={() => router.replace('/login')} />
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
