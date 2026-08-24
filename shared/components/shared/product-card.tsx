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
        {/* Image area */}
        <div className="relative h-[280px] rounded-3xl bg-secondary text-secondary-foreground overflow-hidden shadow-soft group-hover:shadow-soft-lg transition-shadow">
          {/* Soft glow behind pizza */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(22_100%_50%_/_0.08),_transparent_70%)]" />

          <img
            className="absolute inset-0 m-auto w-[230px] h-[230px] object-contain transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-[8deg]"
            src={imageUrl}
            alt={name}
          />

          {/* Discount badge */}
          {priceOld && priceOld > price && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-[hsl(var(--tomato))] text-white shadow-soft z-10">
              <span className="text-sm font-black tracking-tight">
                −{Math.round((1 - price / priceOld) * 100)}%
              </span>
            </div>
          )}

          {/* Rating */}
          {reviews.length > 0 && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass text-xs flex items-center gap-1.5">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="font-bold leading-none">{averageRating}</span>
              <span className="text-muted-foreground leading-none">({reviews.length})</span>
            </div>
          )}

          {/* Favorite heart — bottom-left to not collide with discount */}
          <button
            type="button"
            onClick={onHeartClick}
            aria-label={favorited ? 'Удалить из избранного' : 'Добавить в избранное'}
            className={cn(
              'absolute bottom-3 left-3 w-9 h-9 rounded-full glass flex items-center justify-center transition-transform z-10 active:scale-90',
              favorited && 'text-rose-500',
            )}>
            <Heart
              size={16}
              strokeWidth={2.5}
              className={favorited ? 'fill-rose-500 text-rose-500' : 'text-foreground'}
            />
          </button>

          {/* In-cart badge */}
          {inCart && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white shadow-soft z-10">
              <ShoppingCart size={13} strokeWidth={2.5} />
              <span className="text-xs font-black leading-none">{cartQuantity}</span>
            </div>
          )}
        </div>

        {/* Title + ingredients */}
        <div className="mt-4 px-1">
          <Title
            text={name}
            size="sm"
            className="font-extrabold leading-tight group-hover:text-primary transition-colors"
          />
          {tags.length > 0 && <ProductTagBadges tags={tags} className="mt-2" max={3} />}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-snug">
            {ingredients.map((ingredient) => ingredient.name).join(' · ')}
          </p>
        </div>

        {/* Price + CTA */}
        <div className="flex justify-between items-end mt-4 px-1">
          <div className="flex flex-col">
            {priceOld && priceOld > price && (
              <span className="text-xs text-muted-foreground line-through font-medium">
                {priceOld} TJS
              </span>
            )}
            <span className="text-2xl font-black text-foreground tracking-tight leading-none">
              <span className="text-sm font-bold text-muted-foreground mr-1">
                {t('menu.from')}
              </span>
              {price}{' '}
              <span className="text-base font-bold text-muted-foreground">TJS</span>
            </span>
          </div>

          <motion.div whileTap={{ scale: 0.93 }}>
            {inCart ? (
              <Button
                onClick={goToCart}
                className="btn-gradient h-12 px-5 rounded-2xl text-sm font-extrabold gap-2 border-0">
                <ShoppingCart size={16} />
                {t('menu.toCart')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="h-12 px-5 rounded-2xl text-sm font-extrabold gap-1.5 border-0 hover:bg-primary hover:text-primary-foreground transition-all">
                <Plus size={18} strokeWidth={3} />
                {t('menu.addBtn')}
              </Button>
            )}
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};
