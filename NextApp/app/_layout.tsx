import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, Theme as NavTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import '@/lib/i18n';

import { useColorScheme } from '@/components/useColorScheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';
import { palettes } from '@/constants/Colors';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = (notification?.request?.content?.data ?? {}) as any;

    const silent = data?.silent === true;
    return {
      shouldShowBanner: !silent,
      shouldShowList: true,
      shouldPlaySound: !silent,
      shouldSetBadge: true,
      shouldShowAlert: !silent,
    };
  },
});

const NavLightTheme: NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palettes.light.primary,
    background: palettes.light.background,
    card: palettes.light.surface,
    text: palettes.light.text,
    border: palettes.light.border,
    notification: palettes.light.primary,
  },
};

const NavDarkTheme: NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palettes.dark.primary,
    background: palettes.dark.background,
    card: palettes.dark.surface,
    text: palettes.dark.text,
    border: palettes.dark.border,
    notification: palettes.dark.primary,
  },
};

export {

  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {

  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? palettes.dark : palettes.light;
  usePushNotifications();

  return (
    <SafeAreaProvider style={{ backgroundColor: palette.background }}>
      <ThemeProvider value={isDark ? NavDarkTheme : NavLightTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: palette.background },
            animation: 'fade',
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="favorites" options={{ headerShown: false }} />
          <Stack.Screen name="delivery" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
