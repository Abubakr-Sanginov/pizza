import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, TextInput, Modal, Dimensions, Animated, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/useCartStore';
import { ChooseProductModal } from '@/components/shared/ChooseProductModal';

const BASE_URL = 'https://pizza-liart-chi.vercel.app';
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

  const addItem = useCartStore((state) => state.addItem);

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
    await addItem(values.productItemId, values.ingredients);
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

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.productCard} 
      activeOpacity={0.7}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>
          {item.ingredients.map((i: any) => i.name).join(', ')}
        </Text>
        <View style={styles.productFooter}>
          <View>
            {item.items[0]?.priceOld && (
              <Text style={styles.productPriceOld}>{item.items[0].priceOld} TJS</Text>
            )}
            <Text style={styles.productPrice}>от {item.items[0]?.price} TJS</Text>
          </View>
          <View style={styles.addBtn}>
            <Ionicons name="add" size={20} color="#ff7000" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7000" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.fixedHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>NEXT PIZZA</Text>
            <Text style={styles.headerSubtitle}>Доставка за 45 минут</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="person-outline" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9BA1A6" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск еды..."
            placeholderTextColor="#9BA1A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {!searchQuery && (
          <View style={styles.stickyCategories}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => handleCategoryPress(cat.id, index)}
                  style={[styles.categoryBtn, activeCategory === cat.id && styles.categoryBtnActive]}
                >
                  <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff7000']} tintColor="#ff7000" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf7f2',
  },
  fixedHeader: {
    backgroundColor: '#fdf7f2',
    zIndex: 100,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,112,0,0.05)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf7f2',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#687076',
    marginTop: -2,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#ff7000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#11181C',
    fontWeight: '600',
  },
  stickyCategories: {
    paddingBottom: 15,
  },
  categoriesScroll: {
    paddingHorizontal: 15,
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  categoryBtnActive: {
    backgroundColor: '#ff7000',
    borderColor: '#ff7000',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#11181C',
  },
  categoryTextActive: {
    color: 'white',
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
    borderColor: '#ff7000',
  },
  storyThumb: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
  },
  menuList: {
    paddingBottom: 150,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#11181C',
    marginTop: 20,
    marginBottom: 15,
    marginLeft: 4,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#ff7000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },
  productImage: {
    width: 120,
    height: 120,
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
    fontWeight: '800',
    color: '#11181C',
  },
  productDescription: {
    fontSize: 13,
    color: '#687076',
    lineHeight: 18,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#11181C',
  },
  productPriceOld: {
    fontSize: 12,
    color: '#9BA1A6',
    textDecorationLine: 'line-through',
    marginBottom: -2,
  },
  addBtn: {
    backgroundColor: '#fff7f0',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffeddb',
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
