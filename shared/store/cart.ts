import { create } from 'zustand';
import { Api } from '@/back/services/api-client';
import { getCartDetails } from '../lib';
import { CartStateItem } from '../lib/get-cart-details';
import { CreateCartItemValues } from '@/back/services/dto/cart.dto';

export interface CartState {
  loading: boolean;
  error: boolean;
  initialized: boolean;
  totalAmount: number;
  items: CartStateItem[];

  
  fetchCartItems: (opts?: { silent?: boolean }) => Promise<void>;

  
  updateItemQuantity: (id: number, quantity: number) => Promise<void>;

  
  addCartItem: (values: CreateCartItemValues) => Promise<void>;

  
  removeCartItem: (id: number) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  error: false,
  loading: true,
  initialized: false,
  totalAmount: 0,

  fetchCartItems: async (opts) => {
    const silent = opts?.silent;
    if (!silent) set({ loading: true, error: false });
    try {
      const data = await Api.cart.getCart();
      set({ ...getCartDetails(data), initialized: true });
    } catch (error) {
      console.error(error);
      set({ error: true, initialized: true });
    } finally {
      if (!silent) set({ loading: false });
    }
  },

  updateItemQuantity: async (id: number, quantity: number) => {
    try {
      set({ loading: true, error: false });
      const data = await Api.cart.updateItemQuantity(id, quantity);
      set(getCartDetails(data));
    } catch (error) {
      console.error(error);
      set({ error: true });
    } finally {
      set({ loading: false });
    }
  },

  removeCartItem: async (id: number) => {
    try {
      set((state) => ({
        loading: true,
        error: false,
        items: state.items.map((item) => (item.id === id ? { ...item, disabled: true } : item)),
      }));
      const data = await Api.cart.removeCartItem(id);
      set(getCartDetails(data));
    } catch (error) {
      console.error(error);
      set({ error: true });
    } finally {
      set((state) => ({
        loading: false,
        items: state.items.map((item) => ({ ...item, disabled: false })),
      }));
    }
  },

  addCartItem: async (values: CreateCartItemValues) => {
    try {
      set({ loading: true, error: false });
      const data = await Api.cart.addCartItem(values);
      set(getCartDetails(data));
    } catch (error) {
      console.error(error);
      set({ error: true });
      // Пробрасываем дальше, чтобы UI мог показать тост об ошибке (напр. «товара нет в наличии»)
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
