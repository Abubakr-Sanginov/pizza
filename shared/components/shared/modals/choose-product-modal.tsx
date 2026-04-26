'use client';

import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/utils';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithRelations } from '@/@types/prisma';
import { useCartStore } from '@/shared/store';
import toast from 'react-hot-toast';
import { ProductForm, ProductReviews } from '../index';

interface Props {
  product: ProductWithRelations;
  className?: string;
}

export const ChooseProductModal: React.FC<Props> = ({ product, className }) => {
  const router = useRouter();

  return (
    <Dialog open={Boolean(product)} onOpenChange={() => router.back()}>
      <DialogContent
        className={cn(
          'p-0 w-[95vw] md:w-[1060px] max-w-[1060px] max-h-[90vh] bg-white overflow-y-auto scrollbar',
          className,
        )}>
        <ProductForm product={product} onSubmit={() => router.back()} />
        <ProductReviews productId={product.id} reviews={product.reviews} />
      </DialogContent>
    </Dialog>
  );
};
