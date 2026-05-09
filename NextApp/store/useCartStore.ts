import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@/constants/Api';

let tokenCache: string | null = null;

const getCartToken = async () => {
  if (tokenCache) return tokenCache;
  tokenCache = await AsyncStorage.getItem('cartToken');
  return tokenCache;
};

export interface CartItem {
  id: number;
  quantity: number;
  productItem: {
    price: number;
    size: number | null;
    pizzaType: number | null;
    product: {
      name: string;
      imageUrl: string;
    };
  };
  ingredients: Array<{
    id: number;
    name: string;
    price: number;
  }>;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  loading: boolean;
  error: boolean;
  
  fetchCart: () => Promise<void>;
  addItem: (productItemId: number, ingredients?: number[]) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => void;
}

export { getCartToken };

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  loading: false,
  error: false,

  fetchCart: async () => {
    try {
      const token = await getCartToken();
      if (!token) return;

      const { data } = await axios.get(`${API_URL}/cart`, {
        headers: { 'X-Cart-Token': token },
      });
      
      set({ 
        items: data.items, 
        totalAmount: data.totalAmount, 
        loading: false 
      });
    } catch (error) {
      console.error('Fetch cart error:', error);
      set({ error: true, loading: false });
    }
  },

  addItem: async (productItemId: number, ingredients?: number[]) => {
    try {
      let token = await getCartToken();
      
      const { data } = await axios.post(`${API_URL}/cart`, {
        productItemId,
        ingredients,
      }, {
        headers: { 'X-Cart-Token': token || '' },
      });

      if (!token && data.token) {
        tokenCache = data.token;
        await AsyncStorage.setItem('cartToken', data.token);
      }

      set({ 
        items: data.items, 
        totalAmount: data.totalAmount, 
        loading: false 
      });
    } catch (error) {
      console.error('Add item error:', error);
      set({ error: true, loading: false });
    }
  },

  updateQuantity: async (id: number, quantity: number) => {
    // Optimistic Update
    const oldItems = get().items;
    const oldTotal = get().totalAmount;

    const newItems = oldItems.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    const newTotal = newItems.reduce((sum, item) => sum + (item.productItem.price * item.quantity), 0);
    
    set({ items: newItems, totalAmount: newTotal });

    try {
      const token = await getCartToken();
      const { data } = await axios.patch(`${API_URL}/cart/${id}`, {
        quantity,
      }, {
        headers: { 'X-Cart-Token': token },
      });

      set({ items: data.items, totalAmount: data.totalAmount });
    } catch (error) {
      console.error('Update quantity error:', error);
      set({ items: oldItems, totalAmount: oldTotal });
    }
  },

  removeItem: async (id: number) => {
    const oldItems = get().items;
    const oldTotal = get().totalAmount;

    const newItems = oldItems.filter(item => item.id !== id);
    const removedItem = oldItems.find(item => item.id === id);
    const newTotal = oldTotal - (removedItem ? removedItem.productItem.price * removedItem.quantity : 0);

    set({ items: newItems, totalAmount: newTotal });

    try {
      const token = await getCartToken();
      const { data } = await axios.delete(`${API_URL}/cart/${id}`, {
        headers: { 'X-Cart-Token': token },
      });

      set({ items: data.items, totalAmount: data.totalAmount });
    } catch (error) {
      console.error('Remove item error:', error);
      set({ items: oldItems, totalAmount: oldTotal });
    }
  },
  clearCart: () => {
    set({ items: [], totalAmount: 0 });
  },
}));
