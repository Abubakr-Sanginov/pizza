'use client';

import React from 'react';
import { WhiteBlock } from '../white-block';
import { FormTextarea, FormSelect, FormInput } from '../form';
import { AdressInput } from '../address-input';
import { Controller, useFormContext } from 'react-hook-form';
import { ErrorText } from '../error-text';
import dynamic from 'next/dynamic';
import { Store } from '@prisma/client';

const CheckoutAddressMap = dynamic(
  () => import('./checkout-address-map').then((m) => m.CheckoutAddressMap),
  { ssr: false }
);

interface Props {
  className?: string;
  stores: Store[];
}

export const CheckoutAddressForm: React.FC<Props> = ({ className, stores }) => {
  const { control, watch, setValue } = useFormContext();
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
    <WhiteBlock title="3. Способ и адрес доставки" className={className}>
      <div className="flex flex-col gap-5">
        <Controller
          control={control}
          name="deliveryType"
          render={({ field }) => (
            <div className="flex flex-col md:flex-row gap-4 mb-5">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-100 p-3 rounded-md flex-1">
                <input
                  type="radio"
                  name="deliveryType"
                  value="DELIVERY"
                  checked={field.value === 'DELIVERY'}
                  onChange={() => field.onChange('DELIVERY')}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-sm md:text-base">Доставка курьером</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-100 p-3 rounded-md flex-1">
                <input
                  type="radio"
                  name="deliveryType"
                  value="PICKUP"
                  checked={field.value === 'PICKUP'}
                  onChange={() => field.onChange('PICKUP')}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-sm md:text-base">Самовывоз</span>
              </label>
            </div>
          )}
        />

        {!isDelivery && (
          <>
            <FormSelect
              name="storeId"
              label="Заведение (где заберете заказ)"
              placeholder="Выберите заведение..."
              items={stores.map((s) => ({ value: s.id.toString(), label: s.name }))}
            />

            {stores.length === 0 && (
              <p className="text-red-500 text-sm -mt-3">
                ⚠️ Ошибка: в базе нет заведений. Добавьте их в <a href="/dashboard/stores" className="underline">админ-панели</a>.
              </p>
            )}
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
              <FormInput name="apartment" label="Кв/офис" placeholder="101" />
              <FormInput name="entrance" label="Подъезд" placeholder="1" />
              <FormInput name="floor" label="Этаж" placeholder="5" />
              <FormInput name="doorCode" label="Код двери" placeholder="1234" />
            </div>

            <div className="mt-5">
              <div className="mb-3 text-sm font-medium">Или выберите точку на карте:</div>
              <CheckoutAddressMap
                onChange={(addr) => setValue('address', addr, { shouldValidate: true })}
                position={lat && lng ? [lat, lng] : null}
                onPositionChange={onMapPositionChange}
              />
              {watch('address') && (
                <p className="mt-2 text-sm text-gray-500">Выбранный адрес: {watch('address')}</p>
              )}
            </div>
          </>
        )}

        <FormTextarea
          name="comment"
          className="text-base"
          placeholder="Комментарий к заказу"
          rows={5}
        />
      </div>
    </WhiteBlock>
  );
};
