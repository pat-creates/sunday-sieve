'use client';

import { useEffect, useState } from 'react';
import { cx } from './util';

export interface PaymentCountdownProps {
  /** running: AWAITING_PAYMENT; paused: PAYMENT_UNDER_REVIEW; expired: auto-cancelled. */
  state?: 'running' | 'paused' | 'expired';
  /** Display text, e.g. "Friday, 14 August, 6:00 PM" */
  deadline?: string;
  /** ISO timestamp of payment_deadline_at; drives the live countdown. */
  deadlineAt?: string;
  /** Static text when deadlineAt is not given, e.g. "23h 14m left". */
  remainingText?: string;
  /** settings.verification_sla_text. Default "by the evening of the next day". */
  slaText?: string;
  hint?: string;
  className?: string;
}

function formatLeft(ms: number): string | null {
  if (ms <= 0) return null;
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const hrs = Math.floor((m % 1440) / 60);
  const mins = m % 60;
  if (d > 0) return `${d}d ${hrs}h left`;
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

/** The payment deadline with a live countdown (TDD §9.3, §9.6). */
export function PaymentCountdown({ state = 'running', deadline, deadlineAt, remainingText, slaText, hint, className }: PaymentCountdownProps) {
  const target = deadlineAt ? new Date(deadlineAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state !== 'running' || !target) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [state, target]);

  if (state === 'paused') {
    return (
      <div className={cx('ss-count', 'ss-count--paused', className)} role="status">
        <p className="ss-count__head">Payment received — verifying</p>
        <p className="ss-count__text">
          Thanks! We’ll verify your payment {slaText || 'by the evening of the next day'} — you’ll get an email.
        </p>
      </div>
    );
  }

  const left = target ? formatLeft(target - now) : remainingText;
  if (state === 'expired' || (target && target - now <= 0)) {
    return (
      <div className={cx('ss-count', 'ss-count--expired', className)} role="status">
        <p className="ss-count__head">Payment window closed</p>
        <p className="ss-count__text">
          This order was cancelled because payment didn’t arrive by {deadline}. If you already paid, reply to your order email or message us.
        </p>
      </div>
    );
  }

  return (
    <div className={cx('ss-count', className)} role="timer" aria-live="off">
      <p className="ss-count__head">Pay by <strong>{deadline}</strong></p>
      {/* Server and browser clocks can straddle a minute boundary on first render. */}
      {left ? <p className="ss-count__left" suppressHydrationWarning>{left}</p> : null}
      <p className="ss-count__text">{hint || 'Unpaid orders are cancelled automatically so others can take the slot.'}</p>
    </div>
  );
}
