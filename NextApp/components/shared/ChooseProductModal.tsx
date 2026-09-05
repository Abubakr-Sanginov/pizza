import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, Pressable, Animated, Platform, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView, BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Plus, ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme, Theme } from '@/hooks/useTheme';
import { motion } from '@/constants/Colors';
import { SpringPress } from '@/components/ui';
import { pushRecentlyViewed } from '@/hooks/useRecentlyViewed';

const { height: SCREEN_H } = Dimensions.get('window');

// Буквы размеров: М — Маленькая (20), С — Средняя (30), Б — Большая (40).
const SIZE_LETTERS: Record<number, string> = {
  20: 'М',
  30: 'С',
  40: 'Б',
};

// Порядок кнопок задан здесь, а не выведен из порядка items: API сортирует варианты
// по цене (back/lib/find-pizzas.ts:47), поэтому опираться на него нельзя.
// 20 → 30 → 40 даёт М, С, Б.
const SIZE_ORDER = [20, 30, 40];

const DOUGH_LETTERS: Record<number, string> = { 1: 'ТР', 2: 'ТОН' };
// Полное название раскрываем только у теста; размеры остаются буквами.
const DOUGH_LABEL_KEYS: Record<number, string> = {
  1: 'productModal.typeTraditional',
  2: 'productModal.typeThin',
};

// Невыбранные варианты меньше выбранного; переключение — пружиной.
const PILL_INACTIVE_SCALE = 0.8;

interface OptionPillProps {
  active: boolean;
  short: string;
  /** Если задано — у выбранного варианта подпись раскрывается в полное название. */
  full?: string;
  onPress: () => void;
  renderGlass: () => React.ReactNode;
}

const OptionPill: React.FC<OptionPillProps> = ({ active, short, full, onPress, renderGlass }) => {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      ...motion.spring,
    }).start();
  }, [active, progress]);

  // Масштаб не влияет на layout, поэтому область нажатия у «уменьшенных» кнопок
  // остаётся полноразмерной.
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [PILL_INACTIVE_SCALE, 1],
  });

  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View
        style={[immStyles.pill, active && immStyles.pillActive, { transform: [{ scale }] }]}>
        {!active && renderGlass()}
        <Text style={[immStyles.pillText, active && immStyles.pillTextActive]} numberOfLines={1}>
          {active && full ? full : short}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

interface Props {
  product: any;
  relatedProducts?: any[];
  visible: boolean;
  onClose: () => void;
  onAddToCart: (values: any) => void;
}

export const ChooseProductModal: React.FC<Props> = (props) => {
  if (!props.product) return null;
  return <ImmersiveProductModal {...props} />;
};

