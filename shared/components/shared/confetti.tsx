'use client';

import React from 'react';

interface Props {
  count?: number;
  duration?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#FF6B00', '#FF9D5C', '#FFD166', '#06D6A0', '#118AB2', '#EF476F'];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  drift: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'rect';
}

export const Confetti: React.FC<Props> = ({
  count = 80,
  duration = 4000,
  colors = DEFAULT_COLORS,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [active, setActive] = React.useState(true);
  const [pieces, setPieces] = React.useState<Piece[]>([]);

  React.useEffect(() => {
    setMounted(true);
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 800,
        duration: 2400 + Math.random() * 1800,
        rotate: Math.random() * 720 - 360,
        drift: (Math.random() - 0.5) * 200,
        color: colors[i % colors.length],
        size: 6 + Math.random() * 8,
        shape: ['square', 'circle', 'rect'][i % 3] as Piece['shape'],
      })),
    );
    const t = setTimeout(() => setActive(false), duration);
    return () => clearTimeout(t);
  }, [count, duration, colors]);

  if (!mounted || !active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translate3d(0, -20vh, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift, 0px), 110vh, 0) rotate(var(--rotate, 360deg));
            opacity: 0.85;
          }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.shape === 'rect' ? p.size * 0.6 : p.size,
            height: p.shape === 'rect' ? p.size * 1.6 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            ['--drift' as any]: `${p.drift}px`,
            ['--rotate' as any]: `${p.rotate}deg`,
            animation: `confettiFall ${p.duration}ms cubic-bezier(.2,.6,.4,1) ${p.delay}ms forwards`,
            willChange: 'transform, opacity',
            boxShadow: `0 0 6px ${p.color}60`,
          }}
        />
      ))}
    </div>
  );
};
