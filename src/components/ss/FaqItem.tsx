import type { ReactNode } from 'react';
import { cx } from './util';

export interface FaqItemProps {
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function FaqItem({ question, children, defaultOpen, className }: FaqItemProps) {
  return (
    <details className={cx('ss-faq', className)} open={defaultOpen}>
      <summary className="ss-faq__q">
        <span>{question}</span>
        <span className="ss-faq__sign" aria-hidden="true" />
      </summary>
      <div className="ss-faq__a">{children}</div>
    </details>
  );
}
