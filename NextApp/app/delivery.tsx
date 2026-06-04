import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';

import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { AmbientBackdrop } from '@/components/ui';

const ZONES = [
  { radiusKm: 2, price: 0, color: '#22c55e', label: 'Бесплатно' },
  { radiusKm: 4, price: 15, color: '#f59e0b', label: '15 TJS' },
  { radiusKm: 7, price: 30, color: '#ef4444', label: '30 TJS' },
];

const haversineKm = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
};

interface Store {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
}

const STATS = [
  { label: 'Среднее время', value: '35 мин', icon: 'time-outline' as const },
  { label: 'Зона доставки', value: '7 км', icon: 'location-outline' as const },
  { label: 'Мин. заказ', value: '50 TJS', icon: 'cart-outline' as const },
  { label: 'Работаем', value: 'Ежедневно', icon: 'calendar-outline' as const },
];

const FAQ = [
  {
    q: 'Как рассчитывается стоимость доставки?',
    a: 'Зависит от расстояния до ресторана. В радиусе 2 км — бесплатно, до 4 км — 15 TJS, до 7 км — 30 TJS.',
  },
  {
    q: 'Можно ли отследить заказ?',
    a: 'Да, после оформления заказа в профиле появится статус заказа в реальном времени.',
  },
  {
    q: 'Что если я живу за пределами зоны доставки?',
    a: 'Вы можете оформить самовывоз из ближайшего ресторана — это бесплатно.',
  },
  {
    q: 'Как долго хранится горячей пицца при доставке?',
    a: 'Мы используем термосумки. Пицца остаётся горячей до 45 минут после выхода из ресторана.',
  },
];

export default function DeliveryScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();

  const [stores, setStores] = useState<Store[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const webRef = useRef<WebView>(null);

  useEffect(() => {
    let active = true;
    fetch(`${BASE_URL}/api/stores`)
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data)) setStores(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const openMap = (store: Store) => {
    if (store.lat == null || store.lng == null) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const callStore = (phone: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const located = stores.filter(
    (s): s is Store & { lat: number; lng: number } =>
      s.lat != null && s.lng != null,
  );
  const fallbackLat = 38.5598;
  const fallbackLng = 68.787;
  const mapCenter: [number, number] = located[0]
    ? [located[0].lat, located[0].lng]
    : [fallbackLat, fallbackLng];

  const nearest = useMemo(() => {
    if (!userLoc || located.length === 0) return null;
    let best: { store: Store; km: number } | null = null;
    for (const s of located) {
      const km = haversineKm(userLoc, [s.lat, s.lng]);
      if (!best || km < best.km) best = { store: s, km };
    }
    return best;
  }, [userLoc, located]);

  const deliveryInfo = useMemo(() => {
    if (!nearest) return null;
    for (const z of ZONES) {
      if (nearest.km <= z.radiusKm) {
        return {
          km: nearest.km,
          price: z.price,
          label: z.label,
          color: z.color,
          inZone: true,
        };
      }
    }
    return {
      km: nearest.km,
      price: null,
      label: 'Вне зоны',
      color: '#94a3b8',
      inZone: false,
    };
  }, [nearest]);

  const requestLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(next);
      webRef.current?.injectJavaScript(
        `window.__setUser(${next[0]},${next[1]}); true;`,
      );
    } catch {
    } finally {
      setLocating(false);
    }
  };

  const onMapMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'pick' && typeof msg.lat === 'number') {
        setUserLoc([msg.lat, msg.lng]);
      }
    } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Доставка' }} />
      <AmbientBackdrop />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Назад"
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Доставка</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lead, { color: theme.textMuted }]}>
          Доставляем горячую пиццу по Душанбе. Выберите ресторан и узнайте время
          доставки в свой район.
        </Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[styles.statIcon, { backgroundColor: theme.primarySoft }]}
              >
                <Ionicons name={s.icon} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery status banner */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.surface,
              borderColor: deliveryInfo ? deliveryInfo.color : theme.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            {!userLoc && (
              <>
                <Text style={[styles.bannerTitle, { color: theme.text }]}>
                  Выберите место доставки
                </Text>
                <Text style={[styles.bannerSub, { color: theme.textMuted }]}>
                  Нажмите на карту или используйте геолокацию — мы рассчитаем
                  стоимость
                </Text>
              </>
            )}
            {userLoc && deliveryInfo && (
              <>
                <Text style={[styles.bannerTitle, { color: deliveryInfo.color }]}>
                  {deliveryInfo.inZone
                    ? deliveryInfo.price === 0
                      ? 'Бесплатная доставка'
                      : `Доставка ${deliveryInfo.price} TJS`
                    : 'Вне зоны доставки'}
                </Text>
                <Text style={[styles.bannerSub, { color: theme.textMuted }]}>
                  {deliveryInfo.km.toFixed(1)} км до{' '}
                  {nearest?.store.name ?? 'ресторана'}
                </Text>
              </>
            )}
          </View>
          <TouchableOpacity
            onPress={requestLocation}
            disabled={locating}
            style={[styles.locBtn, { backgroundColor: theme.primary }]}
          >
            {locating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="locate" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* OSM map via Leaflet */}
        {(() => {
          const escapeHtml = (s: string) =>
            s
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          const markersJs = located
            .map(
              (s) =>
                `L.marker([${s.lat},${s.lng}]).addTo(map).bindPopup(${JSON.stringify(
                  `<b>${escapeHtml(s.name)}</b><br/>${escapeHtml(s.address)}`,
                )});`,
            )
            .join('\n');
          const zonesJs = located
            .map(
              (s) =>
                ZONES.map(
                  (z) =>
                    `L.circle([${s.lat},${s.lng}],{radius:${
                      z.radiusKm * 1000
                    },color:'${z.color}',weight:1.5,dashArray:'6,6',fillColor:'${
                      z.color
                    }',fillOpacity:0.08}).addTo(map);`,
                ).join('\n'),
            )
            .join('\n');
          const initUserJs = userLoc
            ? `window.__setUser(${userLoc[0]},${userLoc[1]});`
            : '';
          const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:${theme.surface};}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${mapCenter[0]},${mapCenter[1]}], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  ${zonesJs}
  ${markersJs}
  var userMarker = null;
  function postPick(lat, lng) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'pick',lat:lat,lng:lng}));
  }
  window.__setUser = function(lat, lng) {
    if (userMarker) { userMarker.setLatLng([lat,lng]); }
    else {
      userMarker = L.marker([lat,lng], {
        icon: L.divIcon({ className:'', html:'<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb"></div>', iconSize:[18,18], iconAnchor:[9,9] })
      }).addTo(map);
    }
    map.setView([lat,lng], 13);
  };
  map.on('click', function(e){
    window.__setUser(e.latlng.lat, e.latlng.lng);
    postPick(e.latlng.lat, e.latlng.lng);
  });
  ${initUserJs}
