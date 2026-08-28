import React, { useEffect } from "react";
import { Stack } from "expo-router";

import { useUserStore } from "@/store/useUserStore";
import { useCartStore } from "@/store/useCartStore";
import { useTheme } from "@/hooks/useTheme";

export default function TabLayout() {
  const user = useUserStore((state) => state.user);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const isCourier = user?.role === "COURIER";
  const theme = useTheme();

  useEffect(() => {
    if (!isCourier) fetchCart();
  }, [fetchCart, isCourier]);

  return (
    <Stack
      initialRouteName={isCourier ? "courier" : "index"}
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="two" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="courier" />
    </Stack>
  );
}
