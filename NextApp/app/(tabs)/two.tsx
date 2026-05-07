import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View as DefaultView, Text as DefaultText, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, RefreshControl, LayoutAnimation, Dimensions, ActivityIndicator, Keyboard } from 'react-native';
import { useCartStore, getCartToken } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const BASE_URL = 'https://pizza-liart-chi.vercel.app';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { items, totalAmount, loading, fetchCart, updateQuantity, removeItem } = useCartStore();
  const [refreshing, setRefreshing] = useState(false);
  const [step, setStep] = useState(1); 

  // Order Details
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [doorCode, setDoorCode] = useState('');
  const [comment, setComment] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  // Personal Info
  const user = useUserStore(state => state.user);
  const clearCart = useCartStore(state => state.clearCart);
  const [firstName, setFirstName] = useState(user?.fullName.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.fullName.split(' ')[1] || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map/Stores state
  const [stores, setStores] = useState<any[]>([]);
  const [location, setLocation] = useState({ lat: 38.5763, lon: 68.7831 });
  const [locating, setLocating] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // TAXES AND DELIVERY (Matched with Web)
  const VAT_PERCENT = 15;
  const DELIVERY_PRICE = deliveryType === 'DELIVERY' ? 250 : 0;
  const vatPrice = (totalAmount * VAT_PERCENT) / 100;
  const finalTotal = totalAmount + DELIVERY_PRICE + vatPrice;

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/stores`);
        const data = await res.json();
        setStores(data);
      } catch (e) {
        console.error('Fetch stores error:', e);
      }
    };
    fetchStores();

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [fetchCart]);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  const nextStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(2);
  };

  const prevStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(1);
  };

  const onSubmitOrder = async () => {
    if (!firstName || !lastName || !phone || !email) {
      Alert.alert(t('cart.fillContacts'));
      return;
    }

    if (deliveryType === 'DELIVERY' && !address) {
      Alert.alert(t('cart.fillAddress'));
      return;
    }

    if (deliveryType === 'PICKUP' && !selectedStoreId) {
      Alert.alert(t('cart.fillStore'));
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getCartToken();
      const orderData = {
        cartToken: token,
        fullName: `${firstName} ${lastName}`,
        email,
        phone,
        address,
        apartment,
        entrance,
        floor,
        doorCode,
        deliveryType,
        storeId: selectedStoreId,
        comment,
        lat: location.lat,
        lng: location.lon,
        userId: user?.id
      };

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('courier.error'));
      }

      Alert.alert(t('cart.success'));
      clearCart();
      router.replace('/profile');
    } catch (e: any) {
      Alert.alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`,
        { headers: { 'User-Agent': 'NextPizzaMobileApp/1.0' } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    }
  };

  const locateUser = async () => {
    setLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      const newLoc = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      setLocation(newLoc);
      webViewRef.current?.injectJavaScript(`updateMap(${newLoc.lat}, ${newLoc.lon});`);
      await updateAddressFromCoords(newLoc.lat, newLoc.lon);
    } catch (e) {
      console.error(e);
    } finally {
      setLocating(false);
    }
  };

  const handleMapMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const lat = data.lat;
      const lon = data.lng || data.lon;
      if (lat && lon) {
        setLocation({ lat, lon });
        await updateAddressFromCoords(lat, lon);
      }
    } catch (e) {
      console.error('Map message error:', e);
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #fdf7f2; }
        .leaflet-control-attribution { display: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${location.lat}, ${location.lon}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        var marker = L.marker([${location.lat}, ${location.lon}], { draggable: true }).addTo(map);
        function updateMap(lat, lon) {
          map.setView([lat, lon], 17);
          marker.setLatLng([lat, lon]);
        }
        marker.on('dragend', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify(marker.getLatLng()));
        });
        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          window.ReactNativeWebView.postMessage(JSON.stringify(e.latlng));
        });
      </script>
    </body>
    </html>
  `;

  const calcItemPrice = (item: any) => {
    const ingredientsPrice = item.ingredients?.reduce((acc: number, ing: any) => acc + ing.price, 0) || 0;
    return (item.productItem.price + ingredientsPrice) * item.quantity;
  };

  if (items.length === 0 && !loading) {
    return (
      <DefaultView style={styles.center}>
        <ScrollView 
          contentContainerStyle={styles.centerScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff7000']} tintColor="#ff7000" />
          }
        >
          <DefaultView style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={100} color="#ff7000" />
          </DefaultView>
          <DefaultText style={styles.emptyText}>{t('cart.empty')}</DefaultText>
          <DefaultText style={styles.emptySubText}>{t('cart.emptySubtitle')}</DefaultText>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.replace('/')}>
            <DefaultText style={styles.goBackText}>{t('cart.toMenu')}</DefaultText>
          </TouchableOpacity>
        </ScrollView>
      </DefaultView>
    );
  }

  return (
    <DefaultView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff7000']} tintColor="#ff7000" />
          }
        >
          {step === 1 ? (
            <>
              <DefaultView style={styles.headerRow}>
                <DefaultText style={styles.title}>{t('cart.title')}</DefaultText>
                <TouchableOpacity onPress={onRefresh}>
                  <Ionicons name="refresh-circle" size={32} color="#ff7000" />
                </TouchableOpacity>
              </DefaultView>

              <DefaultView style={styles.itemsList}>
                {items.map((item) => (
                  <DefaultView key={item.id} style={styles.cartItemCard}>
                    <Image source={{ uri: item.productItem.product.imageUrl }} style={styles.itemThumb} />
                    <DefaultView style={styles.itemMeta}>
                      <DefaultText style={styles.itemName}>{item.productItem.product.name}</DefaultText>
                      <DefaultText style={styles.itemSpec}>
                        {item.productItem.size && `${item.productItem.size} см, `}
                        {item.productItem.pizzaType === 1 ? t('cart.traditional') : item.productItem.pizzaType === 2 ? t('cart.thin') : ''}
                      </DefaultText>
                      {item.ingredients?.length > 0 && (
                        <DefaultText style={styles.itemIngredients}>
                          + {item.ingredients.map((ing: any) => ing.name).join(', ')}
                        </DefaultText>
                      )}
                      <DefaultView style={styles.qtyControls}>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} style={styles.qtyBtn}>
                          <Ionicons name="remove" size={18} color="#11181C" />
                        </TouchableOpacity>
                        <DefaultText style={styles.qtyVal}>{item.quantity}</DefaultText>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                          <Ionicons name="add" size={18} color="#11181C" />
                        </TouchableOpacity>
                      </DefaultView>
                    </DefaultView>
                    <DefaultView style={styles.itemRight}>
                      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
                      </TouchableOpacity>
                      <DefaultText style={styles.itemPrice}>{calcItemPrice(item)} TJS</DefaultText>
                    </DefaultView>
                  </DefaultView>
                ))}
              </DefaultView>
            </>
          ) : (
            <>
              <DefaultView style={styles.headerRow}>
                <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={30} color="#11181C" />
                </TouchableOpacity>
                <DefaultText style={styles.title}>{t('cart.checkout')}</DefaultText>
                <DefaultView style={{ width: 30 }} />
              </DefaultView>

              <DefaultView style={styles.section}>
                <DefaultView style={styles.sectionHeaderRow}>
                  <Ionicons name="person-outline" size={22} color="#ff7000" />
                  <DefaultText style={styles.sectionHeader}>{t('cart.contactInfo')}</DefaultText>
                </DefaultView>
                <DefaultView style={styles.inputGrid}>
                  <DefaultView style={styles.inputGroup}>
                    <DefaultText style={styles.label}>{t('cart.firstName')}</DefaultText>
                    <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Фирдавс" placeholderTextColor="#9BA1A6" />
                  </DefaultView>
                  <DefaultView style={styles.inputGroup}>
                    <DefaultText style={styles.label}>{t('cart.lastName')}</DefaultText>
                    <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Рахимов" placeholderTextColor="#9BA1A6" />
                  </DefaultView>
                </DefaultView>
                <DefaultView style={[styles.inputGroup, { marginTop: 15 }]}>
                  <DefaultText style={styles.label}>{t('auth.email')}</DefaultText>
                  <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="example@gmail.com" keyboardType="email-address" placeholderTextColor="#9BA1A6" autoCapitalize="none" />
                </DefaultView>
                <DefaultView style={[styles.inputGroup, { marginTop: 15 }]}>
                  <DefaultText style={styles.label}>{t('courier.phone')}</DefaultText>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+992 (XX) XXX-XX-XX" keyboardType="phone-pad" placeholderTextColor="#9BA1A6" />
                </DefaultView>
              </DefaultView>

              <DefaultView style={styles.section}>
                <DefaultView style={styles.deliveryToggle}>
                  <TouchableOpacity 
                    onPress={() => setDeliveryType('DELIVERY')}
                    style={[styles.toggleBtn, deliveryType === 'DELIVERY' && styles.toggleBtnActive]}
                  >
                    <Ionicons name="bicycle-outline" size={20} color={deliveryType === 'DELIVERY' ? 'white' : '#687076'} />
                    <DefaultText style={[styles.toggleText, deliveryType === 'DELIVERY' && styles.toggleTextActive]}>{t('cart.delivery')}</DefaultText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setDeliveryType('PICKUP')}
                    style={[styles.toggleBtn, deliveryType === 'PICKUP' && styles.toggleBtnActive]}
                  >
                    <Ionicons name="storefront-outline" size={20} color={deliveryType === 'PICKUP' ? 'white' : '#687076'} />
                    <DefaultText style={[styles.toggleText, deliveryType === 'PICKUP' && styles.toggleTextActive]}>{t('cart.pickup')}</DefaultText>
                  </TouchableOpacity>
                </DefaultView>

                {deliveryType === 'DELIVERY' ? (
                  <>
                    <DefaultView style={styles.sectionHeaderRow}>
                      <Ionicons name="map-outline" size={22} color="#ff7000" />
                      <DefaultText style={styles.sectionHeader}>{t('cart.address')}</DefaultText>
                    </DefaultView>
                    
                    <AddressAutocomplete value={address} onChange={setAddress} />
                    
                    <DefaultView style={styles.mapWrapper}>
                      <WebView
                        ref={webViewRef}
                        originWhitelist={['*']}
                        source={{ html: mapHtml }}
                        style={styles.mapWeb}
                        onMessage={handleMapMessage}
                      />
                      <TouchableOpacity style={styles.locateBtn} onPress={locateUser} disabled={locating}>
                        {locating ? <ActivityIndicator size="small" color="#ff7000" /> : <Ionicons name="navigate" size={20} color="#ff7000" />}
                      </TouchableOpacity>
                    </DefaultView>

                    <DefaultView style={styles.inputGrid}>
                      <DefaultView style={styles.inputGroup}>
                        <DefaultText style={styles.label}>{t('cart.apartment')}</DefaultText>
                        <TextInput style={styles.input} value={apartment} onChangeText={setApartment} placeholder="№" keyboardType="numeric" placeholderTextColor="#9BA1A6" />
                      </DefaultView>
                      <DefaultView style={styles.inputGroup}>
                        <DefaultText style={styles.label}>{t('cart.entrance')}</DefaultText>
                        <TextInput style={styles.input} value={entrance} onChangeText={setEntrance} placeholder="№" keyboardType="numeric" placeholderTextColor="#9BA1A6" />
                      </DefaultView>
                    </DefaultView>

                    <DefaultView style={styles.inputGrid}>
                      <DefaultView style={styles.inputGroup}>
                        <DefaultText style={styles.label}>{t('cart.floor')}</DefaultText>
                        <TextInput style={styles.input} value={floor} onChangeText={setFloor} placeholder="№" keyboardType="numeric" placeholderTextColor="#9BA1A6" />
                      </DefaultView>
                      <DefaultView style={styles.inputGroup}>
                        <DefaultText style={styles.label}>{t('cart.doorCode')}</DefaultText>
                        <TextInput style={styles.input} value={doorCode} onChangeText={setDoorCode} placeholder={t('cart.doorCode')} placeholderTextColor="#9BA1A6" />
                      </DefaultView>
                    </DefaultView>
                  </>
                ) : (
                  <>
                    <DefaultView style={styles.sectionHeaderRow}>
                      <Ionicons name="storefront-outline" size={22} color="#ff7000" />
                      <DefaultText style={styles.sectionHeader}>{t('cart.selectStore')}</DefaultText>
                    </DefaultView>
                    {stores.map(store => (
                      <TouchableOpacity 
                        key={store.id} 
                        style={[styles.storeCard, selectedStoreId === store.id && styles.storeCardActive]}
                        onPress={() => setSelectedStoreId(store.id)}
                      >
                        <DefaultView style={styles.storeIcon}>
                          <Ionicons name="pizza" size={20} color="#ff7000" />
                        </DefaultView>
                        <DefaultView style={styles.storeMeta}>
                          <DefaultText style={styles.storeName}>{store.name}</DefaultText>
                          <DefaultText style={styles.storeAddress}>{store.address}</DefaultText>
                        </DefaultView>
                        {selectedStoreId === store.id && <Ionicons name="checkmark-circle" size={24} color="#ff7000" />}
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                <DefaultView style={{ marginTop: 20 }}>
                  <DefaultText style={styles.label}>{t('cart.comment')}</DefaultText>
                  <TextInput 
                    style={[styles.input, { height: 80, paddingTop: 12 }]} 
                    value={comment} 
                    onChangeText={setComment} 
                    placeholder={t('cart.commentPlaceholder')}
                    placeholderTextColor="#9BA1A6"
                    multiline
                  />
                </DefaultView>
              </DefaultView>

              <DefaultView style={styles.section}>
                <DefaultView style={styles.sectionHeaderRow}>
                  <Ionicons name="receipt-outline" size={22} color="#ff7000" />
                  <DefaultText style={styles.sectionHeader}>{t('cart.orderDetails')}</DefaultText>
                </DefaultView>
                
                <DefaultView style={styles.priceRow}>
                  <DefaultText style={styles.priceLabel}>{t('cart.title')}</DefaultText>
                  <DefaultText style={styles.priceVal}>{totalAmount} TJS</DefaultText>
                </DefaultView>
                <DefaultView style={styles.priceRow}>
                  <DefaultText style={styles.priceLabel}>{t('cart.vat')}</DefaultText>
                  <DefaultText style={styles.priceVal}>{vatPrice.toFixed(0)} TJS</DefaultText>
                </DefaultView>
                {deliveryType === 'DELIVERY' && (
                  <DefaultView style={styles.priceRow}>
                    <DefaultText style={styles.priceLabel}>{t('cart.delivery')}</DefaultText>
                    <DefaultText style={styles.priceVal}>{DELIVERY_PRICE} TJS</DefaultText>
                  </DefaultView>
                )}
              </DefaultView>

              <DefaultView style={styles.section}>
                <DefaultView style={styles.sectionHeaderRow}>
                  <Ionicons name="card-outline" size={22} color="#ff7000" />
                  <DefaultText style={styles.sectionHeader}>{t('cart.payment')}</DefaultText>
                </DefaultView>
                <TouchableOpacity style={styles.paymentMethod}>
                  <Ionicons name="wallet-outline" size={24} color="#ff7000" />
                  <DefaultText style={styles.paymentText}>{t('cart.cash')}</DefaultText>
                  <Ionicons name="checkmark-circle" size={24} color="#ff7000" />
                </TouchableOpacity>
              </DefaultView>
            </>
          )}

          <DefaultView style={{ height: 250 }} />
        </ScrollView>

        {!isKeyboardVisible && (
          <DefaultView style={[styles.footer, { bottom: insets.bottom + 100 }]}>
            <DefaultView style={styles.footerContent}>
              <DefaultView style={styles.totalBlock}>
                <DefaultText style={styles.totalLabel}>{t('cart.total')}</DefaultText>
                <DefaultText style={styles.totalAmount}>{finalTotal.toFixed(0)} TJS</DefaultText>
              </DefaultView>
              <TouchableOpacity 
                style={styles.mainButton} 
                onPress={step === 1 ? nextStep : onSubmitOrder}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <DefaultText style={styles.mainButtonText}>
                      {step === 1 ? t('cart.toCheckout') : t('cart.order')}
                    </DefaultText>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </DefaultView>
          </DefaultView>
        )}
      </KeyboardAvoidingView>
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf7f2',
  },
  scrollContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: -1.5,
  },
  backBtn: {
    padding: 4,
  },
  itemsList: {
    gap: 12,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 35,
    padding: 12,
    shadowColor: '#ff7000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  itemThumb: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: '#fff7f0',
  },
  itemMeta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#11181C',
    lineHeight: 18,
  },
  itemSpec: {
    fontSize: 12,
    color: '#687076',
    marginTop: 2,
  },
  itemIngredients: {
    fontSize: 11,
    color: '#ff7000',
    marginTop: 2,
    marginBottom: 6,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    padding: 2,
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: {
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 8,
    color: '#11181C',
  },
  itemRight: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#11181C',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 35,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  deliveryToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderRadius: 22,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    gap: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#ff7000',
    shadowColor: '#ff7000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#687076',
  },
  toggleTextActive: {
    color: 'white',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#11181C',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#687076',
    fontWeight: '700',
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#11181C',
  },
  mapWrapper: {
    height: 220,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    position: 'relative',
  },
  mapWeb: {
    flex: 1,
  },
  locateBtn: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#687076',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    height: 50,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#11181C',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 22,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  storeCardActive: {
    borderColor: '#ff7000',
    backgroundColor: '#fff7f0',
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  storeMeta: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#11181C',
  },
  storeAddress: {
    fontSize: 12,
    color: '#687076',
    marginTop: 2,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7f0',
    padding: 16,
    borderRadius: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ff7000',
  },
  paymentText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#11181C',
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 35,
    padding: 16,
    shadowColor: '#ff7000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalBlock: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    color: '#687076',
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#11181C',
  },
  mainButton: {
    backgroundColor: '#ff7000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    height: 54,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#ff7000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
  },
  center: {
    flex: 1,
    backgroundColor: '#fdf7f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fdf7f2',
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#ff7000',
    shadowOpacity: 0.08,
    shadowRadius: 25,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#11181C',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 15,
    color: '#687076',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  goBackButton: {
    marginTop: 30,
    backgroundColor: '#ff7000',
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 22,
  },
  goBackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
});
