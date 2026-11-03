'use client';

import { cx } from './util';

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  /** Accessible name, e.g. "Number of The Picnic Pack". */
  label?: string;
  /** Added to the button names: "Add one The Picnic Pack". */
  itemName?: string;
  className?: string;
}

export function QuantityStepper({ value = 0, min = 0, max = 99, onChange, disabled, label, itemName, className }: QuantityStepperProps) {
  const item = itemName ? ` ${itemName}` : '';
  const set = (v: number) => onChange?.(Math.max(min, Math.min(max, v)));
  return (
    <div className={cx('ss-stepper', className)} role="group" aria-label={label || 'Quantity'}>
      <button type="button" className="ss-stepper__btn" onClick={() => set(value - 1)}
        disabled={disabled || value <= min} aria-label={`Remove one${item}`}>
        −
      </button>
      <output className="ss-stepper__value" aria-live="polite">{value}</output>
      <button type="button" className="ss-stepper__btn" onClick={() => set(value + 1)}
        disabled={disabled || value >= max} aria-label={`Add one${item}`}>
        +
      </button>
    </div>
  );
}
