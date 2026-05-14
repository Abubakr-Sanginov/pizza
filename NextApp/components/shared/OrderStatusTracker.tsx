import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, Theme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';

type OrderStatus = 'PENDING' | 'COOKING' | 'READY' | 'DELIVERING' | 'SUCCEEDED' | 'CANCELLED';
type DeliveryType = 'DELIVERY' | 'PICKUP';

interface Step {
  status: OrderStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const baseSteps: Step[] = [
  { status: 'PENDING', label: 'Принят', icon: 'time-outline' },
  { status: 'COOKING', label: 'Готовится', icon: 'restaurant-outline' },
  { status: 'READY', label: 'Готов', icon: 'checkmark-circle-outline' },
  { status: 'DELIVERING', label: 'В пути', icon: 'bicycle-outline' },
  { status: 'SUCCEEDED', label: 'Доставлен', icon: 'cube-outline' },
];

const pickupLabels: Partial<Record<OrderStatus, string>> = {
  SUCCEEDED: 'Выдан',
};

interface Props {
  status: OrderStatus;
  deliveryType?: DeliveryType;
}

export const OrderStatusTracker: React.FC<Props> = ({ status, deliveryType }) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (status === 'CANCELLED') {
    return (
      <View style={styles.cancelled}>
        <Ionicons name="close-circle" size={20} color={theme.danger} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cancelledTitle}>Заказ отменён</Text>
          <Text style={styles.cancelledHint}>Если это ошибка — свяжитесь с поддержкой</Text>
        </View>
      </View>
    );
  }

  const steps = deliveryType === 'PICKUP'
    ? baseSteps
        .filter((s) => s.status !== 'DELIVERING')
        .map((s) => (pickupLabels[s.status] ? { ...s, label: pickupLabels[s.status]! } : s))
    : baseSteps;

  const activeIndex = Math.max(0, steps.findIndex((s) => s.status === status));
  const grad = theme.mode === 'dark' ? gradients.dark : gradients.light;

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.container}>
      <View style={styles.lineBack} />
      <View style={[styles.lineFront, { width: `${(activeIndex / (steps.length - 1)) * 100}%` }]}>
        <LinearGradient
          colors={grad.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.stepsRow}>
        {steps.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;
          const filled = isCompleted || isActive;
          return (
            <View key={step.status} style={styles.stepCol}>
              <View style={styles.circleWrap}>
                {isActive && (
                  <Animated.View
                    style={[
                      styles.pulse,
                      { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                    ]}
                  />
                )}
                {filled ? (
                  <LinearGradient
                    colors={grad.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.circle}>
                    <Ionicons name={step.icon} size={16} color="#fff" />
                  </LinearGradient>
                ) : (
                  <View style={styles.circleIdle}>
                    <Ionicons name={step.icon} size={16} color={theme.textSubtle} />
                  </View>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[styles.label, filled ? styles.labelOn : styles.labelOff]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const CIRCLE = 32;

const makeStyles = (t: Theme) => StyleSheet.create({
  container: { width: '100%', position: 'relative', paddingTop: 4 },
  lineBack: {
    position: 'absolute',
    top: 4 + CIRCLE / 2 - 1,
    left: CIRCLE / 2 + 8,
    right: CIRCLE / 2 + 8,
    height: 2,
    backgroundColor: t.border,
    borderRadius: 2,
  },
  lineFront: {
    position: 'absolute',
    top: 4 + CIRCLE / 2 - 1,
    left: CIRCLE / 2 + 8,
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepCol: { flex: 1, alignItems: 'center' },
  circleWrap: { width: CIRCLE, height: CIRCLE, alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: t.primary,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIdle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  label: { fontSize: 10, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  labelOn: { color: t.text },
  labelOff: { color: t.textSubtle },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: t.mode === 'dark' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: t.mode === 'dark' ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
  },
  cancelledTitle: { color: t.danger, fontWeight: '900', fontSize: 13 },
  cancelledHint: { color: t.textMuted, fontSize: 11, marginTop: 1 },
});
