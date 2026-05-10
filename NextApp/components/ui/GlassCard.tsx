import React from 'react';
import { View, StyleSheet, ViewProps, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/hooks/useTheme';
import { gradients } from '@/constants/Colors';

interface Props extends ViewProps {
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  bordered?: boolean;
}

export const GlassCard: React.FC<Props> = ({
  children,
  intensity = 50,
  style,
  rounded = 24,
  bordered = true,
  ...rest
}) => {
  const theme = useTheme();
  const grad = theme.mode === 'dark' ? gradients.dark : gradients.light;

  if (Platform.OS === 'android') {
    return (
      <View
        {...rest}
        style={[
          styles.fallback,
          {
            backgroundColor: theme.surface,
            borderRadius: rounded,
            borderWidth: bordered ? 1 : 0,
            borderColor: theme.border,
            shadowColor: theme.shadow,
            shadowOpacity: theme.mode === 'dark' ? 0.4 : 0.06,
          },
          style,
        ]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView
      tint={theme.mode === 'dark' ? 'dark' : 'light'}
      intensity={intensity}
      {...(rest as any)}
      style={[
        styles.glass,
        {
          borderRadius: rounded,
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          backgroundColor: grad.glassTint,
        },
        style,
      ]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
  },
  fallback: {
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
  },
});
