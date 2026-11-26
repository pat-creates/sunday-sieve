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

export function SiteFooter({ children, center }: { children?: ReactNode; center?: boolean }) {
  return (
    <footer className={center ? 'site-footer site-footer--center' : 'site-footer'}>
      {children}
      <ContactLine />
    </footer>
  );
}
