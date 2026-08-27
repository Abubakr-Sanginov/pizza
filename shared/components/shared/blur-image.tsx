'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';

interface Props {
  src: string;
  alt: string;
  gifSrc?: string | null;
  className?: string;
  imageClassName?: string;
}

export const BlurImage: React.FC<Props> = ({
  src,
  alt,
  gifSrc,
  className,
  imageClassName,
}) => {
  const [showGif, setShowGif] = React.useState(false);

  React.useEffect(() => {
    if (!gifSrc) return;
    const img = new Image();
    img.src = gifSrc;
    img.onload = () => setShowGif(true);
  }, [gifSrc]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={showGif && gifSrc ? gifSrc : src}
        alt={alt}
        loading="lazy"
        className={cn('relative z-10 w-full h-full', imageClassName)}
      />
    </div>
  );
};
