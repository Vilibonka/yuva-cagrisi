import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/components/Design';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider value={DefaultTheme}>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontWeight: '900' },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ title: 'Giriş' }} />
              <Stack.Screen name="register" options={{ title: 'Kayıt Ol' }} />
              <Stack.Screen name="requests" options={{ title: 'Başvurularım' }} />
              <Stack.Screen name="my-listings" options={{ title: 'İlanlarım' }} />
              <Stack.Screen name="profile-settings" options={{ title: 'Profil Ayarları' }} />
              <Stack.Screen name="notifications" options={{ title: 'Bildirimler' }} />
              <Stack.Screen name="post/[id]" options={{ title: 'İlan Detayı' }} />
              <Stack.Screen name="messages/[id]" options={{ title: 'Sohbet' }} />
            </Stack>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
