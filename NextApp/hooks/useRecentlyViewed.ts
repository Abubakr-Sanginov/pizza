import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'recently_viewed_products';
const MAX_ITEMS = 8;

export async function readRecentlyViewedIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export async function pushRecentlyViewed(productId: number) {
  if (!Number.isFinite(productId) || productId <= 0) return;
  try {
    const current = await readRecentlyViewedIds();
    const next = [productId, ...current.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function useRecentlyViewedIds(refreshToken?: any): number[] {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    readRecentlyViewedIds().then((list) => {
      if (!cancelled) setIds(list);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  return ids;
}
