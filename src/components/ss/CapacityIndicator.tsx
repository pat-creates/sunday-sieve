import { cx } from './util';

export interface CapacityIndicatorProps {
  /** Tarts still available. */
  remaining: number;
  /** Bake day capacity in tarts. Default 96. */
  capacity?: number;
  /** At or below this many tarts, show "Almost sold out". Default 24. */
  almostSoldOutAt?: number;
  /** Colours for use on surface-inverse (leaf-green). */
  inverse?: boolean;
  className?: string;
}

/** Remaining capacity, counted in tarts (TDD §9.1). */
export function CapacityIndicator({ remaining: rawRemaining, capacity = 96, almostSoldOutAt = 24, inverse, className }: CapacityIndicatorProps) {
  const remaining = Math.max(0, rawRemaining || 0);
  const state = remaining <= 0 ? 'soldout' : remaining <= almostSoldOutAt ? 'almost' : 'open';
  const reserved = capacity - remaining;
  const taken = Math.min(100, Math.round((reserved / capacity) * 100));
  const label = state === 'soldout' ? 'Sold out' : state === 'almost' ? 'Almost sold out' : `${remaining} tarts left`;
  return (
    <div className={cx('ss-cap', `ss-cap--${state}`, inverse && 'ss-cap--inverse', className)}>
      <div className="ss-cap__text">
        <strong className="ss-cap__label">{label}</strong>
        {state === 'almost' ? <span className="ss-cap__sub">{remaining} tarts left</span> : null}
      </div>
      <div
        className="ss-cap__track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={reserved}
        aria-valuetext={`${reserved} of ${capacity} tarts reserved, ${remaining} left`}
        aria-label="Tarts reserved"
      >
        <span className="ss-cap__fill" style={{ width: `${taken}%` }} />
      </div>
    </div>
  );
}
