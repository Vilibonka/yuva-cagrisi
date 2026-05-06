import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';

import { Button, Field, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/errors';
import { getRedirectTarget } from '@/lib/navigation';
import { emailField } from '@/lib/validation';

const loginSchema = z.object({
  email: emailField(),
  password: z.string().min(1, 'Şifre gerekli.').max(100, 'Şifre en fazla 100 karakter olabilir.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
    resolver: zodResolver(loginSchema),
  });

  const submit = handleSubmit(async (values) => {
    try {
      await signIn(values.email.trim(), values.password);
      router.replace(getRedirectTarget(redirectTo) as Href);
    } catch (error) {
      Alert.alert('Giriş başarısız', getApiErrorMessage(error, 'Bilgilerini kontrol edip tekrar dene.'));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Tekrar hoş geldin</Text>
          <Text style={styles.subtitle}>Favorilerini, mesajlarını ve başvurularını görmek için giriş yap.</Text>
        </View>

        <Section>
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
              <Field
                label="Şifre"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />
          <Button title="Giriş Yap" loading={isSubmitting} onPress={submit} />
          <Button
            title="Hesabım yok, kayıt olayım"
            variant="ghost"
            onPress={() => router.push({ pathname: '/register', params: { redirectTo: getRedirectTarget(redirectTo) } })}
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
