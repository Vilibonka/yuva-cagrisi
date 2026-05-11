import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Heart, ListChecks, LogOut, MessageSquare, Plus, Send, Settings, User } from 'lucide-react-native';

import { Button, LoadingState, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import { buildImageUrl } from '@/lib/config';

export default function ProfileScreen() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) return <LoadingState label="Profil açılıyor..." />;
  if (!isAuthenticated) {
    router.replace({ pathname: '/login', params: { redirectTo: '/profile' } });
    return <LoadingState label="Girişe yönlendiriliyor..." />;
  }

  const signOut = async () => {
    await logout();
    router.replace('/');
  };
  const avatarUrl = buildImageUrl(user?.profileImageUrl);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section>
        <View style={styles.avatar}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <User color={colors.primary} size={32} />}
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.city ? <Text style={styles.meta}>{[user.city, user.district].filter(Boolean).join(' / ')}</Text> : null}
      </Section>

      <Section title="Hızlı Erişim">
        <Button title="İlan Ver" icon={<Plus color="#fff" size={18} />} onPress={() => router.push('/create')} />
        <Button title="İlanlarım" variant="secondary" icon={<ListChecks color={colors.primaryDark} size={18} />} onPress={() => router.push('/my-listings')} />
        <Button title="Mesajlarım" variant="secondary" icon={<MessageSquare color={colors.primaryDark} size={18} />} onPress={() => router.push('/messages')} />
        <Button title="Favorilerim" variant="secondary" icon={<Heart color={colors.primaryDark} size={18} />} onPress={() => router.push('/favorites')} />
        <Button title="Başvurularım" variant="secondary" icon={<Send color={colors.primaryDark} size={18} />} onPress={() => router.push('/requests')} />
        <Button title="Bildirimler" variant="secondary" icon={<Bell color={colors.primaryDark} size={18} />} onPress={() => router.push('/notifications')} />
        <Button title="Profil Ayarları" variant="secondary" icon={<Settings color={colors.primaryDark} size={18} />} onPress={() => router.push('/profile-settings')} />
      </Section>

      <Button title="Çıkış Yap" variant="danger" icon={<LogOut color="#fff" size={18} />} onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 32 },
  avatar: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff4ed',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  avatarImage: { height: '100%', width: '100%' },
  name: { color: colors.ink, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  email: { color: colors.muted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  meta: { color: colors.muted, textAlign: 'center' },
});
