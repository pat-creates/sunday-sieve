import { useId } from 'react';
import { Button } from './Button';
import { CapacityIndicator } from './CapacityIndicator';
import { cx, headingTag, type HeadingLevel } from './util';

export interface BakeDayPanelProps {
  /** open: taking orders; closed: past cut-off; soldout: no capacity; none: no batch scheduled. */
  state?: 'open' | 'closed' | 'soldout' | 'none';
  /** "Saturday, 15 August" */
  bakeDate?: string;
  /** "3:00–7:00 PM" */
  pickupWindow?: string;
  /** "Friday, 14 August at 6:00 PM" */
  cutoff?: string;
  remaining?: number;
  capacity?: number;
  almostSoldOutAt?: number;
  /** bake_days.public_note, e.g. "Adding ube tarts this week!" */
  note?: string;
  orderHref?: string;
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

/** The landing page's next-batch panel (TDD §9.1 item 2), in the loud yellow-on-green look. */
export function BakeDayPanel(props: BakeDayPanelProps) {
  const reasonId = useId();
  const headId = useId();
  const state = props.state || 'open';
  const H = headingTag(props.headingLevel, 2);

  if (state === 'none') {
    return (
      <section className={cx('ss-bakeday', 'ss-bakeday--none', props.className)} aria-labelledby={headId}>
        <p className="ss-bakeday__eyebrow">Next batch</p>
        <H id={headId} className="ss-bakeday__date">No batch scheduled yet</H>
        <p className="ss-bakeday__line">{props.noneText || 'New bake days are announced on our Facebook page.'}</p>
        {props.followHref ? (
          <Button variant="sun" href={props.followHref} size="lg">{props.followLabel || 'Get notified'}</Button>
        ) : null}
      </section>
    );
  }

  const remaining = props.remaining ?? 0;
  const full = state === 'soldout' || remaining <= 0;
  const closed = state === 'closed';
  const reason = full ? 'This batch is sold out.' : closed ? 'Orders for this batch have closed.' : null;
  const label = props.ctaLabel || (full ? 'Sold out' : closed ? 'Orders closed' : 'Order now');

  return (
    <section className={cx('ss-bakeday', props.className)} aria-labelledby={headId}>
      <p className="ss-bakeday__eyebrow">{props.eyebrow || 'Next batch'}</p>
      <H id={headId} className="ss-bakeday__date">{props.bakeDate}</H>
      <dl className="ss-bakeday__facts">
        <div><dt>Pickup</dt><dd>{props.pickupWindow}</dd></div>
        <div><dt>Orders close</dt><dd>{props.cutoff}</dd></div>
      </dl>
      {props.note ? <p className="ss-bakeday__note">{props.note}</p> : null}
      <CapacityIndicator remaining={full ? 0 : remaining} capacity={props.capacity} almostSoldOutAt={props.almostSoldOutAt} inverse />
      <div className="ss-bakeday__cta">
        <Button variant="sun" size="lg" block href={props.orderHref} disabled={full || closed}
          aria-describedby={reason ? reasonId : undefined}>
          {label}
        </Button>
        {reason ? (
          <p id={reasonId} className="ss-bakeday__reason">
            {reason}{props.reasonExtra ? ` ${props.reasonExtra}` : ''}
          </p>
        ) : null}
        {reason && props.followHref ? (
          <Button variant="sun" block href={props.followHref}>{props.followLabel || 'Follow us on Facebook'}</Button>
        ) : null}
      </div>
    </section>
  );
}
