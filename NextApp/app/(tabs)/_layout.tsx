import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/useUserStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useUserStore(state => state.user);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: '#9BA1A6',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(253, 247, 242, 0.95)', // Glass effect
          borderTopWidth: 0,
          height: 70,
          paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 10,
          paddingTop: 15,
          position: 'absolute',
          bottom: 45,
          left: 20,
          right: 20,
          borderRadius: 35,
          elevation: 20,
          shadowColor: '#ff7000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          borderWidth: 1,
          borderColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '900',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Меню',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'pizza' : 'pizza-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Корзина',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courier"
        options={{
          title: 'Курьер',
          href: user?.role === 'COURIER' ? '/courier' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bicycle' : 'bicycle-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
