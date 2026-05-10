import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { gradients, motion } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'soft' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const PremiumButton: React.FC<Props> = ({
  title,
  onPress,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const grad = theme.mode === 'dark' ? gradients.dark : gradients.light;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, ...motion.springSnappy }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...motion.spring }).start();

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };
  const radii = { sm: 14, md: 18, lg: 22 };

  const content = (
    <View style={[styles.row, { gap: size === 'sm' ? 6 : 8 }]}>
      {icon && iconPosition === 'left' && (
        <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={getIconColor(variant, theme)} />
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: fontSizes[size],
            color: getTextColor(variant, theme),
          },
          textStyle,
        ]}>
        {loading ? '…' : title}
      </Text>
      {icon && iconPosition === 'right' && (
        <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={getIconColor(variant, theme)} />
      )}
    </View>
  );

  return (
    <Animated.View
      style={[
        { transform: [{ scale }], opacity: disabled ? 0.5 : 1 },
        fullWidth && { width: '100%' },
        style,
      ]}>
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
        {variant === 'primary' ? (
          <LinearGradient
            colors={grad.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.base,
              {
                height: heights[size],
                borderRadius: radii[size],
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: size === 'sm' ? 4 : 8 },
                shadowOpacity: 0.32,
                shadowRadius: size === 'sm' ? 8 : 16,
                elevation: 6,
              },
            ]}>
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.base,
              {
                height: heights[size],
                borderRadius: radii[size],
                backgroundColor: getBg(variant, theme),
                borderWidth: variant === 'outline' ? 1.5 : 0,
                borderColor: theme.primary,
              },
            ]}>
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

function getBg(variant: string, theme: any) {
  switch (variant) {
    case 'soft':
      return theme.primarySoft;
    case 'outline':
    case 'ghost':
      return 'transparent';
    default:
      return theme.primary;
  }
}

function getTextColor(variant: string, theme: any) {
  switch (variant) {
    case 'soft':
    case 'outline':
    case 'ghost':
      return theme.primary;
    default:
      return theme.primaryContrast;
  }
}

function getIconColor(variant: string, theme: any) {
  return getTextColor(variant, theme);
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
