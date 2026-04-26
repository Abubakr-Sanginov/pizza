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
    <div className={cn('sticky top-0 bg-white py-3 md:py-5 shadow-lg shadow-black/5 z-10', className)}>
      <Container className="flex items-center justify-between gap-3">
        <Categories items={categories} />
      </Container>
    </div>
  );
};
