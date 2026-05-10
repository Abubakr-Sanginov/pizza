import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';

import { motion } from '@/constants/Colors';

interface Props {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
}

export const SpringPress: React.FC<Props> = ({
  onPress,
  children,
  style,
  scaleTo = 0.96,
  disabled,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      ...motion.springSnappy,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      ...motion.spring,
    }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
};
