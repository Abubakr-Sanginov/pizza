'use client';

import React from 'react';
import { useIntersection } from 'react-use';

import { Title } from './title';
import { cn } from '@/shared/lib/utils';
import { ProductCard } from './product-card';
import { useCategoryStore } from '@/shared/store';
import { ProductWithRelations } from '@/@types/prisma';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  items: ProductWithRelations[];
  categoryId: number;
  className?: string;
  listClassName?: string;
}

export const ProductsGroupList: React.FC<Props> = ({
  title,
  items,
  listClassName,
  categoryId,
  className,
}) => {
  const setActiveCategoryId = useCategoryStore((state) => state.setActiveId);
  const { t } = useTranslation();
  const intersectionRef = React.useRef(null);
  const intersection = useIntersection(intersectionRef, {
    threshold: 0.4,
  });

  const categoryMapping: Record<string, string> = {
    'Пиццы': 'menu.pizzas',
    'Все пиццы': 'menu.allPizzas',
    'Завтрак': 'menu.breakfast',
    'Все завтраки': 'menu.allBreakfast',
    'Закуски': 'menu.snacks',
    'Все закуски': 'menu.allSnacks',
    'Коктейли': 'menu.cocktails',
    'Все коктейли': 'menu.allCocktails',
    'Напитки': 'menu.drinks',
    'Все напитки': 'menu.allDrinks',
  };

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (intersection?.isIntersecting) {
      setActiveCategoryId(categoryId);
    }
  }, [categoryId, intersection?.isIntersecting, title]);

  const translationKey = categoryMapping[title] || title;
  const translatedTitle = mounted && translationKey.includes('.') ? t(translationKey) : title;

  return (
    <div className={className} id={title} ref={intersectionRef}>
      <Title text={translatedTitle} size="lg" className="font-extrabold mb-5" />

      <div className={cn('grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[20px] md:gap-[50px]', listClassName)}>
        {items.map((product, i) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            imageUrl={product.imageUrl}
            price={product.items[0].price}
            priceOld={product.items[0].priceOld}
            ingredients={product.ingredients}
            reviews={product.reviews}
            tags={(product as any).tags ?? []}
          />
        ))}
      </div>
    </div>
  );
};
