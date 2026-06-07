import React from 'react';
import { cn } from '@/shared/lib/utils';

interface Props {
  calories?: number | null;
  proteins?: number | null;
  fats?: number | null;
  carbs?: number | null;
  className?: string;
}

const NutrientCell: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center bg-secondary rounded-xl px-3 py-2 min-w-[56px]">
    <span className="font-extrabold text-sm text-foreground">{Math.round(value * 10) / 10}</span>
    <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
  </div>
);

export const NutritionBadge: React.FC<Props> = ({ calories, proteins, fats, carbs, className }) => {
  if (!calories && !proteins && !fats && !carbs) return null;
  return (
    <div className={cn('flex gap-2 flex-wrap', className)}>
      {calories != null && <NutrientCell value={calories} label="ккал" />}
      {proteins != null && <NutrientCell value={proteins} label="белки" />}
      {fats != null && <NutrientCell value={fats} label="жиры" />}
      {carbs != null && <NutrientCell value={carbs} label="углев." />}
    </div>
  );
};
