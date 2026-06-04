'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui';
import { cn } from '@/shared/lib/utils';
import { useTheme } from './theme-provider';

interface Props {
  className?: string;
}

export const ThemeToggle: React.FC<Props> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  return (
    <Button
      variant="secondary"
      onClick={toggleTheme}
      aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className={cn(
        'relative px-2 md:px-4 h-[42px] rounded-2xl overflow-hidden',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ y: -18, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 18, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="inline-flex"
        >
          {isDark ? (
            <Moon size={18} className="text-muted-foreground" />
          ) : (
            <Sun size={18} className="text-muted-foreground" />
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
};
