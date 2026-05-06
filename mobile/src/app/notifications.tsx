import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, CheckCheck } from 'lucide-react-native';

import { Badge, EmptyState, ErrorState, LoadingState, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { formatTimeAgo, notificationTypeLabels } from '@/lib/labels';
import { NotificationItem } from '@/types';

export default function NotificationsScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const { socket } = useSocket(isAuthenticated);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace({ pathname: '/login', params: { redirectTo: '/notifications' } });
    }
  }, [isAuthenticated, isLoading]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;

    const [notificationsRes, countRes] = await Promise.all([
      api.get<NotificationItem[]>('/notifications'),
      api.get<{ count: number }>('/notifications/unread-count'),
    ]);

    setNotifications(notificationsRes.data);
    setUnreadCount(countRes.data.count || 0);

    if ((countRes.data.count || 0) > 0) {
      await api.patch('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    }
  }, [isAuthenticated]);

  const loadScreen = useCallback(
    async ({ withLoading = false }: { withLoading?: boolean } = {}) => {
      if (withLoading) setLoading(true);
      setLoadError(null);
      try {
        await load();
      } catch (error) {
        setLoadError(getApiErrorMessage(error, 'Bildirimler yüklenemedi. Lütfen tekrar dene.'));
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void loadScreen({ withLoading: true });
  }, [loadScreen]);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (notification: NotificationItem) => {
      if (notification.type === 'NEW_MESSAGE') return;

      setNotifications((current) => {
        if (notification.id && current.some((item) => item.id === notification.id)) return current;
        return [{ ...notification, isRead: false, createdAt: notification.createdAt || new Date().toISOString() }, ...current];
      });
      setUnreadCount((current) => current + 1);
    };

    socket.on('new_notification', onNotification);
    return () => {
      socket.off('new_notification', onNotification);
    };
  }, [socket]);

  const refresh = async () => {
    setRefreshing(true);
    await loadScreen();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Bildirimler güncellenemedi.'));
    }
  };

  if (isLoading || loading) {
    return <LoadingState label="Bildirimler yükleniyor..." />;
  }

  if (loadError) {
    return <ErrorState title="Bildirimler açılamadı" description={loadError} onRetry={() => loadScreen({ withLoading: true })} />;
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item, index) => item.id || `${item.type}-${index}`}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Bildirimler</Text>
              <Text style={styles.subtitle}>Başvuru ve ilan gelişmelerini buradan takip et.</Text>
            </View>
            {unreadCount > 0 ? <Badge label={`${unreadCount} yeni`} tone="orange" /> : null}
          </View>
          {notifications.length > 0 ? (
            <Pressable style={styles.markButton} onPress={markAllRead}>
              <CheckCheck color={colors.primaryDark} size={18} />
              <Text style={styles.markText}>Tümünü okundu yap</Text>
            </Pressable>
          ) : null}
        </View>
      }
      ListEmptyComponent={<EmptyState title="Henüz bildirim yok" description="Başvuru ve durum güncellemeleri burada görünecek." />}
      renderItem={({ item }) => <NotificationCard item={item} />}
    />
  );
}

function NotificationCard({ item }: { item: NotificationItem }) {
  const unread = item.isRead === false;

  return (
    <View style={[styles.card, unread && styles.cardUnread]}>
      <View style={styles.iconWrap}>
        <Bell color={unread ? colors.primaryDark : colors.muted} size={20} />
      </View>
      <View style={styles.content}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title || notificationTypeLabels[item.type]}</Text>
          {unread ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, padding: 16, paddingBottom: 32 },
  header: { gap: 12, marginBottom: 2 },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  markButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff4ed',
    borderColor: '#ffd2b8',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  markText: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  cardUnread: { backgroundColor: '#fff8f1', borderColor: '#ffd2b8' },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#fff4ed',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  content: { flex: 1, gap: 5 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  cardTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '900' },
  unreadDot: { backgroundColor: colors.primary, borderRadius: 999, height: 8, width: 8 },
  message: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  time: { color: colors.muted, fontSize: 11, fontWeight: '800' },
});
