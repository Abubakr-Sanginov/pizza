'use client';

import React from 'react';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 8;

export function readRecentlyViewedIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(productId: number) {
  if (typeof window === 'undefined') return;
  if (!Number.isFinite(productId) || productId <= 0) return;
  const current = readRecentlyViewedIds().filter((id) => id !== productId);
  const next = [productId, ...current].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function useRecentlyViewedIds(): number[] {
  const [ids, setIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    setIds(readRecentlyViewedIds());
  }, []);

  return ids;
}
