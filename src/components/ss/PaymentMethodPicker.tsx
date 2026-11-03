'use client';

import { useState } from 'react';
import { PaymentQRCard } from './PaymentQRCard';
import { cx, type HeadingLevel } from './util';

export interface PaymentMethod {
  /** payment_qr_codes.provider: "GCash", "BDO", "BPI", "SeaBank" */
  provider: string;
  qrSrc?: string;
  accountName: string;
  accountHint?: string;
}

export interface PaymentMethodPickerProps {
  /** Active rows of payment_qr_codes, in sort order. */
  methods: PaymentMethod[];
  /** Exact amount to send (or the balance after a short payment). */
  amount?: string;
  /** Selected provider (controlled). */
  value?: string;
  /** Initially selected provider (uncontrolled). Default: the first method. */
  defaultValue?: string;
  onChange?: (provider: string) => void;
  /** Accessible name of the options. Default "Payment method". */
  label?: string;
  /** Tip under the QR card. Default: how to pay from the same phone. Pass "" to hide it. */
  tip?: string;
  headingLevel?: HeadingLevel;
  className?: string;
}

/** One QR code at a time, picked from a row of channel buttons (TDD §9.3). */
export function PaymentMethodPicker({ methods = [], amount, value, defaultValue, onChange, label, tip, headingLevel, className }: PaymentMethodPickerProps) {
  const [inner, setInner] = useState(defaultValue || methods[0]?.provider);
  const selected = value !== undefined ? value : inner;
  const current = methods.find((m) => m.provider === selected) || methods[0];
  function pick(p: string) {
    if (value === undefined) setInner(p);
    onChange?.(p);
  }
  const tipText = tip === undefined
    ? `Paying from this phone? Take a screenshot of the QR code, then in your ${current ? current.provider : 'payment'} app choose “Upload QR” or scan from your gallery.`
    : tip;
  return (
    <div className={cx('ss-picker', className)}>
      <div className="ss-picker__options" role="group" aria-label={label || 'Payment method'}>
        {methods.map((m) => {
          const on = current?.provider === m.provider;
          return (
            <button key={m.provider} type="button" className={cx('ss-picker__option', on && 'ss-picker__option--on')}
              aria-pressed={on} onClick={() => pick(m.provider)}>
              {m.provider}
            </button>
          );
        })}
      </div>
      {current ? (
        <PaymentQRCard provider={current.provider} qrSrc={current.qrSrc} accountName={current.accountName}
          accountHint={current.accountHint} amount={amount} headingLevel={headingLevel} className="ss-picker__card" />
      ) : null}
      {tipText ? <p className="ss-picker__tip">{tipText}</p> : null}
    </div>
  );
}
