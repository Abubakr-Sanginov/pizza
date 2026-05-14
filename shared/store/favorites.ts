import { create } from 'zustand';
import axios from 'axios';

export interface FavoritesState {
  ids: Set<number>;
  loading: boolean;
  fetched: boolean;
  fetchIds: () => Promise<void>;
  toggle: (productId: number) => Promise<boolean>;
  has: (productId: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set<number>(),
  loading: false,
  fetched: false,

  fetchIds: async () => {
    if (get().fetched || get().loading) return;
    set({ loading: true });
    try {
      const { data } = await axios.get<number[]>('/api/favorites/ids');
      set({ ids: new Set(data), fetched: true });
    } catch (e) {
      // Anonymous users get [] from the API — still mark fetched.
      set({ fetched: true });
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (productId) => {
    const wasIn = get().ids.has(productId);
    // Optimistic
    const next = new Set(get().ids);
    if (wasIn) next.delete(productId);
    else next.add(productId);
    set({ ids: next });

    try {
      const { data } = await axios.post<{ favorited: boolean }>('/api/favorites', { productId });
      // Sync to server truth
      const synced = new Set(get().ids);
      if (data.favorited) synced.add(productId);
      else synced.delete(productId);
      set({ ids: synced });
      return data.favorited;
    } catch {
      // Rollback
      const currentIds = get().ids;
      set({ ids: new Set(Array.from(currentIds)) });
      const rollback = new Set(get().ids);
      if (wasIn) rollback.add(productId);
      else rollback.delete(productId);
      set({ ids: rollback });
      return wasIn;
    }
  },

  has: (productId) => get().ids.has(productId),
}));
