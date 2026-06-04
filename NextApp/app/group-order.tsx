import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '@/constants/Api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { useUserStore } from '@/store/useUserStore';
import { AmbientBackdrop } from '@/components/ui';

export default function GroupOrderScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = makeStyles(theme);
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupOrder, setGroupOrder] = useState<any>(null);
  const [myParticipant, setMyParticipant] = useState<any>(null);

  const handleCreateRoom = async () => {
    if (!user) {
      Alert.alert('Войдите в аккаунт', 'Для создания комнаты нужно войти');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/group-orders`, {
        creatorId: user.id,
      });
      setGroupOrder(data);
      setMode('create');

      const participant = await axios.post(
        `${API_URL}/group-orders/${data.code}/join`,
        { userId: user.id }
      );
      setMyParticipant(participant.data);
    } catch (error) {
      console.error('Failed to create group order:', error);
      Alert.alert('Ошибка', 'Не удалось создать комнату');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Введите код', 'Код комнаты обязателен');
      return;
    }

    setLoading(true);
    try {
      const { data: order } = await axios.get(
        `${API_URL}/group-orders?code=${joinCode.toUpperCase()}`
      );
      setGroupOrder(order);

      const { data: participant } = await axios.post(
        `${API_URL}/group-orders/${joinCode.toUpperCase()}/join`,
        user ? { userId: user.id } : { guestName: 'Гость' }
      );
      setMyParticipant(participant);
      setMode('join');
    } catch (error: any) {
      console.error('Failed to join group order:', error);
      if (error.response?.status === 404) {
        Alert.alert('Ошибка', 'Комната не найдена');
      } else if (error.response?.status === 410) {
        Alert.alert('Ошибка', 'Комната истекла');
      } else {
        Alert.alert('Ошибка', 'Не удалось присоединиться');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShareCode = async () => {
    if (!groupOrder) return;
    try {
      await Share.share({
        message: `Присоединяйся к групповому заказу пиццы! Код: ${groupOrder.code}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const refreshGroupOrder = async () => {
    if (!groupOrder) return;
    try {
      const { data } = await axios.get(
        `${API_URL}/group-orders?code=${groupOrder.code}`
      );
      setGroupOrder(data);
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  useEffect(() => {
    if (groupOrder) {
      const interval = setInterval(refreshGroupOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [groupOrder]);

  if (mode === 'menu') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AmbientBackdrop />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            Групповой заказ
          </Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View
              style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}
            >
              <Ionicons name="people" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Создать комнату
            </Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              Создайте комнату и пригласите друзей. Каждый добавит свои позиции
              в общий заказ.
            </Text>
            <TouchableOpacity
              onPress={handleCreateRoom}
              disabled={loading}
              style={[styles.btn, { backgroundColor: theme.primary }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Создать</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View
              style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}
            >
              <Ionicons name="enter" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Присоединиться
            </Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              Введите код комнаты, чтобы присоединиться к групповому заказу.
            </Text>
            <TextInput
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              placeholder="Введите код"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
              maxLength={8}
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleJoinRoom}
              disabled={loading || !joinCode.trim()}
              style={[
                styles.btn,
                {
                  backgroundColor:
                    loading || !joinCode.trim() ? theme.border : theme.primary,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Присоединиться</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!groupOrder || !myParticipant) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const totalAmount = groupOrder.participants.reduce(
    (sum: number, p: any) => sum + p.totalAmount,
    0
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackdrop />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setMode('menu');
            setGroupOrder(null);
            setMyParticipant(null);
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Комната {groupOrder.code}
        </Text>
        <TouchableOpacity onPress={handleShareCode} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.banner,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>
              Код комнаты: {groupOrder.code}
            </Text>
            <Text style={[styles.bannerSub, { color: theme.textMuted }]}>
              Поделитесь кодом с друзьями
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleShareCode}
            style={[styles.shareCircle, { backgroundColor: theme.primarySoft }]}
          >
            <Ionicons name="share-social" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Участники ({groupOrder.participants.length})
          </Text>
          {groupOrder.participants.map((p: any) => (
            <View
              key={p.id}
              style={[
                styles.participantCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.participantName, { color: theme.text }]}>
                  {p.user?.fullName || p.guestName || 'Гость'}
                  {p.id === myParticipant.id && ' (Вы)'}
                </Text>
                <Text
                  style={[styles.participantAmount, { color: theme.textMuted }]}
                >
                  {p.totalAmount} TJS
                </Text>
              </View>
              {p.id === myParticipant.id && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/')}
                  style={[
                    styles.addBtn,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <Ionicons name="add" size={20} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View
          style={[
            styles.totalCard,
            { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
        >
          <Text style={styles.totalLabel}>Общая сумма</Text>
          <Text style={styles.totalAmount}>{totalAmount} TJS</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Оформить заказ',
              'Функция оформления группового заказа в разработке'
            );
          }}
          style={[styles.checkoutBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.checkoutText}>Оформить заказ</Text>
        </TouchableOpacity>
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
    shareBtn: {
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
    card: {
      padding: 24,
      borderRadius: 24,
      alignItems: 'center',
      gap: 12,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    cardDesc: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    input: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 16,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 2,
    },
    btn: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
    },
    bannerTitle: {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    bannerSub: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
    shareCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      gap: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.3,
      marginBottom: 6,
    },
    participantCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
    },
    participantName: {
      fontSize: 15,
      fontWeight: '800',
    },
    participantAmount: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 2,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalCard: {
      padding: 20,
      borderRadius: 20,
      alignItems: 'center',
      borderWidth: 1,
      marginTop: 8,
    },
    totalLabel: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
      opacity: 0.9,
    },
    totalAmount: {
      color: '#fff',
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -1,
      marginTop: 4,
    },
    checkoutBtn: {
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkoutText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '900',
    },
  });
