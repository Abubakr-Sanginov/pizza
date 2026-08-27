'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface Props {
  className?: string;
}

export const HeroBanner: React.FC<Props> = ({ className }) => {
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/settings/hero-banner')
      .then((r) => r.json())
      .then((data) => setBannerUrl(data.heroBannerUrl ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      {/* Animated gradient background (fallback) */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/25 via-amber-500/10 to-red-700/20" />
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

      {/* Banner image/GIF from admin */}
      {bannerUrl && !loading && (
        <img
          src={bannerUrl}
          alt="Hero banner"
          className="absolute inset-0 w-full h-full object-cover z-10"
        />
      )}

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
