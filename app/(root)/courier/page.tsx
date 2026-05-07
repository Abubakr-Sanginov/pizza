'use client';

import React from 'react';
import { Container, Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import { OrderStatus } from '@prisma/client';
import toast from 'react-hot-toast';
import { MapPin, Phone, CheckCircle, Package, Truck } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function CourierPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/courier');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      toast.error(t('courier.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(t('courier.statusUpdated'));
        fetchOrders();
      } else {
        toast.error(t('courier.errorUpdate'));
      }
    } catch (e) {
      toast.error(t('courier.network'));
    }
  };

  if (loading) return <div className="p-20 text-center">{t('courier.loading')}</div>;

  return (
    <Container className="my-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Title text={t('courier.title')} size="lg" className="font-extrabold" />
          <p className="text-gray-400">{t('courier.subtitle')}</p>
        </div>
        <Button onClick={fetchOrders} variant="outline">{t('courier.update')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg">{t('courier.orderNum')}{order.id}</span>
                <div className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold',
                  order.status === 'READY' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                )}>
                  {order.status === 'READY' ? t('courier.readyToPick') : t('courier.delivering')}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin size={18} className="text-gray-400 shrink-0" />
                  <span>{order.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={18} className="text-gray-400 shrink-0" />
                  <span>{order.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-orange-600">
                  <Package size={18} className="shrink-0" />
                  <span>{order.totalAmount} TJS</span>
                </div>
              </div>

              {order.status === 'READY' ? (
                <Button 
                  className="w-full h-12 text-base font-bold rounded-xl"
                  onClick={() => updateStatus(order.id, OrderStatus.DELIVERING)}
                >
                  <Truck className="mr-2" size={20} />
                  {t('courier.takeOrder')}
                </Button>
              ) : (
                <Button 
                  variant="secondary"
                  className="w-full h-12 text-base font-bold rounded-xl bg-green-500 text-white hover:bg-green-600"
                  onClick={() => updateStatus(order.id, OrderStatus.SUCCEEDED)}
                >
                  <CheckCircle className="mr-2" size={20} />
                  {t('courier.delivered')}
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed">
            <Package className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-400 font-medium text-lg">{t('courier.emptyTitle')}</p>
            <p className="text-gray-400 text-sm">{t('courier.emptyText')}</p>
          </div>
        )}
      </div>
    </Container>
  );
}
