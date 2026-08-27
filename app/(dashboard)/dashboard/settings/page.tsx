'use client';

import React from 'react';
import { Title, Container } from '@/shared/components/shared';
import { Button, Input } from '@/shared/components/ui';
import { getSettings, updateSettings, updateHeroBanner } from '@/back/actions/settings-actions';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [vatPrice, setVatPrice] = React.useState(15);
  const [deliveryPrice, setDeliveryPrice] = React.useState(250);
  const [heroBannerUrl, setHeroBannerUrl] = React.useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSettings();
        setVatPrice(data.vatPrice);
        setDeliveryPrice(data.deliveryPrice);
        setHeroBannerUrl(data.heroBannerUrl ?? null);
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

  const onBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || 'Upload failed');
      }

      const { url } = await res.json();
      await updateHeroBanner(url);
      setHeroBannerUrl(url);
      toast.success('Баннер обновлён');
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Не удалось загрузить баннер');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const onBannerRemove = async () => {
    try {
      setUploadingBanner(true);
      await updateHeroBanner(null);
      setHeroBannerUrl(null);
      toast.success('Баннер удалён');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось удалить баннер');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (loading) {
    return <Container className="mt-10">Загрузка...</Container>;
  }

  return (
    <Container className="mt-10">
      <Title text="Настройки магазина" size="lg" className="font-extrabold mb-10" />

      <div className="max-w-[500px] flex flex-col gap-8 bg-card text-card-foreground p-10 rounded-2xl shadow-sm border border-border">
        <div className="flex flex-col gap-2">
          <label className="font-bold">Налог (%)</label>
          <Input
            type="number"
            value={vatPrice}
            onChange={(e) => setVatPrice(Number(e.target.value))}
            placeholder="Процент налога..."
          />
          <p className="text-sm text-muted-foreground">Укажите процент налога (например, 15)</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold">Стоимость доставки (TJS)</label>
          <Input
            type="number"
            value={deliveryPrice}
            onChange={(e) => setDeliveryPrice(Number(e.target.value))}
            placeholder="Стоимость доставки..."
          />
          <p className="text-sm text-muted-foreground">Фиксированная сумма доставки для всех заказов</p>
        </div>

        <Button
          loading={submitting}
          onClick={onSave}
          className="h-12 text-base font-bold"
        >
          Сохранить настройки
        </Button>
      </div>

      <div className="max-w-[500px] flex flex-col gap-4 bg-card text-card-foreground p-10 rounded-2xl shadow-sm border border-border mt-8">
        <label className="font-bold text-lg">Герой-баннер</label>
        <p className="text-sm text-muted-foreground">GIF или картинка на главной странице</p>

        {heroBannerUrl && (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img
              src={heroBannerUrl}
              alt="Hero banner preview"
              className="w-full h-auto object-cover max-h-[200px]"
            />
            <button
              onClick={onBannerRemove}
              disabled={uploadingBanner}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Удалить
            </button>
          </div>
        )}

        <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors text-sm font-bold text-muted-foreground hover:text-primary">
          {uploadingBanner ? 'Загрузка...' : heroBannerUrl ? 'Заменить баннер' : 'Загрузить баннер (GIF / JPG / PNG)'}
          <input
            type="file"
            accept="image/*"
            onChange={onBannerUpload}
            disabled={uploadingBanner}
            className="hidden"
          />
        </label>
      </div>
    </Container>
  );
}
