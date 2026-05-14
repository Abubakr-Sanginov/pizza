import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLORS = ['#FF6B00', '#FF9D5C', '#FFD166', '#06D6A0', '#118AB2', '#EF476F'];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  drift: number;
  shape: 'square' | 'circle' | 'rect';
}

interface Props {
  count?: number;
  duration?: number;
}

export const Confetti: React.FC<Props> = ({ count = 50, duration = 3500 }) => {
  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      left: Math.random() * SCREEN_W,
      delay: Math.random() * 600,
      duration: 1800 + Math.random() * 1400,
      color: COLORS[i % COLORS.length],
      size: 5 + Math.random() * 7,
      rotate: Math.random() * 720 - 360,
      drift: (Math.random() - 0.5) * 120,
      shape: (['square', 'circle', 'rect'] as const)[i % 3],
    }));
  }, [count]);

  return (
    <View pointerEvents="none" style={styles.layer}>
      {pieces.map((p, i) => (
        <Piece key={i} {...p} totalDuration={duration} />
      ))}
    </View>
  );
};

const Piece: React.FC<Piece & { totalDuration: number }> = ({
  left,
  delay,
  duration,
  color,
  size,
  rotate,
  drift,
  shape,
}) => {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fall, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.bezier(0.2, 0.6, 0.4, 1),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, SCREEN_H + 40],
  });
  const translateX = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });
  const rotateDeg = fall.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotate}deg`],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  const w = shape === 'rect' ? size * 0.6 : size;
  const h = shape === 'rect' ? size * 1.6 : size;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left,
        width: w,
        height: h,
        backgroundColor: color,
        borderRadius: shape === 'circle' ? size / 2 : 1.5,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: rotateDeg }],
      }}
    />
  );
};

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
