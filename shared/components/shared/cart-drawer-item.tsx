import { cn } from '@/shared/lib/utils';
import React from 'react';

import * as CartItem from './cart-item-details';
import { CartItemProps } from './cart-item-details/cart-item-details.types';
import { CountButton } from './count-button';
import { Trash2Icon } from 'lucide-react';

interface Props extends CartItemProps {
  id: number;
  onClickCountButton?: (id: number, quantity: number, type: 'plus' | 'minus') => void;
  onClickRemove?: (id: number) => void;
  className?: string;
}

export const CartDrawerItem: React.FC<Props> = React.memo(({
  id,
  imageUrl,
  name,
  price,
  quantity,
  details,
  disabled,
  onClickCountButton,
  onClickRemove,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex glass rounded-3xl p-4 gap-5 mx-4 transition-opacity',
        {
          'opacity-50 pointer-events-none': disabled,
        },
        className,
      )}>
      <CartItem.Image src={imageUrl} />

      <div className="flex-1 min-w-0">
        <CartItem.Info name={name} details={details} />

        <hr className="my-3 border-border/50" />

        <div className="flex items-center justify-between">
          <CountButton onClick={(type) => onClickCountButton?.(id, quantity, type)} value={quantity} />

          <div className="flex items-center gap-3">
            <CartItem.Price value={price} />
            <button
              type="button"
              onClick={() => onClickRemove?.(id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
              <Trash2Icon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
