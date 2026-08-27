'use client';

import { cn } from '@/shared/lib/utils';
import React from 'react';
import { motion } from 'framer-motion';
import { BlurImage } from './blur-image';

interface Props {
  className?: string;
  imageUrl: string;
  gifUrl?: string | null;
  size: 20 | 30 | 40;
}

export const PizzaImage: React.FC<Props> = ({ imageUrl, gifUrl, size, className }) => {
  const sizeMap = {
    20: 'w-[200px] h-[200px] md:w-[300px] md:h-[300px]',
    30: 'w-[250px] h-[250px] md:w-[400px] md:h-[400px]',
    40: 'w-[300px] h-[300px] md:w-[500px] md:h-[500px]',
  };

  return (
    <div className={cn('flex items-center justify-center flex-1 relative w-full h-full min-h-[300px] md:min-h-[500px]', className)}>
      <div className="relative grid place-items-center w-[300px] h-[300px] md:w-[500px] md:h-[500px]">
        <motion.div
          key={size}
          initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className={cn('relative z-10 grid-in-center', sizeMap[size])}
          style={{ gridArea: '1/1' }}
        >
          <BlurImage
            src={imageUrl}
            gifSrc={gifUrl}
            alt="Pizza"
            className="w-full h-full rounded-2xl"
            imageClassName="w-full h-full object-contain drop-shadow-2xl"
          />
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="absolute border-dashed border-2 rounded-full border-border w-[260px] h-[260px] md:w-[450px] md:h-[450px] z-0"
          style={{ gridArea: '1/1' }}
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="absolute border-dotted border-2 rounded-full border-border w-[210px] h-[210px] md:w-[380px] md:h-[380px] z-0"
          style={{ gridArea: '1/1' }}
        />
      </div>
    </div>
  );
};
