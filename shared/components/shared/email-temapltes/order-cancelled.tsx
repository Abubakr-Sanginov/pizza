import React from 'react';

interface Props {
  orderId: number;
}

export const OrderCancelledTemplate: React.FC<Props> = ({ orderId }) => (
  <div>
    <h1>Заказ #{orderId} отменен ❌</h1>

    <p>
      К сожалению, произошла ошибка при оплате заказа #{orderId}. Если у вас возникли вопросы,
      пожалуйста, свяжитесь с нашей поддержкой.
    </p>

    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>Что делать дальше?</p>
      <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
        <li>Проверьте данные вашей карты</li>
        <li>Убедитесь, что на счету достаточно средств</li>
        <li>Попробуйте оформить заказ еще раз</li>
      </ul>
    </div>
  </div>
);
