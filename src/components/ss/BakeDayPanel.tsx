import { useId } from 'react';
import { Button } from './Button';
import { CapacityIndicator } from './CapacityIndicator';
import { cx, headingTag, type HeadingLevel } from './util';

export interface BakeDayPanelProps {
  /** open: taking orders (urgent when remaining <= almostSoldOutAt); closed: past cut-off, quiet look, no count; soldout: no capacity, quiet look; none: no batch scheduled, quiet look. */
  state?: 'open' | 'closed' | 'soldout' | 'none';
  /** "Saturday, 29 November" */
  bakeDate?: string;
  /** "3:00–7:00 PM" */
  pickupWindow?: string;
  /** "Friday, 28 November at 6:00 PM" */
  cutoff?: string;
  remaining?: number;
  capacity?: number;
  almostSoldOutAt?: number;
  /** bake_days.public_note, e.g. "Adding ube tarts this week!" */
  note?: string;
  orderHref?: string;
  /** Default "Order for Saturday" (the day from bakeDate); "· 12 left" is added when almost sold out. */
  ctaLabel?: string;
  eyebrow?: string;
  /** Extra sentence after the closed/sold-out reason. */
  reasonExtra?: string;
  /** For state "none", and under the reason when sold out or closed: the Facebook page (v1). */
  followHref?: string;
  followLabel?: string;
  noneText?: string;
  headingLevel?: HeadingLevel;
  className?: string;
}

/** The one label for the main order action everywhere: "Order for Saturday". */
export function orderLabel(bakeDate?: string): string {
  const day = bakeDate ? String(bakeDate).split(/[ ,]/)[0] : '';
  return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(day) ? `Order for ${day}` : 'Order now';
}

/**
 * The landing page's next-batch panel (TDD §9.1 item 2). Loud yellow-on-green while taking
 * orders, urgent when almost sold out, and a quiet look once sold out, closed or unscheduled.
 */
export function BakeDayPanel(props: BakeDayPanelProps) {
  const reasonId = useId();
  const headId = useId();
  const state = props.state || 'open';
  const H = headingTag(props.headingLevel, 2);
  const follow = props.followHref ? (
    <Button variant="primary" size="lg" block href={props.followHref}>{props.followLabel || 'Follow us on Facebook'}</Button>
  ) : null;

  if (state === 'none') {
    return (
      <section className={cx('ss-bakeday', 'ss-bakeday--quiet', 'ss-bakeday--none', props.className)} aria-labelledby={headId}>
        <p className="ss-bakeday__eyebrow">Next batch</p>
        <H id={headId} className="ss-bakeday__date">No batch scheduled yet</H>
        <p className="ss-bakeday__line">{props.noneText || 'New bake days are announced on our Facebook page.'}</p>
        {follow ? <div className="ss-bakeday__cta">{follow}</div> : null}
      </section>
    );
  }

  const almostAt = props.almostSoldOutAt ?? 24;
  const remaining = props.remaining ?? 0;
  const full = state === 'soldout' || remaining <= 0;
  const closed = !full && state === 'closed';
  const quiet = full || closed;
  const almost = !quiet && remaining <= almostAt;
  const reason = full ? 'This batch is sold out.' : closed ? 'Orders for this batch have closed.' : null;
  const base = props.ctaLabel || orderLabel(props.bakeDate);
  const label = almost ? `${base} · ${remaining} left` : base;

  return (
    <section className={cx('ss-bakeday', quiet && 'ss-bakeday--quiet', almost && 'ss-bakeday--almost', props.className)} aria-labelledby={headId}>
      <div className="ss-bakeday__head">
        <p className="ss-bakeday__eyebrow">{props.eyebrow || 'Next batch'}</p>
        {quiet ? <span className="ss-bakeday__status">{full ? 'Sold out' : 'Orders closed'}</span> : null}
      </div>
      <H id={headId} className="ss-bakeday__date">{props.bakeDate}</H>
      <dl className="ss-bakeday__facts">
        <div><dt>Pickup</dt><dd>{props.pickupWindow}</dd></div>
        <div><dt>{closed ? 'Orders closed' : 'Orders close'}</dt><dd>{props.cutoff}</dd></div>
      </dl>
      {props.note && !quiet ? <p className="ss-bakeday__note">{props.note}</p> : null}
      {closed ? null : (
        <CapacityIndicator remaining={full ? 0 : remaining} capacity={props.capacity} almostSoldOutAt={almostAt} inverse={!quiet} />
      )}
      {quiet ? (
        <div className="ss-bakeday__cta">
          <p id={reasonId} className="ss-bakeday__reason">{reason}{props.reasonExtra ? ` ${props.reasonExtra}` : ''}</p>
          {follow}
        </div>
      ) : (
        <div className="ss-bakeday__cta">
          <Button variant="sun" size="lg" block href={props.orderHref}>{label}</Button>
        </div>
      )}
    </section>
  );
}
