import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Props {
  fullName: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  className?: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

export const ReviewCard: React.FC<Props> = ({ fullName, rating, comment, createdAt, className, canDelete, onDelete }) => {
  return (
    <div className={cn('p-5 bg-card text-card-foreground rounded-xl border border-border shadow-sm relative', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold">{fullName}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {new Date(createdAt).toLocaleDateString('ru-RU')}
          </span>
          {canDelete && (
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Удалить отзыв"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={cn(i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted')}
          />
        ))}
      </div>

      {comment && <p className="text-muted-foreground leading-relaxed">{comment}</p>}
    </div>
  );
};
