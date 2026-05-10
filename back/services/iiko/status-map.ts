import { OrderStatus } from '@prisma/client';

const IIKO_TO_LOCAL: Record<string, OrderStatus> = {
  Unconfirmed: 'PENDING',
  WaitCooking: 'PENDING',
  ReadyForCooking: 'PENDING',
  CookingStarted: 'COOKING',
  CookingCompleted: 'READY',
  Waiting: 'READY',
  OnWay: 'DELIVERING',
  Delivered: 'SUCCEEDED',
  Closed: 'SUCCEEDED',
  Cancelled: 'CANCELLED',
};

export function mapIikoStatusToLocal(iikoStatus: string | null | undefined): OrderStatus | null {
  if (!iikoStatus) return null;
  return IIKO_TO_LOCAL[iikoStatus] ?? null;
}

export function isTerminalIikoStatus(iikoStatus: string | null | undefined): boolean {
  if (!iikoStatus) return false;
  return iikoStatus === 'Delivered' || iikoStatus === 'Closed' || iikoStatus === 'Cancelled';
}
