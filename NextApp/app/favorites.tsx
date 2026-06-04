import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BASE_URL } from '@/constants/Api';
import { useUserStore } from '@/store/useUserStore';
import { getCartToken } from '@/store/useCartStore';
import { useTheme, Theme } from '@/hooks/useTheme';
import { AmbientBackdrop } from '@/components/ui';

interface FavoriteProduct {
  id: number;
  name: string;
  imageUrl: string;
  items: { price: number; priceOld?: number | null }[];
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const token = await getCartToken();
      const res = await fetch(
        `${BASE_URL}/api/favorites?userId=${user.id}`,
        { headers: token ? { 'X-Cart-Token': token } : undefined },
      );
      if (!res.ok) {
        setProducts([]);
        return;
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[favorites] fetch error', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleUnfavorite = async (productId: number) => {
    if (!user) return;
    // optimistic
    const prev = products;
    setProducts((p) => p.filter((x) => x.id !== productId));
    try {
      const token = await getCartToken();
      await fetch(`${BASE_URL}/api/favorites?userId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-Cart-Token': token } : {}),
        },
        body: JSON.stringify({ productId }),
      });
    } catch {
      setProducts(prev);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Избранное' }} />
        <AmbientBackdrop />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={42} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Войди в аккаунт
          </Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Чтобы сохранять любимые позиции, войди в свой профиль.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/profile')}
            style={[styles.cta, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.ctaText}>В профиль</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Избранное' }} />
      <AmbientBackdrop />

      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Назад"
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Избранное</Text>
        <View style={{ width: 42 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={42} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Пока пусто
          </Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Нажимай ♥ на товарах в меню, чтобы сохранять их сюда — и быстро
            возвращаться к любимому.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={[styles.cta, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.ctaText}>К меню</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => {
            const price = item.items[0]?.price ?? 0;
            return (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    onPress={() => handleUnfavorite(item.id)}
                    style={styles.heartBtn}
                    accessibilityLabel="Удалить из избранного"
                  >
                    <Ionicons name="heart" size={18} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
                <Text
                  style={[styles.name, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text style={[styles.price, { color: theme.primary }]}>
                  от {price} TJS
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 10,
    },
    backBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
    },
    title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    list: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 40, gap: 14 },
    card: {
      flex: 1,
      borderRadius: 24,
      borderWidth: 1,
      padding: 12,
      alignItems: 'center',
      gap: 8,
    },
    imageWrap: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 18,
      backgroundColor: t.background,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    image: { width: '90%', height: '90%' },
    heartBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.95)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    name: {
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
      minHeight: 32,
    },
    price: { fontSize: 14, fontWeight: '900' },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: t.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '900',
      marginBottom: 6,
      letterSpacing: -0.4,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    cta: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 18,
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    ctaText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  });
