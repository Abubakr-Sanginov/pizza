import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
  Text,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, Theme } from '@/hooks/useTheme';
import { motion } from '@/constants/Colors';

type IconName = keyof typeof Ionicons.glyphMap;

function GlassEdges({ rounded, theme }: { rounded: number; theme: Theme }) {
  const topColor =
    theme.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)';
  const bottomColor =
    theme.mode === 'dark' ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.04)';
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[topColor, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={[StyleSheet.absoluteFill, { borderRadius: rounded }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', bottomColor]}
        start={{ x: 0.5, y: 0.6 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: rounded }]}
      />
    </>
  );
}

interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  intensity?: number;
  tint?: 'auto' | 'light' | 'dark';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
}

export const LiquidGlassCard: React.FC<CardProps> = ({
  children,
  style,
  rounded = 28,
  intensity = 95,
  tint = 'auto',
  shadow = 'md',
}) => {
  const theme = useTheme();
  const resolvedTint = tint === 'auto' ? (theme.mode === 'dark' ? 'dark' : 'light') : tint;

  const shadowStyle = makeShadow(theme, shadow);

  return (
    <View style={[shadowStyle, { borderRadius: rounded }, style]}>
      <View style={[styles.cardOuter, { borderRadius: rounded }]}>
        <BlurView
          intensity={intensity}
          tint={resolvedTint}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.mode === 'dark' ? 'rgba(18,20,26,0.5)' : 'rgba(255,255,255,0.4)' }]}
        />
        <GlassEdges rounded={rounded} theme={theme} />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: rounded,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor:
                theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)',
            },
          ]}
        />
        <View>{children}</View>
      </View>
    </View>
  );
};

interface ButtonProps {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'glass' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const LiquidGlassButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'primary',
  disabled,
  loading,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, ...motion.springSnappy }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...motion.spring }).start();

  const heights = { sm: 42, md: 54, lg: 62 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };
  const radii = { sm: 16, md: 22, lg: 26 };

  const renderInner = () => {
    const iconColor = variant === 'primary' ? '#fff' : theme.primary;
    const textColor = variant === 'primary' ? '#fff' : theme.primary;
    return (
      <>
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={iconColor} />
        )}
        <Text
          style={[
            styles.btnText,
            { fontSize: fontSizes[size], color: textColor },
            textStyle,
          ]}>
          {loading ? '…' : title}
        </Text>
        {icon && iconPosition === 'right' && (
          <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={iconColor} />
        )}
      </>
    );
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale }], opacity: disabled ? 0.5 : 1 },
        makeShadow(theme, variant === 'primary' ? 'lg' : 'sm', variant === 'primary' ? theme.primary : undefined),
        style,
      ]}>
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <View style={[styles.btnOuter, { height: heights[size], borderRadius: radii[size] }]}>
          {variant === 'primary' ? (
            <LinearGradient
              colors={['#5869e8', '#3549d0'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : variant === 'glass' ? (
            <BlurView
              intensity={95}
              tint={theme.mode === 'dark' ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { backgroundColor: theme.mode === 'dark' ? 'rgba(18,20,26,0.5)' : 'rgba(255,255,255,0.4)' }]}
            />
          ) : null}

          <GlassEdges rounded={radii[size]} theme={theme} />

          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radii[size],
                borderWidth: StyleSheet.hairlineWidth,
                borderColor:
                  variant === 'primary'
                    ? 'rgba(255,255,255,0.4)'
                    : theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.14)'
                    : 'rgba(255,255,255,0.8)',
              },
            ]}
          />

          <View style={styles.btnContent}>{renderInner()}</View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

interface PillProps {
  active?: boolean;
  onPress?: () => void;
  label: string;
  style?: StyleProp<ViewStyle>;
}

export const LiquidGlassPill: React.FC<PillProps> = ({ active, onPress, label, style }) => {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, ...motion.springSnappy }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...motion.spring }).start();

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        active ? makeShadow(theme, 'md', theme.primary) : makeShadow(theme, 'sm'),
        style,
      ]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={[styles.pillOuter]}>
          {active ? (
            <LinearGradient
              colors={['#5869e8', '#3549d0'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <BlurView
              intensity={85}
              tint={theme.mode === 'dark' ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { backgroundColor: theme.mode === 'dark' ? 'rgba(18,20,26,0.5)' : 'rgba(255,255,255,0.4)' }]}
            />
          )}

          <GlassEdges rounded={20} theme={theme} />

          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 20,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: active
                  ? 'rgba(255,255,255,0.4)'
                  : theme.mode === 'dark'
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(255,255,255,0.8)',
              },
            ]}
          />

          <Text
            style={[
              styles.pillText,
              {
                color: active ? '#fff' : theme.textMuted,
              },
            ]}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

function makeShadow(theme: Theme, size: 'sm' | 'md' | 'lg' | 'none', color?: string) {
  if (size === 'none') return {};
  const sizes = {
    sm: { offset: 4, radius: 10, opacity: 0.06 },
    md: { offset: 12, radius: 24, opacity: theme.mode === 'dark' ? 0.5 : 0.1 },
    lg: { offset: 18, radius: 32, opacity: theme.mode === 'dark' ? 0.55 : 0.18 },
  };
  const s = sizes[size];
  return {
    shadowColor: color ?? (theme.mode === 'dark' ? '#000' : theme.primary),
    shadowOffset: { width: 0, height: s.offset },
    shadowOpacity: s.opacity,
    shadowRadius: s.radius,
    elevation: size === 'lg' ? 12 : size === 'md' ? 8 : 3,
  };
}

const styles = StyleSheet.create({
  cardOuter: {
    overflow: 'hidden',
  },
  btnOuter: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  btnText: {
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pillOuter: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
