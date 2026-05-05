import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Field, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'E-posta ve şifre gerekli.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Giriş başarısız', error?.response?.data?.message || 'Bilgilerini kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Tekrar hoş geldin</Text>
          <Text style={styles.subtitle}>Favorilerini, mesajlarını ve başvurularını görmek için giriş yap.</Text>
        </View>

        <Section>
          <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry />
          <Button title="Giriş Yap" loading={loading} onPress={submit} />
          <Button title="Hesabım yok, kayıt olayım" variant="ghost" onPress={() => router.push('/register')} />
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
