'use client';

import React from 'react';
import { Button } from '@/shared/components/ui';
import { Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onDelete: () => Promise<void>;
  className?: string;
}

export const DeleteButton: React.FC<Props> = ({ onDelete, className }) => {
  const [loading, setLoading] = React.useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Вы уверены, что хотите удалить этот элемент?')) {
      return;
    }

    try {
      setLoading(true);
      await onDelete();
      toast.success('Удалено успешно');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось удалить');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={loading}
      className={className}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </Button>
  );
};
