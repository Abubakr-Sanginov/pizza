import { cn } from '@/shared/lib/utils';
import { CircleCheck } from 'lucide-react';
import React from 'react';
import { BlurImage } from './blur-image';

interface Props {
  imageUrl: string;
  name: string;
  price: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const IngredientItem: React.FC<Props> = ({
  className,
  active,
  price,
  name,
  imageUrl,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'flex items-center flex-col p-1.5 rounded-2xl w-full text-center relative cursor-pointer shadow-sm bg-card text-card-foreground transition-all active:scale-95',
        { 'border-2 border-primary shadow-soft': active },
        className,
      )}
      onClick={onClick}>
      {active && <CircleCheck className="absolute top-1.5 right-1.5 text-primary" size={16} />}
      <BlurImage
        src={imageUrl}
        alt={name}
        className="w-[80px] h-[80px] md:w-[110px] md:h-[110px] rounded-xl"
        imageClassName="w-full h-full object-contain"
      />
      <span className="text-[11px] md:text-xs mb-1 leading-tight">{name}</span>
      <span className="font-bold text-xs md:text-sm">{price} TJS</span>
    </div>
  );
};
