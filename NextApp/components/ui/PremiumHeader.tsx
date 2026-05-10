import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PremiumHeader: React.FC<Props> = ({ title, subtitle, right, left, style }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {left && <View style={styles.side}>{left}</View>}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View style={styles.side}>{right}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
