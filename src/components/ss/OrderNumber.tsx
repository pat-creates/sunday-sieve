'use client';

import { useState } from 'react';
import { cx } from './util';

export interface OrderNumberProps {
  /** e.g. "ET-7K3M-9QP2" */
  value: string;
  label?: string;
  /** Show the icon-only copy button. Default true. */
  copyable?: boolean;
  className?: string;
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

const ICON_COPY = (
  <Icon>
    <rect x={9} y={9} width={12} height={12} rx={2} />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Icon>
);
const ICON_CHECK = <Icon><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;

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
          <button type="button" className={cx('ss-ordernum__copy', copied && 'ss-ordernum__copy--done')} onClick={copy}
            aria-label={copied ? 'Order number copied' : 'Copy order number'} title={copied ? 'Copied' : 'Copy order number'}>
            {copied ? ICON_CHECK : ICON_COPY}
          </button>
        ) : null}
      </span>
      <span className="ss-visually-hidden" aria-live="polite">{copied ? 'Order number copied' : ''}</span>
    </div>
  );
}
