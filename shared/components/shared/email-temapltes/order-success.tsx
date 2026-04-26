import { CartItemDTO } from '@/back/services/dto/cart.dto';
import React from 'react';

interface Props {
  orderId: number;
  items: CartItemDTO[];
}

export const OrderSuccessTemplate: React.FC<Props> = ({ orderId, items }) => (
  <div>
    <h1>Спасибо за покупку! 🎉</h1>

    <p>Ваш заказ #{orderId} принят и обрабатывается. Оплата при получении. Список товаров:</p>

    <hr />

    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.productItem.product.name} | {item.productItem.price} TJS x {item.quantity} шт. ={' '}
          {item.productItem.price * item.quantity} TJS
        </li>
      ))}
    </ul>
  </div>
);
