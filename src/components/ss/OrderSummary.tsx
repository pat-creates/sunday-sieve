import { useId, type ReactNode } from 'react';
import { Notice } from './Notice';
import { cx, headingTag, type HeadingLevel } from './util';

export interface OrderSummaryProps {
  items: { name: string; quantity: number; lineTotal: string }[];
  totalTarts: number;
  /** Formatted total, e.g. "₱630.00" */
  total: string;
  /** settings.max_tarts_per_order. Default 24. Above it, a "message me" notice shows. */
  maxTarts?: number;
  /** "Friday, 14 August, 6:00 PM": the clamped payment deadline (TDD §9.6). */
  deadline?: string;
  /** Link or button shown in the over-limit notice, e.g. Messenger. */
  overLimitAction?: ReactNode;
  title?: string;
  headingLevel?: HeadingLevel;
  className?: string;
}

export function OrderSummary({ items = [], totalTarts, total, maxTarts = 24, deadline, overLimitAction, title, headingLevel, className }: OrderSummaryProps) {
  const headId = useId();
  const H = headingTag(headingLevel, 3);
  const over = totalTarts > maxTarts;
  return (
    <section className={cx('ss-summary', className)} aria-labelledby={headId}>
      <H id={headId} className="ss-summary__title">{title || 'Your order'}</H>
      {items.length === 0 ? (
        <p className="ss-summary__empty">No boxes yet. Choose a box size to start.</p>
      ) : (
        <ul className="ss-summary__lines">
          {items.map((it, i) => (
            <li key={i} className="ss-summary__line">
              <span>{`${it.quantity} × ${it.name}`}</span>
              <span className="ss-summary__amt">{it.lineTotal}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="ss-summary__totals">
        <div>
          <dt>Tarts</dt>
          <dd className={over ? 'ss-summary__over' : undefined}>{totalTarts}{maxTarts ? ` of ${maxTarts} max` : ''}</dd>
        </div>
        <div className="ss-summary__grand">
          <dt>Total</dt>
          <dd>{total}</dd>
        </div>
      </dl>
      {over ? (
        <Notice tone="warning" title={`For orders over ${maxTarts} tarts, please message me directly.`}>
          {overLimitAction || null}
        </Notice>
      ) : null}
      {deadline && !over ? <p className="ss-summary__deadline">Pay by <strong>{deadline}</strong></p> : null}
    </section>
  );
}
