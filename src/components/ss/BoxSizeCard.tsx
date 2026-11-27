import { QuantityStepper } from './QuantityStepper';
import { cx, headingTag, type HeadingLevel } from './util';

export interface BoxSizeCardProps {
  /** products.name, e.g. "The Picnic Pack" */
  name: string;
  /** products.subtitle, e.g. "Box of 6"; shown as "Box of 6 · 6 egg tarts". */
  subtitle?: string;
  /** card: square tile (landing page menu); row: compact list item (order form on phones). */
  layout?: 'card' | 'row';
  /** products.tart_count: 4, 6 or 12 */
  tartCount: number;
  /** Formatted price, e.g. "₱315.00" */
  price: string;
  /** Product photo; without it a numbered placeholder shows. */
  image?: string;
  imageAlt?: string;
  /** Provide quantity + onQuantityChange to show the stepper (order form); omit both for the price list. */
  quantity?: number;
  onQuantityChange?: (value: number) => void;
  /** Most boxes of this size the order can still take. */
  max?: number;
  disabled?: boolean;
  /** Landing menu: makes the whole card a link, e.g. to the order form with this box added. Ignored with a stepper. */
  href?: string;
  /** Text under the price on a linked card. Default "Choose this box →". */
  linkLabel?: string;
  headingLevel?: HeadingLevel;
  className?: string;
}

export function BoxSizeCard(props: BoxSizeCardProps) {
  const selected = (props.quantity || 0) > 0;
  const H = headingTag(props.headingLevel, 3);
  const linked = !!props.href && !props.onQuantityChange && !props.disabled;
  return (
    <article className={cx('ss-box', props.layout === 'row' && 'ss-box--row', selected && 'ss-box--selected',
      props.disabled && 'ss-box--disabled', linked && 'ss-box--link', props.className)}>
      <div className="ss-box__media">
        {props.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ss-box__img" src={props.image} alt={props.imageAlt || ''} />
        ) : (
          <div className="ss-box__ph" aria-hidden="true">
            <span className="ss-box__phnum">{props.tartCount}</span>
            <span className="ss-box__phlabel">tarts</span>
          </div>
        )}
      </div>
      <div className="ss-box__body">
        <H className="ss-box__name">{linked ? <a className="ss-box__link" href={props.href}>{props.name}</a> : props.name}</H>
        <p className="ss-box__meta">
          {props.subtitle ? `${props.subtitle} · ${props.tartCount} egg tarts` : `${props.tartCount} egg tarts`}
        </p>
        <p className="ss-box__price">{props.price}</p>
        {linked ? <span className="ss-box__go" aria-hidden="true">{props.linkLabel || 'Choose this box →'}</span> : null}
        {props.onQuantityChange ? (
          <QuantityStepper value={props.quantity || 0} max={props.max} disabled={props.disabled}
            onChange={props.onQuantityChange} label={`Number of ${props.name}`} itemName={props.name} />
        ) : null}
      </div>
    </article>
  );
}
