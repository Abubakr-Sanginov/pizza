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
    <div className={cn('p-5 bg-white rounded-xl border border-gray-100 shadow-sm relative', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold">{fullName}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {new Date(createdAt).toLocaleDateString('ru-RU')}
          </span>
          {canDelete && (
            <button 
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
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
            className={cn(i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')}
          />
        ))}
      </div>

      {comment && <p className="text-gray-600 leading-relaxed">{comment}</p>}
    </div>
  );
};
