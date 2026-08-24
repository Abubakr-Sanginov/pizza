import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View as DefaultView, Text as DefaultText, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, RefreshControl, LayoutAnimation, Dimensions, ActivityIndicator, Keyboard, Alert, Linking } from 'react-native';
import { useCartStore, getCartToken } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';
import { useUiStore } from '@/store/useUiStore';
import { Ionicons } from '@expo/vector-icons';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SpringPress, LiquidGlassCard, AmbientBackdrop } from '@/components/ui';
import { OrderSuccessModal } from '@/components/shared/OrderSuccessModal';
import { CartCrossSell } from '@/components/shared/CartCrossSell';

const CUSTOM_SCATTER = [
  { cx: 0.48, cy: 0.28, rotate: 15, scale: 0.55 },
  { cx: 0.66, cy: 0.38, rotate: -20, scale: 0.5 },
  { cx: 0.7, cy: 0.58, rotate: 35, scale: 0.52 },
  { cx: 0.48, cy: 0.68, rotate: -15, scale: 0.48 },
  { cx: 0.28, cy: 0.58, rotate: 5, scale: 0.5 },
  { cx: 0.24, cy: 0.36, rotate: -20, scale: 0.48 },
  { cx: 0.6, cy: 0.2, rotate: 30, scale: 0.45 },
  { cx: 0.76, cy: 0.48, rotate: -5, scale: 0.5 },
  { cx: 0.36, cy: 0.74, rotate: 18, scale: 0.48 },
  { cx: 0.18, cy: 0.48, rotate: -12, scale: 0.45 },
  { cx: 0.34, cy: 0.18, rotate: 8, scale: 0.5 },
  { cx: 0.58, cy: 0.76, rotate: -25, scale: 0.45 },
];

