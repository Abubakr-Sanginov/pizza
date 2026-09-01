import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, TextInput, Modal, Dimensions, Animated, Easing, SectionList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChooseProductModal } from '@/components/shared/ChooseProductModal';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { SpringPress, ShimmerProductCard, Shimmer, BlurImage, LiquidGlassCard } from '@/components/ui';
const { width, height } = Dimensions.get('window');

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

// Высота большого баннера-гифки (почти весь экран) и порог, на котором категории «поднимаются» в шапку
const BANNER_H = Math.round(height * 0.75);
const CATS_STICK_START = BANNER_H - 70;
const CATS_STICK_END = BANNER_H + 16;

// Пульсирующее сердце для пустого меню — «вернись, вернусь <3»
function PulsingHeart({ color }: { color: string }) {
  const beat = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 0, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [beat]);
  return (
    <Animated.View
      style={{
        transform: [
          { scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
        ],
      }}>
      <Ionicons name="heart" size={26} color={color} />
    </Animated.View>
  );
}

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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const sectionListRef = useRef<any>(null);
  const searchRef = useRef<TextInput>(null);
  const isAutoScrolling = useRef(false);

  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyVisible, setStoryVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const storyProgress = useRef(new Animated.Value(0)).current;

  // Категории прилипли к шапке (баннер проскроллен вверх)
  const [catsStuck, setCatsStuck] = useState(false);
  const catsStuckRef = useRef(false);
  // Шапка показалась при скролле (пока баннер на экране — она скрыта)
  const [headerShown, setHeaderShown] = useState(false);
  const headerShownRef = useRef(false);

  // Анимация переключения категории (бounce + stagger для карточек)
  const categoryBounce = useRef(new Animated.Value(1)).current;
  const categorySwitchKey = useRef(0);
  const [categoryRenderKey, setCategoryRenderKey] = useState(0);

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

  // Прогресс-кольцо на кнопке корзины: заполняется к 10 позициям
  const cartProgress = Math.min(cartQuantity / 10, 1);

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

  // Корзина появляется при скролле (скрыта пока баннер на экране)
  const cartRevealOpacity = useMemo(
    () => scrollY.interpolate({ inputRange: [40, 120], outputRange: [0, 1], extrapolate: 'clamp' }),
    [scrollY],
  );
  const cartRevealShift = useMemo(
    () => scrollY.interpolate({ inputRange: [0, 140], outputRange: [60, 0], extrapolate: 'clamp' }),
    [scrollY],
  );

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
    () => Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: true,
        listener: (e: any) => {
          const y = e.nativeEvent.contentOffset?.y ?? 0;
          const stuck = y > CATS_STICK_START;
          if (stuck !== catsStuckRef.current) {
            catsStuckRef.current = stuck;
            setCatsStuck(stuck);
          }
          const hdr = y > 6;
          if (hdr !== headerShownRef.current) {
            headerShownRef.current = hdr;
            setHeaderShown(hdr);
          }
        },
      },
    ),
    [scrollY],
  );
  // Появление липкой плашки категорий, когда баннер уходит вверх
  const catsReveal = useMemo(
    () => scrollY.interpolate({
      inputRange: [CATS_STICK_START, CATS_STICK_END],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    [scrollY],
  );
  // Шапка появляется одновременно с категориями при скролле
  const headerRevealOpacity = useMemo(
    () => scrollY.interpolate({ inputRange: [CATS_STICK_START, CATS_STICK_END], outputRange: [0, 1], extrapolate: 'clamp' }),
    [scrollY],
  );
  const headerRevealShift = useMemo(
    () => scrollY.interpolate({ inputRange: [CATS_STICK_START, CATS_STICK_END], outputRange: [-50, 0], extrapolate: 'clamp' }),
    [scrollY],
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
      const [productsRes, storiesRes] = await Promise.all([
        fetch(`${BASE_URL}/api/products`),
        fetch(`${BASE_URL}/api/stories`),
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
    // Bounce-анимация при переключении категории
    categoryBounce.setValue(0);
    Animated.spring(categoryBounce, { toValue: 1, useNativeDriver: true, friction: 5, tension: 180 }).start();
    // Обновляем ключ чтобы карточки анимировались заново
    categorySwitchKey.current += 1;
    setCategoryRenderKey(categorySwitchKey.current);
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
    const filtered = searchQuery.trim()
      ? categories.map(cat => ({
          ...cat,
          data: [[...(cat.products ?? []).filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))]]
        })).filter(cat => cat.data[0].length > 0)
      : categories.map(cat => ({ ...cat, data: [cat.products ?? []] })).filter(cat => cat.data[0].length > 0);
    return filtered;
  }, [categories, searchQuery]);

  const bannerProduct = useMemo(() => {
    const all = categories.flatMap(c => c.products ?? []);
    const withGif = all.filter(p => p.gifUrl);
    if (withGif.length === 0) return null;
    const idx = Math.floor(Math.random() * withGif.length);
    return withGif[idx];
  }, [categories]);

  const heroSourceUrl = bannerProduct?.gifUrl || null;
  const hasBanner = !!heroSourceUrl && !searchQuery;
  // Шапка (профиль/поиск/уведомления) скрыта пока баннер на экране, появляется при скролле
  const headerAlwaysVisible = !hasBanner;

  // Один и тот же ряд чипсов категорий: в шапке (липкий) и в контенте под баннером
  const renderCategoryRow = (scrollRef?: any) => (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.textCategoryScroll}>
      {categories.map((cat: any, index: number) => {
        const isActive = activeCategory === cat.id;
        return (
          <View key={cat.id} onLayout={(e) => {
            const { x, width: itemWidth } = e.nativeEvent.layout;
            iconPositions.current[cat.id] = { x, w: itemWidth };
          }}>
            <Pressable onPress={() => handleCategoryPress(cat.id, index)} style={styles.textCategoryPressable}>
              {isActive ? (
                <Animated.View style={{
                  transform: [{
                    scale: categoryBounce.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.15, 1],
                    }),
                  }],
                }}>
                  <Text style={[styles.textCategoryLabel, styles.textCategoryLabelActive]} numberOfLines={1}>
                    {getCategoryName(cat)}
                  </Text>
                  <Animated.View style={[styles.textCategoryIndicator, {
                    transform: [{
                      scaleX: categoryBounce.interpolate({
                        inputRange: [0, 0.4, 1],
                        outputRange: [0, 1.2, 1],
                      }),
                    }],
                  }]} />
                </Animated.View>
              ) : (
                <Text style={styles.textCategoryLabel} numberOfLines={1}>
                  {getCategoryName(cat)}
                </Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderProduct = ({ item, compact = false }: { item: any; compact?: boolean }) => {
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
      <SpringPress onPress={() => handleProductPress(item)} scaleTo={0.97} style={[styles.cardWrap, compact && styles.compactCardWrap]}>
      <View style={[styles.card, compact && styles.compactCard]}>
          <View style={[styles.cardImageWrap, compact && styles.compactCardImageWrap]}>
            <BlurView
              intensity={100}
              tint={theme.mode === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={theme.mode === 'dark'
                ? ['rgba(63,82,217,0.15)', 'rgba(8,10,15,0.92)']
                : ['rgba(220,225,255,0.8)', 'rgba(255,255,255,0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <BlurImage
              uri={item.imageUrl}
              gifUri={item.gifUrl}
              style={[styles.cardImage, compact && styles.compactCardImage]}
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

  const renderRow = ({ item, index: sectionIndex }: { item: any[]; index: number }) => {
    return (
      <Animated.View style={[{
        opacity: categoryBounce.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [1, 0.7, 1],
        }),
        transform: [{
          translateY: categoryBounce.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [8, -2, 0],
          }),
        }, {
          scale: categoryBounce.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0.96, 1.01, 1],
          }),
        }],
      }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowScroll}>
          {item.map((p, itemIdx) => (
            <React.Fragment key={p.id}>
              <Animated.View style={{
                opacity: categoryBounce.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 0.6, 1],
                }),
                transform: [{
                  translateY: categoryBounce.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [12 + itemIdx * 6, -3, 0],
                  }),
                }],
              }}>
                {renderProduct({ item: p })}
              </Animated.View>
            </React.Fragment>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Большой баннер почти на весь экран, как в референсе */}
        <Shimmer width="100%" height={BANNER_H} rounded={0} />
        <Text style={styles.loadingWatermark} pointerEvents="none">Pizza Flow</Text>
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {[0, 1, 2, 3].map((i) => (
              <Shimmer key={i} width={92} height={36} rounded={18} />
            ))}
          </View>
          {[0, 1, 2, 3].map((i) => (
            <ShimmerProductCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {totalProducts === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }>
          <Text style={styles.emptyLogo}>Pizza Flow</Text>
          <View style={styles.emptyLoaders}>
            <Shimmer width={115} height={14} rounded={8} style={{ marginBottom: 12 }} />
            <Shimmer width={270} height={32} rounded={18} style={{ marginBottom: 12 }} />
            <Shimmer width={58} height={14} rounded={8} />
          </View>
          <View style={styles.emptyCards}>
            {[0, 1, 2, 3].map((item) => (
              <Shimmer key={item} width={(width - 96) / 4} height={180} rounded={22} />
            ))}
          </View>
          <View style={styles.emptyHeartWrap}>
            <PulsingHeart color={theme.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {lang === 'en' ? 'Back very soon <3' : lang === 'tg' ? 'Ба зудӣ бармегардем <3' : 'Вернёмся очень скоро <3'}
          </Text>
          <Text style={styles.emptySubtitle}>{lang === 'en' ? 'We are already updating the menu. Pull down to refresh' : lang === 'tg' ? 'Мо аллакай менюро навсозӣ мекунем. Барои навсозӣ поён кашед' : 'Мы уже готовим обновление меню. Потяните вниз, чтобы обновить'}</Text>
        </ScrollView>
      ) : (
      <AnimatedSectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={((item: any, index: number) => (item?.[0]?.id ?? `row-${index}`).toString()) as any}
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
            {bannerProduct && heroSourceUrl && !searchQuery ? (
              <SpringPress onPress={() => handleProductPress(bannerProduct)} scaleTo={0.98}>
                <View style={{ height: BANNER_H, marginHorizontal: -16, position: 'relative' }}>
                  <Animated.View style={[styles.heroBanner, {
                    height: BANNER_H,
                    marginHorizontal: -16,
                    transform: [
                      { translateY: scrollY.interpolate({ inputRange: [0, 400], outputRange: [0, 80], extrapolate: 'clamp' }) },
                      { scale: scrollY.interpolate({ inputRange: [0, 400], outputRange: [1, 0.85], extrapolate: 'clamp' }) },
                    ],
                    opacity: scrollY.interpolate({ inputRange: [200, 400], outputRange: [1, 0], extrapolate: 'clamp' }),
                  }]}>
                    <BlurImage uri={heroSourceUrl} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.15)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                  {/* Шапка-оверлей поверх гифки */}
                  <Animated.View style={[styles.gifHeaderOverlay, { paddingTop: insets.top + 8 }, {
                    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0], extrapolate: 'clamp' }),
                    transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -60], extrapolate: 'clamp' }) }],
                  }]}>
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
                              <Text style={styles.headerTitle} numberOfLines={1}>JLT, Cluster T</Text>
                              <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
                            </View>
                            <Text style={styles.headerSubtitleLight} numberOfLines={1}>до 23:30</Text>
                          </View>
                        </SpringPress>
                      </View>
                      <SpringPress onPress={() => router.push('/notifications')} scaleTo={0.9}>
                        <View style={styles.headerCartBtnLight}>
                          <Ionicons name="notifications-outline" size={22} color="#fff" />
                        </View>
                      </SpringPress>
                    </Entrance>
                  </Animated.View>
                  {/* Инфо о товаре внизу гифки */}
                  <Animated.View style={[styles.gifCategoriesOverlay, {
                    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0], extrapolate: 'clamp' }),
                    transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, 30], extrapolate: 'clamp' }) }],
                  }]}>
                    <View style={styles.bannerProductInfo}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bannerProductName} numberOfLines={1}>{bannerProduct.name}</Text>
                        <Text style={styles.bannerProductPrice}>
                          {bannerProduct.items[0]?.price} TJS
                        </Text>
                      </View>
                      <View style={styles.bannerProductBtn}>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </View>
                    </View>
                    {renderCategoryRow(iconScrollRef)}
                  </Animated.View>
                </View>
              </SpringPress>
            ) : (
              <View style={{ height: 0 }} />
            )}
            {heroSourceUrl && !searchQuery && <View style={{ height: 12 }} />}
            {!searchQuery && categories.length > 0 && !hasBanner && (
              <View style={styles.textCategoryRow}>
                {renderCategoryRow(iconScrollRef)}
              </View>
            )}
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
        renderItem={renderRow as any}
        contentContainerStyle={styles.menuList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
        />
      )}
      {/* Липкая шапка: только поиск + категории при скролле */}
      {!headerAlwaysVisible && (
        <Animated.View
          pointerEvents={headerShown ? 'auto' : 'none'}
          style={[
            styles.fixedHeader,
            { paddingTop: insets.top + 8 },
            {
              opacity: headerRevealOpacity,
              transform: [{ translateY: headerRevealShift }],
            },
          ]}>
          <Animated.View style={[{ transform: [{ scale: searchScale }] }, styles.searchWrap]}>
            <LiquidGlassCard rounded={16} intensity={theme.mode === 'dark' ? 55 : 80} shadow="sm">
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

          {!searchQuery && categories.length > 0 && (
            <Animated.View
              pointerEvents={catsStuck ? 'auto' : 'none'}
              style={[styles.stickyCats, {
                opacity: catsReveal,
                transform: [{ translateY: catsReveal.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
              }]}>
              {renderCategoryRow(iconScrollRef)}
            </Animated.View>
          )}
        </Animated.View>
      )}

      <ChooseProductModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
        onAddToCart={handleAddToCart}
      />

      {cartQuantity > 0 && (
        <Animated.View
          style={[styles.cartPillWrap, { bottom: insets.bottom + 16 }, {
            opacity: hasBanner ? cartRevealOpacity : 1,
            transform: [
              { scale: cartPop },
              ...(hasBanner ? [{ translateY: cartRevealShift }] : []),
            ],
          }]}>
          <SpringPress onPress={() => router.push('/two')} scaleTo={0.95}>
            <View style={styles.cartBar}>
              <Text style={styles.cartBarAmount}>
                {Math.round(cartTotal)}
                <Text style={styles.cartBarCurrency}> TJS</Text>
              </Text>
              {/* Стопка круглых превью последних добавленных товаров */}
              <View style={styles.cartBarThumbs}>
                {cartItems.slice(-3).map((ci: any, idx: number, arr: any[]) => (
                  <View key={ci.id ?? idx} style={[styles.cartBarThumb, idx === 0 && arr.length > 1 && styles.cartBarThumbFirst]}>
                    <BlurImage
                      uri={ci.productItem?.product?.imageUrl ?? ci.imageUrl ?? ''}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
              {/* Круглая кнопка с прогресс-кольцом, как в референсе */}
              <View style={styles.cartBarAction}>
                <Svg width={44} height={44} style={styles.cartBarRing}>
                  <SvgCircle cx={22} cy={22} r={20} stroke={theme.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'} strokeWidth={2.5} fill="none" />
                  <SvgCircle
                    cx={22}
                    cy={22}
                    r={20}
                    stroke={theme.primary}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 20 * cartProgress} ${2 * Math.PI * 20}`}
                  />
                </Svg>
                <View style={styles.cartBarActionBtn}>
                  <Ionicons name="add" size={17} color="#fff" />
                </View>
              </View>
            </View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: t.mode === 'dark' ? 'rgba(18,21,27,0.95)' : 'rgba(243,245,251,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  gifHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  gifCategoriesOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  bannerProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  bannerProductName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bannerProductPrice: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  bannerProductBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitleLight: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
    fontWeight: '600',
  },
  headerCartBtnLight: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Тёмная стеклянная плашка корзины, как в референсе
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: t.mode === 'dark' ? 'rgba(17,19,26,0.97)' : 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: t.mode === 'dark' ? 'rgba(255,255,255,0.09)' : t.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 12,
  },
  cartBarAmount: {
    color: t.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cartBarCurrency: {
    color: t.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  cartBarThumbs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBarThumb: {
    width: 37,
    height: 37,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: t.surfaceMuted,
    borderWidth: 2.5,
    borderColor: t.mode === 'dark' ? '#111219' : '#ffffff',
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarThumbFirst: {
    marginLeft: 0,
  },
  cartBarAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarRing: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  cartBarActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
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
  textCategoryRow: {
    paddingBottom: 12,
  },
  stickyCats: {
    paddingBottom: 12,
  },
  textCategoryScroll: {
    paddingHorizontal: 16,
    gap: 26,
  },
  textCategoryPressable: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  textCategoryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: t.textMuted,
  },
  textCategoryLabelActive: {
    color: t.text,
  },
  textCategoryIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 3,
    backgroundColor: t.primary,
  },
  heroBanner: {
    height: BANNER_H,
    marginHorizontal: -16,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: t.surfaceMuted,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroBannerCopy: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 26,
  },
  heroBannerTitle: {
    color: t.text,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  heroBannerSubtitle: {
    color: t.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
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
  },
  loadingWatermark: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    color: t.mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.05)',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -2,
  },
  emptyState: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 140,
  },
  emptyLogo: {
    color: t.mode === 'dark' ? '#20242d' : '#d7dbe7',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -2,
    marginBottom: 34,
  },
  emptyLoaders: {
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyCards: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 44 },  emptyHeartWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.mode === 'dark' ? 'rgba(63,82,217,0.14)' : 'rgba(63,82,217,0.08)',
    marginBottom: 16,
  },
  emptyTitle: { color: t.text, fontSize: 21, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { color: t.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionTitle: {
    fontSize: 21,
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
  rowScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWrap: {
    width: (width - 80) / 2,
    marginBottom: 16,
  },
  compactCardWrap: {
    width: 145,
    marginRight: 0,
  },
  compactCardImageWrap: {
    height: 142,
    borderRadius: 22,
  },
  compactCardImage: {
    width: 112,
    height: 112,
  },
  card: {
    borderRadius: 22,
    backgroundColor: t.mode === 'dark' ? '#111318' : '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: t.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  },
  compactCard: {
    borderRadius: 22,
    backgroundColor: t.mode === 'dark' ? '#111318' : '#ffffff',
  },
  cardImageWrap: {
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
  },
  cardImage: {
    width: 132,
    height: 132,
    resizeMode: 'contain',
  },
  cardName: {
    fontSize: 14,
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
    borderRadius: 14,
    backgroundColor: t.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
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
    letterSpacing: 0.2,
  },
  cardPillActive: {
    marginTop: 8,
    height: 40,
    borderRadius: 14,
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
