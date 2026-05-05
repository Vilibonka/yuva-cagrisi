import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Field, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      Alert.alert('Eksik bilgi', 'Ad soyad, geçerli e-posta ve en az 6 karakter şifre gerekli.');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        contactPhone: contactPhone.trim() || undefined,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
      });
      router.replace('/');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Kayıt başarısız', Array.isArray(message) ? message.join('\n') : message || 'Lütfen bilgileri kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Yuva ağına katıl</Text>
          <Text style={styles.subtitle}>İlan oluşturmak, başvuru yapmak ve mesajlaşmak için hesabını oluştur.</Text>
        </View>

        <Section>
          <Field label="Ad Soyad" value={fullName} onChangeText={setFullName} />
          <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry />
          <Field label="Telefon" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
          <Field label="Şehir" value={city} onChangeText={setCity} />
          <Field label="İlçe" value={district} onChangeText={setDistrict} />
          <Button title="Kayıt Ol" loading={loading} onPress={submit} />
          <Button title="Zaten hesabım var" variant="ghost" onPress={() => router.push('/login')} />
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
