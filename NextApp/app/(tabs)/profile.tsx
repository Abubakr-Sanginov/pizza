import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, LayoutAnimation, RefreshControl, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

import { BASE_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SpringPress, AmbientBackdrop, LiquidGlassCard } from '@/components/ui';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser, logout } = useUserStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');

  // Edit Profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

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
        const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&json=true`
        });
        
        const loginRes = await fetch(`${BASE_URL}/api/users`);
        const allUsers = await loginRes.json();
        const foundUser = allUsers.find((u: any) => u.email === email);

        if (foundUser) {
          setUser({
            id: foundUser.id.toString(),
            email: foundUser.email,
            fullName: foundUser.fullName,
            role: foundUser.role
          });
        } else {
          Alert.alert(t('profile.updateError'));
        }
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
        // Парсим параметры из URL возврата
        const { queryParams } = Linking.parse(result.url);
        const email = queryParams?.email as string;
        const name = queryParams?.name as string;

        if (email) {
          // Ищем пользователя в нашей базе по email
          const usersRes = await fetch(`${BASE_URL}/api/users`);
          const allUsers = await usersRes.json();
          const foundUser = allUsers.find((u: any) => u.email === email);
          
          if (foundUser) {
            setUser({
              id: foundUser.id.toString(),
              email: foundUser.email,
              fullName: foundUser.fullName,
              role: foundUser.role
            });
            Alert.alert(`${t('profile.welcomeBack')}, ${foundUser.fullName}!`);
          } else {
            // Если пользователя нет в базе (странно, но вдруг), создаем временный профиль
            setUser({
              id: 'social',
              email: email,
              fullName: name || email,
              role: 'USER'
            });
          }
        }
      }
    } catch (e) {
      console.error('Social login error:', e);
      Alert.alert(t('profile.socialError'));
    } finally {
      setLoading(false);
    }
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
          </View>

          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>{t('profile.myOrders')}</Text>
            {orders.length > 0 ? (
              orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>{t('courier.order')} #{order.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: order.status === 'SUCCEEDED' ? (theme.mode === 'dark' ? 'rgba(74,222,128,0.15)' : '#f6ffed') : (theme.mode === 'dark' ? 'rgba(251,191,36,0.15)' : '#fff7e6') }]}>
                      <Text style={[styles.statusText, { color: order.status === 'SUCCEEDED' ? theme.success : theme.warning }]}>
                        {order.status === 'SUCCEEDED' ? t('profile.orderStatus.succeeded') : t('profile.orderStatus.processing')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                  <Text style={styles.orderPrice}>{order.totalAmount} TJS</Text>
                  <View style={styles.orderDivider} />
                  <Text style={styles.orderItems}>
                    {JSON.parse(order.items).map((i: any) => i.productItem.product.name).join(', ')}
                  </Text>
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authHeader}>
            <Image source={{ uri: 'https://cdn.dodostatic.net/site-static/dist/assets/522384a867822955.svg' }} style={styles.logo} />
            <Text style={styles.authTitle}>
              {step === 'verify' ? t('auth.verify') : isLogin ? t('auth.login') : t('auth.register')}
            </Text>
            <Text style={styles.authSubtitle}>
              {step === 'verify' ? `${t('auth.verifySubtitle')} ${email}` : t('auth.authSubtitle')}
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
  orderPrice: { fontSize: 18, fontWeight: '900', color: t.primary, marginTop: 10 },
  orderDivider: { height: 1, backgroundColor: t.borderMuted, marginVertical: 12 },
  orderItems: { fontSize: 13, color: t.textMuted },
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
  logo: { width: 60, height: 60, marginBottom: 20 },
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
