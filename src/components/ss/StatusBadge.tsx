import type { OrderStatus } from '@/lib/db/schema';
import { cx } from './util';

/** Customer-facing labels (TDD §4.1). */
export const STATUS_LABELS: Record<OrderStatus, { label: string; tone: string; emoji?: string }> = {
  AWAITING_PAYMENT: { label: 'Awaiting your payment', tone: 'action' },
  PAYMENT_UNDER_REVIEW: { label: 'Payment received — verifying', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmed', emoji: '🎉', tone: 'success' },
  BAKING: { label: 'In the oven', tone: 'sun' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', tone: 'strong' },
  COMPLETED: { label: 'Picked up', tone: 'muted' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
};

export interface StatusBadgeProps {
  status: OrderStatus;
  /** Override the customer-facing label. */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const s = STATUS_LABELS[status] ?? { label: status, tone: 'neutral' };
  return (
    <span className={cx('ss-badge', `ss-badge--${s.tone}`, className)}>
      {label || s.label}
      {!label && s.emoji ? <span aria-hidden="true">{s.emoji}</span> : null}
    </span>
  );
}
