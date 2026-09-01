import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, LayoutAnimation, RefreshControl, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SpringPress, AmbientBackdrop, LiquidGlassCard, BackButton } from '@/components/ui';
import { LiveOrderStatus } from '@/components/shared/LiveOrderStatus';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { CourierTipModal } from '@/components/shared/CourierTipModal';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser, logout } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName);
      setEditEmail(user.email);
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/users/orders?userId=${user.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error('Fetch orders error:', e);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName,
          email: editEmail,
          password: editPassword || undefined,
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setIsEditing(false);
        setEditPassword('');
        Alert.alert(t('profile.updateSuccess'));
      } else {
        Alert.alert(t('profile.updateError'));
      }
    } catch (e) {
      Alert.alert(t('profile.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        // Login Logic
        const res = await fetch(`${BASE_URL}/api/auth/mobile/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          Alert.alert(err?.error || t('profile.updateError'));
          return;
        }

        const u = await res.json();
        setUser({
          id: String(u.id),
          email: u.email,
          fullName: u.fullName,
          role: u.role,
        });
        Alert.alert(`${t('profile.welcomeBack')}, ${u.fullName}!`);
      } else {
        // Register Logic
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName })
        });
        const data = await res.json();
        if (data.success) {
          setStep('verify');
        } else {
          Alert.alert(data.error || t('profile.updateError'));
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('profile.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    try {
      // Создаем URL для возврата в приложение
      const redirectUri = Linking.createURL('profile');

      // Формируем URL для входа, который после успеха отправит на нашу страницу-мост
      const bridgeUrl = `${BASE_URL}/auth/success?redirect=${encodeURIComponent(redirectUri)}`;
      const authUrl = `${BASE_URL}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(bridgeUrl)}`;

      console.log('Redirect URI:', redirectUri);
      console.log('Auth URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // Мост /auth/success возвращает одноразовый подписанный токен (t)
        const { queryParams } = Linking.parse(result.url);
        const token = queryParams?.t as string;

        if (!token) {
          throw new Error('no token');
        }

        const exRes = await fetch(`${BASE_URL}/api/auth/mobile/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!exRes.ok) {
          const err = await exRes.json().catch(() => null);
          throw new Error(err?.error || t('profile.socialError'));
        }

        const u = await exRes.json();
        setUser({
          id: String(u.id),
          email: u.email,
          fullName: u.fullName,
          role: u.role,
        });
        Alert.alert(`${t('profile.welcomeBack')}, ${u.fullName}!`);
      }
    } catch (e) {
      console.error('Social login error:', e);
      Alert.alert(t('profile.socialError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/telegram/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.botUrl) {
        throw new Error('Failed to start Telegram auth');
      }

      await WebBrowser.openBrowserAsync(data.webUrl || data.botUrl);

      const pollRes = await pollTelegramAuth(data.token);
      if (pollRes) {
        setUser({
          id: String(pollRes.id),
          email: pollRes.email,
          fullName: pollRes.fullName,
          role: pollRes.role,
        });
        Alert.alert(`${t('profile.welcomeBack')}, ${pollRes.fullName}!`);
      }
    } catch (e) {
      console.error('Telegram login error:', e);
      Alert.alert(t('profile.socialError'));
    } finally {
      setLoading(false);
    }
  };

  const pollTelegramAuth = async (token: string): Promise<{
    id: number;
    email: string;
    fullName: string;
    role: string;
  } | null> => {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await fetch(`${BASE_URL}/api/auth/telegram/poll?token=${token}`);
        const data = await res.json();
        if (data.confirmed && data.id) {
          return data;
        }
      } catch {}
    }
    return null;
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert(t('auth.verifySuccess'));
        setIsLogin(true);
        setStep('auth');
      } else {
        Alert.alert(data.error || t('auth.invalidCode'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AmbientBackdrop />
      <BackButton />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
        >
          <View style={styles.profileHeader}>
            <View style={styles.headerTop}>
              <View style={styles.avatarLarge}>
                <LinearGradient
                  colors={(theme.mode === 'dark' ? gradients.dark : gradients.light).primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.avatarTextLarge, { color: '#fff' }]}>{user.fullName[0]}</Text>
              </View>
              <SpringPress onPress={() => setIsEditing(!isEditing)} scaleTo={0.9}>
                <View style={styles.editBtn}>
                  <Ionicons name={isEditing ? 'close' : 'create-outline'} size={22} color={theme.primary} />
                </View>
              </SpringPress>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.editInputGroup}>
                  <Text style={styles.editLabel}>{t('profile.fullName')}</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editFullName}
                    onChangeText={setEditFullName}
                  />
                </View>
                <View style={styles.editInputGroup}>
                  <Text style={styles.editLabel}>{t('profile.email')}</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.editInputGroup}>
                  <Text style={styles.editLabel}>{t('profile.password')}</Text>
                  <TextInput
                    style={styles.editInput}
                    placeholder="••••••••"
                    value={editPassword}
                    onChangeText={setEditPassword}
                    secureTextEntry
                  />
                </View>
                <SpringPress onPress={handleUpdateProfile} disabled={loading} scaleTo={0.96}>
                  <LinearGradient
                    colors={(theme.mode === 'dark' ? gradients.dark : gradients.light).primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveBtn}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{t('profile.save')}</Text>}
                  </LinearGradient>
                </SpringPress>
              </View>
            ) : (
              <>
                <Text style={styles.userNameLarge}>{user.fullName}</Text>
                <Text style={styles.userEmailLarge}>{user.email}</Text>
                <View style={{ marginTop: 10, backgroundColor: theme.primarySoft, paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10 }}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{t('profile.role')}: {user.role}</Text>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color={theme.danger} />
              <Text style={styles.logoutText}>{t('profile.logout')}</Text>
            </TouchableOpacity>

            {user?.role === 'ADMIN' && (
              <TouchableOpacity
                style={[styles.logoutBtn, { marginTop: 10, borderColor: theme.border }]}
                onPress={async () => {
                  Alert.alert('Очистить GIF', 'Удалить все GIF-ссылки у товаров?', [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Очистить',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const res = await fetch(`${BASE_URL}/api/admin/clear-gifs`, { method: 'POST' });
                          const data = await res.json();
                          Alert.alert('Готово', `Очищено: ${data.cleared} товаров`);
                        } catch {
                          Alert.alert('Ошибка');
                        }
                      },
                    },
                  ]);
                }}>
                <Ionicons name="trash-outline" size={20} color={theme.danger} />
                <Text style={styles.logoutText}>Очистить GIF</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.loyaltyCard}>
            <Text style={styles.loyaltyKicker}>Pizza Flow Club</Text>
            <Text style={styles.loyaltyTitle}>Быстрый доступ к заказам, избранному и статусам в одном месте</Text>
            <View style={styles.loyaltyStats}>
              <View style={styles.loyaltyStatBox}>
                <Text style={styles.loyaltyStatValue}>{orders.length}</Text>
                <Text style={styles.loyaltyStatLabel}>Заказов</Text>
              </View>
              <View style={styles.loyaltyStatBox}>
                <Text style={styles.loyaltyStatValue}>{user.role}</Text>
                <Text style={styles.loyaltyStatLabel}>Роль</Text>
              </View>
              <View style={styles.loyaltyStatBox}>
                <Text style={styles.loyaltyStatValue}>24/7</Text>
                <Text style={styles.loyaltyStatLabel}>Статусы</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 20, gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/favorites')}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="heart" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>
                  Избранное
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, fontWeight: '500' }}>
                  Сохранённые товары
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/delivery')}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="location" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>
                  Доставка
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, fontWeight: '500' }}>
                  Зоны, цены и рестораны
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/group-order')}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="people" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>
                  Групповой заказ
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, fontWeight: '500' }}>
                  Заказывайте вместе с друзьями
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
            </TouchableOpacity>

            <ThemeToggle />
          </View>

          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>{t('profile.myOrders')}</Text>
            {orders.length > 0 ? (
              orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>{t('courier.order')} #{order.id}</Text>
                    <Text style={styles.orderPrice}>{order.totalAmount} TJS</Text>
                  </View>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                  <View style={{ marginTop: 12, marginBottom: 6 }}>
                    <LiveOrderStatus
                      orderId={order.id}
                      initialStatus={order.status}
                      initialDeliveryType={order.deliveryType}
                    />
                  </View>
                  <View style={styles.orderDivider} />
                  <Text style={styles.orderItems} numberOfLines={2}>
                    {(() => {
                      try {
                        const items = JSON.parse(order.items);
                        return items.map((i: any) => i.productItem?.product?.name).filter(Boolean).join(', ');
                      } catch {
                        return '';
                      }
                    })()}
                  </Text>
                  {order.status === 'SUCCEEDED' && !order.tip && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedOrderId(order.id);
                        setTipModalVisible(true);
                      }}
                      style={[styles.tipBtn, { backgroundColor: theme.primarySoft }]}
                    >
                      <Ionicons name="heart" size={16} color={theme.primary} />
                      <Text style={[styles.tipBtnText, { color: theme.primary }]}>
                        Оставить чаевые
                      </Text>
                    </TouchableOpacity>
                  )}
                  {order.tip && (
                    <View style={[styles.tipBadge, { backgroundColor: theme.successSoft }]}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                      <Text style={[styles.tipBadgeText, { color: theme.success }]}>
                        Чаевые {order.tip.amount} TJS
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyOrders}>
                <Ionicons name="receipt-outline" size={60} color={theme.textSubtle} />
                <Text style={styles.emptyOrdersText}>{t('profile.emptyOrders')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackdrop />
      <BackButton />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={{ position: 'absolute', top: insets.top + 12, right: 18, zIndex: 10 }}>
            <ThemeToggle variant="icon" />
          </View>
          <View style={styles.authHeader}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeLetter}>P</Text>
            </View>
            <Text style={styles.authTitle}>
              {step === 'verify' ? t('auth.verify') : isLogin ? t('auth.login') : t('auth.register')}
            </Text>
            <Text style={styles.authSubtitle}>
              {step === 'verify'
                ? `${t('auth.verifySubtitle')} ${email}`
                : 'Войди, чтобы сохранить адреса, следить за статусом заказа и повторять любимые позиции быстрее.'}
            </Text>
          </View>

          {step === 'auth' ? (
            <View style={styles.form}>
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.fullName')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Фирдавс Рахимов"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              )}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@mail.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <SpringPress onPress={handleAuth} disabled={loading} scaleTo={0.96}>
                <LinearGradient
                  colors={(theme.mode === 'dark' ? gradients.dark : gradients.light).primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mainBtn}>
                  {loading ? <ActivityIndicator color="white" /> : (
                    <Text style={styles.mainBtnText}>{isLogin ? t('auth.loginBtn') : t('auth.registerBtn')}</Text>
                  )}
                </LinearGradient>
              </SpringPress>

              <View style={styles.dividerRow}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>{t('auth.socialDivider')}</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[styles.socialBtn, { borderColor: theme.border }]}
                  onPress={() => handleSocialLogin('google')}
                >
                  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
                  <Text style={styles.socialBtnText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialBtn, { borderColor: theme.text, backgroundColor: theme.text }]}
                  onPress={() => handleSocialLogin('github')}
                >
                  <Ionicons name="logo-github" size={24} color="white" />
                  <Text style={[styles.socialBtnText, { color: 'white' }]}>GitHub</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.socialBtn, { borderColor: '#2AABEE', backgroundColor: '#2AABEE', marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                onPress={handleTelegramLogin}
              >
                <Ionicons name="paper-plane" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={[styles.socialBtnText, { color: 'white' }]}>Telegram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchBtn}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsLogin(!isLogin);
                }}
              >
                <Text style={styles.switchText}>
                  {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.codeInput')}</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity style={styles.mainBtn} onPress={handleVerify} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <Text style={styles.mainBtnText}>{t('auth.confirmBtn')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.switchBtn} onPress={() => setStep('auth')}>
                <Text style={styles.switchText}>{t('auth.backToRegister')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {selectedOrderId && (
        <CourierTipModal
          visible={tipModalVisible}
          orderId={selectedOrderId}
          onClose={() => {
            setTipModalVisible(false);
            setSelectedOrderId(null);
          }}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 200 },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: t.surface,
    padding: 32,
    borderRadius: 32,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: t.mode === 'dark' ? 0.45 : 0.08,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  },
  avatarLarge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6,
  },
  avatarTextLarge: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  userNameLarge: { fontSize: 26, fontWeight: '900', color: t.text, letterSpacing: -0.6 },
  userEmailLarge: { fontSize: 14, color: t.textMuted, marginTop: 4 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: t.mode === 'dark' ? 'rgba(248,113,113,0.15)' : '#fff1f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    gap: 8,
  },
  logoutText: { color: t.danger, fontWeight: '800' },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  editBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: t.mode === 'dark' ? t.surfaceMuted : t.primarySoft,
    borderWidth: t.mode === 'dark' ? 1 : 0,
    borderColor: t.border,
    padding: 10,
    borderRadius: 15,
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: t.mode === 'dark' ? 0.4 : 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  editForm: { width: '100%', marginTop: 20, gap: 15 },
  editInputGroup: { gap: 5 },
  editLabel: { fontSize: 12, fontWeight: '700', color: t.textMuted, marginLeft: 5 },
  editInput: {
    backgroundColor: t.surfaceMuted,
    height: 50,
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 15,
    color: t.text,
  },
  saveBtn: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 24,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  ordersSection: { marginTop: 30 },
  loyaltyCard: {
    marginTop: 16,
    backgroundColor: t.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: t.border,
  },
  loyaltyKicker: {
    color: t.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  loyaltyTitle: {
    color: t.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginTop: 10,
  },
  loyaltyStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  loyaltyStatBox: {
    flex: 1,
    backgroundColor: t.backgroundSecondary,
    borderRadius: 18,
    padding: 14,
  },
  loyaltyStatValue: {
    color: t.text,
    fontSize: 16,
    fontWeight: '900',
  },
  loyaltyStatLabel: {
    color: t.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: t.text, marginBottom: 20 },
  orderCard: {
    backgroundColor: t.surface,
    borderRadius: 26,
    padding: 22,
    marginBottom: 14,
    shadowColor: t.mode === 'dark' ? '#000' : t.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: t.mode === 'dark' ? 0.35 : 0.05,
    shadowRadius: 18,
    elevation: 3,
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: '800', color: t.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '800' },
  orderDate: { fontSize: 12, color: t.textMuted, marginTop: 4 },
  orderPrice: { fontSize: 18, fontWeight: '900', color: t.primary },
  orderDivider: { height: 1, backgroundColor: t.borderMuted, marginVertical: 12 },
  orderItems: { fontSize: 13, color: t.textMuted },
  tipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  tipBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tipBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyOrders: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20, gap: 15 },
  emptyOrdersText: {
    color: t.textSubtle,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  authScroll: { padding: 30, paddingTop: 60, paddingBottom: 200 },
  authHeader: { alignItems: 'center', marginBottom: 30 },
  brandBadge: {
    width: 74,
    height: 74,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  brandBadgeLetter: {
    color: t.primaryContrast,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  authTitle: { fontSize: 30, fontWeight: '900', color: t.text, textAlign: 'center', letterSpacing: -0.8 },
  authSubtitle: { fontSize: 14, color: t.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  form: { gap: 15 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '800', color: t.text, marginLeft: 5 },
  input: {
    backgroundColor: t.surface,
    height: 60,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    color: t.text,
    shadowColor: t.shadow,
    shadowOpacity: t.mode === 'dark' ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  codeInput: { textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 5 },
  mainBtn: {
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: t.textMuted, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: t.border },
  dividerText: { fontSize: 12, color: t.textSubtle, fontWeight: '700' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  socialIcon: { width: 24, height: 24 },
  socialBtnText: { fontSize: 15, fontWeight: '800', color: t.text },
});
