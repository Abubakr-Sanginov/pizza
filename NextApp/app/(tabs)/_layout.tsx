import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';

import { useUserStore } from '@/store/useUserStore';
import { useCartStore } from '@/store/useCartStore';
import { useTranslation } from 'react-i18next';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const user = useUserStore(state => state.user);
  const { t } = useTranslation();
  const fetchCart = useCartStore(state => state.fetchCart);
  const isCourier = user?.role === 'COURIER';
  const theme = useTheme();

  useEffect(() => {
    if (!isCourier) fetchCart();
  }, [fetchCart, isCourier]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName={isCourier ? 'courier' : 'index'}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: theme.background },
        lazy: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.menu'),
          href: isCourier ? null : '/',
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: t('tabs.cart'),
          href: isCourier ? null : '/two',
        }}
      />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
      <Tabs.Screen name="notifications" options={{ title: t('tabs.notifications') }} />
      <Tabs.Screen
        name="courier"
        options={{
          title: t('tabs.courier'),
          href: isCourier ? '/courier' : null,
        }}
      />
    </Tabs>
  );
}
