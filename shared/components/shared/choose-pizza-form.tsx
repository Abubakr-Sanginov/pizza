'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Ingredient, ProductItem } from '@prisma/client';

import { PizzaImage } from './pizza-image';
import { Title } from './title';
import { Button } from '../ui';
import { GroupVariants } from './group-variants';
import { PizzaSize, PizzaType, pizzaTypes } from '@/shared/constants/pizza';
import { IngredientItem } from './ingredient-item';
import { cn } from '@/shared/lib/utils';
import { getPizzaDetails } from '@/shared/lib';
import { usePizzaOptions } from '@/shared/hooks';
import { ProductTagBadges } from './product-tag-badges';

import { useTranslation } from 'react-i18next';
import { NutritionBadge } from './nutrition-badge';

interface Props {
  imageUrl: string;
  gifUrl?: string | null;
  name: string;
  ingredients: Ingredient[];
  items: ProductItem[];
  loading?: boolean;
  onSubmit: (itemId: number, ingredients: number[]) => void;
  className?: string;
  tags?: string[];
  calories?: number | null;
  proteins?: number | null;
  fats?: number | null;
  carbs?: number | null;
}


export const ChoosePizzaForm: React.FC<Props> = ({
  name,
  items,
  imageUrl,
  gifUrl,
  ingredients,
  loading,
  onSubmit,
  className,
  tags,
  calories,
  proteins,
  fats,
  carbs,
}) => {
  const { t } = useTranslation();
  const {
    size,
    type,
    selectedIngredients,
    availableSizes,
    currentItemId,
    setSize,
    setType,
    addIngredient,
  } = usePizzaOptions(items);

  const { totalPrice, textDetaills } = getPizzaDetails(
    type,
    size,
    items,
    ingredients,
    selectedIngredients,
    t,
  );

  const handleClickAdd = () => {
    if (currentItemId) {
      onSubmit(currentItemId, Array.from(selectedIngredients));
    }
  };

  return (
    <div className={cn(className, 'flex flex-col lg:flex-row flex-1')}>
      <PizzaImage imageUrl={imageUrl} gifUrl={gifUrl} size={size} className="lg:static md:flex items-center justify-center flex-1 w-full" />

      <div className="w-full lg:w-[490px] bg-secondary text-secondary-foreground p-5 md:p-7 flex flex-col">
        <div className="text-center lg:text-left">
          <Title text={name} size="md" className="font-extrabold mb-1" />

          {tags && tags.length > 0 && <ProductTagBadges tags={tags} size="md" className="mb-2 justify-center lg:justify-start" />}

          <p className="text-muted-foreground">{textDetaills}</p>

          {(calories || proteins || fats || carbs) && (
            <NutritionBadge calories={calories} proteins={proteins} fats={fats} carbs={carbs} className="mt-2" />
          )}
        </div>

        <div className="flex flex-col gap-4 mt-5">
          <GroupVariants
            items={availableSizes}
            value={String(size)}
            onClick={(value) => setSize(Number(value) as PizzaSize)}
          />

          <GroupVariants
            items={pizzaTypes}
            value={String(type)}
            onClick={(value) => setType(Number(value) as PizzaType)}
          />
        </div>

        <div className="bg-muted p-3 md:p-5 rounded-3xl h-[280px] lg:h-[420px] overflow-auto scrollbar mt-5">
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {ingredients.map((ingredient) => (
              <IngredientItem
                key={ingredient.id}
                name={ingredient.name}
                price={ingredient.price}
                imageUrl={ingredient.imageUrl}
                onClick={() => addIngredient(ingredient.id)}
                active={selectedIngredients.has(ingredient.id)}
              />
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 -mx-5 md:-mx-7 mt-6 -mb-5 md:-mb-7 px-5 md:px-7 pt-4 pb-5 bg-gradient-to-t from-secondary via-secondary/95 to-transparent">
          <Button
            loading={loading}
            onClick={handleClickAdd}
            className="btn-gradient h-[55px] px-10 text-base rounded-full w-full font-extrabold gap-2 border-0">
            <Plus size={20} strokeWidth={3} />
            {totalPrice} TJS
          </Button>
        </div>
      </div>
    </div>
  );
};
