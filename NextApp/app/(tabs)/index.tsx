import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, TextInput, Modal, Dimensions, Animated, Easing, SectionList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Pizza, Croissant, Sandwich, CakeSlice, CupSoda, Martini, Soup, Salad, UtensilsCrossed, Search, Sparkles, Clock3, MapPin, Flame, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '@/store/useCartStore';
import { ChooseProductModal } from '@/components/shared/ChooseProductModal';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { SpringPress, ShimmerProductCard, Shimmer, BlurImage, LiquidGlassCard, AmbientBackdrop } from '@/components/ui';
const { width, height } = Dimensions.get('window');

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

// Каскадное появление блока: плавное всплывание с лёгким «отскоком»
function Entrance({ delay = 0, y = 20, style, children }: { delay?: number; y?: number; style?: any; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();
  }, [v, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

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

const uiText = {
  ru: {
    brand: 'Pizza Flow',
    slogan: 'Заказ в пару тапов',
    heroBadge: 'Быстрая кухня',
    choose: 'Выбрать',
    eta: '15–25 мин',
    pickup: 'Самовывоз',
    freshToday: 'Сегодня в меню',
    inMenu: 'В меню',
  },
  en: {
    brand: 'Pizza Flow',
    slogan: 'Order in a few taps',
    heroBadge: 'Fast kitchen',
    choose: 'Choose',
    eta: '15–25 min',
    pickup: 'Pickup',
    freshToday: 'Fresh today',
    inMenu: 'On menu',
  },
  tg: {
    brand: 'Pizza Flow',
    slogan: 'Фармоиш дар чанд ламс',
    heroBadge: 'Ошхонаи зуд',
    choose: 'Интихоб',
    eta: '15–25 дақ',
    pickup: 'Худбурд',
    freshToday: 'Имрӯз',
    inMenu: 'Дар меню',
  },
} as const;

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const sectionListRef = useRef<any>(null);
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
  const lang = i18n.language === 'en' || i18n.language.startsWith('en-')
    ? 'en'
    : i18n.language === 'tg' || i18n.language.startsWith('tg-')
      ? 'tg'
      : 'ru';
  const copy = uiText[lang];

  const cartQuantity = useMemo(
    () => cartItems.reduce((sum: number, ci: any) => sum + ci.quantity, 0),
    [cartItems]
  );

  const totalProducts = useMemo(
    () => categories.reduce((sum, category) => sum + (category.products?.length ?? 0), 0),
    [categories],
  );

  const etaText = useMemo(() => {
    if (!cartQuantity) return copy.eta;
    const min = 14 + Math.min(cartQuantity * 2, 8);
    const max = min + 8;
    const suffix = lang === 'en' ? 'min' : lang === 'tg' ? 'дақ' : 'мин';
    return `${min}–${max} ${suffix}`;
  }, [cartQuantity, copy.eta, lang]);

  // Анимации: вращение градиентного кольца hero, параллакс hero при скролле,
  // пружина появления пилюли корзины и масштаб поиска при фокусе
  const glowSpin = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const cartPop = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(glowSpin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [glowSpin]);

  const prevQty = useRef(0);
  useEffect(() => {
    if (cartQuantity > prevQty.current) {
      cartPop.setValue(0.7);
      Animated.spring(cartPop, { toValue: 1, useNativeDriver: true, friction: 4, tension: 170 }).start();
    } else if (cartQuantity === 0 && prevQty.current > 0) {
      Animated.timing(cartPop, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
    prevQty.current = cartQuantity;
  }, [cartQuantity, cartPop]);

  const glowRotate = glowSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const heroParallaxStyle = {
    opacity: scrollY.interpolate({ inputRange: [0, 280], outputRange: [1, 0], extrapolate: 'clamp' }),
    transform: [
      { translateY: scrollY.interpolate({ inputRange: [0, 280], outputRange: [0, 80], extrapolate: 'clamp' }) },
    ],
  };
  const onListScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
    [scrollY]
  );
  const onSearchFocus = useCallback(() => {
    Animated.spring(searchScale, { toValue: 1.015, useNativeDriver: true, friction: 6, tension: 160 }).start();
  }, [searchScale]);
  const onSearchBlur = useCallback(() => {
    Animated.spring(searchScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 160 }).start();
  }, [searchScale]);

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
      const [productsRes, storiesRes, heroRes] = await Promise.all([
        fetch(`${BASE_URL}/api/products`),
        fetch(`${BASE_URL}/api/stories`),
        fetch(`${BASE_URL}/api/settings/hero-banner`).catch(() => null),
      ]);
      const productsData = await productsRes.json();
      const storiesData = await storiesRes.json();
      if (heroRes?.ok) {
        const heroData = await heroRes.json().catch(() => null);
        setHeroBannerUrl(heroData?.heroBannerUrl ?? null);
      }

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
            <BlurView
              intensity={100}
              tint={theme.mode === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={theme.mode === 'dark'
                ? ['rgba(255,150,50,0.18)', 'rgba(30,20,15,0.7)']
                : ['rgba(255,200,120,0.35)', 'rgba(255,247,240,0.85)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.35)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <BlurImage
              uri={item.imageUrl}
              gifUri={item.gifUrl}
              style={styles.cardImage}
              resizeMode="contain"
            />
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
            <View style={styles.cardPillDivider} />
            <Text style={styles.cardPillAction} numberOfLines={1}>{copy.choose}</Text>
          </View>
        )}
      </SpringPress>
    );
  };

  const renderRow = ({ item, index: sectionIndex }: { item: any[]; index: number }) => (
    <Animated.View style={[styles.row, {
      opacity: scrollY.interpolate({
        inputRange: [0, 150 + sectionIndex * 120, 250 + sectionIndex * 120],
        outputRange: [0, 0.4, 1],
        extrapolate: 'clamp',
      }),
      transform: [{
        translateY: scrollY.interpolate({
          inputRange: [0, 200 + sectionIndex * 100],
          outputRange: [50 + sectionIndex * 15, 0],
          extrapolate: 'clamp',
        }),
      }],
    }]}>
      {item.map((p) => (
        <React.Fragment key={p.id}>{renderProduct({ item: p })}</React.Fragment>
      ))}
    </Animated.View>
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
      <AmbientBackdrop />
      <View style={styles.fixedHeader}>
        <Entrance delay={0} y={-14} style={styles.headerTop}>
          <SpringPress onPress={() => router.push('/profile')} scaleTo={0.9}>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </SpringPress>
          <View style={styles.headerCenter}>
            <SpringPress onPress={() => router.push('/delivery')} scaleTo={0.97}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.headerAddressRow}>
                  <Text style={styles.headerTitle} numberOfLines={1}>{copy.brand}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                </View>
                <Text style={styles.headerSubtitle} numberOfLines={1}>{copy.slogan}</Text>
              </View>
            </SpringPress>
          </View>
          <SpringPress onPress={() => router.push('/notifications')} scaleTo={0.9}>
            <View style={styles.headerCartBtn}>
              <Ionicons name="notifications-outline" size={22} color={theme.text} />
            </View>
          </SpringPress>
        </Entrance>

        <Animated.View style={[{ transform: [{ scale: searchScale }] }, styles.searchWrap]}>
          <LiquidGlassCard rounded={18} intensity={theme.mode === 'dark' ? 70 : 85} shadow="sm">
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={theme.textSubtle} style={styles.searchIcon} />
              <TextInput
                ref={searchRef}
                style={styles.searchInput}
                placeholder={t('header.searchPlaceholder')}
                placeholderTextColor={theme.textSubtle}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                clearButtonMode="while-editing"
              />
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {!searchQuery && (
          <View style={styles.iconRow}>
            <ScrollView ref={iconScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconRowScroll}>
              <Entrance delay={80}>
                <SpringPress onPress={() => searchRef.current?.focus()} scaleTo={0.92}>
                  <View style={styles.iconTile}>
                    <View style={styles.iconTileIcon}>
                      <Search size={24} color={theme.text} strokeWidth={2} />
                    </View>
                    <Text style={styles.iconTileLabel}>{t('header.searchPlaceholder')}</Text>
                  </View>
                </SpringPress>
              </Entrance>
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
                    <Entrance delay={120 + index * 40}>
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
                    </Entrance>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <AnimatedSectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item, index) => (item?.[0]?.id ?? `row-${index}`).toString()}
        stickySectionHeadersEnabled={false}
        onScroll={onListScroll}
        scrollEventThrottle={16}
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
            {heroBannerUrl && !searchQuery && (
              <Animated.View style={[{
                height: height * 0.55,
                marginHorizontal: -16,
                transform: [
                  { translateY: scrollY.interpolate({ inputRange: [0, 400], outputRange: [0, 80], extrapolate: 'clamp' }) },
                  { scale: scrollY.interpolate({ inputRange: [0, 400], outputRange: [1, 0.85], extrapolate: 'clamp' }) },
                ],
                opacity: scrollY.interpolate({ inputRange: [200, 400], outputRange: [1, 0], extrapolate: 'clamp' }),
              }]}>
                <BlurImage uri={heroBannerUrl} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', theme.mode === 'dark' ? 'rgba(20,16,12,0.95)' : 'rgba(245,245,240,0.95)']}
                  start={{ x: 0.5, y: 0.6 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
            {heroBannerUrl && !searchQuery && <View style={{ height: 30 }} />}
            {stories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesContainer}
              >
                {stories.map((story, idx) => {
                  if (!story.previewImageUrl || !story.previewImageUrl.trim()) return null;
                  const previewUri = story.previewImageUrl.startsWith('http')
                    ? story.previewImageUrl
                    : `${BASE_URL}${story.previewImageUrl}`;
                  return (
                    <Entrance key={story.id} delay={220 + idx * 60}>
                      <TouchableOpacity
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
                    </Entrance>
                  );
                })}
              </ScrollView>
            )}
          </>
        }
        renderSectionHeader={({ section }: any) => {
          if (categories.length > 0 && section.id === categories[0].id) return <View style={{ height: 20 }} />;
          return <Text style={styles.sectionTitle}>{getCategoryName(section)}</Text>;
        }}
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
        <Animated.View
          style={[styles.cartPillWrap, { bottom: insets.bottom + 16 }, { transform: [{ scale: cartPop }] }]}>
          <SpringPress onPress={() => router.push('/two')} scaleTo={0.95}>
            <LinearGradient
              colors={['#ff8a3d', '#ff5400']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cartPill}>
              <View style={styles.cartPillBadge}>
                <Text style={styles.cartPillBadgeText}>{cartQuantity}</Text>
              </View>
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={styles.cartPillText}>{Math.round(cartTotal)} TJS</Text>
            </LinearGradient>
          </SpringPress>
        </Animated.View>
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
    paddingBottom: 8,
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
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 18,
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
    marginTop: 4,
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
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bannerPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroWrap: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  heroCard: {
    borderRadius: 26,
    padding: 18,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroCol: {
    flex: 1,
  },
  heroGifWrap: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGifRing: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
    overflow: 'hidden',
  },
  heroGifFrame: {
    width: 118,
    height: 118,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: t.surfaceMuted,
  },
  heroGif: {
    width: '100%',
    height: '100%',
  },
  heroGifChip: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: t.mode === 'dark' ? 'rgba(40,33,28,0.94)' : 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: t.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  heroGifChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: t.text,
    letterSpacing: 0.2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: t.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: t.text,
    fontSize: 12,
    fontWeight: '800',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroStat: {
    flex: 1,
    backgroundColor: t.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    padding: 12,
    gap: 6,
  },
  heroStatValue: {
    color: t.text,
    fontSize: 14,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: t.textMuted,
    fontSize: 11,
    fontWeight: '700',
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
    borderRadius: 28,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardImageWrap: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 28,
    overflow: 'hidden',
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
  cardMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: t.textMuted,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  cardPill: {
    marginTop: 8,
    height: 40,
    borderRadius: 999,
    backgroundColor: t.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    flexDirection: 'row',
    gap: 8,
  },
  cardPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: t.text,
  },
  cardPillDivider: {
    width: 1,
    height: 14,
    backgroundColor: t.border,
  },
  cardPillAction: {
    fontSize: 12,
    fontWeight: '900',
    color: t.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
