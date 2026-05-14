import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type ProductTag =
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'SPICY'
  | 'GLUTEN_FREE'
  | 'LACTOSE_FREE'
  | 'NEW'
  | 'HIT';

interface TagMeta {
  label: { ru: string; en: string; tg: string };
  emoji: string;
  bgLight: string;
  bgDark: string;
  fgLight: string;
  fgDark: string;
}

export const TAG_META: Record<ProductTag, TagMeta> = {
  VEGAN: {
    label: { ru: 'Веган', en: 'Vegan', tg: 'Веган' },
    emoji: '🌱',
    bgLight: 'rgba(34,197,94,0.15)', bgDark: 'rgba(34,197,94,0.22)',
    fgLight: '#15803d', fgDark: '#86efac',
  },
  VEGETARIAN: {
    label: { ru: 'Вегетар.', en: 'Veggie', tg: 'Вегетарианӣ' },
    emoji: '🥗',
    bgLight: 'rgba(132,204,22,0.15)', bgDark: 'rgba(132,204,22,0.22)',
    fgLight: '#4d7c0f', fgDark: '#bef264',
  },
  SPICY: {
    label: { ru: 'Острое', en: 'Spicy', tg: 'Тунд' },
    emoji: '🌶️',
    bgLight: 'rgba(239,68,68,0.15)', bgDark: 'rgba(239,68,68,0.22)',
    fgLight: '#b91c1c', fgDark: '#fca5a5',
  },
  GLUTEN_FREE: {
    label: { ru: 'Без глютена', en: 'Gluten-free', tg: 'Бе глютен' },
    emoji: '🌾',
    bgLight: 'rgba(245,158,11,0.15)', bgDark: 'rgba(245,158,11,0.22)',
    fgLight: '#b45309', fgDark: '#fcd34d',
  },
  LACTOSE_FREE: {
    label: { ru: 'Без лактозы', en: 'Lactose-free', tg: 'Бе лактоза' },
    emoji: '🥛',
    bgLight: 'rgba(14,165,233,0.15)', bgDark: 'rgba(14,165,233,0.22)',
    fgLight: '#0369a1', fgDark: '#7dd3fc',
  },
  NEW: {
    label: { ru: 'Новинка', en: 'New', tg: 'Нав' },
    emoji: '✨',
    bgLight: 'rgba(139,92,246,0.15)', bgDark: 'rgba(139,92,246,0.22)',
    fgLight: '#6d28d9', fgDark: '#c4b5fd',
  },
  HIT: {
    label: { ru: 'Хит', en: 'Hit', tg: 'Хит' },
    emoji: '🔥',
    bgLight: 'rgba(249,115,22,0.15)', bgDark: 'rgba(249,115,22,0.22)',
    fgLight: '#c2410c', fgDark: '#fdba74',
  },
};

const isProductTag = (v: string): v is ProductTag => v in TAG_META;

interface Props {
  tags: string[] | undefined | null;
  lang?: string;
  dark?: boolean;
  max?: number;
}

export const TagBadges: React.FC<Props> = ({ tags, lang = 'ru', dark = false, max }) => {
  if (!tags || tags.length === 0) return null;
  const valid = tags.filter(isProductTag) as ProductTag[];
  const shown = typeof max === 'number' ? valid.slice(0, max) : valid;
  if (shown.length === 0) return null;
  const langKey = (lang.slice(0, 2) as 'ru' | 'en' | 'tg');

  return (
    <View style={styles.row}>
      {shown.map((tag) => {
        const meta = TAG_META[tag];
        const label = meta.label[langKey] ?? meta.label.ru;
        return (
          <View
            key={tag}
            style={[
              styles.badge,
              { backgroundColor: dark ? meta.bgDark : meta.bgLight },
            ]}>
            <Text style={[styles.emoji]}>{meta.emoji}</Text>
            <Text style={[styles.text, { color: dark ? meta.fgDark : meta.fgLight }]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 3,
  },
  emoji: { fontSize: 10 },
  text: { fontSize: 10, fontWeight: '700' },
});
