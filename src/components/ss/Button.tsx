import type { ButtonHTMLAttributes } from 'react';
import { cx } from './util';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = leaf-green (main action on cream); sun = sun-yellow (main action on leaf-green); secondary = outlined; quiet = link-style; danger = cancel order. */
  variant?: 'primary' | 'sun' | 'secondary' | 'quiet' | 'danger';
  size?: 'md' | 'lg';
  /** Full width. */
  block?: boolean;
  /** Renders an <a> instead of a <button> (ignored while disabled). */
  href?: string;
}

export function Button({ variant = 'primary', size = 'md', block, className, children, href, ...rest }: ButtonProps) {
  const cls = cx('ss-btn', `ss-btn--${variant}`, `ss-btn--${size}`, block && 'ss-btn--block', className);
  if (href && !rest.disabled) {
    // Only the attributes that make sense on a link carry over.
    const { id, title, onClick, 'aria-describedby': describedBy, 'aria-label': ariaLabel } = rest;
    return (
      <a className={cls} href={href} id={id} title={title} aria-describedby={describedBy} aria-label={ariaLabel}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
