'use client';

import { useState } from 'react';
import { cx } from './util';

export interface OrderNumberProps {
  /** e.g. "ET-7K3M-9QP2" */
  value: string;
  label?: string;
  /** Show a Copy button. Default true. */
  copyable?: boolean;
  className?: string;
}

export function OrderNumber({ value, label, copyable = true, className }: OrderNumberProps) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  }
  return (
    <div className={cx('ss-ordernum', className)}>
      <span className="ss-ordernum__label">{label || 'Order number'}</span>
      <span className="ss-ordernum__row">
        <span className="ss-ordernum__value">{value}</span>
        {copyable ? (
          <button type="button" className="ss-ordernum__copy" onClick={copy} aria-live="polite">
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </span>
    </div>
  );
}
