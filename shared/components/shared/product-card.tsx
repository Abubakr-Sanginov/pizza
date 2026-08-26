'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Title } from './title';
import { Button } from '../ui';
import { Heart, Plus, ShoppingCart, Star } from 'lucide-react';
import { Ingredient } from '@prisma/client';
import { ReviewWithUser } from '@/@types/prisma';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useCartStore, useFavoritesStore } from '@/shared/store';
import { cn } from '@/shared/lib/utils';
import { ProductTagBadges } from './product-tag-badges';

interface Props {
  id: number;
  name: string;
  price: number;
  priceOld?: number | null;
  imageUrl: string;
  ingredients: Ingredient[];
  reviews?: ReviewWithUser[];
  tags?: string[];
  className?: string;
}

export const ProductCard: React.FC<Props> = ({
  id,
  name,
  price,
  priceOld,
  imageUrl,
  ingredients,
  reviews = [],
  tags = [],
  className,
}) => {
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
      : 0;
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const cartItems = useCartStore((state) => state.items);
  const cartQuantity = cartItems
    .filter((item) => item.productId === id)
    .reduce((sum, item) => sum + item.quantity, 0);
  const inCart = cartQuantity > 0;

  const favorited = useFavoritesStore((s) => s.ids.has(id));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const goToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/checkout');
  };

  const onHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push('/not-auth');
      return;
    }
    toggleFavorite(id);
  };

  return (
    <motion.div
      className={cn('group', className)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}>
      <Link href={`/product/${id}`} className="block lift">
        {/* Фото */}
        <div className="relative h-[170px] md:h-[280px] rounded-3xl bg-secondary text-secondary-foreground overflow-hidden shadow-soft group-hover:shadow-soft-lg transition-shadow flex items-center justify-center">
          {/* Мягкое свечение за пиццей */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(22_100%_50%_/_0.08),_transparent_70%)]" />

          <img
            className="w-[140px] h-[140px] md:w-[230px] md:h-[230px] object-contain transition-transform duration-500 ease-out group-hover:scale-110"
            src={imageUrl}
            alt={name}
          />

          {/* Скидка */}
          {priceOld && priceOld > price && (
            <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-[hsl(var(--tomato))] text-white shadow-soft z-10">
              <span className="text-xs md:text-sm font-black tracking-tight">
                −{Math.round((1 - price / priceOld) * 100)}%
              </span>
            </div>
          )}

          {/* Рейтинг */}
          {reviews.length > 0 && (
            <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full glass text-[11px] md:text-xs flex items-center gap-1">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="font-bold leading-none">{averageRating}</span>
              <span className="text-muted-foreground leading-none">({reviews.length})</span>
            </div>
          )}

          {/* Избранное */}
          <button
            type="button"
            onClick={onHeartClick}
            aria-label={favorited ? 'Удалить из избранного' : 'Добавить в избранное'}
            className={cn(
              'absolute bottom-2 left-2 md:bottom-3 md:left-3 w-8 h-8 md:w-9 md:h-9 rounded-full glass flex items-center justify-center transition-transform z-10 active:scale-90',
              favorited && 'text-rose-500',
            )}>
            <Heart
              size={15}
              strokeWidth={2.5}
              className={favorited ? 'fill-rose-500 text-rose-500' : 'text-foreground'}
            />
          </button>

          {/* В корзине */}
          {inCart && (
            <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white shadow-soft z-10">
              <ShoppingCart size={12} strokeWidth={2.5} />
              <span className="text-[11px] md:text-xs font-black leading-none">{cartQuantity}</span>
            </div>
          )}
        </div>

        {/* Название */}
        <div className="mt-2.5 md:mt-4 px-1">
          <Title
            text={name}
            size="sm"
            className="font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors"
          />
          {tags.length > 0 && <ProductTagBadges tags={tags} className="mt-1.5 md:mt-2" max={3} />}
          <p className="hidden sm:block text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-snug">
            {ingredients.map((ingredient) => ingredient.name).join(' · ')}
          </p>
        </div>

        {/* Цена-пилюля */}
        <div className="mt-2.5 md:mt-4 px-1">
          <motion.div whileTap={{ scale: 0.97 }}>
            {inCart ? (
              <Button
                onClick={goToCart}
                className="btn-gradient w-full h-10 md:h-12 rounded-full text-sm font-extrabold gap-2 border-0">
                <ShoppingCart size={15} />
                {t('menu.toCart')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full h-10 md:h-12 rounded-full text-sm font-extrabold gap-1.5 border-0 hover:bg-primary hover:text-primary-foreground transition-all">
                {t('menu.from')} {price} TJS
              </Button>
            )}
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};
