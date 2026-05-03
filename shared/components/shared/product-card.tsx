'use client';

import Link from 'next/link';
import React from 'react';
import { Title } from './title';
import { Button } from '../ui';
import { Plus, Star } from 'lucide-react';
import { Ingredient } from '@prisma/client';
import { ReviewWithUser } from '@/@types/prisma';
import { motion } from 'framer-motion';

interface Props {
  id: number;
  name: string;
  price: number;
  priceOld?: number | null;
  imageUrl: string;
  ingredients: Ingredient[];
  reviews?: ReviewWithUser[];
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
  className,
}) => {
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/product/${id}`}>
        <motion.div 
          className="flex justify-center p-6 bg-secondary rounded-lg h-[260px] relative group overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <motion.img 
            className="w-[215px] h-[215px] group-hover:rotate-6 transition-transform duration-300" 
            src={imageUrl} 
            alt={name} 
          />
          
          {reviews.length > 0 && (
            <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold">{averageRating}</span>
              <span className="text-xs text-gray-400">({reviews.length})</span>
            </div>
          )}
        </motion.div>

        <Title text={name} size="sm" className="mb-1 mt-3 font-bold group-hover:text-primary transition-colors" />

        <p className="text-sm text-gray-400">
          {ingredients.map((ingredient) => ingredient.name).join(', ')}
        </p>

        <div className="flex justify-between items-center mt-4">
          <div className="flex flex-col">
            {priceOld && (
              <span className="text-sm text-gray-400 line-through mb-[-2px]">
                {priceOld} TJS
              </span>
            )}
            <span className="text-[20px]">
              от <b>{price} TJS</b>
            </span>
          </div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="secondary" className="text-base font-bold">
              <Plus size={20} className="mr-1" />
              Добавить
            </Button>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};
