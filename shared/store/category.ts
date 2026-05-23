import { create } from "zustand";

interface State {
  activeId: number;
  setActiveId: (activeId: number) => void;
}

export const useCategoryStore = create<State>()((set, get) => ({
  activeId: 1,
  setActiveId: (activeId: number) => {
    if (get().activeId !== activeId) {
      set({ activeId });
    }
  },
}));
