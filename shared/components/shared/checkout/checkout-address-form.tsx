'use client';

import React from 'react';
import { WhiteBlock } from '../white-block';
import { FormTextarea, FormSelect, FormInput } from '../form';
import { AdressInput } from '../address-input';
import { Controller, useFormContext } from 'react-hook-form';
import { ErrorText } from '../error-text';
import dynamic from 'next/dynamic';
import { Store } from '@prisma/client';
import { useTranslation } from 'react-i18next';

const CheckoutAddressMap = dynamic(
  () => import('./checkout-address-map').then((m) => m.CheckoutAddressMap),
  { ssr: false }
);

const CheckoutPickupMap = dynamic(
  () => import('./checkout-pickup-map').then((m) => m.CheckoutPickupMap),
  { ssr: false }
);

interface Props {
  className?: string;
  stores: Store[];
}

export const CheckoutAddressForm: React.FC<Props> = ({ className, stores }) => {
  const { control, watch, setValue } = useFormContext();
  const { t } = useTranslation();
  const deliveryType = watch('deliveryType');
  const lat = watch('lat');
  const lng = watch('lng');
  const isDelivery = deliveryType === 'DELIVERY';

  const onMapPositionChange = (pos: [number, number] | null) => {
    if (pos) {
      setValue('lat', pos[0], { shouldValidate: true });
      setValue('lng', pos[1], { shouldValidate: true });
    }
  };

  return (
    <WhiteBlock title={t('checkout.deliveryTitle')} className={className}>
      <div className="flex flex-col gap-5">
        <Controller
          control={control}
          name="deliveryType"
          render={({ field }) => (
            <div className="flex flex-col md:flex-row gap-4 mb-5">
              <label className="flex items-center gap-2 cursor-pointer bg-muted p-3 rounded-md flex-1">
                <input
                  type="radio"
                  name="deliveryType"
                  value="DELIVERY"
                  checked={field.value === 'DELIVERY'}
                  onChange={() => field.onChange('DELIVERY')}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-sm md:text-base">{t('checkout.delivery')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-muted p-3 rounded-md flex-1">
                <input
                  type="radio"
                  name="deliveryType"
                  value="PICKUP"
                  checked={field.value === 'PICKUP'}
                  onChange={() => field.onChange('PICKUP')}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-sm md:text-base">{t('checkout.pickup')}</span>
              </label>
            </div>
          )}
        />

        {!isDelivery && (
          <>
            <FormSelect
              name="storeId"
              label={t('checkout.store')}
              placeholder={t('checkout.storePlaceholder')}
              items={stores.map((s) => ({ value: s.id.toString(), label: s.name }))}
            />

            {stores?.length === 0 && (
              <p className="text-red-500 text-sm -mt-3">
                ⚠️ Ошибка: в базе нет заведений. Добавьте их в <a href="/dashboard/stores" className="underline">админ-панели</a>.
              </p>
            )}

            {watch('storeId') && stores.find(s => s.id.toString() === watch('storeId')?.toString()) && (() => {
              const selectedStore = stores.find(s => s.id.toString() === watch('storeId')?.toString())!;
              return (
                <div className="mt-5 border-t border-border pt-5">
                  <CheckoutPickupMap
                    storePosition={[selectedStore.lat || 38.5598, selectedStore.lng || 68.7741]}
                    storeAddress={selectedStore.address}
                  />
                </div>
              );
            })()}
          </>
        )}

        {isDelivery && (
          <>
            <Controller
              control={control}
              name="address"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-3">
                  <AdressInput value={field.value} onChange={field.onChange} />
                  {fieldState.error?.message && <ErrorText text={fieldState.error.message} />}
                </div>
              )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <FormInput name="apartment" label={t('checkout.apartment')} placeholder="101" />
              <FormInput name="entrance" label={t('checkout.entrance')} placeholder="1" />
              <FormInput name="floor" label={t('checkout.floor')} placeholder="5" />
              <FormInput name="doorCode" label={t('checkout.doorCode')} placeholder="1234" />
            </div>

            <div className="mt-5">
              <div className="mb-3 text-sm font-medium">{t('checkout.mapPoint')}:</div>
              <CheckoutAddressMap
                onChange={(addr) => setValue('address', addr, { shouldValidate: true })}
                position={lat !== undefined && lng !== undefined ? [Number(lat), Number(lng)] : null}
                onPositionChange={onMapPositionChange}
              />
              {watch('address') && (
                <p className="mt-2 text-sm text-muted-foreground">{t('checkout.selectedAddress')}: {watch('address')}</p>
              )}
            </div>
          </>
        )}

        <FormTextarea
          name="comment"
          className="text-base"
          placeholder={t('checkout.comment')}
          rows={5}
        />
      </div>
    </WhiteBlock>
  );
};
