'use client';

// Links to every sample state, shown only locally and on Vercel previews (the root layout
// doesn't render it on the live site). Not part of the customer design.
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const LANDING = [['open', 'open'], ['almost', 'almost sold out'], ['soldout', 'sold out'], ['closed', 'closed'], ['none', 'no batch']] as const;
const ORDER = [
  ['awaiting', 'awaiting payment'], ['short', 'short payment'], ['rejected', 'receipt rejected'], ['verifying', 'verifying'],
  ['confirmed', 'confirmed'], ['baking', 'in the oven'], ['ready', 'ready'], ['completed', 'picked up'], ['cancelled', 'cancelled'],
] as const;

export function PreviewBar({ sampleOrderNumber }: { sampleOrderNumber: string }) {
  const path = usePathname();
  const state = useSearchParams().get('state');
  const orderPath = `/orders/${sampleOrderNumber}`;
  const link = (href: string, label: string, current: boolean) => (
    <Link key={href} href={href} aria-current={current ? 'page' : undefined}>{label}</Link>
  );
  return (
    <details className="preview-bar">
      <summary>Preview: sample data · tap to switch states</summary>
      <div className="preview-bar__body">
        <div className="preview-bar__group">
          <span className="preview-bar__label">Landing</span>
          {LANDING.map(([s, label]) => link(`/?state=${s}`, label, path === '/' && (state ?? 'open') === s))}
        </div>
        <div className="preview-bar__group">
          <span className="preview-bar__label">Order form</span>
          {link('/order', 'open', path === '/order')}
        </div>
        <div className="preview-bar__group">
          <span className="preview-bar__label">Order page</span>
          {ORDER.map(([s, label]) => link(`${orderPath}?state=${s}`, label, path === orderPath && (state ?? 'awaiting') === s))}
        </div>
        <div className="preview-bar__group">
          <span className="preview-bar__label">Other</span>
          {link('/dev/components', 'components', path === '/dev/components')}
        </div>
      </div>
    </details>
  );
}
