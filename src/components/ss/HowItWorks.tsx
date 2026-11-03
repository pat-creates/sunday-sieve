import { cx } from './util';

const DEFAULT_STEPS = [
  { title: 'Choose', text: 'Pick your box size and how many.' },
  { title: 'Pay', text: 'Scan the QR code and upload your receipt.' },
  { title: 'We confirm', text: 'We check your payment and email you.' },
  { title: 'Pick up', text: 'Collect your tarts on bake day.' },
];

export interface HowItWorksProps {
  /** Defaults to the four steps: Choose, Pay, We confirm, Pick up. */
  steps?: { title: string; text: string }[];
  className?: string;
}

export function HowItWorks({ steps = DEFAULT_STEPS, className }: HowItWorksProps) {
  return (
    <ol className={cx('ss-how', className)}>
      {steps.map((s, i) => (
        <li key={i} className="ss-how__step">
          <span className="ss-how__num" aria-hidden="true">{i + 1}</span>
          <span className="ss-how__body">
            <strong className="ss-how__title">{s.title}</strong>
            <span className="ss-how__text">{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
