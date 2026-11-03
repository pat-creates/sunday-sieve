import { cx, headingTag, type HeadingLevel } from './util';

export interface PaymentQRCardProps {
  /** payment_qr_codes.provider: "GCash", "BDO", "BPI", "SeaBank" */
  provider: string;
  qrSrc?: string;
  accountName: string;
  /** e.g. "•••• 4821" */
  accountHint?: string;
  /** Exact amount to send, e.g. "₱630.00" */
  amount?: string;
  headingLevel?: HeadingLevel;
  className?: string;
}

export function PaymentQRCard({ provider, qrSrc, accountName, accountHint, amount, headingLevel, className }: PaymentQRCardProps) {
  const H = headingTag(headingLevel, 3);
  return (
    <article className={cx('ss-qr', className)}>
      <div className="ss-qr__head">
        <H className="ss-qr__provider">{provider}</H>
        {amount ? <p className="ss-qr__amount">Send exactly <strong>{amount}</strong></p> : null}
      </div>
      <div className="ss-qr__code">
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrSrc} alt={`${provider} QR code for ${accountName}`} />
        ) : (
          <div className="ss-qr__ph">QR code</div>
        )}
      </div>
      <dl className="ss-qr__acct">
        <div><dt>Account name</dt><dd>{accountName}</dd></div>
        {accountHint ? <div><dt>Account</dt><dd>{accountHint}</dd></div> : null}
      </dl>
    </article>
  );
}
