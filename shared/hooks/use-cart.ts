import React from 'react';
import { useCartStore } from '../store';
import { CreateCartItemValues } from '@/back/services/dto/cart.dto';
import { CartStateItem } from '../lib/get-cart-details';

type ReturnProps = {
  totalAmount: number;
  items: CartStateItem[];
  loading: boolean;
  updateItemQuantity: (id: number, quantity: number) => void;
  removeCartItem: (id: number) => void;
  addCartItem: (values: CreateCartItemValues) => void;
};

export const useCart = (): ReturnProps => {
  const cartState = useCartStore((state) => state);
  const initialized = useCartStore((state) => state.initialized);

  React.useEffect(() => {
    // Первая загрузка — со спиннером, повторные монтирования (открытие шторки и т.п.)
    // обновляют данные в фоне без блокировки интерфейса.
    cartState.fetchCartItems({ silent: initialized });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return cartState;
};
