import { create } from 'zustand';

interface UiState {
  tabBarHidden: boolean;
  setTabBarHidden: (hidden: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  tabBarHidden: false,
  setTabBarHidden: (hidden) => set({ tabBarHidden: hidden }),
}));
