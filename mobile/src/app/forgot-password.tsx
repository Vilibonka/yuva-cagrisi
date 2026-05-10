import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';

import { Button, Field, Section, colors } from '@/components/Design';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { emailField } from '@/lib/validation';

const forgotPasswordSchema = z.object({
  email: emailField(),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: '' },
    mode: 'onTouched',
    resolver: zodResolver(forgotPasswordSchema),
  });

  const submit = handleSubmit(async (values) => {
    setMessage(null);
    setPreviewUrl(null);

    try {
      const { data } = await api.post<{ message?: string; previewUrl?: string | null }>('/auth/forgot-password', {
        email: values.email.trim(),
      });
      setMessage(data.message || 'E-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi.');
      setPreviewUrl(data.previewUrl || null);
    } catch (error) {
      Alert.alert('Bağlantı gönderilemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  });

  const openPreview = async () => {
    if (!previewUrl) return;
    const canOpen = await Linking.canOpenURL(previewUrl);
    if (canOpen) {
      await Linking.openURL(previewUrl);
    } else {
      Alert.alert('Bağlantı açılamadı', previewUrl);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Şifremi unuttum</Text>
          <Text style={styles.subtitle}>E-posta adresini gir; kayıtlıysa şifre sıfırlama bağlantısı gönderelim.</Text>
        </View>

        <Section>
          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}
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
          <Button title="Bağlantı Gönder" loading={isSubmitting} onPress={submit} />
          {previewUrl ? <Button title="Test Mail Kutusunu Aç" variant="secondary" onPress={openPreview} /> : null}
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
  messageBox: {
    backgroundColor: '#e9f8f1',
    borderColor: '#b7ead3',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  messageText: { color: colors.success, fontSize: 13, fontWeight: '800', lineHeight: 19 },
});