// Полноэкранная карточка: гифка/фото на весь фон + КБЖУ + доп-товары (блюр) + размер и цена
const ImmersiveProductModal: React.FC<Props> = ({ product, relatedProducts = [], visible, onClose, onAddToCart }) => {
  const { t } = useTranslation();
  const isPizza = product.items.some((i: any) => i.pizzaType != null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  // expo-blur 57 на Android блюрит только содержимое BlurTargetView, ссылку на который
  // нужно передать в BlurView. Раньше стоял `experimentalBlurMethod` без цели — нативная
  // вьюха в таком случае молча падает в режим `none` и рисует просто полупрозрачный
  // прямоугольник. Цель подхватываем в onLayout: к этому моменту нативная вьюха точно
  // создана, и только после этого включаем сам метод блюра.
  const blurTargetRef = useRef<View | null>(null);
  const [blurTarget, setBlurTarget] = useState<{ current: View | null }>({ current: null });
  const [blurMethod, setBlurMethod] = useState<'none' | 'dimezisBlurView'>('none');

  const attachBlurTarget = () => {
    const node = blurTargetRef.current;
    if (!node) return;
    setBlurTarget((prev) => (prev.current === node ? prev : { current: node }));
  };

  useEffect(() => {
    if (!visible) {
      // Modal рендерит детей только когда открыт — старый нативный тег уже не валиден.
      setBlurTarget((prev) => (prev.current === null ? prev : { current: null }));
      setBlurMethod('none');
      return;
    }
    attachBlurTarget();
  }, [visible]);

  useEffect(() => {
    if (blurTarget.current) setBlurMethod('dimezisBlurView');
  }, [blurTarget]);

  // Общая цель блюра одна на весь экран, поэтому все стеклянные поверхности переиспользуют
  // её — так дешевле, чем поднимать отдельный BlurTargetView под каждую.
  // Это функция, а не компонент: иначе на каждый рендер создавался бы новый тип элемента
  // и нативная блюр-вьюха пересоздавалась бы заново.
  const glass = (intensity = 55) => (
    <BlurView
      blurTarget={blurTarget}
      blurMethod={blurMethod}
      intensity={intensity}
      tint="dark"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );

  // Порядок берём из SIZE_ORDER (С → М → Б), а не из порядка items: API сортирует
  // варианты по цене, поэтому в данных они лежат как попало. Нестандартные размеры,
  // если такие появятся, дописываем в конец по возрастанию.
  const sizeValues = useMemo(() => {
    const present = new Set<number>(
      product.items
        .map((i: any) => i.size)
        .filter((s: any): s is number => typeof s === 'number'),
    );
    const known = SIZE_ORDER.filter((s) => present.has(s));
    const rest = [...present].filter((s) => !SIZE_ORDER.includes(s)).sort((a, b) => a - b);
    return [...known, ...rest];
  }, [product]);

  const doughTypes = useMemo(
    () => (isPizza ? [1, 2].filter((v) => product.items.some((i: any) => i.pizzaType === v)) : []),
    [product, isPizza],
  );

  // По умолчанию — самый маленький размер и традиционное тесто, а не случайный
  // «самый дешёвый» вариант, который приходит первым из API.
  const defaultItemId = useMemo(() => {
    const sorted = [...product.items].sort(
      (a: any, b: any) => (a.size ?? 0) - (b.size ?? 0) || (a.pizzaType ?? 0) - (b.pizzaType ?? 0),
    );
    return sorted[0]?.id ?? null;
  }, [product]);

  useEffect(() => {
    if (visible) {
      setSelectedItemId(defaultItemId);
      setSelectedIngredients([]);
      setDetailsOpen(false);
      setReviewsOpen(false);
      if (product.id) pushRecentlyViewed(product.id);
    }
  }, [product, visible, defaultItemId]);

  const selectedItem = product.items.find((i: any) => i.id === selectedItemId) || product.items[0];

  // Сетка вариантов у пицц разреженная: в сиде, например, есть (ТР, 20), (ТОН, 30),
  // (ТОН, 40), а пары (ТР, 30) просто нет (back/prisma/seed.ts:98-100). Раньше поиск
  // точной пары размер+тесто возвращал undefined и переключение молча не срабатывало —
  // это и был баг «не могу переключать». Теперь недостающую половину пары подбираем.
  const pickSize = (size: number) => {
    const withSize = product.items.filter((i: any) => i.size === size);
    if (withSize.length === 0) return;
    const next = withSize.find((i: any) => i.pizzaType === selectedItem?.pizzaType) ?? withSize[0];
    setSelectedItemId(next.id);
  };

  const pickDough = (type: number) => {
    const withType = product.items.filter((i: any) => i.pizzaType === type);
    if (withType.length === 0) return;
    const currentSize = selectedItem?.size ?? 0;
    // Если текущего размера у этого теста нет — берём ближайший, а не первый попавшийся.
    const next =
      withType.find((i: any) => i.size === currentSize) ??
      [...withType].sort(
        (a: any, b: any) =>
          Math.abs((a.size ?? 0) - currentSize) - Math.abs((b.size ?? 0) - currentSize),
      )[0];
    setSelectedItemId(next.id);
  };

  const ingredientsTotal = selectedIngredients.reduce((acc, id) => {
    const ingredient = product.ingredients.find((i: any) => i.id === id);
    return acc + (ingredient?.price || 0);
  }, 0);
  const price = (selectedItem?.price || 0) + ingredientsTotal;

  const toggleIngredient = (id: number) => {
    setSelectedIngredients(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const nutrition = [
    { value: product.calories, unit: t('productModal.kcal', 'ккал'), label: t('productModal.energy', 'энергия') },
    { value: product.fats, unit: 'г', label: t('productModal.fats', 'жиры') },
    { value: product.carbs, unit: 'г', label: t('productModal.carbs', 'углеводы') },
    { value: product.proteins, unit: 'г', label: t('productModal.proteins', 'белки') },
  ].filter((n) => n.value !== null && n.value !== undefined);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={immStyles.root}>
        {/* Гифка (или фото) товара на весь фон — она же цель для блюра на Android */}
        <BlurTargetView
          ref={blurTargetRef}
          onLayout={attachBlurTarget}
          style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: product.gifUrl || product.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.75)', 'transparent']}
            style={immStyles.gradientTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.55, 1]}
            style={immStyles.gradientBottom}
            pointerEvents="none"
          />
        </BlurTargetView>

        {/* Шапка */}
        <View style={immStyles.header}>
          <TouchableOpacity onPress={onClose} style={immStyles.circleBtn}>
            {glass()}
            <X size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={immStyles.title} numberOfLines={2}>{product.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Тесто (наверху): ТР / ТОН, у выбранного — полное название */}
        {doughTypes.length > 0 && (
          <View style={immStyles.optionRow}>
            {doughTypes.map((v) => (
              <OptionPill
                key={v}
                active={selectedItem?.pizzaType === v}
                short={DOUGH_LETTERS[v] ?? String(v)}
                full={DOUGH_LABEL_KEYS[v] ? t(DOUGH_LABEL_KEYS[v]) : String(v)}
                onPress={() => pickDough(v)}
                renderGlass={glass}
              />
            ))}
          </View>
        )}

        {/* КБЖУ */}
        {nutrition.length > 0 && (
          <View style={immStyles.nutritionWrap}>
            <View style={immStyles.nutritionRow}>
              {nutrition.map((n) => (
                <View key={n.label} style={immStyles.nutritionCell}>
                  <Text style={immStyles.nutritionValue}>{n.value} {n.unit}</Text>
                  <Text style={immStyles.nutritionLabel}>{n.label}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={immStyles.moreBtn} onPress={() => { setDetailsOpen(v => !v); setReviewsOpen(false); }}>
                {glass()}
                <Text style={immStyles.moreText}>{t('productModal.moreDetails', 'подробнее')}</Text>
                <ChevronDown size={14} color="#fff" style={{ transform: [{ rotate: detailsOpen ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              <TouchableOpacity style={[immStyles.moreBtn, reviewsOpen && immStyles.moreBtnActive]} onPress={() => { setReviewsOpen(v => !v); setDetailsOpen(false); }}>
                {glass()}
                <Text style={immStyles.moreText}>{t('productModal.reviews')} ({product.reviews?.length || 0})</Text>
                <ChevronDown size={14} color="#fff" style={{ transform: [{ rotate: reviewsOpen ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
            </View>
            {detailsOpen && (
              <View style={immStyles.detailsCard}>
                {glass(70)}
                <Text style={immStyles.detailsText}>
                  <Text style={immStyles.detailsMuted}>{t('productModal.composition', 'Состав: ')}</Text>
                  {product.ingredients.length > 0
                    ? product.ingredients.map((i: any) => i.name).join(', ')
                    : t('productModal.noComposition', 'не указан')}
                </Text>
              </View>
            )}
            {reviewsOpen && (
              <View style={immStyles.detailsCard}>
                {glass(70)}
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((review: any) => (
                    <View key={review.id} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[immStyles.detailsText, { fontWeight: '800', flex: 1 }]}>
                          {review.user?.fullName || t('reviews.user')}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons key={i} name={i < review.rating ? 'star' : 'star-outline'} size={12} color={i < review.rating ? '#ff7000' : 'rgba(255,255,255,0.35)'} />
                          ))}
                        </View>
                      </View>
                      {review.comment ? (
                        <Text style={[immStyles.detailsText, { color: 'rgba(255,255,255,0.8)', marginTop: 2 }]}>{review.comment}</Text>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={immStyles.detailsMuted}>{t('reviews.empty')}</Text>
                )}
              </View>
            )}
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* Добавки (блюр-карточки) */}
        {product.ingredients.length > 0 && (
          <View style={immStyles.relatedWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={immStyles.relatedRow}>
              {product.ingredients.map((item: any) => {
                const isSelected = selectedIngredients.includes(item.id);
                return (
                  <TouchableOpacity key={item.id} onPress={() => toggleIngredient(item.id)} activeOpacity={0.8}>
                    <View style={[immStyles.relatedCard, isSelected && immStyles.ingCardActive]}>
                      {glass(60)}
                      {isSelected && (
                        <>
                          <View style={immStyles.ingOverlayActive} pointerEvents="none" />
                          <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }} />
                        </>
                      )}
                      <Image source={{ uri: item.imageUrl }} style={{ width: 46, height: 46, marginTop: 2 }} resizeMode="contain" />
                      <Text style={immStyles.relatedName} numberOfLines={2}>{item.name}</Text>
                      <Text style={immStyles.ingPrice}>+{item.price} TJS</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Размер + цена: подписи короткие, поэтому ряд снова влезает рядом с кнопкой */}
        <View style={immStyles.footer}>
          <View style={immStyles.sizeRow}>
            {sizeValues.map((s) => (
              <OptionPill
                key={s}
                active={selectedItem?.size === s}
                short={SIZE_LETTERS[s] ?? String(s)}
                onPress={() => pickSize(s)}
                renderGlass={glass}
              />
            ))}
          </View>
          <SpringPress onPress={() => onAddToCart({ productItemId: selectedItem.id, ingredients: selectedIngredients })} scaleTo={0.97}>
            <View style={immStyles.addBtn}>
              <Plus size={22} color="#fff" strokeWidth={3} />
              <Text style={immStyles.addBtnText}>{price} TJS</Text>
            </View>
          </SpringPress>
        </View>
      </View>
    </Modal>
  );
};

const immStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.55,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
    gap: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // Фон даёт BlurView; overflow нужен, чтобы блюр обрезался по радиусу
    // (на Android/iOS borderRadius сам по себе BlurView не клипает).
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  nutritionWrap: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  nutritionRow: {
    flexDirection: 'row',
  },
  nutritionCell: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  nutritionLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  moreBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  moreText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  moreBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  detailsCard: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  detailsText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 19,
  },
  detailsMuted: {
    color: 'rgba(255,255,255,0.6)',
  },
  relatedWrap: {
    marginBottom: 12,
  },
  relatedRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  relatedCard: {
    width: 102,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    overflow: 'hidden',
    // Фон даёт сам BlurView (tint="dark"), собственная подложка убила бы блюр.
    backgroundColor: 'transparent',
  },
  ingOverlayActive: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  ingCardActive: {
    borderColor: 'rgba(255,255,255,0.85)',
    borderWidth: 2,
  },
  relatedName: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    minHeight: 28,
    lineHeight: 14,
  },
  ingPrice: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    gap: 10,
  },
  sizeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    height: 52,
    minWidth: 52,
    borderRadius: 999,
    paddingHorizontal: 18,
    // Фон неактивной кнопки даёт BlurView, активной — белый ниже.
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#fff',
  },
  pillText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#000',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    minWidth: 170,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
