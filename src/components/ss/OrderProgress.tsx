import type { ReactNode } from 'react';
import type { OrderStatus } from '@/lib/db/schema';
import { Notice } from './Notice';
import { cx, headingTag, type HeadingLevel } from './util';

const STEPS = [
  { key: 'placed', label: 'Order placed' },
  { key: 'pay', label: 'Payment' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'BAKING', label: 'In the oven' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for pickup' },
  { key: 'COMPLETED', label: 'Picked up' },
];
const INDEX: Partial<Record<OrderStatus, number>> = {
  AWAITING_PAYMENT: 1, PAYMENT_UNDER_REVIEW: 1, CONFIRMED: 2, BAKING: 3, READY_FOR_PICKUP: 4, COMPLETED: 5,
};

export interface OrderProgressProps {
  status: OrderStatus;
  /** For CANCELLED: the reason shown to the customer. */
  reason?: ReactNode;
  /** With a title, the list sits in a card like OrderSummary and PickupDetails, e.g. "Where your order is". */
  title?: string;
  headingLevel?: HeadingLevel;
  className?: string;
}

/** Where the order is in its lifecycle (TDD §4). */
export function OrderProgress({ status, reason, title, headingLevel, className }: OrderProgressProps) {
  if (status === 'CANCELLED') {
    return <Notice tone="danger" title="This order was cancelled" className={className}>{reason || null}</Notice>;
  }
  if (title) {
    const H = headingTag(headingLevel, 3);
    return (
      <section className={cx('ss-progress-card', className)}>
        <H className="ss-progress-card__title">{title}</H>
        <OrderProgress status={status} />
      </section>
    );
  }
  const cur = INDEX[status] ?? 0;
  return (
    <ol className={cx('ss-progress', className)} aria-label="Order progress">
      {STEPS.map((s, i) => {
        const state = i < cur || (status === 'COMPLETED' && i === cur) ? 'done' : i === cur ? 'current' : 'todo';
        let label = s.label;
        if (i === 1 && status === 'AWAITING_PAYMENT') label = 'Awaiting your payment';
        if (i === 1 && status === 'PAYMENT_UNDER_REVIEW') label = 'Payment received — verifying';
        return (
          <li key={s.key} className={`ss-progress__step ss-progress__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="ss-progress__dot" aria-hidden="true">{state === 'done' ? '✓' : ''}</span>
            <span className="ss-progress__label">
              {label}
              {state === 'done' ? <span className="ss-visually-hidden"> (done)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
