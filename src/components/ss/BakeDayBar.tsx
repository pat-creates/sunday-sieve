import type { ReactNode } from 'react';
import { Button } from './Button';
import { cx } from './util';

export interface BakeDayBarProps {
  /** Same states as BakeDayPanel. */
  state?: 'open' | 'closed' | 'soldout' | 'none';
  /** Short form, e.g. "Sat 5 Dec". */
  bakeDate?: string;
  /** Short form, e.g. "Fri 6 PM". */
  cutoff?: string;
  remaining?: number;
  almostSoldOutAt?: number;
  orderHref?: string;
  /** Default "Order". */
  ctaLabel?: string;
  /** Sold out, closed or none: link to the Facebook page. */
  followHref?: string;
  followLabel?: string;
  className?: string;
}

/** The bake day in one line, for the top of the landing page on phones. */
export function BakeDayBar(props: BakeDayBarProps) {
  const state = props.state || 'open';
  const remaining = props.remaining ?? 0;
  const almostAt = props.almostSoldOutAt ?? 24;
  const full = state === 'soldout' || (state === 'open' && remaining <= 0);
  const quiet = full || state === 'closed' || state === 'none';
  const almost = !quiet && remaining <= almostAt;

  let parts: ReactNode;
  if (state === 'none') parts = <strong>No batch scheduled yet</strong>;
  else if (quiet) parts = <><strong>{props.bakeDate}</strong>{' · '}{full ? 'Sold out' : 'Orders closed'}</>;
  else parts = (
    <>
      <strong className="ss-bar__lead">{`Next batch: ${props.bakeDate}`}</strong>
      {almost
        ? <span className="ss-bar__urgent"><span className="ss-cap__dot" aria-hidden="true" />{`Only ${remaining} left`}</span>
        : `${remaining} tarts left`}
      {props.cutoff ? ` · Order by ${props.cutoff}` : null}
    </>
  );

  const action = quiet
    ? (props.followHref ? <a className="ss-bar__link" href={props.followHref}>{props.followLabel || 'Follow us for the next batch'}</a> : null)
    : <Button variant="sun" href={props.orderHref} className="ss-bar__btn">{props.ctaLabel || 'Order'}</Button>;

  return (
    <div className={cx('ss-bar', quiet && 'ss-bar--quiet', almost && 'ss-bar--almost', props.className)} role="region" aria-label="Next batch">
      <p className="ss-bar__text">{parts}</p>
      {action}
    </div>
  );
}
