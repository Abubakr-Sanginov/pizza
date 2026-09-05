'use client';

import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/utils';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithRelations } from '@/@types/prisma';
import { ProductForm, ProductReviews, ImmersiveProductForm } from '../index';

interface RelatedProduct {
  id: number;
  name: string;
  imageUrl: string;
  gifUrl?: string | null;
  items: { id: number; price: number; size: number | null }[];
}

interface Props {
  product: ProductWithRelations;
  relatedProducts?: RelatedProduct[];
  className?: string;
}

export const ChooseProductModal: React.FC<Props> = ({ product, relatedProducts = [], className }) => {
  const router = useRouter();
  const isPizzaForm = Boolean(product.items[0]?.pizzaType);

  if (!isPizzaForm) {
    return <ImmersiveProductForm product={product} relatedProducts={relatedProducts} />;
  }

  return (
    <Dialog open={Boolean(product)} onOpenChange={() => router.back()}>
      <DialogContent
        className={cn(
          'p-0 w-[95vw] md:w-[1060px] max-w-[1060px] max-h-[90vh] bg-card text-card-foreground overflow-y-auto scrollbar',
          className,
        )}>
        <ProductForm product={product} onSubmit={() => router.back()} />
        <ProductReviews productId={product.id} reviews={product.reviews} />
      </DialogContent>
    </Dialog>
  );
};
