'use client';

import React from 'react';
import { OrderStatus } from '@prisma/client';
import toast from 'react-hot-toast';
import { updateOrderStatus } from '../actions';

interface Props {
  orderId: number;
  initialStatus: OrderStatus;
}

const statusTranslations: Record<OrderStatus, string> = {
  PENDING: 'В ожидании',
  COOKING: 'Готовится',
  READY: 'Готов',
  DELIVERING: 'В доставке',
  SUCCEEDED: 'Выполнен',
  CANCELLED: 'Отменен',
};

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300',
  COOKING: 'bg-orange-500/15 text-orange-800 dark:text-orange-300',
  READY: 'bg-blue-500/15 text-blue-800 dark:text-blue-300',
  DELIVERING: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300',
  SUCCEEDED: 'bg-green-500/15 text-green-800 dark:text-green-300',
  CANCELLED: 'bg-red-500/15 text-red-800 dark:text-red-300',
};

export const OrderStatusSelector: React.FC<Props> = ({ orderId, initialStatus }) => {
  const [status, setStatus] = React.useState<OrderStatus>(initialStatus);
  const [loading, setLoading] = React.useState(false);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      setLoading(true);
      setStatus(newStatus);
      await updateOrderStatus(orderId, newStatus);
      toast.success('Статус заказа обновлен');
    } catch (error) {
      toast.error('Не удалось обновить статус');
      setStatus(status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-primary ${statusColors[status]}`}
    >
      {Object.entries(statusTranslations).map(([key, label]) => (
        <option key={key} value={key} className="bg-card text-card-foreground">
          {label}
        </option>
      ))}
    </select>
  );
};
