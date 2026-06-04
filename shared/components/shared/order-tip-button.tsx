'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Heart, CheckCircle2 } from 'lucide-react';
import { CourierTipDialog } from './courier-tip-dialog';

interface OrderTipButtonProps {
  orderId: number;
  orderAmount: number;
  existingTip: { amount: number } | null;
}

export const OrderTipButton: React.FC<OrderTipButtonProps> = ({
  orderId,
  orderAmount,
  existingTip,
}) => {
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState(existingTip);

  if (tip) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4" />
        <span>Чаевые {tip.amount} TJS</span>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Heart className="w-4 h-4 text-pink-500" />
        Оставить чаевые
      </Button>

      <CourierTipDialog
        open={open}
        onClose={() => setOpen(false)}
        orderId={orderId}
        orderAmount={orderAmount}
        onSuccess={() => {
          setTip({ amount: 0 });
          window.location.reload();
        }}
      />
    </>
  );
};
