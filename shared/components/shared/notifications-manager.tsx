'use client';

import React from 'react';
import axios from 'axios';

export const NotificationsManager: React.FC = () => {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        subscribeToPush(registration);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
    try {
      const VAPID_PUB = 'BHjNmaZUTX9bX3hatdV8Q7mK3ezc0B2Xp33EGQNux_AES54o4HBllLsPErzSQ2ZLIJ6kW-_GyUACfJjtl_Oxe3w';
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || VAPID_PUB;

      if (!publicKey) return;

      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        await existingSubscription.unsubscribe();
        console.log('Old subscription removed');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await axios.post('/api/notifications/token', {
        token: JSON.stringify(subscription),
        platform: 'web'
      });
      console.log('New Web Push subscription created successfully');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  return null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
