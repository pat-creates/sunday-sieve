import { useId } from 'react';
import { Button } from './Button';
import { cx, headingTag, type HeadingLevel } from './util';

export interface PickupDetailsProps {
  /** true only at READY_FOR_PICKUP (TDD §7.4). The full address must not even be fetched before then. */
  revealed?: boolean;
  /** pickup_locations.public_blurb: city + landmark, no street address. */
  publicBlurb?: string;
  fullAddress?: string;
  mapUrl?: string;
  instructions?: string;
  contactNumber?: string;
  /** "Saturday, 15 August · 3:00–7:00 PM" */
  pickupWindow?: string;
  headingLevel?: HeadingLevel;
  className?: string;
}

export function PickupDetails(props: PickupDetailsProps) {
  const headId = useId();
  const H = headingTag(props.headingLevel, 3);
  if (!props.revealed) {
    return (
      <section className={cx('ss-pickup', props.className)} aria-labelledby={headId}>
        <H id={headId} className="ss-pickup__title">Pickup area</H>
        <p className="ss-pickup__area">{props.publicBlurb}</p>
        {props.pickupWindow ? <p className="ss-pickup__window">{props.pickupWindow}</p> : null}
        <p className="ss-pickup__hint">Exact address sent when your order is ready.</p>
      </section>
    );
  }
  return (
    <section className={cx('ss-pickup', 'ss-pickup--revealed', props.className)} aria-labelledby={headId}>
      <H id={headId} className="ss-pickup__title">Pickup address</H>
      <p className="ss-pickup__address">{props.fullAddress}</p>
      {props.pickupWindow ? <p className="ss-pickup__window">{props.pickupWindow}</p> : null}
      {props.instructions ? <p className="ss-pickup__instr">{props.instructions}</p> : null}
      <div className="ss-pickup__actions">
        {props.mapUrl ? <Button variant="primary" href={props.mapUrl}>Open map</Button> : null}
        {props.contactNumber ? (
          <Button variant="secondary" href={`tel:${props.contactNumber.replace(/[^+\d]/g, '')}`}>Call {props.contactNumber}</Button>
        ) : null}
      </div>
    </section>
  );
}
