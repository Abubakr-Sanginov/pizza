import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { API_URL } from '@/constants/Api';
import { useUserStore } from '@/store/useUserStore';

export interface PushNotificationState {
  expoPushToken?: string;
  notification?: Notifications.Notification;
  permissionGranted?: boolean;
  registrationError?: string;
}

const TOKEN_STORAGE_KEY = 'lastPushToken';
const TOKEN_USER_KEY = 'lastPushTokenUserId';
const PENDING_RETRY_KEY = 'pushTokenPendingRetry';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Основные уведомления',
      description: 'Заказы, акции и важные события',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff7000',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      bypassDnd: false,
    });
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Статусы заказов',
      description: 'Когда заказ принят, готовится, в пути',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff7000',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  } catch (e) {
    console.warn('[push] setNotificationChannelAsync failed', e);
  }
}

async function getProjectId(): Promise<string | undefined> {
  return (
    (Constants?.expoConfig as any)?.extra?.eas?.projectId ||
    (Constants as any)?.easConfig?.projectId
  );
}

async function postTokenToServer(token: string, userId?: number | string) {
  await axios.post(
    `${API_URL}/notifications/token`,
    { token, platform: Platform.OS, userId: userId ? Number(userId) : undefined },
    {
      headers: userId ? { 'X-User-Id': String(userId) } : undefined,
      timeout: 10000,
    },
  );
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [permissionGranted, setPermissionGranted] = useState<boolean | undefined>();
  const [registrationError, setRegistrationError] = useState<string | undefined>();

  const userId = useUserStore((s) => s.user?.id);
  const router = useRouter();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  /**
   * Effect 1: register token. Runs on mount + when userId changes.
   */
  useEffect(() => {
    let cancelled = false;

    const register = async () => {
      try {
        await ensureAndroidChannels();

        console.log('[push] starting registration, isExpoGo:', isExpoGo, 'isDevice:', Device.isDevice);

        if (isExpoGo) {
          setRegistrationError(
            'Push не работает в Expo Go (SDK 53+). Соберите development build.',
          );
          console.warn('[push] blocked: running in Expo Go');
          return;
        }

        if (!Device.isDevice) {
          setRegistrationError('not a physical device');
          console.warn('[push] blocked: not a physical device');
          return;
        }

        // Permissions
        const existing = (await Notifications.getPermissionsAsync()) as any;
        let granted = existing?.granted ?? existing?.status === 'granted';

        console.log('[push] existing permissions:', existing);

        if (!granted) {
          console.log('[push] requesting permissions...');
          const requested = (await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              provideAppNotificationSettings: false,
              allowProvisional: false,
            },
          })) as any;
          granted = requested?.granted ?? requested?.status === 'granted';
          console.log('[push] permission result:', requested, 'granted:', granted);
        } else {
          console.log('[push] permissions already granted');
        }
        if (cancelled) return;
        setPermissionGranted(granted);
        if (!granted) {
          setRegistrationError('permission denied');
          return;
        }

        const projectId = await getProjectId();
        if (!projectId) {
          setRegistrationError('missing projectId in app.json');
          console.warn('[push] missing extra.eas.projectId in app.json');
          return;
        }

        const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenResp.data;
        if (cancelled) return;
        setExpoPushToken(token);

        // Avoid re-posting if token+userId unchanged
        const lastToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const lastUserId = await AsyncStorage.getItem(TOKEN_USER_KEY);
        const currentUid = userId ? String(userId) : '';
        const sameAsBefore = lastToken === token && lastUserId === currentUid;

        if (!sameAsBefore) {
          await postTokenWithRetry(token, userId);
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
          await AsyncStorage.setItem(TOKEN_USER_KEY, currentUid);
        }

        // Drain pending retry (e.g. previous launch had no network)
        const pending = await AsyncStorage.getItem(PENDING_RETRY_KEY);
        if (pending && pending === token) {
          await postTokenWithRetry(token, userId);
          await AsyncStorage.removeItem(PENDING_RETRY_KEY);
        }
      } catch (e: any) {
        if (!cancelled) {
          setRegistrationError(e?.message || 'unknown error');
          console.warn('[push] init failed', e);
        }
      }
    };

    register();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /**
   * Effect 2: subscribe to received + tap response. Mount only.
   * Listeners are stable — we don't recreate them when userId changes.
   */
  useEffect(() => {
    if (isExpoGo) return;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response?.notification?.request?.content?.data as any;
      if (!data) return;

      // Deep-link: navigate based on payload
      if (data.type === 'order_status' && data.orderId) {
        router.push(`/profile`);
        return;
      }
      if (typeof data.url === 'string' && data.url.startsWith('/')) {
        try {
          router.push(data.url as any);
        } catch (e) {
          console.warn('[push] deep-link failed for', data.url, e);
        }
      }
    };

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
        setNotification(n);
      });
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(handleResponse);

      // Handle case where app was launched by tapping a notification
      Notifications.getLastNotificationResponseAsync()
        .then((resp) => {
          if (resp) handleResponse(resp);
        })
        .catch(() => {});
    } catch (e) {
      console.warn('[push] listener setup failed', e);
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  return { expoPushToken, notification, permissionGranted, registrationError };
};

async function postTokenWithRetry(token: string, userId?: number | string, attempt = 0): Promise<void> {
  try {
    await postTokenToServer(token, userId);
  } catch (err: any) {
    const isNetwork = !err?.response;
    const status = err?.response?.status;
    const transient = isNetwork || (status && status >= 500);

    if (transient && attempt < 3) {
      const delay = 800 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      return postTokenWithRetry(token, userId, attempt + 1);
    }

    if (transient) {
      // Save for next launch retry
      await AsyncStorage.setItem(PENDING_RETRY_KEY, token);
    }
    console.warn('[push] token registration failed', err?.message ?? err);
  }
}

export { TOKEN_STORAGE_KEY };
