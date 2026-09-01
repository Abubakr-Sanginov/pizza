import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';

export const AmbientBackdrop: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(63,82,217,0.16)', 'transparent']
            : ['rgba(63,82,217,0.08)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={[StyleSheet.absoluteFill, styles.glow]}
      />
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(30,44,145,0.14)']
            : ['transparent', 'rgba(63,82,217,0.06)']
        }
        start={{ x: 1, y: 1 }}
        end={{ x: 0.3, y: 0.3 }}
        style={[StyleSheet.absoluteFill, styles.glow]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    opacity: 1,
  },
});
