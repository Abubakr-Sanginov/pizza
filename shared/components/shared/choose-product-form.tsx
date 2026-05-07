'use client';

import { cn } from '@/shared/lib/utils';
import React from 'react';
import { Title } from './title';
import { Button } from '../ui';
import { useTranslation } from 'react-i18next';

interface Props {
  imageUrl: string;
  name: string;
  price: number;
  loading?: boolean;
  onSubmit?: VoidFunction;
  className?: string;
}

/**
 * Форма выбора ПРОДУКТА
 */
export const ChooseProductForm: React.FC<Props> = ({
  name,
  imageUrl,
  price,
  onSubmit,
  className,
  loading,
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn(className, 'flex flex-col lg:flex-row flex-1')}>
      <div className="flex items-center justify-center flex-1 relative w-full p-10">
        <img
          src={imageUrl}
          alt={name}
          className="relative transition-all z-10 duration-300 w-[200px] h-[200px] md:w-[350px] md:h-[350px]"
        />
      </div>

      <div className="w-full lg:w-[490px] bg-[#f7f6f5] p-7 flex flex-col justify-between">
        <Title text={name} size="md" className="font-extrabold mb-1" />

        <Button
          loading={loading}
          onClick={() => onSubmit?.()}
          className="h-[55px] px-10 text-base rounded-[18px] w-full mt-10">
          {t('productModal.addToCart')} {price} TJS
        </Button>
      </div>
    </div>
  );
};
