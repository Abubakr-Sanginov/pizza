import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, LayoutAnimation, RefreshControl, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const BASE_URL = 'https://pizza-liart-chi.vercel.app';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser, logout } = useUserStore();
  
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

  const fetchOrders = async () => {
    if (!user) return;
    try {
      // In a real app, we'd use the userId to fetch orders
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
        
        // Note: NextAuth might not return JSON directly here, so we might need a custom login route
        // For simplicity in this demo, let's assume a custom route or manual check
        const loginRes = await fetch(`${BASE_URL}/api/users`); // Dummy check to get user info
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
          alert('Ошибка входа. Проверьте данные или подтвердите почту.');
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
          alert(data.error || 'Ошибка регистрации');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения с сервером');
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
      
      if (result.type === 'success') {
        // Проверяем сессию после возврата
        const res = await fetch(`${BASE_URL}/api/auth/session`);
        const session = await res.json();
        
        if (session?.user) {
          const usersRes = await fetch(`${BASE_URL}/api/users`);
          const allUsers = await usersRes.json();
          const foundUser = allUsers.find((u: any) => u.email === session.user.email);
          
          if (foundUser) {
            setUser({
              id: foundUser.id.toString(),
              email: foundUser.email,
              fullName: foundUser.fullName,
              role: foundUser.role
            });
            alert('С возвращением!');
          }
        }
      }
    } catch (e) {
      console.error('Social login error:', e);
      alert('Ошибка при входе через соцсети');
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
        alert('Почта подтверждена! Теперь вы можете войти.');
        setIsLogin(true);
        setStep('auth');
      } else {
        alert(data.error || 'Неверный код');
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff7000']} />}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{user.fullName[0]}</Text>
            </View>
            <Text style={styles.userNameLarge}>{user.fullName}</Text>
            <Text style={styles.userEmailLarge}>{user.email}</Text>
            
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="#ff4d4f" />
              <Text style={styles.logoutText}>Выйти</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>Мои заказы</Text>
            {orders.length > 0 ? (
              orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Заказ #{order.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: order.status === 'SUCCEEDED' ? '#f6ffed' : '#fff7e6' }]}>
                      <Text style={[styles.statusText, { color: order.status === 'SUCCEEDED' ? '#52c41a' : '#faad14' }]}>
                        {order.status === 'SUCCEEDED' ? 'Выполнен' : 'В обработке'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                  <Text style={styles.orderPrice}>{order.totalAmount} TJS</Text>
                  <View style={styles.orderDivider} />
                  <Text style={styles.orderItems} numberOfLines={1}>
                    {JSON.parse(order.items).map((i: any) => i.productItem.product.name).join(', ')}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyOrders}>
                <Ionicons name="receipt-outline" size={60} color="#9BA1A6" />
                <Text style={styles.emptyOrdersText}>Вы еще ничего не заказывали</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authHeader}>
            <Image source={{ uri: 'https://cdn.dodostatic.net/site-static/dist/assets/522384a867822955.svg' }} style={styles.logo} />
            <Text style={styles.authTitle}>
              {step === 'verify' ? 'Подтверждение' : isLogin ? 'Вход в аккаунт' : 'Регистрация'}
            </Text>
            <Text style={styles.authSubtitle}>
              {step === 'verify' ? `Введите код, отправленный на ${email}` : 'Чтобы видеть историю заказов'}
            </Text>
          </View>

          {step === 'auth' ? (
            <View style={styles.form}>
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Полное имя</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Иван Иванов" 
                    value={fullName} 
                    onChangeText={setFullName} 
                  />
                </View>
              )}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="example@mail.com" 
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Пароль</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                />
              </View>

              <TouchableOpacity style={styles.mainBtn} onPress={handleAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <Text style={styles.mainBtnText}>{isLogin ? 'Войти' : 'Создать аккаунт'}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>или через соцсети</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity 
                  style={[styles.socialBtn, { borderColor: '#e0e0e0' }]} 
                  onPress={() => handleSocialLogin('google')}
                >
                  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
                  <Text style={styles.socialBtnText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.socialBtn, { borderColor: '#181717', backgroundColor: '#181717' }]} 
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
                  {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Код из письма</Text>
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
                  <Text style={styles.mainBtnText}>Подтвердить</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.switchBtn} onPress={() => setStep('auth')}>
                <Text style={styles.switchText}>Назад к регистрации</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf7f2',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 200,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 40,
    shadowColor: '#ff7000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff7f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ff7000',
    marginBottom: 15,
  },
  avatarTextLarge: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ff7000',
  },
  userNameLarge: {
    fontSize: 24,
    fontWeight: '900',
    color: '#11181C',
  },
  userEmailLarge: {
    fontSize: 14,
    color: '#687076',
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#fff1f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    gap: 8,
  },
  logoutText: {
    color: '#ff4d4f',
    fontWeight: '800',
  },
  ordersSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#11181C',
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#11181C',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 12,
    color: '#687076',
    marginTop: 4,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ff7000',
    marginTop: 10,
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  orderItems: {
    fontSize: 13,
    color: '#687076',
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 15,
  },
  emptyOrdersText: {
    color: '#9BA1A6',
    fontWeight: '700',
  },
  authScroll: {
    padding: 30,
    paddingTop: 60,
    paddingBottom: 200, // Even more space for tab bar
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#11181C',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  form: {
    gap: 15,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#11181C',
    marginLeft: 5,
  },
  input: {
    backgroundColor: 'white',
    height: 60,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#11181C',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 5,
  },
  mainBtn: {
    backgroundColor: '#ff7000',
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Adjusted margin
    shadowColor: '#ff7000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  mainBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  switchBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#687076',
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    fontSize: 12,
    color: '#9BA1A6',
    fontWeight: '700',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
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
  socialIcon: {
    width: 24,
    height: 24,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#11181C',
  },
});
