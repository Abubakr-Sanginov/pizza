'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface Props {
  className?: string;
}

export const HeroBanner: React.FC<Props> = ({ className }) => {
  const [imgSrc, setImgSrc] = React.useState('/uploads/5ab0859f-ce1a-4180-8a65-a6082944442d.png');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative w-full overflow-hidden rounded-b-3xl md:rounded-b-[32px]',
        'aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1]',
        className,
      )}>
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/30 via-amber-500/15 to-red-600/20" />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_hsl(22_100%_55%_/_0.15),_transparent_60%)]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,_hsl(350_100%_50%_/_0.1),_transparent_50%)]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Product image */}
      <motion.img
        src={imgSrc}
        alt="Свежая пицца"
        className="absolute right-[-2%] md:right-[5%] top-1/2 -translate-y-1/2 z-10
                   w-[55%] md:w-[45%] lg:w-[40%] h-auto object-contain drop-shadow-2xl"
        initial={{ x: 60, opacity: 0, rotate: -8 }}
        animate={{ x: 0, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        onError={() => setImgSrc('/uploads/2cbc274b-c8f1-4ad7-8e96-038f62b5984b.png')}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 z-20 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      {/* Decorative circles */}
      <motion.div
        className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl"
        animate={{ x: [0, 15, 0], y: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-10 -bottom-10 w-56 h-56 rounded-full bg-red-500/5 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-30">
        <div className="glass-strong rounded-2xl px-4 py-2.5 md:px-6 md:py-3 shadow-soft-lg">
          <p className="text-xs md:text-sm font-black tracking-widest uppercase text-primary">
            Горячая доставка
          </p>
          <p className="text-lg md:text-2xl font-black text-foreground mt-0.5 leading-tight">
            Свежая пицца<br className="hidden md:block" /> за 40 минут
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
