import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ScrollView, Animated, Platform, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useCartStore } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';
import { useTranslation } from 'react-i18next';

import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SpringPress, TagBadges } from '@/components/ui';
import { pushRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface Props {
  product: any;
  visible: boolean;
  onClose: () => void;
  onAddToCart: (values: any) => void;
}

export const ChooseProductModal: React.FC<Props> = ({ product, visible, onClose, onAddToCart }) => {
  const user = useUserStore(state => state.user);
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const SIZE_LABELS: Record<number, string> = {
    20: t('productModal.sizeSmall'),
    30: t('productModal.sizeMedium'),
    40: t('productModal.sizeLarge'),
  };

  const PIZZA_TYPES = [
    { name: t('productModal.typeTraditional'), value: 1 },
    { name: t('productModal.typeThin'), value: 2 },
  ];

  const [size, setSize] = useState<number>(20);
  const [type, setType] = useState<number>(1);
  const [tab, setTab] = useState<'details' | 'reviews'>('details');
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (product && product.items.length > 0 && visible) {
      const firstAvailableItem = product.items[0];
      setSize(firstAvailableItem.size);
      setType(firstAvailableItem.pizzaType || 1);
      setTab('details');
      if (product.id) pushRecentlyViewed(product.id);
    }
  }, [product, visible]);

  const availableSizes = useMemo(() => {
    if (!product) return [];
    return [20, 30, 40].map(s => ({
      value: s,
      name: SIZE_LABELS[s],
      disabled: !product.items.some((item: any) => item.pizzaType === type && item.size === s)
    }));
  }, [product, type, SIZE_LABELS]);

  useEffect(() => {
    const isCurrentSizeDisabled = availableSizes.find(s => s.value === size)?.disabled;
    if (isCurrentSizeDisabled) {
      const firstAvailable = availableSizes.find(s => !s.disabled);
      if (firstAvailable) setSize(firstAvailable.value);
    }
  }, [type, availableSizes]);

  useEffect(() => {
    let scale = 1;
    if (size === 20) scale = 0.8;
    if (size === 30) scale = 0.9;
    if (size === 40) scale = 1.0;

    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [size]);

  if (!product) return null;

  const isPizza = product.items[0]?.pizzaType !== null;
  const currentItem = product.items.find((item: any) => item.size === size && item.pizzaType === type) || product.items[0];

  const availableTypes = isPizza
    ? PIZZA_TYPES.filter(pt => product.items.some((item: any) => item.pizzaType === pt.value))
    : [];
  const currentTypeIdx = availableTypes.findIndex(pt => pt.value === type);
  const currentTypeName = availableTypes[currentTypeIdx >= 0 ? currentTypeIdx : 0]?.name ?? '';
  const cycleType = (dir: 1 | -1) => {
    if (availableTypes.length === 0) return;
    const idx = Math.max(0, currentTypeIdx);
    const next = (idx + dir + availableTypes.length) % availableTypes.length;
    setType(availableTypes[next].value);
  };

  const totalPrice = (currentItem?.price || 0) +
    selectedIngredients.reduce((acc, id) => {
      const ingredient = product.ingredients.find((i: any) => i.id === id);
      return acc + (ingredient?.price || 0);
    }, 0);

  const toggleIngredient = (id: number) => {
    setSelectedIngredients(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    onAddToCart({
      productItemId: currentItem.id,
      ingredients: selectedIngredients,
    });
    onClose();
  };

  const submitReview = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        Alert.alert(t('reviews.thanks'));
        setRating(0);
        setComment('');
      } else {
        const error = await res.json();
        Alert.alert(error.message || t('reviews.error'));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('courier.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Animated.Image
            source={{ uri: product.imageUrl }}
            style={[styles.image, { transform: [{ scale: scaleAnim }] }]}
          />
        </View>

        <View style={styles.tabHeader}>
          <TouchableOpacity onPress={() => setTab('details')} style={[styles.tabBtn, tab === 'details' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === 'details' && styles.tabTextActive]}>{t('productModal.details')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('reviews')} style={[styles.tabBtn, tab === 'reviews' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === 'reviews' && styles.tabTextActive]}>
              {t('productModal.reviews')} ({product.reviews?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {tab === 'details' ? (
            <>
              <Text style={styles.name}>{product.name}</Text>
              <View style={{ alignItems: 'center', marginTop: 6 }}>
                <TagBadges
                  tags={product.tags}
                  lang={i18n.language}
                  dark={theme.mode === 'dark'}
                />
              </View>
              {product.description ? (
                <Text style={styles.description}>{product.description}</Text>
              ) : null}

              {isPizza && (
                <View style={styles.selectors}>
                  <View style={styles.selectorRow}>
                    {availableSizes.map((s) => (
                      <TouchableOpacity
                        key={s.value}
                        style={[
                          styles.selectorBtn,
                          size === s.value && styles.selectorBtnActive,
                          s.disabled && styles.selectorBtnDisabled
                        ]}
                        onPress={() => !s.disabled && setSize(s.value)}
                        disabled={s.disabled}
                      >
                        <Text style={[
                          styles.selectorText,
                          size === s.value && styles.selectorTextActive,
                          s.disabled && styles.selectorTextDisabled
                        ]}>
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {availableTypes.length > 0 && (
                    <View style={styles.typeCarousel}>
                      <TouchableOpacity
                        onPress={() => cycleType(-1)}
                        style={styles.typeChevron}
                        disabled={availableTypes.length < 2}>
                        <ChevronLeft size={20} color={theme.text} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={styles.typeName} numberOfLines={1}>{currentTypeName}</Text>
                      <TouchableOpacity
                        onPress={() => cycleType(1)}
                        style={styles.typeChevron}
                        disabled={availableTypes.length < 2}>
                        <ChevronRight size={20} color={theme.text} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {product.ingredients.length > 0 && (
                <View style={styles.ingredientsSection}>
                  <Text style={styles.sectionTitle}>{t('productModal.addIngredients')}</Text>
                  <View style={styles.ingredientsGrid}>
                    {product.ingredients.map((item: any) => {
                      const isSelected = selectedIngredients.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.ingredientCard, isSelected && styles.ingredientActive]}
                          onPress={() => toggleIngredient(item.id)}
                        >
                          {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} style={styles.checkIcon} />}
                          <Image source={{ uri: item.imageUrl }} style={styles.ingredientImage} />
                          <Text style={styles.ingredientName}>{item.name}</Text>
                          <Text style={styles.ingredientPrice}>{item.price} TJS</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          ) : (
              <View style={styles.reviewsList}>
                {user ? (
                  <View style={styles.addReviewForm}>
                    <Text style={styles.addReviewTitle}>{t('reviews.leaveReview')}</Text>
                    <View style={styles.starRowBig}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                          <Ionicons
                            name={s <= rating ? "star" : "star-outline"}
                            size={32}
                            color={s <= rating ? "#ff7000" : "#9BA1A6"}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.reviewInput}
                      placeholder={t('reviews.yourComment')}
                      placeholderTextColor={theme.textSubtle}
                      multiline
                      value={comment}
                      onChangeText={setComment}
                    />
                    <SpringPress onPress={submitReview} disabled={!rating || submitting} scaleTo={0.96}>
                      {!rating || submitting ? (
                        <View style={[styles.submitReviewBtn, styles.submitReviewBtnDisabled]}>
                          {submitting ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : (
                            <Text style={styles.submitReviewText}>{t('reviews.sendReview')}</Text>
                          )}
                        </View>
                      ) : (
                        <LinearGradient
                          colors={(theme.mode === 'dark' ? gradients.dark : gradients.light).primary}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.submitReviewBtn}>
                          <Text style={styles.submitReviewText}>{t('reviews.sendReview')}</Text>
                        </LinearGradient>
                      )}
                    </SpringPress>
                  </View>
                ) : (
                  <View style={styles.loginToReview}>
                    <Text style={styles.loginToReviewText}>{t('reviews.loginToReview')}</Text>
                  </View>
                )}

                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((review: any) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.avatarText}>{review.user?.fullName?.[0] || 'U'}</Text>
                        </View>
                        <View style={styles.reviewMeta}>
                          <Text style={styles.userName}>{review.user?.fullName || t('reviews.user')}</Text>
                          <View style={styles.starRow}>
                            {[...Array(5)].map((_, i) => (
                              <Ionicons
                                key={i}
                                name={i < review.rating ? "star" : "star-outline"}
                                size={14}
                                color={i < review.rating ? "#ff7000" : "#9BA1A6"}
                              />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.reviewText}>{review.comment}</Text>

                      {user && (Number(user.id) === review.userId || user.role === 'ADMIN') && (
                        <TouchableOpacity
                          style={styles.deleteReviewBtn}
                          onPress={() => {
                            Alert.alert(
                              t('reviews.deleteTitle'),
                              t('reviews.deleteConfirm'),
                              [
                                { text: t('reviews.cancel'), style: 'cancel' },
                                {
                                  text: t('reviews.delete'),
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      const res = await fetch(`${BASE_URL}/api/reviews/${review.id}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        Alert.alert(t('courier.success'), t('reviews.delete'));
                                      } else {
                                        Alert.alert(t('courier.error'), t('reviews.deleteConfirm'));
                                      }
                                    } catch (e) {
                                      Alert.alert(t('courier.error'), t('courier.networkError'));
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.danger} />
                          <Text style={styles.deleteReviewText}>{t('reviews.delete')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyReviews}>
                    <Ionicons name="chatbox-outline" size={60} color={theme.textSubtle} />
                    <Text style={styles.emptyReviewsText}>{t('reviews.empty')}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {tab === 'details' && (
            <View style={styles.footer}>
              <SpringPress onPress={handleAdd} scaleTo={0.97}>
                <View style={styles.addBtn}>
                  <Plus size={24} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.addBtnText}>{totalPrice} TJS</Text>
                </View>
              </SpringPress>
            </View>
          )}
        </View>
    </Modal>
  );
};

const makeStyles = (t: Theme) => StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: t.background,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 320,
  },
  image: { width: '86%', height: 290, resizeMode: 'contain' },
  tabHeader: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 6, marginBottom: 10 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: t.surface },
  tabBtnActive: { backgroundColor: t.primarySoft },
  tabText: { fontSize: 14, fontWeight: '800', color: t.textMuted },
  tabTextActive: { color: t.primary },
  scroll: { paddingHorizontal: 20, paddingBottom: 180 },
  name: { fontSize: 26, fontWeight: '900', color: t.text, textAlign: 'center', marginTop: 4, letterSpacing: -0.4 },
  description: { fontSize: 13, color: t.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19, paddingHorizontal: 8 },
  selectors: { marginTop: 20, gap: 12 },
  selectorRow: { flexDirection: 'row', backgroundColor: t.surface, borderRadius: 999, borderWidth: 1, borderColor: t.border, padding: 4 },
  selectorBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 999 },
  selectorBtnActive: { backgroundColor: t.text },
  selectorBtnDisabled: { opacity: 0.25 },
  selectorText: { fontSize: 14, fontWeight: '800', color: t.textMuted },
  selectorTextActive: { color: t.background },
  selectorTextDisabled: { color: t.textSubtle },
  typeCarousel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  typeChevron: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: { fontSize: 15, fontWeight: '800', color: t.text, flex: 1, textAlign: 'center' },
  ingredientsSection: { marginTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: t.text, marginBottom: 15 },
  ingredientsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ingredientCard: {
    width: '30.5%',
    backgroundColor: t.surface,
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ingredientActive: { borderColor: t.primary },
  checkIcon: { position: 'absolute', top: 6, right: 6 },
  ingredientImage: { width: 52, height: 52, resizeMode: 'contain' },
  ingredientName: { fontSize: 11, fontWeight: '700', color: t.text, marginTop: 6, textAlign: 'center' },
  ingredientPrice: { fontSize: 12, fontWeight: '900', color: t.text, marginTop: 2 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: t.background,
    borderTopWidth: 1,
    borderTopColor: t.border,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 58,
    borderRadius: 999,
    backgroundColor: t.primary,
  },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  reviewsList: { gap: 15 },
  reviewCard: {
    backgroundColor: t.surface,
    borderRadius: 25,
    padding: 15,
    shadowColor: t.shadow,
    shadowOpacity: t.mode === 'dark' ? 0.3 : 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: t.primary,
  },
  avatarText: { color: t.primary, fontWeight: '900', fontSize: 16 },
  reviewMeta: { flex: 1, marginLeft: 10 },
  userName: { fontSize: 14, fontWeight: '800', color: t.text },
  starRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 11, color: t.textSubtle },
  reviewText: { fontSize: 14, color: t.text, lineHeight: 20 },
  addReviewForm: {
    backgroundColor: t.surface,
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    shadowColor: t.shadow,
    shadowOpacity: t.mode === 'dark' ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  addReviewTitle: { fontSize: 18, fontWeight: '900', color: t.text, marginBottom: 10 },
  starRowBig: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  reviewInput: {
    backgroundColor: t.surfaceMuted,
    borderRadius: 15,
    padding: 15,
    minHeight: 100,
    fontSize: 14,
    color: t.text,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  submitReviewBtn: {
    backgroundColor: t.primary,
    borderRadius: 15,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewBtnDisabled: { backgroundColor: t.textSubtle },
  submitReviewText: { color: t.primaryContrast, fontSize: 16, fontWeight: '900' },
  loginToReview: {
    padding: 20,
    backgroundColor: t.primarySoft,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: t.primary,
  },
  loginToReviewText: { color: t.primary, fontWeight: '700' },
  deleteReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: t.mode === 'dark' ? 'rgba(248,113,113,0.15)' : '#fff1f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deleteReviewText: { color: t.danger, fontSize: 12, fontWeight: '700' },
  emptyReviews: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 15 },
  emptyReviewsText: { fontSize: 14, color: t.textSubtle, textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },
});
