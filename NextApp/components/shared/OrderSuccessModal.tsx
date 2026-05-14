import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';
import { SpringPress, Confetti } from '@/components/ui';

interface Props {
  visible: boolean;
  orderId?: number;
  totalAmount?: number;
  etaMinutes?: number;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<Props> = ({
  visible,
  orderId,
  totalAmount,
  etaMinutes = 45,
  onClose,
}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const grad = theme.mode === 'dark' ? gradients.dark : gradients.light;

  const scale = useRef(new Animated.Value(0.6)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.6);
      ring.setValue(0);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [visible]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {visible && <Confetti count={60} />}
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
            <Animated.View style={{ transform: [{ scale }] }}>
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark" size={44} color="#fff" />
              </View>
            </Animated.View>
          </View>

          <Text style={styles.title}>Заказ оформлен!</Text>
          <Text style={styles.subtitle}>Скоро всё будет горячее. Спасибо ❤</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>№ заказа</Text>
              <Text style={styles.statValue}>#{orderId ?? '—'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Сумма</Text>
              <Text style={styles.statValue}>{totalAmount ?? 0} TJS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Доставка</Text>
              <Text style={styles.statValue}>~{etaMinutes} мин</Text>
            </View>
          </View>

          <SpringPress onPress={onClose} scaleTo={0.96} style={{ width: '100%' }}>
            <LinearGradient
              colors={grad.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}>
              <Text style={styles.btnText}>Отлично</Text>
            </LinearGradient>
          </SpringPress>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (t: Theme) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: t.surface,
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    borderWidth: t.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  iconWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#10b981',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: t.text,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: t.textMuted,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    backgroundColor: t.surfaceMuted,
    borderRadius: 18,
    marginBottom: 18,
  },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', color: t.textSubtle, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 16, fontWeight: '900', color: t.text, marginTop: 4 },
  statDivider: { width: 1, height: 28, backgroundColor: t.borderMuted },
  btn: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.2 },
});
