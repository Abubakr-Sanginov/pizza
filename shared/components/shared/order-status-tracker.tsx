'use client';

import React from 'react';
import { OrderStatus, DeliveryType } from '@prisma/client';
import { Clock, ChefHat, CheckCircle2, Bike, PackageCheck, XCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { motion } from 'framer-motion';

interface Step {
  status: OrderStatus;
  label: string;
  icon: LucideIcon;
}

const baseSteps: Step[] = [
  { status: 'PENDING', label: 'Принят', icon: Clock },
  { status: 'COOKING', label: 'Готовится', icon: ChefHat },
  { status: 'READY', label: 'Готов', icon: CheckCircle2 },
  { status: 'DELIVERING', label: 'В пути', icon: Bike },
  { status: 'SUCCEEDED', label: 'Доставлен', icon: PackageCheck },
];

const pickupLabels: Partial<Record<OrderStatus, string>> = {
  SUCCEEDED: 'Выдан',
  DELIVERING: 'Готов к выдаче',
};

interface Props {
  status: OrderStatus;
  deliveryType?: DeliveryType;
  className?: string;
}

export const OrderStatusTracker: React.FC<Props> = ({ status, deliveryType, className }) => {
  if (status === 'CANCELLED') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20',
          className,
        )}>
        <XCircle className="w-5 h-5 text-red-500 shrink-0" strokeWidth={2.4} />
        <div>
          <div className="text-sm font-bold text-red-600 dark:text-red-300">Заказ отменён</div>
          <div className="text-xs text-muted-foreground">Если это ошибка — свяжитесь с поддержкой</div>
        </div>
      </div>
    );
  }

  const steps =
    deliveryType === 'PICKUP'
      ? baseSteps.filter((s) => s.status !== 'DELIVERING').map((s) =>
          pickupLabels[s.status] ? { ...s, label: pickupLabels[s.status]! } : s,
        )
      : baseSteps;

  const activeIndex = steps.findIndex((s) => s.status === status);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex items-start justify-between">
        {/* connector line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border rounded-full -z-0" />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: safeIndex / (steps.length - 1) }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ transformOrigin: 'left' }}
          className="absolute top-5 left-5 right-5 h-0.5 bg-gradient-to-r from-primary to-orange-500 rounded-full -z-0"
        />

        {steps.map((step, i) => {
          const isCompleted = i < safeIndex;
          const isActive = i === safeIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.08 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 border-2',
                  isCompleted && 'bg-gradient-to-br from-primary to-orange-500 text-white border-transparent shadow-soft',
                  isActive && 'bg-gradient-to-br from-primary to-orange-500 text-white border-transparent shadow-soft',
                  !isCompleted && !isActive && 'bg-card border-border text-muted-foreground',
                )}>
                {isActive && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-primary/30"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                <Icon size={18} strokeWidth={2.5} />
              </motion.div>
              <span
                className={cn(
                  'text-[10px] md:text-xs font-bold text-center leading-tight px-1',
                  (isCompleted || isActive) ? 'text-foreground' : 'text-muted-foreground',
                )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
