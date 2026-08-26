import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  onPress?: () => void;
}

export const BackButton: React.FC<Props> = ({ onPress }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 10 }]}>
      <TouchableOpacity
        onPress={onPress ?? (() => router.back())}
        style={[styles.btn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        activeOpacity={0.8}>
        <ChevronLeft size={24} color={theme.text} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },
  btn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
