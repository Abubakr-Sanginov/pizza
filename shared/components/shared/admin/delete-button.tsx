'use client';

import React from 'react';
import { Button } from '@/shared/components/ui';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  id: number;
  deleteAction: (id: number) => Promise<void>;
  entityName?: string;
}

export const DeleteButton: React.FC<Props> = ({ id, deleteAction, entityName = 'элемент' }) => {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Вы уверены, что хотите удалить ${entityName} #${id}?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteAction(id);
      toast.success(`${entityName} удален`);
    } catch (error) {
      toast.error(`Ошибка при удалении`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:bg-destructive/10"
      disabled={loading}
      onClick={handleDelete}>
      <Trash2 size={18} className={loading ? 'animate-spin' : ''} />
    </Button>
  );
};
