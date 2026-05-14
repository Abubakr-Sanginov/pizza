import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  iconAccent?: 'primary' | 'success' | 'rose' | 'sky';
  className?: string;
}

const accents: Record<NonNullable<Props['iconAccent']>, { bg: string; ring: string; fg: string }> = {
  primary: { bg: 'from-primary/20 to-orange-500/10', ring: 'ring-primary/20', fg: 'text-primary' },
  success: { bg: 'from-emerald-500/20 to-green-500/10', ring: 'ring-emerald-500/20', fg: 'text-emerald-500' },
  rose:    { bg: 'from-rose-500/20 to-pink-500/10', ring: 'ring-rose-500/20', fg: 'text-rose-500' },
  sky:     { bg: 'from-sky-500/20 to-indigo-500/10', ring: 'ring-sky-500/20', fg: 'text-sky-500' },
};

export const EmptyState: React.FC<Props> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  iconAccent = 'primary',
  className,
}) => {
  const accent = accents[iconAccent];
  const cta =
    actionLabel && (actionHref || onAction) ? (
      actionHref ? (
        <Link href={actionHref}>
          <Button size="lg" className="btn-gradient border-0 h-12 px-8 rounded-2xl font-extrabold">
            {actionLabel}
          </Button>
        </Link>
      ) : (
        <Button
          onClick={onAction}
          size="lg"
          className="btn-gradient border-0 h-12 px-8 rounded-2xl font-extrabold">
          {actionLabel}
        </Button>
      )
    ) : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 glass rounded-3xl animate-in fade-in-0 slide-in-from-bottom-2 duration-500',
        className,
      )}>
      <div
        className={cn(
          'w-20 h-20 rounded-3xl flex items-center justify-center mb-5 bg-gradient-to-br ring-4',
          accent.bg,
          accent.ring,
        )}>
        <Icon className={cn('w-9 h-9', accent.fg)} strokeWidth={2.2} />
      </div>
      <h3 className="text-xl font-black tracking-tight mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground leading-relaxed max-w-md mb-6">{description}</p>
      )}
      {cta}
    </div>
  );
};
