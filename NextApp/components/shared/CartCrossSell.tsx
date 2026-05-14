import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { BASE_URL } from '@/constants/Api';
import { useCartStore } from '@/store/useCartStore';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';
import { SpringPress } from '@/components/ui';

interface Reco {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  productItemId: number;
}

export const CartCrossSell: React.FC = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const grad = theme.mode === 'dark' ? gradients.dark : gradients.light;
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);

  const productIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.productItem?.productId).filter(Boolean))),
    [items],
  );

  const [recos, setRecos] = useState<Reco[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${BASE_URL}/api/recommendations?exclude=${productIds.join(',')}`)
      .then((r) => r.json())
      .then((data: Reco[]) => {
        if (!cancelled && Array.isArray(data)) setRecos(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productIds.join(',')]);

  if (items.length === 0 || (!loading && recos.length === 0)) return null;

  const onAdd = async (r: Reco) => {
    setAdding(r.id);
    try {
      await addItem(r.productItemId);
    } finally {
      setAdding(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.header}>Добавьте к заказу</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {loading && recos.length === 0 ? (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          recos.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.imageWrap}>
                <LinearGradient
                  colors={grad.surface}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Image source={{ uri: r.imageUrl }} style={styles.image} />
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {r.name}
              </Text>
              <Text style={styles.price}>
                {r.price}
                <Text style={styles.priceUnit}> TJS</Text>
              </Text>
              <SpringPress onPress={() => onAdd(r)} scaleTo={0.88} disabled={adding === r.id}>
                <LinearGradient
                  colors={grad.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addBtn}>
                  {adding === r.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="add" size={18} color="#fff" />
                  )}
                </LinearGradient>
              </SpringPress>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (t: Theme) => StyleSheet.create({
  wrap: { marginTop: 18, marginBottom: 8 },
  header: {
    fontSize: 11,
    fontWeight: '900',
    color: t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  row: { gap: 10, paddingHorizontal: 4, paddingBottom: 4 },
  card: {
    width: 124,
    backgroundColor: t.surface,
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: t.mode === 'dark' ? 0.2 : 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  image: { width: 80, height: 80, resizeMode: 'contain' },
  name: {
    fontSize: 11,
    fontWeight: '800',
    color: t.text,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  price: { fontSize: 14, fontWeight: '900', color: t.text, marginTop: 4 },
  priceUnit: { fontSize: 10, color: t.textMuted, fontWeight: '700' },
  addBtn: {
    marginTop: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { width: 200, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});
