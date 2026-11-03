import type { ReactNode } from 'react';
import { cx } from './util';

export interface NoticeProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: ReactNode;
  children?: ReactNode;
  /** Optional button or link under the message. */
  action?: ReactNode;
  className?: string;
}

export function Notice({ tone = 'info', title, children, action, className }: NoticeProps) {
  return (
    <div className={cx('ss-notice', `ss-notice--${tone}`, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      {title ? <p className="ss-notice__title">{title}</p> : null}
      {children ? <div className="ss-notice__body">{children}</div> : null}
      {action ? <div className="ss-notice__action">{action}</div> : null}
    </div>
  );
}
