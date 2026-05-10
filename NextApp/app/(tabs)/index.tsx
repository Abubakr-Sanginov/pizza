import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, TextInput, Modal, Dimensions, Animated, SectionList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '@/store/useCartStore';
import { ChooseProductModal } from '@/components/shared/ChooseProductModal';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients, motion } from '@/constants/Colors';
import { SpringPress, LiquidGlassCard, LiquidGlassPill, AmbientBackdrop, ShimmerProductCard, Shimmer } from '@/components/ui';
const { width, height } = Dimensions.get('window');

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
  const isAutoScrolling = useRef(false);

  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyVisible, setStoryVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const storyProgress = useRef(new Animated.Value(0)).current;

  const { t, i18n } = useTranslation();
  const cartItems = useCartStore(state => state.items);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();

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

  const toggleLanguage = () => {
    const langs = ['ru', 'tg', 'en'];
    const nextIdx = (langs.indexOf(i18n.language) + 1) % langs.length;
    i18n.changeLanguage(langs[nextIdx]);
  };

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
    const filtered = searchQuery.trim() 
      ? categories.map(cat => ({
          ...cat,
          data: cat.products.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        })).filter(cat => cat.data.length > 0)
      : categories.map(cat => ({
          ...cat,
          data: cat.products
        }));
    return filtered;
  }, [categories, searchQuery]);

  const categoryMapping: Record<string, string> = {
    'Пиццы': 'menu.pizzas',
    'Завтрак': 'menu.breakfast',
    'Закуски': 'menu.snacks',
    'Коктейли': 'menu.cocktails',
    'Напитки': 'menu.drinks',
  };

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

    const grad = theme.mode === 'dark' ? gradients.dark : gradients.light;

    return (
      <SpringPress onPress={() => handleProductPress(item)} scaleTo={0.97} style={styles.productCardWrap}>
        <LiquidGlassCard rounded={28} shadow="md">
          <View style={styles.productCard}>
            <View style={styles.productImageWrap}>
              <LinearGradient
                colors={grad.surface}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              {hasDiscount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
                </View>
              )}
              {inCart && (
                <View style={styles.cartBadge}>
                  <Ionicons name="cart" size={12} color="white" />
                  <Text style={styles.cartBadgeText}>{cartQuantityForProduct}</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.ingredients.map((i: any) => i.name).join(', ')}
              </Text>
              <View style={styles.productFooter}>
                <View>
                  {hasDiscount && (
                    <Text style={styles.productPriceOld}>{item.items[0].priceOld} TJS</Text>
                  )}
                  <Text style={styles.productPrice}>
                    {t('menu.from')} <Text style={styles.productPriceAmount}>{item.items[0]?.price}</Text> TJS
                  </Text>
                </View>
                {inCart ? (
                  <Pressable onPress={goToCart} style={styles.toCartBtnWrap}>
                    <LinearGradient
                      colors={grad.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.toCartBtn}>
                      <Ionicons name="cart" size={16} color="#fff" />
                      <Text style={styles.toCartBtnText} numberOfLines={1}>
                        {t('menu.toCart')}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <View style={styles.addBtn}>
                    <Ionicons name="add" size={20} color={theme.primary} />
                  </View>
                )}
              </View>
            </View>
          </View>
        </LiquidGlassCard>
      </SpringPress>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AmbientBackdrop />
        <View style={[styles.fixedHeader, { paddingHorizontal: 22, paddingBottom: 12 }]}>
          <Shimmer width={140} height={36} rounded={12} style={{ marginBottom: 18 }} />
          <Shimmer width="100%" height={52} rounded={22} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Shimmer width={90} height={40} rounded={18} />
            <Shimmer width={110} height={40} rounded={18} />
            <Shimmer width={100} height={40} rounded={18} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
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
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerKicker}>{t('header.slogan')}</Text>
            <Text style={styles.headerTitle}>Next Pizza</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SpringPress onPress={toggleLanguage} scaleTo={0.9}>
              <LiquidGlassCard rounded={22} shadow="sm" style={styles.profileBtnWrap}>
                <View style={styles.profileBtn}>
                  <Text style={{ fontWeight: '900', fontSize: 13, color: theme.primary }}>
                    {i18n.language.toUpperCase()}
                  </Text>
                </View>
              </LiquidGlassCard>
            </SpringPress>
            <SpringPress scaleTo={0.9}>
              <LiquidGlassCard rounded={22} shadow="sm" style={styles.profileBtnWrap}>
                <View style={styles.profileBtn}>
                  <Ionicons name="person-outline" size={22} color={theme.text} />
                </View>
              </LiquidGlassCard>
            </SpringPress>
          </View>
        </View>

        <LiquidGlassCard rounded={22} shadow="sm" style={styles.searchContainer}>
          <View style={styles.searchInner}>
            <Ionicons name="search-outline" size={20} color={theme.textSubtle} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('header.searchPlaceholder')}
              placeholderTextColor={theme.textSubtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        </LiquidGlassCard>

        {!searchQuery && (
          <View style={styles.stickyCategories}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {categories.map((cat, index) => {
                const currentLang = i18n.language;
                let translatedName = cat.name;

                if (currentLang === 'en' && cat.nameEn) {
                  translatedName = cat.nameEn;
                } else if (currentLang === 'tg' && cat.nameTg) {
                  translatedName = cat.nameTg;
                } else {
                  const translationKey = categoryMapping[cat.name] || cat.name;
                  translatedName = translationKey.includes('.') ? t(translationKey) : cat.name;
                }
                const isActive = activeCategory === cat.id;
                const grad = theme.mode === 'dark' ? gradients.dark : gradients.light;
                return (
                  <SpringPress
                    key={cat.id}
                    onPress={() => handleCategoryPress(cat.id, index)}
                    scaleTo={0.94}>
                    {isActive ? (
                      <LinearGradient
                        colors={grad.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.categoryBtn, styles.categoryBtnActive]}>
                        <Text style={[styles.categoryText, styles.categoryTextActive]}>
                          {translatedName}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.categoryBtn}>
                        <Text style={styles.categoryText}>{translatedName}</Text>
                      </View>
                    )}
                  </SpringPress>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
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
            {stories.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.storiesContainer}
              >
                {stories.map((story) => (
                  <TouchableOpacity 
                    key={story.id} 
                    style={styles.storyThumbWrapper}
                    onPress={() => openStory(story)}
                  >
                    <View style={styles.storyBorder}>
                      <Image source={{ uri: story.previewImageUrl }} style={styles.storyThumb} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        }
        renderSectionHeader={({ section: { name } }) => (
          <Text style={styles.sectionTitle}>{name}</Text>
        )}
        renderItem={renderProduct}
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

      <Modal visible={storyVisible} transparent={true} animationType="fade">
        <View style={styles.storyModalContainer}>
          {selectedStory && (
            <View style={styles.storyContent}>
              <Image source={{ uri: selectedStory.items[currentStoryIndex].sourceUrl }} style={styles.storyImage} />
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
  },
  fixedHeader: {
    zIndex: 100,
    paddingTop: 14,
    paddingBottom: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: t.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 22,
  },
  headerKicker: {
    fontSize: 11,
    color: t.textMuted,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: t.text,
    letterSpacing: -1.2,
    marginTop: 2,
  },
  profileBtnWrap: {
    overflow: 'hidden',
  },
  profileBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginHorizontal: 22,
    marginBottom: 16,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: t.text,
    fontWeight: '600',
  },
  stickyCategories: {
    paddingBottom: 15,
  },
  categoriesScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: t.surface,
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: t.mode === 'dark' ? 0.25 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryBtnActive: {
    shadowColor: t.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '800',
    color: t.textMuted,
    letterSpacing: 0.2,
  },
  categoryTextActive: {
    color: '#fff',
  },
  storiesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
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
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: t.surfaceMuted,
  },
  menuList: {
    paddingBottom: 150,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: t.text,
    marginTop: 22,
    marginBottom: 14,
    marginLeft: 4,
    letterSpacing: -0.6,
  },
  productCardWrap: {
    marginBottom: 14,
  },
  productCard: {
    flexDirection: 'row',
    padding: 14,
  },
  productImageWrap: {
    width: 120,
    height: 120,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  productName: {
    fontSize: 18,
    fontWeight: '900',
    color: t.text,
    letterSpacing: -0.3,
  },
  productDescription: {
    fontSize: 13,
    color: t.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  productPrice: {
    fontSize: 13,
    color: t.textMuted,
    fontWeight: '700',
  },
  productPriceAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: t.text,
  },
  productPriceOld: {
    fontSize: 12,
    color: t.textSubtle,
    textDecorationLine: 'line-through',
    marginBottom: -2,
  },
  addBtn: {
    backgroundColor: t.primarySoft,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: t.mode === 'dark' ? 'transparent' : '#ffeddb',
  },
  addBtnActive: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  toCartBtnWrap: {
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  toCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    minWidth: 130,
    justifyContent: 'center',
  },
  toCartBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  cartBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
    shadowColor: t.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: t.surface,
  },
  cartBadgeText: {
    color: t.primaryContrast,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: t.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: t.danger,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
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
