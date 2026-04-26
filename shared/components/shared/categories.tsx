'use client';

import { cn } from '@/shared/lib/utils';
import { useCategoryStore } from '@/shared/store/category';
import { Category } from '@prisma/client';
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  items: Category[];
  className?: string;
}

export const Categories: React.FC<Props> = ({ items, className }) => {
  const categoryActiveId = useCategoryStore((state) => state.activeId);

  return (
    <div className={cn('inline-flex gap-1 bg-gray-50 p-1 rounded-2xl overflow-x-auto scrollbar-hide', className)}>
      {items.map(({ name, id }, index) => {
        const isActive = categoryActiveId === id;
        return (
          <a
            className={cn(
              'flex items-center font-bold h-11 rounded-2xl px-5 relative transition-colors duration-300',
              isActive ? 'text-primary' : 'text-gray-500 hover:text-primary',
            )}
            href={`/#${name}`}
            key={index}
          >
            {isActive && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-white rounded-2xl shadow-md shadow-gray-200"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{name}</span>
          </a>
        );
      })}
    </div>
  );
};
