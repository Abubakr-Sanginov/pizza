'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface Props {
  className?: string;
}

export const HeroBanner: React.FC<Props> = ({ className }) => {
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
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/25 via-amber-500/10 to-red-700/20" />

      {/* Animated glow orbs */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full bg-primary/15 blur-[80px]"
        style={{ left: '60%', top: '10%' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full bg-red-500/10 blur-[100px]"
        style={{ left: '75%', top: '40%' }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full bg-orange-400/10 blur-[60px]"
        style={{ left: '40%', top: '60%' }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Grain noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* Bottom fade */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

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
