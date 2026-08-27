'use client';

import { cn } from '@/shared/lib/utils';
import React from 'react';
import { Title } from './title';
import { Button } from '../ui';
import { useTranslation } from 'react-i18next';
import { ProductTagBadges } from './product-tag-badges';
import { BlurImage } from './blur-image';

interface Props {
  imageUrl: string;
  gifUrl?: string | null;
  name: string;
  price: number;
  loading?: boolean;
  onSubmit?: VoidFunction;
  className?: string;
  tags?: string[];
}


export const ChooseProductForm: React.FC<Props> = ({
  name,
  imageUrl,
  gifUrl,
  price,
  onSubmit,
  className,
  loading,
  tags,
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn(className, 'flex flex-col lg:flex-row flex-1')}>
      <div className="flex items-center justify-center flex-1 relative w-full p-10">
        <BlurImage
          src={imageUrl}
          gifSrc={gifUrl}
          alt={name}
          className="w-[200px] h-[200px] md:w-[350px] md:h-[350px] rounded-2xl"
          imageClassName="w-full h-full object-contain"
        />
      </div>

      <div className="w-full lg:w-[490px] bg-secondary text-secondary-foreground p-7 flex flex-col justify-between">
        <Title text={name} size="md" className="font-extrabold mb-1" />

        {tags && tags.length > 0 && <ProductTagBadges tags={tags} size="md" className="mb-3" />}

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
