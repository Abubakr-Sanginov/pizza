import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { AmbientBackdrop, BackButton } from '@/components/ui';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/notifications`);
      setNotifications(data);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.notificationCard}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}

      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackdrop />
      <BackButton />
      <View style={styles.fixedHeader}>
        <Text style={styles.headerTitle}>{t('tabs.notifications')}</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.textSubtle} />
            <Text style={styles.emptyText}>У вас пока нет уведомлений</Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: t.background,
  },
  fixedHeader: {
    paddingLeft: 64,
    paddingRight: 22,
    paddingVertical: 18,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: t.text,
    letterSpacing: -1,
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  notificationCard: {
    backgroundColor: t.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: t.mode === 'dark' ? 0.35 : 0.06,
    shadowRadius: 18,
    elevation: 3,
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: t.text,
    flex: 1,
    marginRight: 10,
  },
  date: {
    fontSize: 12,
    color: t.textSubtle,
  },
  body: {
    fontSize: 14,
    color: t.textMuted,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: t.textSubtle,
    fontWeight: '600',
  },
});
