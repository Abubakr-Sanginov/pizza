'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store } from '@prisma/client';
import { Input, Button } from '@/shared/components/ui';
import { Title } from '@/shared/components/shared';
import { createStore, updateStore } from '@/back/actions/store-actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const CheckoutAddressMap = dynamic(
  () => import('../checkout/checkout-address-map').then((m) => m.CheckoutAddressMap),
  { ssr: false }
);

const storeSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  address: z.string().min(5, 'Минимум 5 символов'),
  phone: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface Props {
  initialData?: any;
}

export const StoreForm: React.FC<Props> = ({ initialData }) => {
  const router = useRouter();
  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      lat: initialData?.lat || undefined,
      lng: initialData?.lng || undefined,
    },
  });

  const lat = form.watch('lat');
  const lng = form.watch('lng');

  const mapPosition: [number, number] | null =
    lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0
      ? [Number(lat), Number(lng)]
      : null;

  const handleMapAddressChange = (addr: string) => {
    form.setValue('address', addr, { shouldValidate: true });
  };

  const handleMapPositionChange = (pos: [number, number] | null) => {
    if (pos) {
      form.setValue('lat', pos[0], { shouldValidate: true });
      form.setValue('lng', pos[1], { shouldValidate: true });
    }
  };

  const onSubmit = async (values: StoreFormValues) => {
    try {
      if (initialData) {
        await updateStore(initialData.id, values);
        toast.success('Заведение обновлено');
      } else {
        await createStore(values);
        toast.success('Заведение создано');
      }

      router.push('/dashboard/stores');
      router.refresh();
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  return (
    <div className="max-w-2xl bg-card text-card-foreground p-10 rounded-2xl border border-border shadow-sm">
      <Title text={initialData ? 'Редактирование заведения' : 'Новое заведение'} size="md" className="font-bold mb-10" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-sm font-medium mb-1">Название заведения</label>
            <Input {...form.register('name')} placeholder="Пиццерия на Рудаки" />
            {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Телефон (необязательно)</label>
            <Input {...form.register('phone')} placeholder="+992..." />
            {form.formState.errors.phone && <p className="text-destructive text-xs mt-1">{form.formState.errors.phone.message}</p>}
          </div>

          {/* Map section */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Адрес</label>
              <Input
                {...form.register('address')}
                placeholder="Кликните на карте или введите вручную"
              />
              {form.formState.errors.address && (
                <p className="text-destructive text-xs mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              📍 Кликните на карту — адрес и координаты заполнятся автоматически
            </p>

            <CheckoutAddressMap
              onChange={handleMapAddressChange}
              onPositionChange={handleMapPositionChange}
              position={mapPosition}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Широта (Lat)</label>
                <Input
                  {...form.register('lat')}
                  placeholder="38.559..."
                  step="any"
                  type="number"
                  readOnly
                  className="bg-muted text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Долгота (Lng)</label>
                <Input
                  {...form.register('lng')}
                  placeholder="68.774..."
                  step="any"
                  type="number"
                  readOnly
                  className="bg-muted text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-5">
            <Button size="lg" disabled={form.formState.isSubmitting} type="submit" className="px-10">
              {initialData ? 'Сохранить изменения' : 'Создать заведение'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
