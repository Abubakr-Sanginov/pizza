import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Theme, useTheme, useThemePreference } from '@/hooks/useTheme';

interface Props {
  variant?: 'row' | 'icon';
}

export const ThemeToggle: React.FC<Props> = ({ variant = 'row' }) => {
  const theme = useTheme();
  const preference = useThemePreference((s) => s.preference);
  const toggle = useThemePreference((s) => s.toggle);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isDark = theme.mode === 'dark';
  const handlePress = () => toggle(isDark ? 'dark' : 'light');

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={styles.iconBtn}
        accessibilityLabel={isDark ? 'Светлая тема' : 'Тёмная тема'}
      >
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={20}
          color={theme.textMuted}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={styles.row}
    >
      <View style={styles.iconCircle}>
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={20}
          color={theme.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{isDark ? 'Тёмная тема' : 'Светлая тема'}</Text>
        <Text style={styles.sub}>
          {preference === 'system' ? 'Как в системе' : 'Выбрано вручную'} · нажми чтобы переключить
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
    </TouchableOpacity>
  );
};

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { color: t.text, fontSize: 15, fontWeight: '800' },
    sub: { color: t.textMuted, fontSize: 12, marginTop: 2, fontWeight: '500' },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.border,
    },
  });
