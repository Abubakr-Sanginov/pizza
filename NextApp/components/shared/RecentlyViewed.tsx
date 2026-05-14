import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';
import { useRecentlyViewedIds } from '@/hooks/useRecentlyViewed';
import { SpringPress, TagBadges } from '@/components/ui';

interface Product {
  id: number;
  name: string;
  imageUrl: string;
  tags?: string[];
  items: { price: number; priceOld?: number | null }[];
}

interface Props {
  onPress: (product: Product) => void;
  refreshToken?: any;
}

export const RecentlyViewed: React.FC<Props> = ({ onPress, refreshToken }) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const grad = theme.mode === 'dark' ? gradients.dark : gradients.light;

  const ids = useRecentlyViewedIds(refreshToken);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`${BASE_URL}/api/products/by-ids?ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (!cancelled && Array.isArray(data)) setProducts(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ids.join(',')]);

  if (products.length === 0 && !loading) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="time-outline" size={16} color={theme.primary} />
        </View>
        <Text style={styles.title}>Недавно смотрели</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {loading && products.length === 0 ? (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          products.map((p) => (
            <SpringPress key={p.id} onPress={() => onPress(p)} scaleTo={0.94}>
              <View style={styles.card}>
                <View style={styles.imageWrap}>
                  <LinearGradient
                    colors={grad.surface}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Image source={{ uri: p.imageUrl }} style={styles.image} />
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {p.name}
                </Text>
                <TagBadges tags={p.tags} dark={theme.mode === 'dark'} max={1} />
                <Text style={styles.price}>
                  от {p.items[0]?.price}
                  <Text style={styles.priceUnit}> TJS</Text>
                </Text>
              </View>
            </SpringPress>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (t: Theme) => StyleSheet.create({
  wrap: { paddingVertical: 16, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: t.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', color: t.text, letterSpacing: -0.3 },
  row: { gap: 10, paddingBottom: 4 },
  card: {
    width: 140,
    backgroundColor: t.surface,
    borderRadius: 20,
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
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  image: { width: 100, height: 100, resizeMode: 'contain' },
  name: {
    fontSize: 12,
    fontWeight: '800',
    color: t.text,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
  },
  price: { fontSize: 14, fontWeight: '900', color: t.text, marginTop: 6 },
  priceUnit: { fontSize: 10, color: t.textMuted, fontWeight: '700' },
  loader: { width: 200, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});
