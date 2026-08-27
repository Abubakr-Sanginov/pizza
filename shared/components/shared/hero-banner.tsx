'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface Props {
  className?: string;
}

export const HeroBanner: React.FC<Props> = ({ className }) => {
  const [gifError, setGifError] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn('relative w-full overflow-hidden rounded-b-3xl md:rounded-b-[32px] aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1]', className)}>
      {/* Fallback gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-primary/10 to-red-500/10" />

      {/* GIF */}
      {!gifError && (
        <img
          src="/assets/hero-banner.gif"
          alt="Свежая пицца"
          className="relative z-10 w-full h-full object-cover"
          onError={() => setGifError(true)}
        />
      )}

      {/* Градиент */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

      {/* Бейдж */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-30">
        <div className="glass-strong rounded-2xl px-4 py-2 md:px-6 md:py-3 shadow-soft-lg">
          <p className="text-xs md:text-sm font-black tracking-widest uppercase text-primary">
            🔥 Горячая доставка
          </p>
          <p className="text-lg md:text-2xl font-black text-foreground mt-0.5">
            Свежая пицца за 40 минут
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
