import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { useUiStore } from "@/store/useUiStore";
import { useTheme, Theme } from "@/hooks/useTheme";
import { motion } from "@/constants/Colors";

type IconName = keyof typeof Ionicons.glyphMap;

const iconMap: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: "pizza", inactive: "pizza-outline" },
  two: { active: "cart", inactive: "cart-outline" },
  profile: { active: "person", inactive: "person-outline" },
  notifications: { active: "notifications", inactive: "notifications-outline" },
  courier: { active: "bicycle", inactive: "bicycle-outline" },
  builder: { active: "construct", inactive: "construct-outline" },
};

function isRouteVisible(routeName: string, isCourier: boolean): boolean {
  if (routeName === "index" || routeName === "two" || routeName === "builder")
    return !isCourier;
  if (routeName === "courier") return isCourier;
  return true;
}

export const CustomTabBar: React.FC<BottomTabBarProps> = React.memo(
  ({ state, navigation }) => {
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const role = useUserStore((s) => s.user?.role);
    const isCourier = role === "COURIER";
    const tabBarHidden = useUiStore((s) => s.tabBarHidden);

    const cartQuantity = useCartStore((s) =>
      isCourier ? 0 : s.items.reduce((sum, item) => sum + item.quantity, 0),
    );

    if (tabBarHidden) return null;

    const visibleRoutes = state.routes.filter((r) =>
      isRouteVisible(r.name, isCourier),
    );

    return (
      <View
        pointerEvents="box-none"
        style={[
          styles.wrapper,
          { bottom: insets.bottom > 0 ? insets.bottom + 8 : 16 },
        ]}
      >
        <View style={styles.shadowWrap}>
          <View style={styles.barOuter}>
            <BlurView
              intensity={95}
              tint={theme.mode === "dark" ? "dark" : "light"}
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? "rgba(36,30,26,0.4)"
                      : "rgba(255,255,255,0.45)",
                },
              ]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[
                theme.mode === "dark"
                  ? "rgba(255,255,255,0.16)"
                  : "rgba(255,255,255,0.55)",
                "transparent",
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.45 }}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[
                "transparent",
                theme.mode === "dark" ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.05)",
              ]}
              start={{ x: 0.5, y: 0.55 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: 36,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor:
                    theme.mode === "dark"
                      ? "rgba(255,255,255,0.14)"
                      : "rgba(255,255,255,0.7)",
                },
              ]}
            />

            <View style={styles.bar}>
              {visibleRoutes.map((route) => {
                const realIndex = state.routes.findIndex(
                  (r: any) => r.key === route.key,
                );
                const isFocused = state.index === realIndex;
                const icons = iconMap[route.name] || {
                  active: "ellipse",
                  inactive: "ellipse-outline",
                };
                const showCartBadge = route.name === "two" && cartQuantity > 0;

                const onPress = () => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name as never);
                  }
                };

                return (
                  <TabItem
                    key={route.key}
                    isFocused={isFocused}
                    onPress={onPress}
                    iconActive={icons.active}
                    iconInactive={icons.inactive}
                    badge={showCartBadge ? cartQuantity : 0}
                    theme={theme}
                    styles={styles}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  },
);

CustomTabBar.displayName = "CustomTabBar";

const TabItem: React.FC<{
  isFocused: boolean;
  onPress: () => void;
  iconActive: IconName;
  iconInactive: IconName;
  badge: number;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
}> = ({
  isFocused,
  onPress,
  iconActive,
  iconInactive,
  badge,
  theme,
  styles,
}) => {
  const focused = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(focused, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      ...motion.spring,
    }).start();
  }, [isFocused, focused]);

  const onPressIn = () =>
    Animated.spring(press, {
      toValue: 0.86,
      useNativeDriver: true,
      ...motion.springSnappy,
    }).start();
  const onPressOut = () =>
    Animated.spring(press, {
      toValue: 1,
      useNativeDriver: true,
      ...motion.spring,
    }).start();

  const iconScale = focused.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.item, { transform: [{ scale: press }] }]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.itemPillWrap,
            { opacity: focused },
          ]}
        >
          <LinearGradient
            colors={["#ff8a3d", "#ff5400"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(255,255,255,0.45)", "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        <Animated.View
          style={[styles.iconWrapper, { transform: [{ scale: iconScale }] }]}
        >
          <Ionicons
            name={isFocused ? iconActive : iconInactive}
            size={22}
            color={isFocused ? "#fff" : theme.textSubtle}
          />
          {badge > 0 && (
            <View
              style={[
                styles.badge,
                { borderColor: isFocused ? "#fff" : theme.surface },
              ]}
            >
              <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
    },
    shadowWrap: {
      borderRadius: 36,
      shadowColor: t.mode === "dark" ? "#000" : t.primary,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: t.mode === "dark" ? 0.6 : 0.18,
      shadowRadius: 30,
      elevation: 20,
    },
    barOuter: {
      borderRadius: 36,
      overflow: "hidden",
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    item: {
      width: 56,
      height: 48,
      marginHorizontal: 2,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    itemPillWrap: {
      borderRadius: 24,
      overflow: "hidden",
    },
    iconWrapper: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: -8,
      right: -12,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 5,
      borderRadius: 10,
      backgroundColor: t.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "900",
      lineHeight: 12,
    },
  });
