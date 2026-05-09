import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';
import { useTranslation } from 'react-i18next';

import { BASE_URL } from '@/constants/Api';

export default function CourierScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/courier`);
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
        body: JSON.stringify({ status })
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
        <ActivityIndicator size="large" color="#ff7000" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('courier.title')}</Text>
        <Text style={styles.subtitle}>{t('courier.subtitle')}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff7000']} />}
      >
        {orders.length > 0 ? (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>{t('courier.order')} #{order.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: order.status === 'READY' ? '#e6f7ff' : '#f6ffed' }]}>
                  <Text style={[styles.statusText, { color: order.status === 'READY' ? '#1890ff' : '#52c41a' }]}>
                    {order.status === 'READY' ? t('courier.ready') : t('courier.delivering')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#687076" />
                <Text style={styles.infoText}>{order.address}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#687076" />
                <Text style={styles.infoText}>{order.phone}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('courier.priceLabel')}</Text>
                <Text style={styles.priceValue}>{order.totalAmount} TJS</Text>
              </View>

              <View style={styles.actions}>
                {order.status === 'READY' ? (
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => updateStatus(order.id, 'DELIVERING')}
                  >
                    <Ionicons name="bicycle" size={20} color="white" />
                    <Text style={styles.actionBtnText}>{t('courier.takeOrder')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#52c41a' }]} 
                    onPress={() => updateStatus(order.id, 'SUCCEEDED')}
                  >
                    <Ionicons name="checkmark-done" size={20} color="white" />
                    <Text style={styles.actionBtnText}>{t('courier.delivered')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="cafe-outline" size={64} color="#9BA1A6" />
            <Text style={styles.emptyText}>{t('courier.empty')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf7f2',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#11181C',
  },
  subtitle: {
    fontSize: 14,
    color: '#687076',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#11181C',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#11181C',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  priceLabel: {
    fontSize: 14,
    color: '#687076',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ff7000',
  },
  actions: {
    marginTop: 20,
  },
  actionBtn: {
    backgroundColor: '#ff7000',
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
    gap: 15,
  },
  emptyText: {
    color: '#9BA1A6',
    fontSize: 16,
    fontWeight: '700',
  },
});
