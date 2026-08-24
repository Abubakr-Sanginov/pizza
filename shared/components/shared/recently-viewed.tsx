'use client';

import React from 'react';
import axios from 'axios';

import { useRecentlyViewedIds } from '@/shared/hooks';
import { ProductCard } from './product-card';
import { SectionHeader } from './section-header';

export const RecentlyViewed: React.FC = () => {
  const ids = useRecentlyViewedIds();
  const [products, setProducts] = React.useState<any[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    axios
      .get<any[]>('/api/products/by-ids', { params: { ids: ids.join(',') } })
      .then((res) => {
        if (!cancelled) setProducts(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ids.join(',')]);

  if (!loaded || products.length === 0) return null;

  return (
    <section className="mb-10">
      <SectionHeader title="Вы недавно смотрели" className="mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[20px] md:gap-[40px]">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            imageUrl={product.imageUrl}
            price={product.items[0]?.price || 0}
            priceOld={product.items[0]?.priceOld}
            ingredients={product.ingredients}
            reviews={[]}
            tags={product.tags ?? []}
          />
        ))}
      </div>
    </section>
  );
};
