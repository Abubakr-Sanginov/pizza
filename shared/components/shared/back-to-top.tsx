'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface Props {
  threshold?: number;
  className?: string;
}

export const BackToTop: React.FC<Props> = ({ threshold = 600, className }) => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Наверх"
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-soft-lg btn-gradient text-white border-0',
            className,
          )}>
          <ArrowUp size={22} strokeWidth={2.8} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
