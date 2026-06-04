import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';

export const AmbientBackdrop: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,112,0,0.18)', 'transparent']
            : ['rgba(255,138,61,0.16)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={[StyleSheet.absoluteFillObject, styles.glow]}
      />
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(255,84,0,0.14)']
            : ['transparent', 'rgba(255,138,61,0.10)']
        }
        start={{ x: 1, y: 1 }}
        end={{ x: 0.3, y: 0.3 }}
        style={[StyleSheet.absoluteFillObject, styles.glow]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    opacity: 1,
  },
});
