import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';
import { useTranslation } from 'react-i18next';

import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SpringPress, AmbientBackdrop } from '@/components/ui';

export default function CourierScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/orders/courier?userId=${user.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error('Fetch courier orders error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: user?.id })
      });

      if (res.ok) {
        Alert.alert(t('courier.success'), t('courier.statusUpdated'));
        fetchOrders();
      } else {
        Alert.alert(t('courier.error'), t('courier.statusUpdateError'));
      }
    } catch (e) {
      Alert.alert(t('courier.error'), t('courier.networkError'));
    }
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>{t('courier.title')}</Text>
        <Text style={styles.subtitle}>{t('courier.subtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
      >
        {orders.length > 0 ? (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>{t('courier.order')} #{order.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: order.status === 'READY' ? (theme.mode === 'dark' ? 'rgba(96,165,250,0.18)' : '#e6f7ff') : (theme.mode === 'dark' ? 'rgba(74,222,128,0.18)' : '#f6ffed') }]}>
                  <Text style={[styles.statusText, { color: order.status === 'READY' ? (theme.mode === 'dark' ? '#60a5fa' : '#1890ff') : theme.success }]}>
                    {order.status === 'READY' ? t('courier.ready') : t('courier.delivering')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={theme.textMuted} />
                <Text style={styles.infoText}>{order.address}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={theme.textMuted} />
                <Text style={styles.infoText}>{order.phone}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('courier.priceLabel')}</Text>
                <Text style={styles.priceValue}>{order.totalAmount} TJS</Text>
              </View>

              <View style={styles.actions}>
                {order.status === 'READY' ? (
                  <SpringPress onPress={() => updateStatus(order.id, 'DELIVERING')} scaleTo={0.96}>
                    <LinearGradient
                      colors={(theme.mode === 'dark' ? gradients.dark : gradients.light).primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionBtn}>
                      <Ionicons name="bicycle" size={20} color="white" />
                      <Text style={styles.actionBtnText}>{t('courier.takeOrder')}</Text>
                    </LinearGradient>
                  </SpringPress>
                ) : (
                  <SpringPress onPress={() => updateStatus(order.id, 'SUCCEEDED')} scaleTo={0.96}>
                    <LinearGradient
                      colors={['#22c55e', '#16a34a'] as const}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionBtn}>
                      <Ionicons name="checkmark-done" size={20} color="white" />
                      <Text style={styles.actionBtnText}>{t('courier.delivered')}</Text>
                    </LinearGradient>
                  </SpringPress>
                )}

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    Alert.alert(
                      t('courier.confirmCancelTitle') || 'Отмена заказа',
                      t('courier.confirmCancel') || 'Вы уверены, что хотите отменить этот заказ?',
                      [
                        { text: t('reviews.cancel'), style: 'cancel' },
                        {
                          text: t('courier.cancelOrder'),
                          style: 'destructive',
                          onPress: () => updateStatus(order.id, 'CANCELLED')
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.cancelBtnText}>{t('courier.cancelOrder')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="cafe-outline" size={64} color={theme.textSubtle} />
            <Text style={styles.emptyText}>{t('courier.empty')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 24,
    backgroundColor: t.surface,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: t.mode === 'dark' ? 0.4 : 0.08,
    shadowRadius: 18,
    elevation: 4,
    borderBottomWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  },
  title: { fontSize: 30, fontWeight: '900', color: t.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: t.textMuted, marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  orderCard: {
    backgroundColor: t.surface,
    borderRadius: 26,
    padding: 22,
    marginBottom: 14,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: t.mode === 'dark' ? 0.4 : 0.06,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  orderId: { fontSize: 18, fontWeight: '800', color: t.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 14, color: t.text, flex: 1 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: t.borderMuted,
  },
  priceLabel: { fontSize: 14, color: t.textMuted },
  priceValue: { fontSize: 18, fontWeight: '900', color: t.primary },
  actions: { marginTop: 20 },
  actionBtn: {
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  cancelBtn: { marginTop: 10, height: 40, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: t.danger, fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 100, gap: 15 },
  emptyText: { color: t.textSubtle, fontSize: 16, fontWeight: '700' },
});
