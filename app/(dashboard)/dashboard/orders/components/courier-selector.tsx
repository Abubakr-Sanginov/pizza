'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { assignCourier } from '../actions';

interface Props {
  orderId: number;
  couriers: { id: number; fullName: string }[];
  initialCourierId?: number | null;
}

export const CourierSelector: React.FC<Props> = ({ orderId, couriers, initialCourierId }) => {
  const [courierId, setCourierId] = React.useState<number | string>(initialCourierId || '');
  const [loading, setLoading] = React.useState(false);

  const handleAssign = async (val: string) => {
    try {
      setLoading(true);
      const id = val === '' ? null : Number(val);
      setCourierId(val);
      await assignCourier(orderId, id);
      toast.success('Курьер назначен');
    } catch (error) {
      toast.error('Не удалось назначить курьера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={courierId}
      onChange={(e) => handleAssign(e.target.value)}
      disabled={loading}
      className="px-2 py-1 border border-border rounded text-xs bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none"
    >
      <option value="">Без курьера</option>
      {couriers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.fullName}
        </option>
      ))}
    </select>
  );
};