const CustomPizzaThumb = ({
  ingredients,
  size = 80,
}: {
  ingredients: Array<{ imageUrl: string }>;
  size?: number;
}) => (
  <DefaultView
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      backgroundColor: '#8b4513',
    }}
  >
    <DefaultView
      style={{
        position: 'absolute',
        top: size * 0.08,
        left: size * 0.08,
        right: size * 0.08,
        bottom: size * 0.08,
        borderRadius: size / 2,
        backgroundColor: '#f5d070',
      }}
    />
    {ingredients.map((ing, idx) => {
      const pos = CUSTOM_SCATTER[idx % CUSTOM_SCATTER.length];
      const imgSize = size * pos.scale;
      return (
        <Image
          key={idx}
          source={{ uri: ing.imageUrl }}
          style={{
            position: 'absolute',
            left: size * pos.cx - imgSize / 2,
            top: size * pos.cy - imgSize / 2,
            width: imgSize,
            height: imgSize,
            transform: [{ rotate: `${pos.rotate}deg` }],
          }}
          resizeMode="contain"
        />
      );
    })}
  </DefaultView>
);

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { items, totalAmount, loading, fetchCart, updateQuantity, removeItem } = useCartStore();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [refreshing, setRefreshing] = useState(false);
  const [step, setStep] = useState(1);
  const setTabBarHidden = useUiStore((s) => s.setTabBarHidden);

  useEffect(() => {
    setTabBarHidden(step === 2);
    return () => setTabBarHidden(false);
  }, [step, setTabBarHidden]);

  useFocusEffect(
    useCallback(() => {
      return () => setTabBarHidden(false);
    }, [setTabBarHidden]),
  );

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
  const [successOrder, setSuccessOrder] = useState<{ id: number; total: number; eta: number } | null>(null);

  const [stores, setStores] = useState<any[]>([]);
  const [location, setLocation] = useState({ lat: 38.5763, lon: 68.7831 });

  type PaymentMethod = 'CASH_ON_DELIVERY' | 'TELEGRAM_STARS' | 'MANUAL_TRANSFER';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const applyPromoCode = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    try {
      const res = await fetch(`${BASE_URL}/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoInput.trim(),
          subtotal: totalAmount,
          items: items.map((i: any) => ({ productId: i.productId, lineTotal: i.price * i.quantity })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        Alert.alert(err?.error || 'Промокод недействителен');
        return;
      }
      const data = await res.json();
      setAppliedPromo({ code: data.code, discount: data.appliedDiscount });
    } catch {
      Alert.alert('Не удалось проверить промокод');
    } finally {
      setApplyingPromo(false);
    }
  };
  const [userPos, setUserPos] = useState<{lat: number, lon: number} | null>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // TAXES AND DELIVERY (Matched with Web)
  const VAT_PERCENT = 15;
  const DELIVERY_PRICE = deliveryType === 'DELIVERY' ? 250 : 0;
  const vatPrice = (totalAmount * VAT_PERCENT) / 100;
  const promoDiscount = appliedPromo?.discount ?? 0;
  const finalTotal = Math.max(0, totalAmount + DELIVERY_PRICE + vatPrice - promoDiscount);

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
        userId: user?.id,
        paymentMethod,
        promoCode: appliedPromo?.code,
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

      const created = await res.json().catch(() => null);
      const orderId = created?.id ?? created?.order?.id ?? 0;
      const requiresOnlinePayment = created?.requiresOnlinePayment;

      if (requiresOnlinePayment && orderId) {
        try {
          const initRes = await fetch(`${BASE_URL}/api/payments/telegram/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              method: paymentMethod === 'TELEGRAM_STARS' ? 'STARS' : 'TRANSFER',
            }),
          });
          const initData = await initRes.json();
          if (initData?.deepLink) {
            Alert.alert(
              'Завершите оплату',
              'Сейчас откроется Telegram. После оплаты заказ автоматически принимается в работу.',
              [
                {
                  text: 'Открыть Telegram',
                  onPress: () => Linking.openURL(initData.deepLink),
                },
              ],
            );
          } else {
            Alert.alert('Не удалось создать ссылку оплаты');
          }
        } catch (e) {
          Alert.alert('Ошибка инициализации оплаты');
        }
        clearCart();
        return;
      }

      clearCart();
      setSuccessOrder({
        id: orderId,
        total: Math.round(finalTotal),
        eta: deliveryType === 'PICKUP' ? 20 : 45,
      });
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

  const getPickupMapHtml = (storeLat: number, storeLon: number, uLat?: number, uLon?: number) => `
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
        .custom-pizza-marker {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: 2.5px solid #f97316;
          box-sizing: border-box;
        }
        .custom-pizza-marker span { font-size: 22px; line-height: 1; }
        .custom-user-marker {
          background-color: #3b82f6;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.4), 0 4px 6px -1px rgb(0 0 0 / 0.2);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${storeLat}, ${storeLon}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        var storeIcon = L.divIcon({
          html: '<div class="custom-pizza-marker"><span>🍕</span></div>',
          className: '',
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        });
        L.marker([${storeLat}, ${storeLon}], { icon: storeIcon }).addTo(map);

        ${uLat && uLon ? `
          var userIcon = L.divIcon({
            html: '<div class="custom-user-marker"></div>',
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          L.marker([${uLat}, ${uLon}], { icon: userIcon }).addTo(map);

          var url = 'https://router.project-osrm.org/route/v1/walking/${uLon},${uLat};${storeLon},${storeLat}?overview=full&geometries=geojson';
          fetch(url)
            .then(res => res.json())
            .then(data => {
              if (data.routes && data.routes.length > 0) {
                var route = data.routes[0];
                var coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
                var polyline = L.polyline(coords, { color: '#f97316', weight: 5 }).addTo(map);
                map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'route', distance: route.distance, duration: route.duration }));
              }
            });
        ` : ''}
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
        <AmbientBackdrop />
        <ScrollView
          contentContainerStyle={styles.centerScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
        >
          <DefaultView style={styles.emptyIconContainer}>
            <LinearGradient
              colors={(theme.mode === 'dark' ? gradients.dark : gradients.light).primarySoft}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="cart-outline" size={86} color={theme.primary} />
          </DefaultView>
          <DefaultText style={styles.emptyText}>{t('cart.empty')}</DefaultText>
          <DefaultText style={styles.emptySubText}>{t('cart.emptySubtitle')}</DefaultText>
          <SpringPress onPress={() => router.replace('/')} scaleTo={0.95} style={{ marginTop: 30 }}>
            <LinearGradient
              colors={(theme.mode === 'dark' ? gradients.dark : gradients.light).primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goBackButton}>
              <DefaultText style={styles.goBackText}>{t('cart.toMenu')}</DefaultText>
            </LinearGradient>
          </SpringPress>
        </ScrollView>
      </DefaultView>
    );
  }

  return (
    <DefaultView style={styles.container}>
      <AmbientBackdrop />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
        >
          {step === 1 ? (
            <>
              <DefaultView style={styles.headerRow}>
                <DefaultText style={styles.title}>{t('cart.title')}</DefaultText>
                <TouchableOpacity onPress={onRefresh}>
                  <Ionicons name="refresh-circle" size={32} color={theme.primary} />
                </TouchableOpacity>
              </DefaultView>

              <DefaultView style={styles.itemsList}>
                {items.map((item) => (
                  <DefaultView key={item.id} style={styles.cartItemCard}>
                    {item.customName ? (
                      <CustomPizzaThumb
                        ingredients={item.ingredients ?? []}
                        size={80}
                      />
                    ) : (
                      <Image source={{ uri: item.productItem.product.imageUrl }} style={styles.itemThumb} />
                    )}
                    <DefaultView style={styles.itemMeta}>
                      <DefaultText style={styles.itemName}>{item.customName || item.productItem.product.name}</DefaultText>
                      {item.customName && (
                        <DefaultText style={styles.itemSpec}>
                          Своя пицца
                        </DefaultText>
                      )}
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
                          <Ionicons name="remove" size={18} color={theme.text} />
                        </TouchableOpacity>
                        <DefaultText style={styles.qtyVal}>{item.quantity}</DefaultText>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                          <Ionicons name="add" size={18} color={theme.text} />
                        </TouchableOpacity>
                      </DefaultView>
                    </DefaultView>
                    <DefaultView style={styles.itemRight}>
                      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={20} color={theme.danger} />
                      </TouchableOpacity>
                      <DefaultText style={styles.itemPrice}>{calcItemPrice(item)} TJS</DefaultText>
                    </DefaultView>
                  </DefaultView>
                ))}
              </DefaultView>

              <CartCrossSell />
            </>
          ) : (
            <>
              <DefaultView style={styles.headerRow}>
                <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={30} color={theme.text} />
                </TouchableOpacity>
                <DefaultText style={styles.title}>{t('cart.checkout')}</DefaultText>
                <DefaultView style={{ width: 30 }} />
              </DefaultView>

              <DefaultView style={styles.section}>
                <DefaultView style={styles.sectionHeaderRow}>
                  <Ionicons name="person-outline" size={22} color={theme.primary} />
                  <DefaultText style={styles.sectionHeader}>{t('cart.contactInfo')}</DefaultText>
                </DefaultView>
                <DefaultView style={styles.inputGrid}>
                  <DefaultView style={styles.inputGroup}>
                    <DefaultText style={styles.label}>{t('cart.firstName')}</DefaultText>
                    <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Фирдавс" placeholderTextColor={theme.textSubtle} />
                  </DefaultView>
                  <DefaultView style={styles.inputGroup}>
                    <DefaultText style={styles.label}>{t('cart.lastName')}</DefaultText>
                    <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Рахимов" placeholderTextColor={theme.textSubtle} />
                  </DefaultView>
                </DefaultView>
                <DefaultView style={[styles.inputGroup, { marginTop: 15 }]}>
                  <DefaultText style={styles.label}>{t('auth.email')}</DefaultText>
                  <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="example@gmail.com" keyboardType="email-address" placeholderTextColor={theme.textSubtle} autoCapitalize="none" />
                </DefaultView>
                <DefaultView style={[styles.inputGroup, { marginTop: 15 }]}>
                  <DefaultText style={styles.label}>{t('courier.phone')}</DefaultText>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+992 (XX) XXX-XX-XX" keyboardType="phone-pad" placeholderTextColor={theme.textSubtle} />
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
                      <Ionicons name="map-outline" size={22} color={theme.primary} />
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
                        {locating ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="navigate" size={20} color={theme.primary} />}
                      </TouchableOpacity>
                    </DefaultView>

                    <DefaultView style={styles.inputGrid}>
                      <DefaultView style={styles.inputGroup}>
                        <DefaultText style={styles.label}>{t('cart.apartment')}</DefaultText>
                        <TextInput style={styles.input} value={apartment} onChangeText={setApartment} placeholder="№" keyboardType="numeric" placeholderTextColor={theme.textSubtle} />
                      </DefaultView>
                      <DefaultView style={styles.inputGroup}>
                        <DefaultText style={styles.label}>{t('cart.entrance')}</DefaultText>
                        <TextInput style={styles.input} value={entrance} onChangeText={setEntrance} placeholder="№" keyboardType="numeric" placeholderTextColor={theme.textSubtle} />
                      </DefaultView>
                    </DefaultView>

                    <DefaultView style={styles.inputGrid}>
                      <DefaultView style={styles.inputGroup}>
                        <DefaultText style={styles.label}>{t('cart.floor')}</DefaultText>
                        <TextInput style={styles.input} value={floor} onChangeText={setFloor} placeholder="№" keyboardType="numeric" placeholderTextColor={theme.textSubtle} />
                      </DefaultView>
                      <DefaultView style={styles.inputGroup}>
                        <DefaultText style={styles.label}>{t('cart.doorCode')}</DefaultText>
                        <TextInput style={styles.input} value={doorCode} onChangeText={setDoorCode} placeholder={t('cart.doorCode')} placeholderTextColor={theme.textSubtle} />
                      </DefaultView>
                    </DefaultView>
                  </>
                ) : (
                  <>
                    <DefaultView style={styles.sectionHeaderRow}>
                      <Ionicons name="storefront-outline" size={22} color={theme.primary} />
                      <DefaultText style={styles.sectionHeader}>{t('cart.selectStore')}</DefaultText>
                    </DefaultView>
                    {stores.map(store => (
                      <TouchableOpacity
                        key={store.id}
                        style={[styles.storeCard, selectedStoreId === store.id && styles.storeCardActive]}
                        onPress={() => setSelectedStoreId(store.id)}
                      >
                        <DefaultView style={styles.storeIcon}>
                          <Ionicons name="pizza" size={20} color={theme.primary} />
                        </DefaultView>
                        <DefaultView style={styles.storeMeta}>
                          <DefaultText style={styles.storeName}>{store.name}</DefaultText>
                          <DefaultText style={styles.storeAddress}>{store.address}</DefaultText>
                        </DefaultView>
                        {selectedStoreId === store.id && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                      </TouchableOpacity>
                    ))}

                    {selectedStoreId && (() => {
                      const s = stores.find(s => s.id === selectedStoreId);
                      if (!s) return null;
                      return (
                        <DefaultView style={{ marginTop: 10 }}>
                          {routeInfo && (
                            <DefaultView style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                              <DefaultView style={{ flex: 1, padding: 12, backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)' }}>
                                <DefaultText style={{ fontSize: 12, color: theme.textMuted }}>Расстояние</DefaultText>
                                <DefaultText style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                                  {routeInfo.distance < 1000 ? Math.round(routeInfo.distance) + ' м' : (routeInfo.distance / 1000).toFixed(1) + ' км'}
                                </DefaultText>
                              </DefaultView>
                              <DefaultView style={{ flex: 1, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                <DefaultText style={{ fontSize: 12, color: theme.textMuted }}>Пешком</DefaultText>
                                <DefaultText style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                                  {Math.round(routeInfo.duration / 60)} мин
                                </DefaultText>
                              </DefaultView>
                            </DefaultView>
                          )}

                          <DefaultView style={styles.mapWrapper}>
                            <WebView
                              originWhitelist={['*']}
                              source={{ html: getPickupMapHtml(s.lat || 38.5598, s.lng || 68.7741, userPos?.lat, userPos?.lon) }}
                              style={styles.mapWeb}
                              onMessage={(e) => {
                                try {
                                  const data = JSON.parse(e.nativeEvent.data);
                                  if (data.type === 'route') {
                                    setRouteInfo({ distance: data.distance, duration: data.duration });
                                  }
                                } catch {}
                              }}
                            />
                          </DefaultView>

                          <TouchableOpacity
                            style={[styles.mainButton, { marginTop: 15, height: 48, borderRadius: 14, shadowOpacity: 0 }]}
                            onPress={async () => {
                              setLocating(true);
                              try {
                                let { status } = await Location.requestForegroundPermissionsAsync();
                                if (status !== 'granted') {
                                  Alert.alert('Геолокация недоступна');
                                  return;
                                }
                                let loc = await Location.getCurrentPositionAsync({});
                                setUserPos({ lat: loc.coords.latitude, lon: loc.coords.longitude });
                              } catch (err) {
                                Alert.alert('Не удалось определить местоположение');
                              } finally {
                                setLocating(false);
                              }
                            }}
                          >
                            {locating ? <ActivityIndicator color="white" /> : (
                              <>
                                <Ionicons name="navigate" size={18} color="white" />
                                <DefaultText style={[styles.mainButtonText, { fontSize: 14 }]}>
                                  {userPos ? 'Обновить маршрут' : 'Проложить маршрут'}
                                </DefaultText>
                              </>
                            )}
                          </TouchableOpacity>
                        </DefaultView>
                      );
                    })()}
                  </>
                )}

                <DefaultView style={{ marginTop: 20 }}>
                  <DefaultText style={styles.label}>{t('cart.comment')}</DefaultText>
                  <TextInput
                    style={[styles.input, { height: 80, paddingTop: 12 }]}
                    value={comment}
                    onChangeText={setComment}
                    placeholder={t('cart.commentPlaceholder')}
                    placeholderTextColor={theme.textSubtle}
                    multiline
                  />
                </DefaultView>
              </DefaultView>

              <DefaultView style={styles.section}>
                <DefaultView style={styles.sectionHeaderRow}>
                  <Ionicons name="receipt-outline" size={22} color={theme.primary} />
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
                {appliedPromo && (
                  <DefaultView style={styles.priceRow}>
                    <DefaultText style={[styles.priceLabel, { color: theme.primary }]}>
                      Промокод {appliedPromo.code}
                    </DefaultText>
                    <DefaultText style={[styles.priceVal, { color: theme.primary, fontWeight: '800' }]}>
                      −{appliedPromo.discount} TJS
                    </DefaultText>
                  </DefaultView>
                )}
              </DefaultView>

              <DefaultView style={styles.section}>
                <DefaultView style={styles.sectionHeaderRow}>
                  <Ionicons name="pricetag-outline" size={22} color={theme.primary} />
                  <DefaultText style={styles.sectionHeader}>Промокод</DefaultText>
                </DefaultView>
                {appliedPromo ? (
                  <DefaultView
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: theme.primarySoft,
                      borderWidth: 1,
                      borderColor: theme.primary,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    <DefaultView style={{ flex: 1 }}>
                      <DefaultText style={{ fontWeight: '800', color: theme.text }}>
                        {appliedPromo.code}
                      </DefaultText>
                      <DefaultText style={{ fontSize: 12, color: theme.textMuted }}>
                        Скидка −{appliedPromo.discount} TJS
                      </DefaultText>
                    </DefaultView>
                    <TouchableOpacity
                      onPress={() => {
                        setAppliedPromo(null);
                        setPromoInput('');
                      }}
                    >
                      <Ionicons name="close-circle" size={22} color={theme.textSubtle} />
                    </TouchableOpacity>
                  </DefaultView>
                ) : (
                  <DefaultView style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1, textTransform: 'uppercase' }]}
                      value={promoInput}
                      onChangeText={(v) => setPromoInput(v.toUpperCase())}
                      placeholder="Введите промокод"
                      placeholderTextColor={theme.textSubtle}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      onPress={applyPromoCode}
                      disabled={applyingPromo || !promoInput.trim()}
                      style={{
                        paddingHorizontal: 20,
                        justifyContent: 'center',
                        backgroundColor: theme.primary,
                        borderRadius: 12,
                        opacity: applyingPromo || !promoInput.trim() ? 0.5 : 1,
                      }}
                    >
                      {applyingPromo ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <DefaultText style={{ color: '#fff', fontWeight: '800' }}>OK</DefaultText>
                      )}
                    </TouchableOpacity>
                  </DefaultView>
                )}
              </DefaultView>

              <DefaultView style={styles.section}>
                <DefaultView style={styles.sectionHeaderRow}>
                  <Ionicons name="card-outline" size={22} color={theme.primary} />
                  <DefaultText style={styles.sectionHeader}>{t('cart.payment')}</DefaultText>
                </DefaultView>

                {[
                  {
                    id: 'CASH_ON_DELIVERY' as PaymentMethod,
                    title: 'Курьеру при получении',
                    subtitle: 'Наличными или картой',
                    icon: 'wallet-outline' as const,
                  },
                  {
                    id: 'TELEGRAM_STARS' as PaymentMethod,
                    title: 'Telegram Stars',
                    subtitle: 'Звёздами в Telegram (+43% наценка)',
                    icon: 'star-outline' as const,
                  },
                  {
                    id: 'MANUAL_TRANSFER' as PaymentMethod,
                    title: 'Перевод на карту',
                    subtitle: 'Через Telegram-бот',
                    icon: 'send-outline' as const,
                  },
                ].map((opt) => {
                  const active = paymentMethod === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setPaymentMethod(opt.id)}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 14,
                        borderRadius: 14,
                        marginTop: 8,
                        backgroundColor: active ? theme.primarySoft : theme.surface,
                        borderWidth: 1.5,
                        borderColor: active ? theme.primary : theme.border,
                      }}
                    >
                      <DefaultView
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: active ? theme.primary : theme.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={opt.icon} size={20} color={active ? '#fff' : theme.text} />
                      </DefaultView>
                      <DefaultView style={{ flex: 1 }}>
                        <DefaultText style={{ fontWeight: '800', color: theme.text, fontSize: 14 }}>
                          {opt.title}
                        </DefaultText>
                        <DefaultText style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                          {opt.subtitle}
                        </DefaultText>
                      </DefaultView>
                      <DefaultView
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          borderColor: active ? theme.primary : theme.border,
                          backgroundColor: active ? theme.primary : 'transparent',
                        }}
                      />
                    </TouchableOpacity>
                  );
                })}

                {paymentMethod === 'TELEGRAM_STARS' && (
                  <DefaultView
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: '#FEF3C7',
                      borderWidth: 1,
                      borderColor: '#FCD34D',
                    }}
                  >
                    <DefaultText style={{ fontSize: 11, color: '#92400E', lineHeight: 16 }}>
                      <DefaultText style={{ fontWeight: '800' }}>Внимание:</DefaultText> Telegram удерживает 30%
                      комиссии. К сумме заказа добавляется +43% наценка — чтобы после удержания нам пришла
                      полная стоимость. Формула: сумма ÷ 0,7 ≈ ×1,43.
                    </DefaultText>
                  </DefaultView>
                )}
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
              <SpringPress
                onPress={step === 1 ? nextStep : onSubmitOrder}
                disabled={isSubmitting}
                scaleTo={0.96}>
                <LinearGradient
                  colors={(theme.mode === 'dark' ? gradients.dark : gradients.light).primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mainButton}>
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
                </LinearGradient>
              </SpringPress>
            </DefaultView>
          </DefaultView>
        )}
      </KeyboardAvoidingView>

      <OrderSuccessModal
        visible={!!successOrder}
        orderId={successOrder?.id}
        totalAmount={successOrder?.total}
        etaMinutes={successOrder?.eta}
        onClose={() => {
          setSuccessOrder(null);
          router.replace('/profile');
        }}
      />
    </DefaultView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: { fontSize: 34, fontWeight: '900', color: t.text, letterSpacing: -1.4 },
  backBtn: { padding: 4 },
  itemsList: { gap: 12 },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: t.surface,
    borderRadius: 28,
    padding: 14,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: t.mode === 'dark' ? 0.4 : 0.06,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  },
  itemThumb: { width: 80, height: 80, borderRadius: 25, backgroundColor: t.primarySoft },
  itemMeta: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '800', color: t.text, lineHeight: 18 },
  itemSpec: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  itemIngredients: { fontSize: 11, color: t.primary, marginTop: 2, marginBottom: 6 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.surfaceMuted,
    borderRadius: 14,
    padding: 2,
    alignSelf: 'flex-start',
  },
  qtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { fontSize: 14, fontWeight: '800', paddingHorizontal: 8, color: t.text },
  itemRight: { justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 4 },
  deleteBtn: { padding: 4 },
  itemPrice: { fontSize: 16, fontWeight: '900', color: t.text },
  section: {
    backgroundColor: t.surface,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: t.mode === 'dark' ? 0.35 : 0.05,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  },
  deliveryToggle: {
    flexDirection: 'row',
    backgroundColor: t.surfaceMuted,
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
    backgroundColor: t.primary,
    shadowColor: t.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  toggleText: { fontSize: 14, fontWeight: '800', color: t.textMuted },
  toggleTextActive: { color: t.primaryContrast },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: t.text },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: t.textMuted, fontWeight: '700' },
  priceVal: { fontSize: 15, fontWeight: '800', color: t.text },
  mapWrapper: {
    height: 220,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 15,
    borderWidth: 1,
    borderColor: t.borderMuted,
    position: 'relative',
  },
  mapWeb: { flex: 1 },
  locateBtn: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: t.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  inputGrid: { flexDirection: 'row', gap: 12, marginTop: 15 },
  inputGroup: { flex: 1 },
  label: { fontSize: 12, fontWeight: '800', color: t.textMuted, marginBottom: 6, marginLeft: 4 },
  input: {
    height: 50,
    backgroundColor: t.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: t.text,
    borderWidth: 1,
    borderColor: t.borderMuted,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 22,
    backgroundColor: t.inputBg,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  storeCardActive: { borderColor: t.primary, backgroundColor: t.primarySoft },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  storeMeta: { flex: 1, marginLeft: 12 },
  storeName: { fontSize: 15, fontWeight: '800', color: t.text },
  storeAddress: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primarySoft,
    padding: 16,
    borderRadius: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: t.primary,
  },
  paymentText: { flex: 1, fontSize: 15, fontWeight: '800', color: t.text },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: t.surface,
    borderRadius: 32,
    padding: 16,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: t.mode === 'dark' ? 0.5 : 0.16,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  },
  footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalBlock: { flex: 1 },
  totalLabel: { fontSize: 13, color: t.textMuted, fontWeight: '700' },
  totalAmount: { fontSize: 24, fontWeight: '900', color: t.text },
  mainButton: {
    backgroundColor: t.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    height: 54,
    borderRadius: 20,
    gap: 6,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: { color: t.primaryContrast, fontSize: 15, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: t.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: t.mode === 'dark' ? 0.5 : 0.18,
    shadowRadius: 28,
    elevation: 8,
    overflow: 'hidden',
  },
  emptyText: { fontSize: 24, fontWeight: '900', color: t.text, textAlign: 'center' },
  emptySubText: { fontSize: 15, color: t.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  goBackButton: {
    paddingHorizontal: 38,
    paddingVertical: 18,
    borderRadius: 24,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  goBackText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
});
