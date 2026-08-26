import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, TextInput, Modal, Dimensions, Animated, SectionList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pizza, Croissant, Sandwich, CakeSlice, CupSoda, Martini, Soup, Salad, UtensilsCrossed, Search, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '@/store/useCartStore';
import { ChooseProductModal } from '@/components/shared/ChooseProductModal';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { SpringPress, ShimmerProductCard, Shimmer } from '@/components/ui';
const { width, height } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Пиццы': Pizza,
  'Пицца': Pizza,
  'Комбо': UtensilsCrossed,
  'Закуски': Sandwich,
  'Завтрак': Croissant,
  'Десерты': CakeSlice,
  'Напитки': CupSoda,
  'Коктейли': Martini,
  'Соусы': Soup,
  'Салаты': Salad,
};

const categoryMapping: Record<string, string> = {
  'Пиццы': 'menu.pizzas',
  'Завтрак': 'menu.breakfast',
  'Закуски': 'menu.snacks',
  'Коктейли': 'menu.cocktails',
  'Напитки': 'menu.drinks',
};

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const sectionListRef = useRef<SectionList>(null);
  const searchRef = useRef<TextInput>(null);
  const isAutoScrolling = useRef(false);

  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyVisible, setStoryVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const storyProgress = useRef(new Animated.Value(0)).current;

  const { t, i18n } = useTranslation();
  const cartItems = useCartStore(state => state.items);
  const cartTotal = useCartStore(state => state.totalAmount);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();

  const cartQuantity = useMemo(
    () => cartItems.reduce((sum: number, ci: any) => sum + ci.quantity, 0),
    [cartItems]
  );

  const iconScrollRef = useRef<ScrollView>(null);
  const iconPositions = useRef<Record<number, { x: number; w: number }>>({});

  // Активная категория всегда видна в ряду иконок (подскролл к ней)
  useEffect(() => {
    const pos = iconPositions.current[activeCategory];
    if (pos && iconScrollRef.current) {
      const target = Math.max(0, pos.x - width / 2 + pos.w / 2);
      iconScrollRef.current.scrollTo({ x: target, animated: true });
    }
  }, [activeCategory]);

  const getCategoryName = useCallback((cat: any) => {
    if (i18n.language === 'en' && cat.nameEn) return cat.nameEn;
    if (i18n.language === 'tg' && cat.nameTg) return cat.nameTg;
    const translationKey = categoryMapping[cat.name] || cat.name;
    return translationKey.includes('.') ? t(translationKey) : cat.name;
  }, [i18n.language, t]);

  const fetchData = async () => {
    try {
      const [productsRes, storiesRes] = await Promise.all([
        fetch(`${BASE_URL}/api/products`),
        fetch(`${BASE_URL}/api/stories`)
      ]);
      const productsData = await productsRes.json();
      const storiesData = await storiesRes.json();

      setCategories(productsData);
      setStories(storiesData);
      if (productsData.length > 0 && activeCategory === 0) setActiveCategory(productsData[0].id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleProductPress = (product: any) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleAddToCart = async (values: any) => {
    await useCartStore.getState().addItem(values.productItemId, values.ingredients);
  };

  const handleCategoryPress = (categoryId: number, index: number) => {
    setActiveCategory(categoryId);
    isAutoScrolling.current = true;
    sectionListRef.current?.scrollToLocation({
      sectionIndex: index,
      itemIndex: 0,
      animated: true,
      viewOffset: 0
    });
    setTimeout(() => { isAutoScrolling.current = false; }, 1000);
  };

  const openStory = (story: any) => {
    setSelectedStory(story);
    setCurrentStoryIndex(0);
    setStoryVisible(true);
    startStoryAnimation();
  };

  const startStoryAnimation = () => {
    storyProgress.setValue(0);
    Animated.timing(storyProgress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStoryItem();
      }
    });
  };

  const nextStoryItem = () => {
    if (!selectedStory) return;
    if (currentStoryIndex < selectedStory.items.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      startStoryAnimation();
    } else {
      closeStory();
    }
  };

  const closeStory = () => {
    setStoryVisible(false);
    setSelectedStory(null);
    storyProgress.stopAnimation();
  };

  const sections = useMemo(() => {
    const toRows = (products: any[]): any[][] => {
      const rows: any[][] = [];
      const list = Array.isArray(products) ? products : [];
      for (let i = 0; i < list.length; i += 2) {
        const row = list.slice(i, i + 2);
        if (row.length > 0) rows.push(row);
      }
      return rows;
    };
    const filtered = searchQuery.trim()
      ? categories.map(cat => ({
          ...cat,
          data: toRows((cat.products ?? []).filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase())))
        })).filter(cat => cat.data.length > 0)
      : categories.map(cat => ({
          ...cat,
          data: toRows(cat.products)
        })).filter(cat => cat.data.length > 0);
    return filtered;
  }, [categories, searchQuery]);

  const bannerProduct = useMemo(() => {
    const all = categories.flatMap(c => c.products ?? []);
    if (all.length === 0) return null;
    const discounted = all.find(p => p.items?.[0]?.priceOld && p.items[0].priceOld > p.items[0].price);
    return discounted ?? all[0];
  }, [categories]);

  const renderProduct = ({ item }: { item: any }) => {
    const hasDiscount = item.items[0]?.priceOld && item.items[0].priceOld > item.items[0]?.price;
    const discountPercent = hasDiscount ? Math.round((1 - item.items[0].price / item.items[0].priceOld) * 100) : 0;

    const productItemIds = new Set(item.items.map((it: any) => it.id));
    const cartQuantityForProduct = cartItems
      .filter((ci: any) => productItemIds.has(ci.productItemId ?? ci.productItem?.id))
      .reduce((sum: number, ci: any) => sum + ci.quantity, 0);
    const inCart = cartQuantityForProduct > 0;

    const goToCart = (e: any) => {
      e?.stopPropagation?.();
      router.push('/two');
    };

    return (
      <SpringPress onPress={() => handleProductPress(item)} scaleTo={0.97} style={styles.cardWrap}>
        <View style={styles.card}>
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
              </View>
            )}
            {inCart && (
              <View style={styles.cartBadge}>
                <Ionicons name="cart" size={11} color="white" />
                <Text style={styles.cartBadgeText}>{cartQuantityForProduct}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        {inCart ? (
          <Pressable onPress={goToCart} style={styles.cardPillActive}>
            <Ionicons name="cart" size={14} color="#fff" />
            <Text style={styles.cardPillActiveText} numberOfLines={1}>
              {t('menu.toCart')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.cardPill}>
            <Text style={styles.cardPillText} numberOfLines={1}>
              {t('menu.from')} {item.items[0]?.price} TJS
            </Text>
          </View>
        )}
      </SpringPress>
    );
  };

  const renderRow = ({ item }: { item: any[] }) => (
    <View style={styles.row}>
      {item.map((p) => (
        <React.Fragment key={p.id}>{renderProduct({ item: p })}</React.Fragment>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.fixedHeader, { paddingHorizontal: 16, paddingBottom: 12 }]}>
          <Shimmer width={140} height={40} rounded={12} style={{ marginBottom: 16 }} />
          <Shimmer width="100%" height={48} rounded={14} style={{ marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Shimmer width={72} height={72} rounded={16} />
            <Shimmer width={72} height={72} rounded={16} />
            <Shimmer width={72} height={72} rounded={16} />
            <Shimmer width={72} height={72} rounded={16} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <ShimmerProductCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.fixedHeader}>
        <View style={styles.headerTop}>
          <SpringPress onPress={() => router.push('/profile')} scaleTo={0.9}>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </SpringPress>
          <View style={styles.headerCenter}>
            <SpringPress onPress={() => router.push('/delivery')} scaleTo={0.97}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.headerAddressRow}>
                  <Text style={styles.headerTitle} numberOfLines={1}>Next Pizza</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                </View>
                <Text style={styles.headerSubtitle} numberOfLines={1}>{t('header.slogan')}</Text>
              </View>
            </SpringPress>
          </View>
          <SpringPress onPress={() => router.push('/notifications')} scaleTo={0.9}>
            <View style={styles.headerCartBtn}>
              <Ionicons name="notifications-outline" size={22} color={theme.text} />
            </View>
          </SpringPress>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={theme.textSubtle} style={styles.searchIcon} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder={t('header.searchPlaceholder')}
            placeholderTextColor={theme.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {!searchQuery && (
          <View style={styles.iconRow}>
            <ScrollView ref={iconScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconRowScroll}>
              <SpringPress onPress={() => searchRef.current?.focus()} scaleTo={0.92}>
                <View style={styles.iconTile}>
                  <View style={styles.iconTileIcon}>
                    <Search size={24} color={theme.text} strokeWidth={2} />
                  </View>
                  <Text style={styles.iconTileLabel}>{t('header.searchPlaceholder')}</Text>
                </View>
              </SpringPress>
              {categories.map((cat, index) => {
                const isActive = activeCategory === cat.id;
                const Icon = CATEGORY_ICONS[cat.name] ?? UtensilsCrossed;
                return (
                  <View
                    key={cat.id}
                    onLayout={(e) => {
                      const { x, width: w } = e.nativeEvent.layout;
                      iconPositions.current[cat.id] = { x, w };
                    }}>
                    <SpringPress
                      onPress={() => handleCategoryPress(cat.id, index)}
                      scaleTo={0.92}>
                      <View style={[styles.iconTile, isActive && styles.iconTileActive]}>
                        <View style={[styles.iconTileIcon, isActive && styles.iconTileIconActive]}>
                          <Icon size={24} color={isActive ? theme.primary : theme.text} strokeWidth={2} />
                        </View>
                        <Text
                          style={[styles.iconTileLabel, isActive && styles.iconTileLabelActive]}
                          numberOfLines={1}>
                          {getCategoryName(cat)}
                        </Text>
                      </View>
                    </SpringPress>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item, index) => (item?.[0]?.id ?? `row-${index}`).toString()}
        stickySectionHeadersEnabled={false}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems.length > 0 && !isAutoScrolling.current) {
            const firstVisibleSection = viewableItems[0].section;
            if (firstVisibleSection && firstVisibleSection.id !== activeCategory) {
              setActiveCategory(firstVisibleSection.id);
            }
          }
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        ListHeaderComponent={
          <>
            {bannerProduct && !searchQuery && (
              <SpringPress onPress={() => handleProductPress(bannerProduct)} scaleTo={0.98} style={styles.bannerWrap}>
                <LinearGradient
                  colors={['#FA7431', '#E85A1B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.banner}>
                  <Image
                    source={{ uri: bannerProduct.imageUrl }}
                    style={styles.bannerImage}
                    resizeMode="contain"
                  />
                  <View style={styles.bannerFooter}>
                    <Text style={styles.bannerTitle} numberOfLines={1}>{bannerProduct.name}</Text>
                    <View style={styles.bannerPill}>
                      <Text style={styles.bannerPillText}>
                        {t('menu.from')} {bannerProduct.items?.[0]?.price} TJS
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </SpringPress>
            )}
            {stories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesContainer}
              >
                {stories.map((story) => {
                  if (!story.previewImageUrl || !story.previewImageUrl.trim()) return null;
                  const previewUri = story.previewImageUrl.startsWith('http')
                    ? story.previewImageUrl
                    : `${BASE_URL}${story.previewImageUrl}`;
                  return (
                    <TouchableOpacity
                      key={story.id}
                      style={styles.storyThumbWrapper}
                      onPress={() => openStory(story)}
                    >
                      <View style={styles.storyBorder}>
                        <Image
                          source={{ uri: previewUri }}
                          style={styles.storyThumb}
                          onError={(e) => console.log('Story image error:', previewUri, e.nativeEvent.error)}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{getCategoryName(section)}</Text>
        )}
        renderItem={renderRow}
        contentContainerStyle={styles.menuList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
      />

      <ChooseProductModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
        onAddToCart={handleAddToCart}
      />

      {cartQuantity > 0 && (
        <SpringPress
          onPress={() => router.push('/two')}
          scaleTo={0.95}
          style={[styles.cartPillWrap, { bottom: insets.bottom + 16 }]}>
          <View style={styles.cartPill}>
            <View style={styles.cartPillBadge}>
              <Text style={styles.cartPillBadgeText}>{cartQuantity}</Text>
            </View>
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.cartPillText}>{Math.round(cartTotal)} TJS</Text>
          </View>
        </SpringPress>
      )}

      <Modal visible={storyVisible} transparent={true} animationType="fade">
        <View style={styles.storyModalContainer}>
          {selectedStory && (
            <View style={styles.storyContent}>
              <Image
                source={{
                  uri: (() => {
                    const src = selectedStory.items[currentStoryIndex].sourceUrl ?? '';
                    return src.startsWith('http') ? src : `${BASE_URL}${src}`;
                  })(),
                }}
                style={styles.storyImage}
              />
              <View style={[styles.storyHeader, { paddingTop: insets.top + 10 }]}>
                <View style={styles.progressBarContainer}>
                  {selectedStory.items.map((_: any, i: number) => (
                    <View key={i} style={styles.progressBackground}>
                      <Animated.View style={[styles.progressForeground, { width: i === currentStoryIndex ? storyProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) : i < currentStoryIndex ? '100%' : '0%' }]} />
                    </View>
                  ))}
                </View>
                <TouchableOpacity onPress={closeStory} style={styles.closeStoryBtn}><Ionicons name="close" size={30} color="white" /></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.storyLeftTap} onPress={() => { if (currentStoryIndex > 0) { setCurrentStoryIndex(prev => prev - 1); startStoryAnimation(); } }} />
              <TouchableOpacity style={styles.storyRightTap} onPress={nextStoryItem} />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.background,
  },
  fixedHeader: {
    zIndex: 100,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: t.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  headerCartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  cartPillWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 200,
  },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: t.primary,
    borderRadius: 999,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  cartPillBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartPillBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  cartPillText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    height: 50,
    borderRadius: 18,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: t.text,
    fontWeight: '600',
    padding: 0,
  },
  iconRow: {
    paddingBottom: 12,
  },
  iconRowScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  iconTile: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  iconTileActive: {},
  iconTileIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileIconActive: {
    backgroundColor: t.primarySoft,
    borderColor: t.primary,
  },
  iconTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: t.textMuted,
    textAlign: 'center',
  },
  iconTileLabelActive: {
    color: t.text,
  },
  bannerWrap: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  banner: {
    borderRadius: 28,
    overflow: 'hidden',
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  bannerImage: {
    width: '100%',
    height: 110,
  },
  bannerFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  bannerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.3,
  },
  bannerPill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bannerPillText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },
  storiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  storyThumbWrapper: {
    alignItems: 'center',
  },
  storyBorder: {
    padding: 3,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: t.primary,
  },
  storyThumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: t.surfaceMuted,
  },
  menuList: {
    paddingBottom: 150,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: t.text,
    marginTop: 20,
    marginBottom: 12,
    marginLeft: 2,
    letterSpacing: -0.4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cardWrap: {
    width: (width - 44) / 2,
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    backgroundColor: t.surface,
    overflow: 'hidden',
  },
  cardImageWrap: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardImage: {
    width: 132,
    height: 132,
    resizeMode: 'contain',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: t.text,
    marginTop: 10,
    paddingHorizontal: 2,
    letterSpacing: -0.2,
    minHeight: 40,
  },
  cardPill: {
    marginTop: 8,
    height: 40,
    borderRadius: 999,
    backgroundColor: t.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cardPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: t.text,
  },
  cardPillActive: {
    marginTop: 8,
    height: 40,
    borderRadius: 999,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
  },
  cardPillActiveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  cartBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: t.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  storyModalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  storyContent: {
    flex: 1,
    position: 'relative',
  },
  storyImage: {
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  storyHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    zIndex: 10,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 3,
    gap: 5,
  },
  progressBackground: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressForeground: {
    height: '100%',
    backgroundColor: 'white',
  },
  closeStoryBtn: {
    alignSelf: 'flex-end',
    marginTop: 15,
  },
  storyLeftTap: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.3,
  },
  storyRightTap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.7,
  },
});
