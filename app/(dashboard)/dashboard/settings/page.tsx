'use client';

import React from 'react';
import { Title, Container } from '@/shared/components/shared';
import { Button, Input } from '@/shared/components/ui';
import { getSettings, updateSettings } from '@/back/actions/settings-actions';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [vatPrice, setVatPrice] = React.useState(15);
  const [deliveryPrice, setDeliveryPrice] = React.useState(250);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSettings();
        setVatPrice(data.vatPrice);
        setDeliveryPrice(data.deliveryPrice);
      } catch (error) {
        console.error(error);
        toast.error('Не удалось загрузить настройки');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const onSave = async () => {
    try {
      setSubmitting(true);
      await updateSettings(Number(vatPrice), Number(deliveryPrice));
      toast.success('Настройки сохранены');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Container className="mt-10">Загрузка...</Container>;
  }

  return (
    <Container className="mt-10">
      <Title text="Настройки магазина" size="lg" className="font-extrabold mb-10" />

      <div className="max-w-[500px] flex flex-col gap-8 bg-white p-10 rounded-2xl shadow-sm border">
        <div className="flex flex-col gap-2">
          <label className="font-bold">Налог (%)</label>
          <Input
            type="number"
            value={vatPrice}
            onChange={(e) => setVatPrice(Number(e.target.value))}
            placeholder="Процент налога..."
          />
          <p className="text-sm text-gray-400">Укажите процент налога (например, 15)</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold">Стоимость доставки (TJS)</label>
          <Input
            type="number"
            value={deliveryPrice}
            onChange={(e) => setDeliveryPrice(Number(e.target.value))}
            placeholder="Стоимость доставки..."
          />
          <p className="text-sm text-gray-400">Фиксированная сумма доставки для всех заказов</p>
        </div>

        <Button
          loading={submitting}
          onClick={onSave}
          className="h-12 text-base font-bold"
        >
          Сохранить настройки
        </Button>
      </div>
    </Container>
  );
}