</script>
</body></html>`;
          return (
            <View
              style={[
                styles.mapWrap,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
            >
              <WebView
                ref={webRef}
                originWhitelist={['*']}
                source={{ html }}
                style={styles.map}
                javaScriptEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                onMessage={onMapMessage}
                nestedScrollEnabled
                scrollEnabled={false}
              />
            </View>
          );
        })()}

        {/* Zone legend */}
        <View style={styles.legendRow}>
          {ZONES.map((z) => (
            <View key={z.radiusKm} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: z.color }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>
                до {z.radiusKm} км · {z.price === 0 ? 'беспл.' : `${z.price} TJS`}
              </Text>
            </View>
          ))}
        </View>

        {/* Stores list */}
        {stores.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="storefront" size={18} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Наши рестораны
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {stores.map((store) => (
                <View
                  key={store.id}
                  style={[
                    styles.storeCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeName, { color: theme.text }]}>
                      {store.name}
                    </Text>
                    <Text style={[styles.storeAddr, { color: theme.textMuted }]}>
                      {store.address}
                    </Text>
                    {store.phone && (
                      <Text style={[styles.storePhone, { color: theme.primary }]}>
                        {store.phone}
                      </Text>
                    )}
                  </View>
                  <View style={{ gap: 8 }}>
                    {store.lat != null && store.lng != null && (
                      <TouchableOpacity
                        onPress={() => openMap(store)}
                        style={[
                          styles.storeBtn,
                          { backgroundColor: theme.primarySoft },
                        ]}
                      >
                        <Ionicons name="map" size={18} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                    {store.phone && (
                      <TouchableOpacity
                        onPress={() => callStore(store.phone)}
                        style={[
                          styles.storeBtn,
                          { backgroundColor: theme.primarySoft },
                        ]}
                      >
                        <Ionicons name="call" size={18} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* FAQ */}
        <View style={styles.sectionHeader}>
          <Ionicons name="help-circle" size={20} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Частые вопросы
          </Text>
        </View>
        <View style={{ gap: 10 }}>
          {FAQ.map((item, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <TouchableOpacity
                key={item.q}
                activeOpacity={0.85}
                onPress={() => setExpandedFaq(isOpen ? null : idx)}
                style={[
                  styles.faqCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.faqRow}>
                  <Text style={[styles.faqQ, { color: theme.text }]}>
                    {item.q}
                  </Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textMuted}
                  />
                </View>
                {isOpen && (
                  <Text style={[styles.faqA, { color: theme.textMuted }]}>
                    {item.a}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 10,
    },
    backBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
    },
    title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    scroll: { paddingHorizontal: 18, paddingBottom: 60, gap: 16 },
    lead: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statCard: {
      width: '48%',
      borderRadius: 20,
      borderWidth: 1,
      padding: 14,
      gap: 6,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    statValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
    statLabel: { fontSize: 11, fontWeight: '600' },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      marginBottom: 4,
    },
    sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
    storeCard: {
      flexDirection: 'row',
      gap: 12,
      padding: 14,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
    },
    storeName: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    storeAddr: { fontSize: 12, fontWeight: '500' },
    storePhone: { fontSize: 12, fontWeight: '700', marginTop: 4 },
    storeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    faqCard: {
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      gap: 8,
    },
    faqRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    faqQ: { fontSize: 13, fontWeight: '800', flex: 1 },
    faqA: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
    mapWrap: {
      height: 320,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    map: { flex: 1 },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    bannerTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
    bannerSub: { fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 16 },
    locBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, fontWeight: '700' },
  });
