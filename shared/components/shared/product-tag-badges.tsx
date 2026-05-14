'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { PRODUCT_TAGS, isProductTag, type ProductTag } from '@/shared/constants';

interface Props {
  tags: string[] | null | undefined;
  size?: 'sm' | 'md';
  max?: number;
  className?: string;
}

export const ProductTagBadges: React.FC<Props> = ({ tags, size = 'sm', max, className }) => {
  const { i18n } = useTranslation();
  if (!tags || tags.length === 0) return null;

  const lang = (i18n.language || 'ru').slice(0, 2) as 'ru' | 'en' | 'tg';
  const valid = tags.filter(isProductTag) as ProductTag[];
  const shown = typeof max === 'number' ? valid.slice(0, max) : valid;

  if (shown.length === 0) return null;

  const sizeCls = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-1'
    : 'text-xs px-2 py-1 gap-1';

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {shown.map((tag) => {
        const meta = PRODUCT_TAGS[tag];
        const label = meta.label[lang] ?? meta.label.ru;
        return (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center rounded-full border font-semibold',
              sizeCls,
              meta.className,
            )}>
            <span aria-hidden>{meta.emoji}</span>
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
};
