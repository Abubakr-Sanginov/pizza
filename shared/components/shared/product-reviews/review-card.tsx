import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Props {
  fullName: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  className?: string;
}

export const ReviewCard: React.FC<Props> = ({ fullName, rating, comment, createdAt, className }) => {
  return (
    <div className={cn('p-5 bg-white rounded-xl border border-gray-100 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold">{fullName}</span>
        <span className="text-sm text-gray-400">
          {new Date(createdAt).toLocaleDateString('ru-RU')}
        </span>
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
