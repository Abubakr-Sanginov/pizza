import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';

interface ShimmerProps {
  width?: number | string;
  height?: number | string;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}

export const Shimmer: React.FC<ShimmerProps> = ({ width = '100%', height = 16, rounded = 8, style }) => {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const baseColor = theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const highlightColor =
    theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)';

  return (
    <View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius: rounded,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateX }] },
        ]}>
        <LinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

export const ShimmerProductCard: React.FC = () => {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderRadius: 28,
        padding: 14,
        marginBottom: 14,
        shadowColor: theme.mode === 'dark' ? '#000' : theme.primary,
        shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.05,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 18,
        elevation: 3,
      }}>
      <Shimmer width={120} height={120} rounded={22} />
      <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between' }}>
        <View>
          <Shimmer width="70%" height={20} rounded={8} />
          <View style={{ height: 8 }} />
          <Shimmer width="90%" height={12} rounded={6} />
          <View style={{ height: 6 }} />
          <Shimmer width="60%" height={12} rounded={6} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Shimmer width={80} height={28} rounded={8} />
          <Shimmer width={42} height={42} rounded={21} />
        </View>
      </View>
    </View>
  );
};
