import type { ReactNode } from 'react';
import { site } from '@/lib/site';

/** "Questions? Message us on Facebook or text …" — the contact number only when it's set. */
export function ContactLine({ prefix = 'Questions?' }: { prefix?: string }) {
  return (
    <span>
      {prefix} Message us on <a href={site.facebookUrl}>Facebook</a>
      {site.contactNumber ? <> or text <a href={`tel:${site.contactNumber.replace(/[^+\d]/g, '')}`}>{site.contactNumber}</a></> : null}.
    </span>
  );
}

/** Page footer. The landing page shows the logo too; order pages add a line before the contact. */
export function SiteFooter({ children, logo, contactPrefix }: { children?: ReactNode; logo?: boolean; contactPrefix?: string }) {
  return (
    <footer className="foot">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src="/brand/lockup.png" alt="Sunday Sieve" width={96} height={48} /> : null}
      {children}
      <ContactLine prefix={contactPrefix} />
    </footer>
  );
}
