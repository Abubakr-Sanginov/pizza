'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';

interface CourierTipDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
  orderAmount: number;
  onSuccess?: () => void;
}

const TIP_PRESETS = [
  { label: '5%', percent: 5 },
  { label: '10%', percent: 10 },
  { label: '15%', percent: 15 },
];

export const CourierTipDialog: React.FC<CourierTipDialogProps> = ({
  open,
  onClose,
  orderId,
  orderAmount,
  onSuccess,
}) => {
  const [selectedPercent, setSelectedPercent] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateTip = () => {
    if (customAmount) {
      return Number(customAmount) || 0;
    }
    if (selectedPercent && orderAmount) {
      return Math.round((orderAmount * selectedPercent) / 100);
    }
    return 0;
  };

  const handleSubmit = async () => {
    const tipAmount = calculateTip();
    if (tipAmount <= 0) {
      toast.error('Введите сумму чаевых');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/orders/${orderId}/tip`, {
        amount: tipAmount,
        rating,
        comment: comment.trim() || null,
      });
      toast.success('Чаевые отправлены!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to add tip:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Не удалось добавить чаевые');
      }
    } finally {
      setLoading(false);
    }
  };

  const tipAmount = calculateTip();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Оцените курьера</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <p className="text-sm font-semibold mb-3">Как прошла доставка?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-8 h-8',
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Оставить чаевые</p>
            <div className="flex gap-2 mb-3">
              {TIP_PRESETS.map((preset) => (
                <Button
                  key={preset.percent}
                  type="button"
                  variant={
                    selectedPercent === preset.percent && !customAmount
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => {
                    setSelectedPercent(preset.percent);
                    setCustomAmount('');
                  }}
                  className="flex-1"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Своя сумма:</span>
              <Input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPercent(null);
                }}
                placeholder="0"
                className="flex-1"
              />
              <span className="text-sm text-gray-600">TJS</span>
            </div>

            {tipAmount > 0 && (
              <p className="text-center text-lg font-bold text-primary mt-3">
                Чаевые: {tipAmount} TJS
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">
              Комментарий (необязательно)
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Отличная доставка!"
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Пропустить
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || tipAmount <= 0}
              className="flex-1"
            >
              {loading ? 'Отправка...' : `Отправить ${tipAmount > 0 ? `${tipAmount} TJS` : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
