import { cn } from '@/shared/lib/utils';
import React from 'react';
import { Container } from './container';
import { Categories } from './categories';
import { Category } from '@prisma/client';

interface Props {
  categories: Category[];
  className?: string;
}

export const TopBar: React.FC<Props> = ({ categories, className }) => {
  return (
    <div className={cn('sticky top-[68px] md:top-[88px] glass py-3 md:py-4 z-30 border-b border-border/40', className)}>
      <Container className="flex items-center justify-between gap-3">
        <Categories items={categories} />
      </Container>
    </div>
  );
};
